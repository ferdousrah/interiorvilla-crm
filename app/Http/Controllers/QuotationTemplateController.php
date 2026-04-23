<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\QuotationTemplate;
use App\Models\QuotationTemplateItem;
use App\Models\QuotationTemplateSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QuotationTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        $query = QuotationTemplate::withCount('sections')
            ->with('sections.items')
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($group = $request->get('service_group')) {
            $query->where('service_group', $group);
        }
        if ($search = $request->get('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $templates = $query->get()->map(function ($t) {
            $t->item_count  = $t->sections->sum(fn ($s) => $s->items->count());
            $t->total_value = $t->sections->sum(fn ($s) =>
                $s->items->sum(fn ($i) => ((float) $i->default_quantity ?: 1) * (float) $i->default_rate)
            );
            return $t;
        });

        return Inertia::render('Settings/QuotationTemplates/Index', [
            'templates'         => $templates,
            'serviceCategories' => config('services_catalog.service_categories'),
            'filters'           => $request->only(['service_group', 'search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Settings/QuotationTemplates/Builder', [
            'template'          => null,
            'serviceCategories' => config('services_catalog.service_categories'),
            'materials'         => Material::where('is_active', true)
                ->select('id', 'name', 'unit', 'default_rate')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateTemplate($request);

        DB::transaction(function () use ($validated) {
            $template = QuotationTemplate::create([
                'name'                    => $validated['name'],
                'service_group'           => $validated['service_group'] ?? null,
                'service_type'            => $validated['service_type'] ?? null,
                'description'             => $validated['description'] ?? null,
                'default_terms'           => $validated['default_terms'] ?? null,
                'default_supervision_pct' => $validated['default_supervision_pct'] ?? 0,
                'is_active'               => $validated['is_active'] ?? true,
                'sort_order'              => $validated['sort_order'] ?? 0,
                'created_by'              => auth()->id(),
            ]);

            $this->syncSections($template, $validated['sections'] ?? []);
        });

        return redirect()->route('settings.quotation-templates.index')
            ->with('success', 'Template created.');
    }

    public function edit(QuotationTemplate $quotation_template): Response
    {
        $quotation_template->load('sections.items.material');

        return Inertia::render('Settings/QuotationTemplates/Builder', [
            'template'          => $quotation_template,
            'serviceCategories' => config('services_catalog.service_categories'),
            'materials'         => Material::where('is_active', true)
                ->select('id', 'name', 'unit', 'default_rate')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function update(Request $request, QuotationTemplate $quotation_template): RedirectResponse
    {
        $validated = $this->validateTemplate($request);

        DB::transaction(function () use ($validated, $quotation_template) {
            $quotation_template->update([
                'name'                    => $validated['name'],
                'service_group'           => $validated['service_group'] ?? null,
                'service_type'            => $validated['service_type'] ?? null,
                'description'             => $validated['description'] ?? null,
                'default_terms'           => $validated['default_terms'] ?? null,
                'default_supervision_pct' => $validated['default_supervision_pct'] ?? 0,
                'is_active'               => $validated['is_active'] ?? true,
                'sort_order'              => $validated['sort_order'] ?? 0,
            ]);

            $this->syncSections($quotation_template, $validated['sections'] ?? []);
        });

        return redirect()->route('settings.quotation-templates.index')
            ->with('success', 'Template updated.');
    }

    public function destroy(QuotationTemplate $quotation_template): RedirectResponse
    {
        $quotation_template->delete();
        return back()->with('success', 'Template deleted.');
    }

    /**
     * AJAX endpoint — returns active templates matching a service_group / service_type.
     * Used by the Quotation Create form to show a "Use Template" picker.
     */
    public function searchApi(Request $request): JsonResponse
    {
        $query = QuotationTemplate::where('is_active', true)
            ->with('sections.items')
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($group = $request->get('group')) {
            $query->where(function ($q) use ($group) {
                $q->where('service_group', $group)->orWhereNull('service_group');
            });
        }
        if ($type = $request->get('type')) {
            $query->where(function ($q) use ($type) {
                $q->where('service_type', $type)->orWhereNull('service_type');
            });
        }

        return response()->json(
            $query->get()->map(function ($t) {
                return [
                    'id'                      => $t->id,
                    'name'                    => $t->name,
                    'service_group'           => $t->service_group,
                    'service_type'            => $t->service_type,
                    'description'             => $t->description,
                    'default_terms'           => $t->default_terms,
                    'default_supervision_pct' => (float) $t->default_supervision_pct,
                    'sections' => $t->sections->map(fn ($s) => [
                        'name'  => $s->name,
                        'items' => $s->items->map(fn ($i) => [
                            'description'     => $i->description,
                            'unit'            => $i->unit,
                            'default_quantity'=> $i->default_quantity ? (float) $i->default_quantity : null,
                            'default_rate'    => (float) $i->default_rate,
                        ])->values(),
                    ])->values(),
                ];
            })
        );
    }

    private function validateTemplate(Request $request): array
    {
        return $request->validate([
            'name'                            => 'required|string|max:150',
            'service_group'                   => 'nullable|string|max:50',
            'service_type'                    => 'nullable|string|max:100',
            'description'                     => 'nullable|string',
            'default_terms'                   => 'nullable|string',
            'default_supervision_pct'         => 'nullable|numeric|min:0|max:100',
            'is_active'                       => 'boolean',
            'sort_order'                      => 'nullable|integer|min:0',
            'sections'                        => 'nullable|array',
            'sections.*.name'                 => 'required|string|max:150',
            'sections.*.items'                => 'nullable|array',
            'sections.*.items.*.description'  => 'required|string',
            'sections.*.items.*.unit'         => 'required|string|max:30',
            'sections.*.items.*.default_quantity' => 'nullable|numeric|min:0',
            'sections.*.items.*.default_rate' => 'required|numeric|min:0',
            'sections.*.items.*.material_id'  => 'nullable|uuid|exists:materials,id',
        ]);
    }

    private function syncSections(QuotationTemplate $template, array $sections): void
    {
        // Wipe + rebuild (cascade will remove items too)
        $template->sections()->delete();

        foreach ($sections as $sIdx => $section) {
            $created = QuotationTemplateSection::create([
                'template_id' => $template->id,
                'name'        => $section['name'],
                'sort_order'  => $sIdx,
            ]);

            foreach ($section['items'] ?? [] as $iIdx => $item) {
                QuotationTemplateItem::create([
                    'section_id'       => $created->id,
                    'material_id'      => $item['material_id'] ?? null,
                    'description'      => $item['description'],
                    'unit'             => $item['unit'],
                    'default_quantity' => $item['default_quantity'] ?? null,
                    'default_rate'     => $item['default_rate'] ?? 0,
                    'sort_order'       => $iIdx,
                ]);
            }
        }
    }
}
