<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function __construct(private CodeGeneratorService $codeGenerator) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Employee::class);

        $employees = Employee::with('user')
            ->when($request->department, fn($q, $d) => $q->where('department', $d))
            ->when($request->employment_type, fn($q, $t) => $q->where('employment_type', $t))
            ->when($request->filled('is_active'), fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderByDesc('created_at')
            ->paginate(25)->withQueryString();

        return Inertia::render('HR/Employees/Index', [
            'employees' => $employees,
            'filters' => $request->only(['department', 'employment_type', 'is_active']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Employee::class);

        return Inertia::render('HR/Employees/Create', [
            'users' => User::where('is_active', true)->select('id', 'name', 'email')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Employee::class);

        $validated = $request->validate([
            'user_id' => 'nullable|uuid|exists:users,id|unique:employees',
            'name' => 'required|string|max:150',
            'email' => 'nullable|email|max:150',
            'phone' => 'required|string|max:20',
            'department' => 'nullable|string|max:100',
            'designation' => 'nullable|string|max:100',
            'employment_type' => 'required|in:permanent,contract,part_time,intern,daily_labour',
            'join_date' => 'required|date',
            'contract_end_date' => 'nullable|date',
            'basic_salary' => 'nullable|numeric|min:0',
            'nid_number' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:150',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
        ]);

        $code = $this->codeGenerator->generate('EMP', 'employees', false);
        $employee = Employee::create(array_merge($validated, [
            'code' => $code,
            'created_by' => auth()->id(),
        ]));

        return redirect()->route('hr.employees.show', $employee)->with('success', 'Employee created.');
    }

    public function show(Employee $employee): Response
    {
        $this->authorize('view', $employee);

        $employee->load(['user', 'leaveRequests.leaveType', 'documents', 'attendance']);

        return Inertia::render('HR/Employees/Show', ['employee' => $employee]);
    }

    public function edit(Employee $employee): Response
    {
        $this->authorize('update', $employee);
        return Inertia::render('HR/Employees/Edit', [
            'employee' => $employee,
            'users' => User::where('is_active', true)->select('id', 'name', 'email')->get(),
        ]);
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $this->authorize('update', $employee);

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'nullable|email|max:150',
            'phone' => 'required|string|max:20',
            'department' => 'nullable|string|max:100',
            'designation' => 'nullable|string|max:100',
            'employment_type' => 'required|in:permanent,contract,part_time,intern,daily_labour',
            'join_date' => 'required|date',
            'contract_end_date' => 'nullable|date',
            'basic_salary' => 'nullable|numeric|min:0',
            'nid_number' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:150',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $employee->update($validated);

        return redirect()->route('hr.employees.show', $employee)->with('success', 'Employee updated.');
    }

    public function destroy(Employee $employee): RedirectResponse
    {
        $this->authorize('delete', $employee);
        $employee->delete();
        return redirect()->route('hr.employees.index')->with('success', 'Employee deleted.');
    }
}
