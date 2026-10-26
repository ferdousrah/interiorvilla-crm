<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\StockTransaction;
use App\Models\Vendor;
use App\Models\VendorPayment;
use App\Services\AccountingService;
use App\Services\CodeGeneratorService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function __construct(
        private CodeGeneratorService $codeGenerator,
        private AccountingService $accounting
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        $pos = PurchaseOrder::with(['vendor', 'project', 'warehouse'])->withSum('payments', 'amount')
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->vendor_id, fn($q, $v) => $q->where('vendor_id', $v))
            ->orderByDesc('created_at')
            ->paginate(25)->withQueryString();

        return Inertia::render('Procurement/PurchaseOrders/Index', [
            'purchaseOrders' => $pos,
            'vendors' => Vendor::where('is_active', true)->select('id', 'name')->get(),
            'filters' => $request->only(['status', 'vendor_id', 'project_id']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        return Inertia::render('Procurement/PurchaseOrders/Create', [
            'vendors'        => Vendor::where('is_active', true)->select('id', 'name', 'code')->orderBy('name')->get(),
            'projects'       => Project::whereNotIn('status', ['completed', 'cancelled'])->select('id', 'name', 'code')->orderBy('name')->get(),
            'warehouses'     => \App\Models\Warehouse::where('is_active', true)->select('id', 'name')->orderBy('name')->get(),
            'inventoryItems' => \App\Models\InventoryItem::where('is_active', true)->select('id', 'name', 'code', 'unit', 'standard_rate')->orderBy('name')->get(),
            'accountHeads'   => \App\Models\AccountHead::whereHas('group', fn($q) => $q->where('type', 'asset'))
                ->where('is_active', true)->select('id', 'name', 'code')->get(),
        ]);
    }

    /**
     * Record a direct purchase: already received, no requisition/approval/GRN.
     * One transaction creates the purchase, its stock entries (warehouse
     * delivery) and an optional vendor payment; journal entries follow.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        $validated = $request->validate([
            'vendor_id'     => 'required|uuid|exists:vendors,id',
            'project_id'    => 'nullable|uuid|exists:projects,id|required_if:delivery_type,site',
            'delivery_type' => 'required|in:stock,site',
            'warehouse_id'  => 'nullable|uuid|exists:warehouses,id|required_if:delivery_type,stock',
            'order_date'    => 'required|date',
            'other_charges' => 'nullable|numeric|min:0',
            'notes'         => 'nullable|string',
            'items'                     => 'required|array|min:1',
            'items.*.inventory_item_id' => 'nullable|uuid|exists:inventory_items,id|required_if:delivery_type,stock',
            'items.*.description'       => 'required|string|max:250',
            'items.*.unit'              => 'required|string|max:50',
            'items.*.quantity_ordered'  => 'required|numeric|min:0.01',
            'items.*.unit_rate'         => 'required|numeric|min:0',
            'items.*.vat_pct'           => 'nullable|numeric|min:0|max:100',
            'paid_amount'       => 'nullable|numeric|min:0',
            'payment_method'    => 'nullable|in:cash,bank_transfer,cheque,bkash,nagad,rocket,other',
            'account_head_id'   => 'nullable|uuid|exists:account_heads,id',
            'payment_reference' => 'nullable|string|max:150',
        ], [
            'project_id.required_if'                => 'Select the project the goods were delivered to.',
            'warehouse_id.required_if'              => 'Select the warehouse the goods went into.',
            'items.*.inventory_item_id.required_if' => 'Pick an inventory item — stock deliveries need one for every line.',
        ]);

        $subtotal     = collect($validated['items'])->sum(fn($i) => $i['quantity_ordered'] * $i['unit_rate']);
        $vatAmount    = collect($validated['items'])->sum(fn($i) => $i['quantity_ordered'] * $i['unit_rate'] * (($i['vat_pct'] ?? 0) / 100));
        $otherCharges = (float) ($validated['other_charges'] ?? 0);
        $grandTotal   = round($subtotal + $vatAmount + $otherCharges, 2);
        $paidAmount   = round((float) ($validated['paid_amount'] ?? 0), 2);

        if ($paidAmount > $grandTotal) {
            return back()->withErrors(['paid_amount' => 'Paid amount cannot exceed the purchase total.'])->withInput();
        }
        if ($paidAmount > 0 && (empty($validated['payment_method']) || empty($validated['account_head_id']))) {
            return back()->withErrors(['account_head_id' => 'Select the payment method and the account it was paid from.'])->withInput();
        }

        [$po, $payment] = DB::transaction(function () use ($validated, $subtotal, $vatAmount, $otherCharges, $grandTotal, $paidAmount) {
            $isStock = $validated['delivery_type'] === 'stock';

            $po = PurchaseOrder::create([
                'code'          => $this->codeGenerator->generate('PUR', 'purchase_orders'),
                'vendor_id'     => $validated['vendor_id'],
                'project_id'    => $validated['project_id'] ?? null,
                'status'        => 'received',
                'delivery_type' => $validated['delivery_type'],
                'warehouse_id'  => $isStock ? $validated['warehouse_id'] : null,
                'order_date'    => $validated['order_date'],
                'subtotal'      => $subtotal,
                'vat_amount'    => $vatAmount,
                'other_charges' => $otherCharges,
                'grand_total'   => $grandTotal,
                'notes'         => $validated['notes'] ?? null,
                'sent_at'       => now(),
                'created_by'    => auth()->id(),
            ]);

            foreach ($validated['items'] as $item) {
                $po->items()->create([
                    'inventory_item_id' => $item['inventory_item_id'] ?? null,
                    'description'       => $item['description'],
                    'unit'              => $item['unit'],
                    'quantity_ordered'  => $item['quantity_ordered'],
                    'quantity_received' => $item['quantity_ordered'],
                    'unit_rate'         => $item['unit_rate'],
                    'vat_pct'           => $item['vat_pct'] ?? 0,
                    'total'             => $item['quantity_ordered'] * $item['unit_rate'],
                ]);

                if ($isStock) {
                    StockTransaction::create([
                        'inventory_item_id' => $item['inventory_item_id'],
                        'warehouse_id'      => $validated['warehouse_id'],
                        'project_id'        => $validated['project_id'] ?? null,
                        'type'              => 'purchase',
                        'quantity'          => $item['quantity_ordered'],
                        'unit_rate'         => $item['unit_rate'],
                        'total_value'       => $item['quantity_ordered'] * $item['unit_rate'],
                        'reference_type'    => 'purchase',
                        'reference_id'      => $po->id,
                        'transaction_date'  => $validated['order_date'],
                        'created_by'        => auth()->id(),
                        'created_at'        => now(),
                    ]);
                }
            }

            $payment = null;
            if ($paidAmount > 0) {
                $payment = VendorPayment::create([
                    'code'            => $this->codeGenerator->generate('PMT', 'vendor_payments'),
                    'vendor_id'       => $validated['vendor_id'],
                    'po_id'           => $po->id,
                    'project_id'      => $validated['project_id'] ?? null,
                    'amount'          => $paidAmount,
                    'payment_date'    => $validated['order_date'],
                    'payment_method'  => $validated['payment_method'],
                    'reference'       => $validated['payment_reference'] ?? null,
                    'account_head_id' => $validated['account_head_id'],
                    'notes'           => "Paid at purchase {$po->code}",
                    'created_by'      => auth()->id(),
                ]);
            }

            return [$po, $payment];
        });

        $this->accounting->postPurchaseOrderApproved($po->fresh(['vendor']));
        if ($payment) {
            $this->accounting->postVendorPaymentMade($payment->fresh(['vendor']));
        }

        return redirect()->route('procurement.purchase-orders.show', $po)->with('success', 'Purchase recorded.');
    }

    public function show(PurchaseOrder $purchaseOrder): Response
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        $purchaseOrder->load(['vendor', 'project', 'warehouse', 'items.inventoryItem', 'payments.accountHead', 'createdBy']);

        return Inertia::render('Procurement/PurchaseOrders/Show', ['po' => $purchaseOrder]);
    }

    public function edit(PurchaseOrder $purchaseOrder): Response
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);
        $purchaseOrder->load('items');
        return Inertia::render('Procurement/PurchaseOrders/Edit', [
            'purchaseOrder' => $purchaseOrder,
            'vendors' => Vendor::where('is_active', true)->select('id', 'name', 'code')->get(),
            'projects' => Project::whereNotIn('status', ['completed', 'cancelled'])->select('id', 'name', 'code')->get(),
        ]);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        $validated = $request->validate([
            'notes' => 'nullable|string',
            'expected_delivery_date' => 'nullable|date',
            'delivery_address' => 'nullable|string',
        ]);

        $purchaseOrder->update($validated);

        return back()->with('success', 'Purchase Order updated.');
    }

    /** Delete a purchase and reverse everything it posted: stock, payments, journal entries. */
    public function destroy(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        DB::transaction(function () use ($purchaseOrder) {
            $paymentIds = $purchaseOrder->payments()->pluck('id');

            \App\Models\JournalEntry::where(function ($q) use ($purchaseOrder, $paymentIds) {
                $q->where(fn($q) => $q->where('reference_type', 'po')->where('reference_id', $purchaseOrder->id))
                  ->orWhere(fn($q) => $q->where('reference_type', 'vendor_payment')->whereIn('reference_id', $paymentIds));
            })->delete();

            VendorPayment::whereIn('id', $paymentIds)->delete();
            StockTransaction::where('reference_type', 'purchase')->where('reference_id', $purchaseOrder->id)->delete();

            $purchaseOrder->delete();
        });

        return redirect()->route('procurement.purchase-orders.index')->with('success', 'Purchase deleted and reversed.');
    }

    public function pdf(PurchaseOrder $purchaseOrder)
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);
        $purchaseOrder->load(['vendor', 'items.inventoryItem']);

        $pdf = Pdf::loadView('pdf.purchase-order', ['po' => $purchaseOrder]);
        return $pdf->stream("PO-{$purchaseOrder->code}.pdf");
    }
}
