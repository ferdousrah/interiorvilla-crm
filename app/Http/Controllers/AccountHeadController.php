<?php

namespace App\Http\Controllers;

use App\Models\AccountGroup;
use App\Models\AccountHead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    /**
     * System accounts are referenced by code from AccountingService, so only
     * their name, opening balance and notes may change.
     */
    public function update(Request $request, AccountHead $accountHead): RedirectResponse
    {
        $this->authorize('create', \App\Models\Invoice::class);

        $rules = [
            'name'            => 'required|string|max:150',
            'opening_balance' => 'nullable|numeric',
            'notes'           => 'nullable|string',
        ];
        if (!$accountHead->is_system) {
            $rules += [
                'code'      => 'required|string|max:20|unique:account_heads,code,' . $accountHead->id,
                'group_id'  => 'required|uuid|exists:account_groups,id',
                'is_active' => 'boolean',
            ];
        }

        $validated = $request->validate($rules);
        $validated['opening_balance'] = $validated['opening_balance'] ?? 0;

        // Moving a used account to another type (e.g. asset → expense) would
        // silently re-classify every past entry in the reports.
        if (isset($validated['group_id']) && $validated['group_id'] !== $accountHead->group_id) {
            $oldType = AccountGroup::where('id', $accountHead->group_id)->value('type');
            $newType = AccountGroup::where('id', $validated['group_id'])->value('type');
            if ($oldType !== $newType && $this->usageOf($accountHead)) {
                return back()->withErrors([
                    'group_id' => "This account already has transactions, so it must stay in a {$oldType} group.",
                ]);
            }
        }

        $accountHead->update($validated);

        return back()->with('success', 'Account updated.');
    }

    public function destroy(AccountHead $accountHead): RedirectResponse
    {
        abort_unless(auth()->user()->hasRole('admin'), 403, 'Only an admin can delete accounts.');

        if ($accountHead->is_system) {
            return back()->with('error', "{$accountHead->name} is a system account and cannot be deleted.");
        }

        if ($usage = $this->usageOf($accountHead)) {
            return back()->with('error',
                "Cannot delete {$accountHead->code} — {$accountHead->name}: it is used in " . implode(', ', $usage)
                . '. Mark it inactive instead.'
            );
        }

        $accountHead->delete();

        return back()->with('success', 'Account deleted.');
    }

    /** @return string[] human-readable list of what still references this account (empty = safe to delete) */
    private function usageOf(AccountHead $head): array
    {
        $sources = [
            'ledger entries'  => DB::table('journal_lines')->where('account_head_id', $head->id)->count(),
            'expenses'        => DB::table('expenses')->where(fn ($q) => $q->where('account_head_id', $head->id)->orWhere('paid_from', $head->id))->count(),
            'client receipts' => DB::table('client_receipts')->where('account_head_id', $head->id)->count(),
            'vendor payments' => DB::table('vendor_payments')->where('account_head_id', $head->id)->count(),
            'paid service submissions' => DB::table('paid_service_submissions')->where('account_head_id', $head->id)->count(),
        ];

        $usage = [];
        foreach ($sources as $label => $count) {
            if ($count > 0) {
                $usage[] = "{$label} ({$count})";
            }
        }
        return $usage;
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
