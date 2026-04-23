<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyTasksController extends Controller
{
    /**
     * Kanban board of tasks. Admin sees all, others see their own + ones they created.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $query = Task::with(['project:id,name,code', 'assignedTo:id,name', 'createdBy:id,name'])
            ->whereNull('deleted_at');

        if ($user->hasRole('admin')) {
            // Admin sees all tasks
        } else {
            // Others see tasks assigned to them OR created by them
            $query->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id)->orWhere('created_by', $user->id);
            });
        }

        if ($request->get('filter') === 'mine') {
            $query->where('assigned_to', $user->id);
        }
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }
        if ($priority = $request->get('priority')) {
            $query->where('priority', $priority);
        }

        $tasks = $query->orderBy('due_date')->get()->groupBy('status');

        return Inertia::render('Tasks/Index', [
            'tasks'    => $tasks,
            'projects' => Project::whereNotIn('status', ['completed', 'cancelled'])
                ->orderBy('name')->get(['id', 'name', 'code']),
            'users'    => User::where('is_active', true)->select('id', 'name')->get(),
            'filters'  => $request->only('filter', 'status', 'priority'),
            'canAssign'=> $user->hasAnyRole(['admin', 'site_engineer']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:250',
            'description' => 'nullable|string',
            'project_id'  => 'nullable|uuid|exists:projects,id',
            'assigned_to' => 'nullable|uuid|exists:users,id',
            'priority'    => 'required|in:low,medium,high,urgent',
            'status'      => 'required|in:pending,in_progress,review,done,cancelled',
            'start_date'  => 'nullable|date',
            'due_date'    => 'nullable|date',
        ]);

        // Non-admins can only assign to themselves
        $user = auth()->user();
        if (!$user->hasAnyRole(['admin', 'site_engineer'])) {
            $validated['assigned_to'] = $user->id;
        }

        Task::create(array_merge($validated, [
            'created_by' => $user->id,
        ]));

        return back()->with('success', 'Task created.');
    }

    public function update(Request $request, Task $task): RedirectResponse
    {
        $this->authorizeTask($task);

        $validated = $request->validate([
            'title'       => 'sometimes|required|string|max:250',
            'description' => 'nullable|string',
            'project_id'  => 'nullable|uuid|exists:projects,id',
            'assigned_to' => 'nullable|uuid|exists:users,id',
            'priority'    => 'sometimes|in:low,medium,high,urgent',
            'status'      => 'sometimes|in:pending,in_progress,review,done,cancelled',
            'start_date'  => 'nullable|date',
            'due_date'    => 'nullable|date',
            'delay_reason'=> 'nullable|string',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'done' && !$task->completed_at) {
            $validated['completed_at'] = now();
        }

        $task->update($validated);

        return back()->with('success', 'Task updated.');
    }

    public function updateStatus(Request $request, Task $task): RedirectResponse
    {
        $this->authorizeTask($task);

        $request->validate(['status' => 'required|in:pending,in_progress,review,done,cancelled']);

        $task->update([
            'status'       => $request->status,
            'completed_at' => $request->status === 'done' ? now() : null,
        ]);

        return back();
    }

    public function destroy(Task $task): RedirectResponse
    {
        $this->authorizeTask($task, 'delete');
        $task->delete();
        return back()->with('success', 'Task deleted.');
    }

    private function authorizeTask(Task $task, string $action = 'edit'): void
    {
        $user = auth()->user();
        if ($user->hasAnyRole(['admin', 'site_engineer'])) return;

        $owns = $task->assigned_to === $user->id || $task->created_by === $user->id;
        abort_unless($owns, 403);

        if ($action === 'delete' && $task->created_by !== $user->id) abort(403);
    }
}
