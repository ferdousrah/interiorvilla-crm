<?php

namespace App\Http\Controllers;

use App\Models\AccountGroup;
use App\Models\AccountHead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountHeadController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', \App\Models\Invoice::class);

        $groups       = AccountGroup::orderBy('type')->orderBy('name')->get();
        $accountHeads = AccountHead::orderBy('code')->get();

        return Inertia::render('Accounts/Chart', [
            'groups'       => $groups,
            'accountHeads' => $accountHeads,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', \App\Models\Invoice::class);

        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:account_heads',
            'name' => 'required|string|max:150',
            'group_id' => 'required|uuid|exists:account_groups,id',
            'parent_id' => 'nullable|uuid|exists:account_heads,id',
            'opening_balance' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        AccountHead::create($validated);

        return back()->with('success', 'Account head created.');
    }

    public function update(Request $request, AccountHead $accountHead): RedirectResponse
    {
        $this->authorize('create', \App\Models\Invoice::class);

        abort_if($accountHead->is_system, 403, 'System accounts cannot be modified.');

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'opening_balance' => 'nullable|numeric',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $accountHead->update($validated);

        return back()->with('success', 'Account head updated.');
    }

    public function destroy(AccountHead $accountHead): RedirectResponse
    {
        $this->authorize('delete', \App\Models\Invoice::class);

        abort_if($accountHead->is_system, 403, 'System accounts cannot be deleted.');

        $accountHead->delete();

        return back()->with('success', 'Account head deleted.');
    }

    public function create(): Response { return $this->index(); }
    public function edit(AccountHead $accountHead): Response { return $this->index(); }
    public function show(AccountHead $accountHead): Response { return $this->index(); }

    public function storeGroup(Request $request): RedirectResponse
    {
        $this->authorize('create', \App\Models\Invoice::class);

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'type' => 'required|in:asset,liability,equity,income,expense',
        ]);

        AccountGroup::create($validated);

        return back()->with('success', 'Account group created.');
    }
}
