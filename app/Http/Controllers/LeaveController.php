<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isManager = $user->hasRole('admin');

        $query = LeaveRequest::with(['employee', 'leaveType', 'reviewedBy']);

        if (!$isManager) {
            $employee = Employee::where('user_id', $user->id)->first();
            if ($employee) {
                $query->where('employee_id', $employee->id);
            }
        }

        $leaves = $query->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->orderByDesc('created_at')
            ->paginate(25)->withQueryString();

        return Inertia::render('HR/Leaves/Index', [
            'leaves' => $leaves,
            'isManager' => $isManager,
            'leaveTypes' => LeaveType::all(),
            'employees' => $isManager ? Employee::where('is_active', true)->select('id', 'name', 'code')->get() : [],
            'filters' => $request->only(['status', 'employee_id']),
        ]);
    }

    public function create(): Response
    {
        $user = auth()->user();
        $isManager = $user->hasRole('admin');

        return Inertia::render('HR/Leaves/Create', [
            'isManager' => $isManager,
            'leaveTypes' => LeaveType::all(),
            'employees' => $isManager ? Employee::where('is_active', true)->select('id', 'name', 'code')->get() : [],
            'myEmployee' => Employee::where('user_id', $user->id)->first(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        $isManager = $user->hasRole('admin');

        $validated = $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'leave_type_id' => 'required|uuid|exists:leave_types,id',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'reason' => 'nullable|string',
        ]);

        if (!$isManager) {
            $myEmployee = Employee::where('user_id', $user->id)->first();
            abort_if(!$myEmployee || $myEmployee->id !== $validated['employee_id'], 403);
        }

        $from = \Carbon\Carbon::parse($validated['from_date']);
        $to = \Carbon\Carbon::parse($validated['to_date']);
        $days = $from->diffInDays($to) + 1;

        LeaveRequest::create(array_merge($validated, ['days' => $days]));

        return redirect()->route('hr.leaves.index')->with('success', 'Leave request submitted.');
    }

    public function show(LeaveRequest $leave): Response
    {
        $leave->load(['employee', 'leaveType', 'reviewedBy']);
        return Inertia::render('HR/Leaves/Show', ['leave' => $leave]);
    }

    public function edit(LeaveRequest $leave): Response { return $this->create(); }
    public function update(Request $request, LeaveRequest $leave): RedirectResponse { return back(); }

    public function destroy(LeaveRequest $leave): RedirectResponse
    {
        $leave->delete();
        return back()->with('success', 'Leave request deleted.');
    }

    public function approve(Request $request, LeaveRequest $leave): RedirectResponse
    {
        abort_unless(auth()->user()->hasRole('admin'), 403);

        $leave->update([
            'status' => 'approved',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
            'review_note' => $request->review_note,
        ]);

        return back()->with('success', 'Leave approved.');
    }

    public function reject(Request $request, LeaveRequest $leave): RedirectResponse
    {
        abort_unless(auth()->user()->hasRole('admin'), 403);

        $validated = $request->validate(['review_note' => 'required|string']);

        $leave->update([
            'status' => 'rejected',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
            'review_note' => $validated['review_note'],
        ]);

        return back()->with('success', 'Leave rejected.');
    }
}
