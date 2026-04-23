<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Lead;
use App\Models\Project;
use App\Models\User;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function __construct(private CodeGeneratorService $codeGenerator) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Project::class);

        $projects = Project::with(['client', 'siteEngineer', 'phases'])
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->when($request->site_engineer, fn($q, $se) => $q->where('site_engineer_id', $se))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        $managers = User::where('is_active', true)->select('id', 'name')->get();

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'managers' => $managers,
            'filters' => $request->only(['status', 'type', 'site_engineer']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Project::class);

        return Inertia::render('Projects/Create', [
            'clients'  => Client::where('is_active', true)->select('id', 'name', 'code')->get(),
            'users'    => User::where('is_active', true)->select('id', 'name')->get(),
            'engineers'=> $this->engineerOptions(),
            'leads'    => Lead::whereIn('status', ['qualified', 'proposal_sent', 'won'])->select('id', 'name', 'code')->get(),
        ]);
    }

    /**
     * Users eligible to be picked as Site Engineer. Prefers users with the
     * 'site_engineer' role, but falls back to all active users if no one has
     * that role yet (so the dropdown isn't empty on fresh installs).
     */
    private function engineerOptions()
    {
        $engineers = User::role('site_engineer')
            ->where('is_active', true)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        if ($engineers->isEmpty()) {
            $engineers = User::where('is_active', true)->select('id', 'name')->orderBy('name')->get();
        }

        return $engineers;
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Project::class);

        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'client_id' => 'required|uuid|exists:clients,id',
            'lead_id' => 'nullable|uuid|exists:leads,id',
            'type' => 'required|in:residential,commercial,office,retail,restaurant,hospital,other',
            'status' => 'required|in:survey,planning,design,execution,finishing,handover,completed,on_hold,cancelled',
            'site_address' => 'required|string',
            'area_sqft' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'expected_end_date' => 'nullable|date',
            'contract_value' => 'nullable|numeric|min:0',
            'budget_limit' => 'nullable|numeric|min:0',
            'site_engineer_id'   => 'nullable|uuid|exists:users,id',
            'notes' => 'nullable|string',
        ]);

        $code = $this->codeGenerator->generate('PRJ', 'projects');
        $project = Project::create(array_merge($validated, [
            'code' => $code,
            'created_by' => auth()->id(),
        ]));

        return redirect()->route('projects.show', $project)->with('success', 'Project created.');
    }

    public function show(Project $project): Response
    {
        $this->authorize('view', $project);

        $project->load([
            'client',
            'siteEngineer',
            'members.user',
            'phases',
            'notes.createdBy',
            'tasks' => fn($q) => $q->whereNull('parent_task_id')->with(['assignedTo', 'subtasks.assignedTo', 'phase']),
        ]);

        $financials = [
            'contract_value' => $project->contract_value,
            'total_invoiced' => $project->invoices()->sum('grand_total'),
            'total_received' => $project->invoices()->sum('paid_amount'),
            'total_po' => $project->purchaseOrders()->whereNotIn('status', ['cancelled'])->sum('grand_total'),
            'total_expenses' => $project->expenses()->sum('amount'),
        ];

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'financials' => $financials,
            'users' => User::where('is_active', true)->select('id', 'name')->get(),
        ]);
    }

    public function edit(Project $project): Response
    {
        $this->authorize('update', $project);

        return Inertia::render('Projects/Edit', [
            'project'   => $project,
            'clients'   => Client::where('is_active', true)->select('id', 'name', 'code')->get(),
            'users'     => User::where('is_active', true)->select('id', 'name')->get(),
            'engineers' => $this->engineerOptions(),
        ]);
    }

    public function update(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'client_id' => 'required|uuid|exists:clients,id',
            'lead_id' => 'nullable|uuid|exists:leads,id',
            'type' => 'required|in:residential,commercial,office,retail,restaurant,hospital,other',
            'status' => 'required|in:survey,planning,design,execution,finishing,handover,completed,on_hold,cancelled',
            'site_address' => 'required|string',
            'area_sqft' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'expected_end_date' => 'nullable|date',
            'actual_end_date' => 'nullable|date',
            'contract_value' => 'nullable|numeric|min:0',
            'budget_limit' => 'nullable|numeric|min:0',
            'site_engineer_id'   => 'nullable|uuid|exists:users,id',
            'notes' => 'nullable|string',
        ]);

        $project->update($validated);

        return redirect()->route('projects.show', $project)->with('success', 'Project updated.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        $this->authorize('delete', $project);
        $project->delete();
        return redirect()->route('projects.index')->with('success', 'Project deleted.');
    }
}
