<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', \App\Models\InventoryItem::class);
        return Inertia::render('Inventory/Warehouses/Index', ['warehouses' => Warehouse::all()]);
    }

    public function create(): Response
    {
        $this->authorize('create', \App\Models\InventoryItem::class);
        return Inertia::render('Inventory/Warehouses/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', \App\Models\InventoryItem::class);
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'location' => 'nullable|string|max:200',
            'notes' => 'nullable|string|max:500',
        ]);
        Warehouse::create($validated);
        return redirect()->route('inventory.warehouses.index')->with('success', 'Warehouse created.');
    }

    public function show(Warehouse $warehouse): Response
    {
        $this->authorize('viewAny', \App\Models\InventoryItem::class);
        return Inertia::render('Inventory/Warehouses/Show', ['warehouse' => $warehouse]);
    }

    public function edit(Warehouse $warehouse): Response
    {
        $this->authorize('update', \App\Models\InventoryItem::class);
        return Inertia::render('Inventory/Warehouses/Edit', ['warehouse' => $warehouse]);
    }

    public function update(Request $request, Warehouse $warehouse): RedirectResponse
    {
        $this->authorize('update', \App\Models\InventoryItem::class);
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'location' => 'nullable|string|max:200',
            'notes' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);
        $warehouse->update($validated);
        return back()->with('success', 'Warehouse updated.');
    }

    public function destroy(Warehouse $warehouse): RedirectResponse
    {
        $this->authorize('delete', \App\Models\InventoryItem::class);
        $warehouse->delete();
        return redirect()->route('inventory.warehouses.index')->with('success', 'Warehouse deleted.');
    }
}
