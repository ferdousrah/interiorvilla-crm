<?php

namespace App\Http\Controllers;

use App\Models\PurchaseRequisition;
use App\Models\Project;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RequisitionController extends Controller
{
    public function __construct(private CodeGeneratorService $codeGenerator) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        $requisitions = PurchaseRequisition::with(['project', 'requestedBy', 'items'])
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->project_id, fn($q, $p) => $q->where('project_id', $p))
            ->orderByDesc('created_at')
            ->paginate(25)->withQueryString();

        return Inertia::render('Procurement/Requisitions/Index', [
            'requisitions' => $requisitions,
            'filters' => $request->only(['status', 'project_id']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        return Inertia::render('Procurement/Requisitions/Create', [
            'projects' => Project::whereNotIn('status', ['completed', 'cancelled'])->select('id', 'name', 'code')->get(),
            'inventoryItems' => \App\Models\InventoryItem::where('is_active', true)->select('id', 'name', 'code', 'unit')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        $validated = $request->validate([
            'project_id' => 'nullable|uuid|exists:projects,id',
            'priority' => 'required|in:low,normal,high,urgent',
            'required_by' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'nullable|uuid|exists:inventory_items,id',
            'items.*.description' => 'required|string|max:250',
            'items.*.unit' => 'required|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.estimated_rate' => 'nullable|numeric|min:0',
        ]);

        $requisition = DB::transaction(function () use ($validated) {
            $code = $this->codeGenerator->generate('REQ', 'purchase_requisitions');
            $req = PurchaseRequisition::create(array_merge(
                \Illuminate\Support\Arr::except($validated, ['items']),
                ['code' => $code, 'requested_by' => auth()->id()]
            ));

            foreach ($validated['items'] as $item) {
                $req->items()->create($item);
            }

            return $req;
        });

        return redirect()->route('procurement.requisitions.show', $requisition)->with('success', 'Requisition created.');
    }

    public function show(PurchaseRequisition $requisition): Response
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        $requisition->load(['project', 'requestedBy', 'approvedBy', 'items.inventoryItem']);

        return Inertia::render('Procurement/Requisitions/Show', ['requisition' => $requisition]);
    }

    public function edit(PurchaseRequisition $requisition): Response
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);
        $requisition->load('items');
        return Inertia::render('Procurement/Requisitions/Edit', [
            'requisition' => $requisition,
            'projects' => Project::whereNotIn('status', ['completed', 'cancelled'])->select('id', 'name', 'code')->get(),
            'inventoryItems' => \App\Models\InventoryItem::where('is_active', true)->select('id', 'name', 'code', 'unit')->get(),
        ]);
    }

    public function update(Request $request, PurchaseRequisition $requisition): RedirectResponse
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        abort_if($requisition->status !== 'pending', 403, 'Cannot edit non-pending requisition.');

        $validated = $request->validate([
            'project_id' => 'nullable|uuid|exists:projects,id',
            'priority' => 'required|in:low,normal,high,urgent',
            'required_by' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $requisition->update($validated);

        return back()->with('success', 'Requisition updated.');
    }

    public function destroy(PurchaseRequisition $requisition): RedirectResponse
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);
        $requisition->delete();
        return redirect()->route('procurement.requisitions.index')->with('success', 'Requisition deleted.');
    }

    public function approve(Request $request, PurchaseRequisition $requisition): RedirectResponse
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        $requisition->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Requisition approved.');
    }

    public function reject(Request $request, PurchaseRequisition $requisition): RedirectResponse
    {
        $this->authorize('viewAny', \App\Models\Vendor::class);

        $validated = $request->validate(['rejection_note' => 'required|string']);

        $requisition->update(array_merge($validated, [
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]));

        return back()->with('success', 'Requisition rejected.');
    }
}
