<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\ItemCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', InventoryItem::class);

        $query = ItemCategory::orderBy('sort_order')->orderBy('name')->withCount('items');

        if ($search = $request->get('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        return Inertia::render('Inventory/Categories/Index', [
            'categories' => $query->paginate(50)->withQueryString(),
            'filters'    => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', InventoryItem::class);

        $validated = $request->validate([
            'name'        => 'required|string|max:100|unique:item_categories,name',
            'description' => 'nullable|string|max:250',
            'is_active'   => 'boolean',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        ItemCategory::create([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active'   => $validated['is_active'] ?? true,
            'sort_order'  => $validated['sort_order'] ?? 0,
        ]);

        return back()->with('success', 'Inventory category added.');
    }

    public function update(Request $request, ItemCategory $category): RedirectResponse
    {
        $this->authorize('create', InventoryItem::class);

        $validated = $request->validate([
            'name'        => 'required|string|max:100|unique:item_categories,name,' . $category->id,
            'description' => 'nullable|string|max:250',
            'is_active'   => 'boolean',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        $category->update([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active'   => $validated['is_active'] ?? true,
            'sort_order'  => $validated['sort_order'] ?? 0,
        ]);

        return back()->with('success', 'Inventory category updated.');
    }

    public function destroy(ItemCategory $category): RedirectResponse
    {
        $this->authorize('create', InventoryItem::class);

        if ($category->items()->exists()) {
            return back()->withErrors(['delete' => 'Cannot delete: items are still using this category. Reassign them first.']);
        }

        $category->delete();
        return back()->with('success', 'Inventory category deleted.');
    }
}
