<?php

namespace App\Http\Controllers;

use App\Models\GoodsReceiptNote;
use App\Models\PurchaseOrder;
use App\Models\StockTransaction;
use App\Models\Warehouse;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class GRNController extends Controller
{
    public function __construct(private CodeGeneratorService $codeGenerator) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        $grns = GoodsReceiptNote::with(['purchaseOrder.vendor', 'receivedBy', 'warehouse'])
            ->orderByDesc('created_at')
            ->paginate(25)->withQueryString();

        return Inertia::render('Procurement/GRN/Index', ['grns' => $grns]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        $po = null;
        if ($request->po_id) {
            $po = PurchaseOrder::with(['items.inventoryItem'])->find($request->po_id);
        }

        return Inertia::render('Procurement/GRN/Create', [
            'po' => $po,
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'purchaseOrders' => PurchaseOrder::whereNotIn('status', ['received', 'cancelled'])
                ->with(['vendor', 'items'])
                ->orderByDesc('order_date')
                ->get()
                ->map(fn($po) => [
                    'id'     => $po->id,
                    'code'   => $po->code,
                    'status' => $po->status,
                    'vendor' => $po->vendor ? ['id' => $po->vendor->id, 'name' => $po->vendor->name] : null,
                    'items'  => $po->items->map(fn($it) => [
                        'id'                => $it->id,
                        'inventory_item_id' => $it->inventory_item_id,
                        'description'       => $it->description,
                        'unit'              => $it->unit,
                        'quantity_ordered'  => (float) $it->quantity_ordered,
                        'quantity_received' => (float) ($it->quantity_received ?? 0),
                    ]),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        $validated = $request->validate([
            'po_id' => 'required|uuid|exists:purchase_orders,id',
            'received_date' => 'required|date',
            'warehouse_id' => 'nullable|uuid|exists:warehouses,id',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.po_item_id' => 'required|uuid|exists:purchase_order_items,id',
            'items.*.quantity_received' => 'required|numeric|min:0',
            'items.*.condition' => 'required|in:good,damaged,partial',
            'items.*.notes' => 'nullable|string',
        ]);

        $grn = DB::transaction(function () use ($validated) {
            $code = $this->codeGenerator->generate('GRN', 'goods_receipt_notes');

            $grn = GoodsReceiptNote::create(array_merge(
                \Illuminate\Support\Arr::except($validated, ['items']),
                ['code' => $code, 'received_by' => auth()->id()]
            ));

            $po = PurchaseOrder::with('items.inventoryItem')->find($validated['po_id']);

            foreach ($validated['items'] as $itemData) {
                $grn->items()->create(array_merge($itemData, ['created_at' => now()]));

                // Update PO item quantity received
                $poItem = $po->items->firstWhere('id', $itemData['po_item_id']);
                if ($poItem && $poItem->inventory_item_id) {
                    $poItem->increment('quantity_received', $itemData['quantity_received']);

                    // Post stock transaction
                    StockTransaction::create([
                        'inventory_item_id' => $poItem->inventory_item_id,
                        'warehouse_id' => $validated['warehouse_id'],
                        'type' => 'purchase',
                        'quantity' => $itemData['quantity_received'],
                        'unit_rate' => $poItem->unit_rate,
                        'total_value' => $itemData['quantity_received'] * $poItem->unit_rate,
                        'reference_type' => 'grn',
                        'reference_id' => $grn->id,
                        'transaction_date' => $validated['received_date'],
                        'created_by' => auth()->id(),
                        'created_at' => now(),
                    ]);
                }
            }

            // Update PO status
            $allReceived = $po->items->every(fn($i) => $i->fresh()->quantity_received >= $i->quantity_ordered);
            $anyReceived = $po->items->some(fn($i) => $i->fresh()->quantity_received > 0);

            if ($allReceived) {
                $po->update(['status' => 'received']);
            } elseif ($anyReceived) {
                $po->update(['status' => 'partially_received']);
            }

            return $grn;
        });

        return redirect()->route('procurement.grn.show', $grn)->with('success', 'GRN created.');
    }

    public function show(GoodsReceiptNote $grn): Response
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);
        $grn->load(['purchaseOrder.vendor', 'receivedBy', 'warehouse', 'items.poItem.inventoryItem']);
        return Inertia::render('Procurement/GRN/Show', ['grn' => $grn]);
    }

    public function edit(GoodsReceiptNote $grn): Response
    {
        abort(403, 'GRNs cannot be edited.');
    }

    public function update(Request $request, GoodsReceiptNote $grn): RedirectResponse
    {
        abort(403, 'GRNs cannot be edited.');
    }

    public function destroy(GoodsReceiptNote $grn): RedirectResponse
    {
        abort(403, 'GRNs cannot be deleted.');
    }
}
