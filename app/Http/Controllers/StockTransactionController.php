<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Project;
use App\Models\StockAdjustment;
use App\Models\StockTransaction;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockTransactionController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', InventoryItem::class);

        $validated = $request->validate([
            'inventory_item_id' => 'required|uuid|exists:inventory_items,id',
            'warehouse_id' => 'required|uuid|exists:warehouses,id',
            'type' => 'required|in:opening,purchase,return_from_project,transfer_in,transfer_out,damage,waste',
            'quantity' => 'required|numeric|min:0.01',
            'unit_rate' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'transaction_date' => 'required|date',
        ]);

        StockTransaction::create(array_merge($validated, [
            'total_value' => ($validated['quantity'] ?? 0) * ($validated['unit_rate'] ?? 0),
            'reference_type' => 'manual',
            'created_by' => auth()->id(),
            'created_at' => now(),
        ]));

        return back()->with('success', 'Stock transaction recorded.');
    }

    public function issueForm(): Response
    {
        $this->authorize('create', InventoryItem::class);

        // Recent project-issue transactions (negative-quantity rows)
        $recent = StockTransaction::with(['inventoryItem:id,code,name,unit', 'warehouse:id,name', 'project:id,code,name', 'createdBy:id,name'])
            ->where('type', 'project_issue')
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn($t) => [
                'id'              => $t->id,
                'transaction_date'=> $t->transaction_date,
                'item'            => $t->inventoryItem ? [
                    'id'   => $t->inventoryItem->id,
                    'code' => $t->inventoryItem->code,
                    'name' => $t->inventoryItem->name,
                    'unit' => $t->inventoryItem->unit,
                ] : null,
                'warehouse'       => $t->warehouse ? ['id' => $t->warehouse->id, 'name' => $t->warehouse->name] : null,
                'project'         => $t->project ? ['id' => $t->project->id, 'code' => $t->project->code, 'name' => $t->project->name] : null,
                'quantity'        => abs((float) $t->quantity),
                'notes'           => $t->notes,
                'created_by'      => $t->createdBy?->name,
            ]);

        return Inertia::render('Inventory/Issue', [
            'projects'   => Project::whereNotIn('status', ['completed', 'cancelled'])->select('id', 'name', 'code')->get(),
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'items'      => InventoryItem::where('is_active', true)->select('id', 'name', 'code', 'unit')->get(),
            'history'    => $recent,
        ]);
    }

    public function issue(Request $request): RedirectResponse
    {
        $this->authorize('create', InventoryItem::class);

        $validated = $request->validate([
            'project_id' => 'required|uuid|exists:projects,id',
            'warehouse_id' => 'required|uuid|exists:warehouses,id',
            'issue_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|uuid|exists:inventory_items,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['items'] as $item) {
                // Check stock
                $balance = StockTransaction::where('inventory_item_id', $item['inventory_item_id'])
                    ->where('warehouse_id', $validated['warehouse_id'])
                    ->sum('quantity');

                if ($balance < $item['quantity']) {
                    abort(422, "Insufficient stock for item.");
                }

                StockTransaction::create([
                    'inventory_item_id' => $item['inventory_item_id'],
                    'warehouse_id' => $validated['warehouse_id'],
                    'project_id' => $validated['project_id'],
                    'type' => 'project_issue',
                    'quantity' => -$item['quantity'],
                    'notes' => $item['notes'] ?? null,
                    'transaction_date' => $validated['issue_date'],
                    'reference_type' => 'manual',
                    'created_by' => auth()->id(),
                    'created_at' => now(),
                ]);
            }
        });

        return redirect()->route('inventory.issue')->with('success', 'Items issued to project.');
    }

    public function adjustmentForm(): Response
    {
        $this->authorize('create', InventoryItem::class);

        $recent = StockAdjustment::with(['inventoryItem:id,code,name,unit', 'warehouse:id,name', 'adjustedBy:id,name'])
            ->orderByDesc('adjustment_date')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn($a) => [
                'id'              => $a->id,
                'adjustment_date' => $a->adjustment_date,
                'item'            => $a->inventoryItem ? [
                    'id'   => $a->inventoryItem->id,
                    'code' => $a->inventoryItem->code,
                    'name' => $a->inventoryItem->name,
                    'unit' => $a->inventoryItem->unit,
                ] : null,
                'warehouse'       => $a->warehouse ? ['id' => $a->warehouse->id, 'name' => $a->warehouse->name] : null,
                'physical_count'  => (float) $a->physical_count,
                'system_count'    => (float) $a->system_count,
                'variance'        => (float) $a->variance,
                'reason'          => $a->reason,
                'adjusted_by'     => $a->adjustedBy?->name,
            ]);

        return Inertia::render('Inventory/Adjustments', [
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'items'      => InventoryItem::where('is_active', true)->select('id', 'name', 'code', 'unit')->get(),
            'history'    => $recent,
        ]);
    }

    public function adjustment(Request $request): RedirectResponse
    {
        $this->authorize('create', InventoryItem::class);

        $validated = $request->validate([
            'inventory_item_id' => 'required|uuid|exists:inventory_items,id',
            'warehouse_id' => 'required|uuid|exists:warehouses,id',
            'physical_count' => 'required|numeric|min:0',
            'adjustment_date' => 'required|date',
            'reason' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            $systemCount = StockTransaction::where('inventory_item_id', $validated['inventory_item_id'])
                ->where('warehouse_id', $validated['warehouse_id'])
                ->sum('quantity');

            $variance = $validated['physical_count'] - $systemCount;

            StockAdjustment::create([
                'inventory_item_id' => $validated['inventory_item_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'physical_count' => $validated['physical_count'],
                'system_count' => $systemCount,
                'variance' => $variance,
                'adjustment_date' => $validated['adjustment_date'],
                'reason' => $validated['reason'],
                'adjusted_by' => auth()->id(),
                'created_at' => now(),
            ]);

            if ($variance != 0) {
                StockTransaction::create([
                    'inventory_item_id' => $validated['inventory_item_id'],
                    'warehouse_id' => $validated['warehouse_id'],
                    'type' => 'adjustment',
                    'quantity' => $variance,
                    'notes' => "Adjustment: {$validated['reason']}",
                    'transaction_date' => $validated['adjustment_date'],
                    'reference_type' => 'manual',
                    'created_by' => auth()->id(),
                    'created_at' => now(),
                ]);
            }
        });

        return back()->with('success', 'Stock adjustment recorded.');
    }

    public function report(Request $request): Response
    {
        $this->authorize('viewAny', InventoryItem::class);

        $filters = $request->only(['inventory_item_id', 'project_id', 'from', 'to']);

        $query = StockTransaction::query()
            ->with([
                'inventoryItem:id,name,sku,unit',
                'project:id,name,code',
                'warehouse:id,name',
                'createdBy:id,name',
            ]);

        if (!empty($filters['inventory_item_id'])) {
            $query->where('inventory_item_id', $filters['inventory_item_id']);
        }
        if (!empty($filters['project_id'])) {
            if ($filters['project_id'] === 'none') {
                $query->whereNull('project_id');
            } else {
                $query->where('project_id', $filters['project_id']);
            }
        }
        if (!empty($filters['from'])) {
            $query->whereDate('transaction_date', '>=', $filters['from']);
        }
        if (!empty($filters['to'])) {
            $query->whereDate('transaction_date', '<=', $filters['to']);
        }

        $transactions = $query
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->get();

        // Group by project_id (null → warehouse-only movements)
        $groups = $transactions
            ->groupBy(fn ($tx) => $tx->project_id ?? 'none')
            ->map(function ($txs) {
                $project = $txs->first()->project;
                $inQty  = (float) $txs->where('quantity', '>', 0)->sum('quantity');
                $outQty = (float) abs($txs->where('quantity', '<', 0)->sum('quantity'));
                $inVal  = (float) $txs->where('quantity', '>', 0)->sum('total_value');
                $outVal = (float) abs($txs->where('quantity', '<', 0)->sum('total_value'));

                return [
                    'project' => $project ? [
                        'id'   => $project->id,
                        'name' => $project->name,
                        'code' => $project->code,
                    ] : null,
                    'transactions' => $txs->values(),
                    'in_qty'    => $inQty,
                    'out_qty'   => $outQty,
                    'net_qty'   => $inQty - $outQty,
                    'in_value'  => $inVal,
                    'out_value' => $outVal,
                    'net_value' => $inVal - $outVal,
                    'count'     => $txs->count(),
                ];
            })
            ->sortByDesc(fn ($g) => $g['project'] !== null)
            ->values();

        $items = InventoryItem::select('id', 'name', 'unit')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $projects = Project::select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        return Inertia::render('Inventory/Report', [
            'groups'   => $groups,
            'items'    => $items,
            'projects' => $projects,
            'filters'  => $filters,
        ]);
    }
}
