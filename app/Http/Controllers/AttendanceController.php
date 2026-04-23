<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless(auth()->user()->hasRole('admin'), 403);

        $month = $request->month ?? now()->format('Y-m');
        $employees = Employee::where('is_active', true)->get();

        $attendance = Attendance::whereYear('date', substr($month, 0, 4))
            ->whereMonth('date', substr($month, 5, 2))
            ->get()
            ->groupBy('employee_id');

        return Inertia::render('HR/Attendance', [
            'employees' => $employees,
            'attendance' => $attendance,
            'month' => $month,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()->hasRole('admin'), 403);

        $validated = $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,half_day,on_leave,holiday,off',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i',
            'notes' => 'nullable|string',
        ]);

        Attendance::updateOrCreate(
            ['employee_id' => $validated['employee_id'], 'date' => $validated['date']],
            array_merge($validated, ['recorded_by' => auth()->id()])
        );

        return back()->with('success', 'Attendance recorded.');
    }

    public function bulk(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()->hasRole('admin'), 403);

        $validated = $request->validate([
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'uuid|exists:employees,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,half_day,on_leave,holiday,off',
        ]);

        foreach ($validated['employee_ids'] as $empId) {
            Attendance::updateOrCreate(
                ['employee_id' => $empId, 'date' => $validated['date']],
                [
                    'status' => $validated['status'],
                    'recorded_by' => auth()->id(),
                ]
            );
        }

        return back()->with('success', 'Bulk attendance recorded.');
    }

    public function export(Request $request)
    {
        return back()->with('error', 'Export coming soon.');
    }
}
