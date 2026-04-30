<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Vendor;
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

        $pos = PurchaseOrder::with(['vendor', 'project'])
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

        // Approved requisitions (not yet converted to PO) — for the "From Requisition" picker
        $requisitions = \App\Models\PurchaseRequisition::with(['items', 'project:id,name'])
            ->where('status', 'approved')
            ->orderByDesc('created_at')
            ->get(['id', 'code', 'project_id', 'required_by'])
            ->map(fn($r) => [
                'id'         => $r->id,
                'code'       => $r->code,
                'project_id' => $r->project_id,
                'project'    => $r->project ? ['id' => $r->project->id, 'name' => $r->project->name] : null,
                'items'      => $r->items->map(fn($i) => [
                    'inventory_item_id' => $i->inventory_item_id,
                    'description'       => $i->description,
                    'unit'              => $i->unit,
                    'quantity'          => (float) $i->quantity,
                    'estimated_rate'    => $i->estimated_rate ? (float) $i->estimated_rate : null,
                ]),
            ]);

        return Inertia::render('Procurement/PurchaseOrders/Create', [
            'vendors'        => Vendor::where('is_active', true)->select('id', 'name', 'code')->get(),
            'projects'       => Project::whereNotIn('status', ['completed', 'cancelled'])->select('id', 'name', 'code')->get(),
            'inventoryItems' => \App\Models\InventoryItem::where('is_active', true)->select('id', 'name', 'code', 'unit', 'standard_rate')->get(),
            'requisitions'   => $requisitions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        $validated = $request->validate([
            'vendor_id' => 'required|uuid|exists:vendors,id',
            'project_id' => 'nullable|uuid|exists:projects,id',
            'requisition_id' => 'nullable|uuid|exists:purchase_requisitions,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'delivery_address' => 'nullable|string',
            'other_charges' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'status' => 'required|in:draft,sent',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'nullable|uuid|exists:inventory_items,id',
            'items.*.description' => 'required|string|max:250',
            'items.*.unit' => 'required|string|max:50',
            'items.*.quantity_ordered' => 'required|numeric|min:0.01',
            'items.*.unit_rate' => 'required|numeric|min:0',
            'items.*.vat_pct' => 'nullable|numeric|min:0|max:100',
        ]);

        $po = DB::transaction(function () use ($validated) {
            $code = $this->codeGenerator->generate('PO', 'purchase_orders');

            $subtotal = collect($validated['items'])->sum(fn($i) => $i['quantity_ordered'] * $i['unit_rate']);
            $vatAmount = collect($validated['items'])->sum(fn($i) => $i['quantity_ordered'] * $i['unit_rate'] * (($i['vat_pct'] ?? 0) / 100));
            $otherCharges = $validated['other_charges'] ?? 0;

            $po = PurchaseOrder::create(array_merge(
                \Illuminate\Support\Arr::except($validated, ['items']),
                [
                    'code' => $code,
                    'subtotal' => $subtotal,
                    'vat_amount' => $vatAmount,
                    'other_charges' => $otherCharges,
                    'grand_total' => $subtotal + $vatAmount + $otherCharges,
                    'sent_at' => $validated['status'] === 'sent' ? now() : null,
                    'created_by' => auth()->id(),
                ]
            ));

            foreach ($validated['items'] as $item) {
                // vat_pct is nullable in validation but the DB column is NOT NULL
                // — coerce missing/empty to 0 before insert.
                $po->items()->create(array_merge($item, [
                    'vat_pct' => $item['vat_pct'] ?? 0,
                    'total'   => $item['quantity_ordered'] * $item['unit_rate'],
                ]));
            }

            return $po;
        });

        if ($po->status === 'sent') {
            $this->accounting->postPurchaseOrderApproved($po->fresh(['vendor']));
        }

        return redirect()->route('procurement.purchase-orders.show', $po)->with('success', 'Purchase Order created.');
    }

    public function show(PurchaseOrder $purchaseOrder): Response
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        $purchaseOrder->load(['vendor', 'project', 'items.inventoryItem', 'grns.items', 'payments']);

        return Inertia::render('Procurement/PurchaseOrders/Show', ['purchaseOrder' => $purchaseOrder]);
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

    public function destroy(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        abort_if($purchaseOrder->status !== 'draft', 403, 'Only draft POs can be deleted.');

        $purchaseOrder->delete();

        return redirect()->route('procurement.purchase-orders.index')->with('success', 'Purchase Order deleted.');
    }

    public function pdf(PurchaseOrder $purchaseOrder)
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);
        $purchaseOrder->load(['vendor', 'items.inventoryItem']);

        $pdf = Pdf::loadView('pdf.purchase-order', ['po' => $purchaseOrder]);
        return $pdf->stream("PO-{$purchaseOrder->code}.pdf");
    }
}
