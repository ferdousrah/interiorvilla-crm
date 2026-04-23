<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\CostEstimation;
use App\Models\CostEstimationItem;
use App\Models\Lead;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CostEstimationController extends Controller
{
    public function __construct(private CodeGeneratorService $codeGenerator) {}

    public function index(Request $request): Response
    {
        $query = CostEstimation::with(['lead', 'client', 'project', 'createdBy'])
            ->whereNull('deleted_at');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%");
            });
        }
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $estimations = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        return Inertia::render('CostEstimations/Index', [
            'estimations' => $estimations,
            'filters'     => $request->only('search', 'status'),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('CostEstimations/Create', [
            'clients'  => Client::orderBy('name')->get(['id', 'name', 'code']),
            'leads'    => Lead::whereNotIn('status', ['won', 'lost'])->orderBy('name')->get(['id', 'name', 'phone', 'estimated_value']),
            'projects' => Project::whereNotIn('status', ['completed', 'cancelled'])->orderBy('name')->get(['id', 'name', 'code', 'contract_value']),
            'serviceCategories' => config('services_catalog.service_categories'),
            'prefill'  => [
                'lead_id'    => $request->get('lead_id'),
                'client_id'  => $request->get('client_id'),
                'project_id' => $request->get('project_id'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title'         => 'required|string|max:250',
            'service_group' => 'nullable|string|max:50',
            'service_type'  => 'nullable|string|max:150',
            'lead_id'       => 'nullable|uuid|exists:leads,id',
            'client_id'     => 'nullable|uuid|exists:clients,id',
            'project_id'    => 'nullable|uuid|exists:projects,id',
            'markup_pct'    => 'nullable|numeric|min:0|max:100',
            'notes'         => 'nullable|string',
            'items'         => 'required|array|min:1',
            'items.*.material_id'    => 'nullable|uuid|exists:materials,id',
            'items.*.category'       => 'required|in:material,labor,subcontractor,transport,overhead,contingency,other',
            'items.*.description'    => 'required|string|max:250',
            'items.*.unit'           => 'required|string|max:30',
            'items.*.quantity'       => 'required|numeric|min:0',
            'items.*.estimated_rate' => 'required|numeric|min:0',
            'items.*.actual_total'   => 'nullable|numeric|min:0',
        ]);

        $estimation = DB::transaction(function () use ($validated) {
            $totals = $this->calculateTotals($validated);

            $estimation = CostEstimation::create([
                'code'            => $this->codeGenerator->generate('CE', 'cost_estimations'),
                'title'           => $validated['title'],
                'service_group'   => $validated['service_group'] ?? null,
                'service_type'    => $validated['service_type'] ?? null,
                'lead_id'         => $validated['lead_id'] ?? null,
                'client_id'       => $validated['client_id'] ?? null,
                'project_id'      => $validated['project_id'] ?? null,
                'markup_pct'      => $validated['markup_pct'] ?? 20,
                'total_estimated' => $totals['estimated'],
                'total_actual'    => $totals['actual'],
                'markup_amount'   => $totals['markup'],
                'suggested_quote' => $totals['suggested_quote'],
                'notes'           => $validated['notes'] ?? null,
                'created_by'      => auth()->id(),
            ]);

            foreach ($validated['items'] as $seq => $item) {
                CostEstimationItem::create([
                    'cost_estimation_id' => $estimation->id,
                    'material_id'        => $item['material_id'] ?? null,
                    'category'           => $item['category'],
                    'description'        => $item['description'],
                    'unit'               => $item['unit'],
                    'quantity'           => $item['quantity'],
                    'estimated_rate'     => $item['estimated_rate'],
                    'estimated_total'    => round($item['quantity'] * $item['estimated_rate'], 2),
                    'actual_total'       => $item['actual_total'] ?? 0,
                    'sequence'           => $seq,
                ]);
            }

            return $estimation;
        });

        return redirect()->route('cost-estimations.show', $estimation)->with('success', 'Cost estimation created.');
    }

    public function show(CostEstimation $costEstimation): Response
    {
        $costEstimation->load(['lead', 'client', 'project', 'items', 'createdBy']);

        return Inertia::render('CostEstimations/Show', [
            'estimation' => $costEstimation,
        ]);
    }

    public function edit(CostEstimation $costEstimation): Response
    {
        $costEstimation->load(['items']);

        return Inertia::render('CostEstimations/Edit', [
            'estimation' => $costEstimation,
            'clients'    => Client::orderBy('name')->get(['id', 'name', 'code']),
            'leads'      => Lead::whereNotIn('status', ['won', 'lost'])->orderBy('name')->get(['id', 'name', 'phone']),
            'projects'   => Project::whereNotIn('status', ['completed', 'cancelled'])->orderBy('name')->get(['id', 'name', 'code', 'contract_value']),
            'serviceCategories' => config('services_catalog.service_categories'),
        ]);
    }

    public function update(Request $request, CostEstimation $costEstimation): RedirectResponse
    {
        $validated = $request->validate([
            'title'         => 'required|string|max:250',
            'service_group' => 'nullable|string|max:50',
            'service_type'  => 'nullable|string|max:150',
            'lead_id'       => 'nullable|uuid|exists:leads,id',
            'client_id'     => 'nullable|uuid|exists:clients,id',
            'project_id'    => 'nullable|uuid|exists:projects,id',
            'markup_pct'    => 'nullable|numeric|min:0|max:100',
            'notes'         => 'nullable|string',
            'items'         => 'required|array|min:1',
            'items.*.material_id'    => 'nullable|uuid|exists:materials,id',
            'items.*.category'       => 'required|in:material,labor,subcontractor,transport,overhead,contingency,other',
            'items.*.description'    => 'required|string|max:250',
            'items.*.unit'           => 'required|string|max:30',
            'items.*.quantity'       => 'required|numeric|min:0',
            'items.*.estimated_rate' => 'required|numeric|min:0',
            'items.*.actual_total'   => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $costEstimation) {
            $totals = $this->calculateTotals($validated);

            $costEstimation->update([
                'title'           => $validated['title'],
                'service_group'   => $validated['service_group'] ?? null,
                'service_type'    => $validated['service_type'] ?? null,
                'lead_id'         => $validated['lead_id'] ?? null,
                'client_id'       => $validated['client_id'] ?? null,
                'project_id'      => $validated['project_id'] ?? null,
                'markup_pct'      => $validated['markup_pct'] ?? 20,
                'total_estimated' => $totals['estimated'],
                'total_actual'    => $totals['actual'],
                'markup_amount'   => $totals['markup'],
                'suggested_quote' => $totals['suggested_quote'],
                'notes'           => $validated['notes'] ?? null,
            ]);

            $costEstimation->items()->delete();
            foreach ($validated['items'] as $seq => $item) {
                CostEstimationItem::create([
                    'cost_estimation_id' => $costEstimation->id,
                    'material_id'        => $item['material_id'] ?? null,
                    'category'           => $item['category'],
                    'description'        => $item['description'],
                    'unit'               => $item['unit'],
                    'quantity'           => $item['quantity'],
                    'estimated_rate'     => $item['estimated_rate'],
                    'estimated_total'    => round($item['quantity'] * $item['estimated_rate'], 2),
                    'actual_total'       => $item['actual_total'] ?? 0,
                    'sequence'           => $seq,
                ]);
            }
        });

        return redirect()->route('cost-estimations.show', $costEstimation)->with('success', 'Cost estimation updated.');
    }

    public function destroy(CostEstimation $costEstimation): RedirectResponse
    {
        $costEstimation->delete();
        return redirect()->route('cost-estimations.index')->with('success', 'Cost estimation deleted.');
    }

    public function markFinal(CostEstimation $costEstimation): RedirectResponse
    {
        $costEstimation->update(['status' => 'final']);
        return back()->with('success', 'Cost estimation finalized.');
    }

    /**
     * Generate a Quotation from this cost estimation.
     * Maps cost categories to quotation line items, applying the markup.
     */
    public function generateQuotation(Request $request, CostEstimation $costEstimation): RedirectResponse
    {
        $request->validate([
            'markup_pct' => 'required|numeric|min:0|max:200',
            'subject'    => 'required|string|max:250',
        ]);

        $costEstimation->load('items');
        $markupPct = $request->markup_pct;

        $quotation = DB::transaction(function () use ($costEstimation, $markupPct, $request) {
            $codeService = app(CodeGeneratorService::class);

            // Map cost items to quotation items with markup applied to rates
            $quotationItems = [];
            foreach ($costEstimation->items as $seq => $item) {
                $markedUpRate = round($item->estimated_rate * (1 + $markupPct / 100), 2);
                $quotationItems[] = [
                    'category'    => $this->mapCostCategoryToQuotation($item->category),
                    'description' => $item->description,
                    'unit'        => $item->unit,
                    'quantity'    => $item->quantity,
                    'unit_rate'   => $markedUpRate,
                    'total'       => round($item->quantity * $markedUpRate, 2),
                    'sequence'    => $seq,
                ];
            }

            $subtotal = collect($quotationItems)->sum('total');

            $quotation = Quotation::create([
                'code'       => $codeService->generate('QT', 'quotations'),
                'client_id'  => $costEstimation->client_id,
                'lead_id'    => $costEstimation->lead_id,
                'project_id' => $costEstimation->project_id,
                'subject'    => $request->subject,
                'subtotal'   => $subtotal,
                'grand_total'=> $subtotal,
                'terms'      => "1. This quotation is valid for 30 days.\n2. 30% advance payment required.\n3. 40% on material delivery.\n4. 30% balance on completion.",
                'notes'      => "Generated from Cost Estimation {$costEstimation->code} with {$markupPct}% markup.",
                'created_by' => auth()->id(),
            ]);

            foreach ($quotationItems as $item) {
                QuotationItem::create(array_merge($item, ['quotation_id' => $quotation->id]));
            }

            // Mark CE as final
            $costEstimation->update(['status' => 'final']);

            return $quotation;
        });

        return redirect()->route('quotations.show', $quotation)->with('success', 'Quotation generated from cost estimation!');
    }

    private function mapCostCategoryToQuotation(string $category): string
    {
        return match($category) {
            'material'       => 'Materials & Supplies',
            'labor'          => 'Labor & Workmanship',
            'subcontractor'  => 'Subcontractor Work',
            'transport'      => 'Transport & Logistics',
            'overhead'       => 'Overhead & Management',
            'contingency'    => 'Contingency',
            default          => 'Other',
        };
    }

    private function calculateTotals(array $data): array
    {
        $estimated = collect($data['items'])->sum(fn($i) => $i['quantity'] * $i['estimated_rate']);
        $actual    = collect($data['items'])->sum(fn($i) => $i['actual_total'] ?? 0);
        $markupPct = $data['markup_pct'] ?? 20;
        $markup    = round($estimated * $markupPct / 100, 2);

        return [
            'estimated'       => round($estimated, 2),
            'actual'          => round($actual, 2),
            'markup'          => $markup,
            'suggested_quote' => round($estimated + $markup, 2),
        ];
    }
}
