<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\MaterialCategory;
use App\Models\MaterialServiceType;
use App\Models\MaterialUnit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MaterialController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Material::with('serviceTypes')->orderBy('name');

        if ($search = $request->get('search')) {
            $query->where('name', 'like', "%{$search}%");
        }
        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }

        $materials = $query->paginate(30)->withQueryString();

        return Inertia::render('Settings/Materials/Index', [
            'materials'         => $materials,
            'serviceCategories' => config('services_catalog.service_categories'),
            'availableUnits'    => MaterialUnit::where('is_active', true)
                ->orderBy('sort_order')->orderBy('code')
                ->get(['id', 'code', 'name']),
            'availableCategories' => MaterialCategory::where('is_active', true)
                ->orderBy('sort_order')->orderBy('name')
                ->get(['id', 'slug', 'name', 'icon']),
            'filters'           => $request->only('search', 'category'),
        ]);
    }

    /** Quick-add a new unit (called from the Material modal) */
    public function storeUnit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:material_units,code',
            'name' => 'nullable|string|max:80',
        ]);

        $unit = MaterialUnit::create([
            'code'       => Str::lower(trim($validated['code'])),
            'name'       => $validated['name'] ?? Str::title($validated['code']),
            'sort_order' => (int) (MaterialUnit::max('sort_order') ?? 0) + 1,
            'is_active'  => true,
        ]);

        return response()->json($unit);
    }

    /** Quick-add a new material category */
    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:80',
            'icon' => 'nullable|string|max:10',
        ]);

        $slug = Str::slug($validated['name']);
        // If slug clash, suffix with -n
        $base = $slug; $i = 2;
        while (MaterialCategory::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        $category = MaterialCategory::create([
            'slug'       => $slug,
            'name'       => $validated['name'],
            'icon'       => $validated['icon'] ?? '📦',
            'sort_order' => (int) (MaterialCategory::max('sort_order') ?? 0) + 1,
            'is_active'  => true,
        ]);

        return response()->json($category);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category'     => 'required|string|max:50',
            'name'         => 'required|string|max:200',
            'unit'         => 'required|string|max:30',
            'default_rate' => 'nullable|numeric|min:0',
            'description'  => 'nullable|string',
            'is_active'    => 'boolean',
            'service_types'=> 'array',
            'service_types.*.group' => 'required|string|max:50',
            'service_types.*.type'  => 'required|string|max:150',
        ]);

        DB::transaction(function () use ($validated) {
            $material = Material::create([
                'category'     => $validated['category'],
                'name'         => $validated['name'],
                'unit'         => $validated['unit'],
                'default_rate' => $validated['default_rate'] ?? 0,
                'description'  => $validated['description'] ?? null,
                'is_active'    => $validated['is_active'] ?? true,
            ]);

            foreach ($validated['service_types'] ?? [] as $st) {
                MaterialServiceType::create([
                    'material_id'  => $material->id,
                    'service_group'=> $st['group'],
                    'service_type' => $st['type'],
                ]);
            }
        });

        return back()->with('success', 'Material added.');
    }

    public function update(Request $request, Material $material): RedirectResponse
    {
        $validated = $request->validate([
            'category'     => 'required|string|max:50',
            'name'         => 'required|string|max:200',
            'unit'         => 'required|string|max:30',
            'default_rate' => 'nullable|numeric|min:0',
            'description'  => 'nullable|string',
            'is_active'    => 'boolean',
            'service_types'=> 'array',
            'service_types.*.group' => 'required|string|max:50',
            'service_types.*.type'  => 'required|string|max:150',
        ]);

        DB::transaction(function () use ($validated, $material) {
            $material->update([
                'category'     => $validated['category'],
                'name'         => $validated['name'],
                'unit'         => $validated['unit'],
                'default_rate' => $validated['default_rate'] ?? 0,
                'description'  => $validated['description'] ?? null,
                'is_active'    => $validated['is_active'] ?? true,
            ]);

            // Replace all service type links
            $material->serviceTypes()->delete();
            foreach ($validated['service_types'] ?? [] as $st) {
                MaterialServiceType::create([
                    'material_id'  => $material->id,
                    'service_group'=> $st['group'],
                    'service_type' => $st['type'],
                ]);
            }
        });

        return back()->with('success', 'Material updated.');
    }

    public function destroy(Material $material): RedirectResponse
    {
        $material->delete();
        return back()->with('success', 'Material deleted.');
    }

    /**
     * AJAX: fetch materials filtered by service type for Cost Estimation form.
     */
    public function search(Request $request): JsonResponse
    {
        $group = $request->get('group');
        $type  = $request->get('type');

        $query = Material::where('is_active', true);

        if ($group && $type) {
            $query->whereHas('serviceTypes', function ($q) use ($group, $type) {
                $q->where('service_group', $group)->where('service_type', $type);
            });
        } elseif ($group) {
            $query->whereHas('serviceTypes', fn($q) => $q->where('service_group', $group));
        }

        return response()->json(
            $query->orderBy('category')->orderBy('name')
                ->get(['id', 'category', 'name', 'unit', 'default_rate', 'description'])
        );
    }
}
