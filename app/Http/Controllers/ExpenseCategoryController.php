<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ExpenseCategory::orderBy('sort_order')->orderBy('name');

        if ($search = $request->get('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        return Inertia::render('Settings/ExpenseCategories/Index', [
            'categories' => $query->paginate(50)->withQueryString(),
            'filters'    => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:80',
            'description' => 'nullable|string|max:250',
            'is_active'   => 'boolean',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        ExpenseCategory::create([
            'name'        => $validated['name'],
            'slug'        => $this->uniqueSlug($validated['name']),
            'description' => $validated['description'] ?? null,
            'is_active'   => $validated['is_active'] ?? true,
            'sort_order'  => $validated['sort_order'] ?? 0,
        ]);

        return back()->with('success', 'Expense category added.');
    }

    public function update(Request $request, ExpenseCategory $expense_category): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:80',
            'description' => 'nullable|string|max:250',
            'is_active'   => 'boolean',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        $updates = [
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active'   => $validated['is_active'] ?? true,
            'sort_order'  => $validated['sort_order'] ?? 0,
        ];

        // Regenerate slug only when name changed
        if ($expense_category->name !== $validated['name']) {
            $updates['slug'] = $this->uniqueSlug($validated['name'], $expense_category->id);
        }

        $expense_category->update($updates);

        return back()->with('success', 'Expense category updated.');
    }

    public function destroy(ExpenseCategory $expense_category): RedirectResponse
    {
        // Existing expenses keep their reference (nullOnDelete on the FK) —
        // they'll just show a blank category after this. Safe to delete.
        $expense_category->delete();
        return back()->with('success', 'Expense category deleted.');
    }

    private function uniqueSlug(string $name, ?string $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 2;

        while (ExpenseCategory::where('slug', $slug)
            ->when($ignoreId, fn ($q, $id) => $q->where('id', '!=', $id))
            ->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
