<?php

namespace App\Http\Controllers;

use App\Models\AccountHead;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Project;
use App\Services\AccountingService;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function __construct(
        private CodeGeneratorService $codeGenerator,
        private AccountingService $accounting
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', \App\Models\Invoice::class);

        $query = Expense::with(['accountHead', 'paidFrom', 'project', 'category', 'submittedBy', 'approvedBy'])
            ->when($request->project_id, fn($q, $p) => $q->where('project_id', $p))
            ->when($request->expense_category_id, fn($q, $c) => $q->where('expense_category_id', $c))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->orderByRaw("FIELD(status, 'pending', 'rejected', 'approved')") // pending first
            ->orderByDesc('expense_date');

        $expenses = $query->paginate(25)->withQueryString();

        // Counts for the status strip at the top
        $counts = Expense::selectRaw('status, COUNT(*) as n')
            ->groupBy('status')
            ->pluck('n', 'status');

        return Inertia::render('Accounts/Expenses/Index', [
            'expenses' => $expenses,
            'filters'  => $request->only(['project_id', 'expense_category_id', 'status']),
            'counts'   => [
                'pending'  => (int) ($counts['pending']  ?? 0),
                'approved' => (int) ($counts['approved'] ?? 0),
                'rejected' => (int) ($counts['rejected'] ?? 0),
                'total'    => (int) $counts->sum(),
            ],
            'expenseCategories' => ExpenseCategory::where('is_active', true)
                ->orderBy('sort_order')->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'accountHeads' => AccountHead::whereHas('group', fn($q) => $q->where('type', 'expense'))
                ->where('is_active', true)->select('id', 'name', 'code')->orderBy('code')->get(),
            'cashBankHeads' => AccountHead::whereHas('group', fn($q) => $q->where('type', 'asset'))
                ->where('is_active', true)->select('id', 'name', 'code')->orderBy('code')->get(),
            'projects' => Project::whereNotIn('status', ['completed', 'cancelled'])
                ->select('id', 'name', 'code')->orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', \App\Models\Invoice::class);

        return Inertia::render('Accounts/Expenses/Create', [
            'expenseHeads' => AccountHead::whereHas('group', fn($q) => $q->where('type', 'expense'))
                ->where('is_active', true)->select('id', 'name', 'code')->get(),
            'cashBankHeads' => AccountHead::whereHas('group', fn($q) => $q->where('type', 'asset'))
                ->where('is_active', true)->select('id', 'name', 'code')->get(),
            'projects' => Project::whereNotIn('status', ['completed', 'cancelled'])->select('id', 'name', 'code')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', \App\Models\Invoice::class);

        $validated = $request->validate([
            'account_head_id'     => 'required|uuid|exists:account_heads,id',
            'expense_category_id' => 'nullable|uuid|exists:expense_categories,id',
            'project_id'          => 'nullable|uuid|exists:projects,id',
            'amount'              => 'required|numeric|min:0.01',
            'expense_date'        => 'required|date',
            'paid_from'           => 'required|uuid|exists:account_heads,id',
            'description'         => 'required|string|max:250',
            'reference'           => 'nullable|string|max:150',
            'receipt_path'        => 'nullable|string',
        ]);

        // Accountant creating directly → auto-approve + post journal immediately.
        $user = auth()->user();
        $code = $this->codeGenerator->generate('EXP', 'expenses');

        $expense = DB::transaction(function () use ($validated, $code, $user) {
            return Expense::create(array_merge($validated, [
                'code'         => $code,
                'created_by'   => $user->id,
                'submitted_by' => $user->id,
                'status'       => 'approved',
                'approved_by'  => $user->id,
                'approved_at'  => now(),
            ]));
        });

        $this->accounting->postExpenseRecorded($expense->fresh(['accountHead']));

        return redirect()->route('accounts.expenses.index')->with('success', 'Expense recorded.');
    }

    public function show(Expense $expense): Response
    {
        $this->authorize('viewAny', \App\Models\Invoice::class);
        $expense->load(['accountHead', 'paidFrom', 'project', 'category', 'createdBy', 'submittedBy', 'approvedBy']);
        return Inertia::render('Accounts/Expenses/Show', ['expense' => $expense]);
    }

    /**
     * Accountant approves a pending expense → journal entry is posted.
     */
    public function approve(Expense $expense): RedirectResponse
    {
        $this->authorize('create', \App\Models\Invoice::class);

        if (!$expense->isPending()) {
            return back()->with('error', 'Only pending expenses can be approved.');
        }

        $expense->update([
            'status'      => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);

        $this->accounting->postExpenseRecorded($expense->fresh(['accountHead']));

        return back()->with('success', "Expense {$expense->code} approved and posted to ledger.");
    }

    /**
     * Accountant rejects a pending expense → nothing is posted; reason is stored.
     */
    public function reject(Request $request, Expense $expense): RedirectResponse
    {
        $this->authorize('create', \App\Models\Invoice::class);

        if (!$expense->isPending()) {
            return back()->with('error', 'Only pending expenses can be rejected.');
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $expense->update([
            'status'           => 'rejected',
            'approved_by'      => auth()->id(),
            'approved_at'      => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return back()->with('success', "Expense {$expense->code} rejected.");
    }

    public function edit(Expense $expense): Response { abort(403); }
    public function update(Request $request, Expense $expense): RedirectResponse { abort(403); }
    public function destroy(Expense $expense): RedirectResponse { abort(403); }
}
