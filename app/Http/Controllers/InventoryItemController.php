<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\ItemCategory;
use App\Models\StockTransaction;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InventoryItemController extends Controller
{
    public function __construct(private CodeGeneratorService $codeGenerator) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', InventoryItem::class);

        $query = InventoryItem::with('category')
            ->when($request->search, fn($q, $s) => $q->where(function ($w) use ($s) {
                $w->where('name', 'like', "%$s%")->orWhere('code', 'like', "%$s%");
            }))
            ->when($request->category_id, fn($q, $c) => $q->where('category_id', $c));

        // Stock balance per item (sum of all transactions) for the current page
        $balances = StockTransaction::select('inventory_item_id', DB::raw('SUM(quantity) as qty'))
            ->groupBy('inventory_item_id')
            ->pluck('qty', 'inventory_item_id');

        // For low/out filters we need balance info before paginating, so compute
        // the matching set first, then paginate the filtered id list.
        if (in_array($request->stock_status, ['low', 'out'])) {
            $allIds = (clone $query)->pluck('id');
            $matchIds = $allIds->filter(function ($id) use ($balances, $request) {
                $stock = (float) ($balances[$id] ?? 0);
                $item  = InventoryItem::select('reorder_level')->find($id);
                $min   = (float) ($item->reorder_level ?? 0);
                return $request->stock_status === 'out'
                    ? $stock <= 0
                    : ($stock <= $min && $stock > 0);
            })->values();
            $query->whereIn('id', $matchIds);
        }

        $items = $query->orderBy('name')->paginate(25)->withQueryString();

        // Attach stock info to the page's items
        $items->getCollection()->transform(function ($item) use ($balances) {
            $stock = (float) ($balances[$item->id] ?? 0);
            $min   = (float) ($item->reorder_level ?? 0);
            $item->current_stock = $stock;
            $item->stock_status  = $stock <= 0 ? 'out' : ($min > 0 && $stock <= $min ? 'low' : 'ok');
            return $item;
        });

        // Dashboard counts — visible regardless of current filter
        $allBalances = $balances;
        $allItems = InventoryItem::where('is_active', true)->get(['id', 'reorder_level']);
        $lowCount = 0;
        $outCount = 0;
        foreach ($allItems as $it) {
            $s = (float) ($allBalances[$it->id] ?? 0);
            $m = (float) ($it->reorder_level ?? 0);
            if ($s <= 0) $outCount++;
            elseif ($m > 0 && $s <= $m) $lowCount++;
        }

        return Inertia::render('Inventory/Items/Index', [
            'items'      => $items,
            'categories' => ItemCategory::where('is_active', true)->orderBy('sort_order')->orderBy('name')->get(['id', 'name']),
            'filters'    => $request->only(['search', 'category_id', 'stock_status']),
            'alerts'     => [
                'low' => $lowCount,
                'out' => $outCount,
                'total_active' => $allItems->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', InventoryItem::class);
        return Inertia::render('Inventory/Items/Create', [
            'categories' => ItemCategory::where('is_active', true)
                ->orderBy('sort_order')->orderBy('name')
                ->get(['id', 'name']),
            'warehouses' => \App\Models\Warehouse::where('is_active', true)
                ->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', InventoryItem::class);

        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'category_id' => 'nullable|uuid|exists:item_categories,id',
            'unit' => 'required|string|max:50',
            'reorder_level' => 'nullable|numeric|min:0',
            'standard_rate' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $code = $this->codeGenerator->generate('ITM', 'inventory_items', false);
        $item = InventoryItem::create(array_merge($validated, ['code' => $code]));

        return redirect()->route('inventory.items.show', $item)->with('success', 'Item created.');
    }

    public function show(InventoryItem $item): Response
    {
        $this->authorize('view', $item);

        $item->load('category');

        $stockByWarehouse = \App\Models\StockTransaction::selectRaw('warehouse_id, SUM(quantity) as balance, SUM(total_value) as total_value')
            ->where('inventory_item_id', $item->id)
            ->groupBy('warehouse_id')
            ->with('warehouse')
            ->get();

        $currentStock = (float) StockTransaction::where('inventory_item_id', $item->id)->sum('quantity');
        $min = (float) ($item->reorder_level ?? 0);
        $item->current_stock = $currentStock;
        $item->stock_status  = $currentStock <= 0 ? 'out' : ($min > 0 && $currentStock <= $min ? 'low' : 'ok');

        $transactions = \App\Models\StockTransaction::with(['warehouse', 'project', 'createdBy'])
            ->where('inventory_item_id', $item->id)
            ->orderByDesc('transaction_date')
            ->paginate(25);

        return Inertia::render('Inventory/Items/Show', [
            'item' => $item,
            'stockByWarehouse' => $stockByWarehouse,
            'transactions' => $transactions,
        ]);
    }

    public function edit(InventoryItem $item): Response
    {
        $this->authorize('update', $item);
        return Inertia::render('Inventory/Items/Edit', [
            'item' => $item,
            'categories' => ItemCategory::where('is_active', true)
                ->orderBy('sort_order')->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, InventoryItem $item): RedirectResponse
    {
        $this->authorize('update', $item);

        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'category_id' => 'nullable|uuid|exists:item_categories,id',
            'unit' => 'required|string|max:50',
            'reorder_level' => 'nullable|numeric|min:0',
            'standard_rate' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $item->update($validated);

        return back()->with('success', 'Item updated.');
    }

    public function destroy(InventoryItem $item): RedirectResponse
    {
        $this->authorize('delete', $item);
        $item->delete();
        return redirect()->route('inventory.items.index')->with('success', 'Item deleted.');
    }
}

// Add policies for InventoryItem
