<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function store(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('manageTasks', $project);

        $validated = $request->validate([
            'title' => 'required|string|max:250',
            'description' => 'nullable|string',
            'phase_id' => 'nullable|uuid|exists:project_phases,id',
            'parent_task_id' => 'nullable|uuid|exists:tasks,id',
            'status' => 'required|in:pending,in_progress,review,done,cancelled',
            'priority' => 'required|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|uuid|exists:users,id',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
        ]);

        $project->tasks()->create(array_merge($validated, [
            'created_by' => auth()->id(),
        ]));

        return back()->with('success', 'Task created.');
    }

    public function update(Request $request, Project $project, Task $task): RedirectResponse
    {
        $this->authorize('manageTasks', $project);

        $validated = $request->validate([
            'title' => 'required|string|max:250',
            'description' => 'nullable|string',
            'phase_id' => 'nullable|uuid|exists:project_phases,id',
            'status' => 'required|in:pending,in_progress,review,done,cancelled',
            'priority' => 'required|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|uuid|exists:users,id',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'delay_reason' => 'nullable|string',
        ]);

        if ($validated['status'] === 'done' && $task->status !== 'done') {
            $validated['completed_at'] = now();
        }

        $task->update($validated);

        return back()->with('success', 'Task updated.');
    }

    public function destroy(Project $project, Task $task): RedirectResponse
    {
        $this->authorize('manageTasks', $project);
        $task->delete();
        return back()->with('success', 'Task deleted.');
    }

    public function updateStatus(Request $request, Project $project, Task $task): RedirectResponse
    {
        $this->authorize('manageTasks', $project);

        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,review,done,cancelled',
        ]);

        $data = ['status' => $validated['status']];
        if ($validated['status'] === 'done' && $task->status !== 'done') {
            $data['completed_at'] = now();
        }

        $task->update($data);

        return back()->with('success', 'Task status updated.');
    }
}
