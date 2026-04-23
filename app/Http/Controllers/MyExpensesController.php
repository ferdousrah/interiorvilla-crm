<?php

namespace App\Http\Controllers;

use App\Models\AccountHead;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Project;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "My Expenses" — submission portal for Site Engineers (and any user who
 * incurs project-level expenses). Entries land as status=pending and wait for
 * an accountant to approve them before hitting the general ledger.
 */
class MyExpensesController extends Controller
{
    public function __construct(private CodeGeneratorService $codeGenerator) {}

    public function index(Request $request): Response
    {
        $user = auth()->user();

        $query = Expense::with(['category', 'project', 'approvedBy'])
            ->where('submitted_by', $user->id)
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->project_id, fn($q, $p) => $q->where('project_id', $p))
            ->orderByRaw("FIELD(status, 'pending', 'rejected', 'approved')")
            ->orderByDesc('expense_date');

        $expenses = $query->paginate(25)->withQueryString();

        $counts = Expense::where('submitted_by', $user->id)
            ->selectRaw('status, COUNT(*) as n')
            ->groupBy('status')
            ->pluck('n', 'status');

        return Inertia::render('MyExpenses/Index', [
            'expenses' => $expenses,
            'filters'  => $request->only(['status', 'project_id']),
            'counts'   => [
                'pending'  => (int) ($counts['pending']  ?? 0),
                'approved' => (int) ($counts['approved'] ?? 0),
                'rejected' => (int) ($counts['rejected'] ?? 0),
                'total'    => (int) $counts->sum(),
            ],
            // Projects this user is assigned to (as Site Engineer)
            'myProjects' => Project::where('site_engineer_id', $user->id)
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->select('id', 'name', 'code')
                ->orderBy('name')
                ->get(),
            'expenseCategories' => ExpenseCategory::where('is_active', true)
                ->orderBy('sort_order')->orderBy('name')
                ->get(['id', 'name']),
            'expenseHeads' => AccountHead::whereHas('group', fn ($q) => $q->where('type', 'expense'))
                ->where('is_active', true)
                ->select('id', 'name', 'code')
                ->orderBy('code')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'project_id'          => 'required|uuid|exists:projects,id',
            'account_head_id'     => 'required|uuid|exists:account_heads,id',
            'expense_category_id' => 'nullable|uuid|exists:expense_categories,id',
            'amount'              => 'required|numeric|min:0.01',
            'expense_date'        => 'required|date',
            'description'         => 'required|string|max:250',
            'reference'           => 'nullable|string|max:150',
            'receipt_path'        => 'nullable|string',
        ]);

        // Verify the site engineer is actually assigned to the project they're charging
        $assigned = Project::where('id', $validated['project_id'])
            ->where('site_engineer_id', $user->id)
            ->exists();

        if (!$assigned) {
            return back()->withErrors(['project_id' => 'You can only submit expenses for projects where you are the assigned Site Engineer.'])->withInput();
        }

        // paid_from defaults to Cash in Hand (account code 1001). Accountant can
        // reassign during approval if needed.
        $defaultPaidFrom = AccountHead::where('code', '1001')->value('id')
            ?? AccountHead::whereHas('group', fn ($q) => $q->where('type', 'asset'))->value('id');

        Expense::create(array_merge($validated, [
            'code'         => $this->codeGenerator->generate('EXP', 'expenses'),
            'paid_from'    => $defaultPaidFrom,
            'created_by'   => $user->id,
            'submitted_by' => $user->id,
            'status'       => 'pending',
        ]));

        return back()->with('success', 'Expense submitted for approval.');
    }
}
