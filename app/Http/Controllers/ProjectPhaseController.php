<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectPhase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProjectPhaseController extends Controller
{
    public function store(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'sequence' => 'required|integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $project->phases()->create($validated);

        return back()->with('success', 'Phase added.');
    }

    public function update(Request $request, Project $project, ProjectPhase $phase): RedirectResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'sequence' => 'required|integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $phase->update($validated);

        return back()->with('success', 'Phase updated.');
    }

    public function destroy(Project $project, ProjectPhase $phase): RedirectResponse
    {
        $this->authorize('update', $project);
        $phase->delete();
        return back()->with('success', 'Phase removed.');
    }

    public function updateStatus(Request $request, Project $project, ProjectPhase $phase): RedirectResponse
    {
        $this->authorize('update', $project);

        $request->validate(['status' => 'required|in:pending,in_progress,completed']);
        $phase->update(['status' => $request->status]);

        return back()->with('success', 'Phase status updated.');
    }

    public function reorder(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $request->validate([
            'phases' => 'required|array',
            'phases.*.id' => 'required|uuid',
            'phases.*.sequence' => 'required|integer',
        ]);

        foreach ($request->phases as $phaseData) {
            $project->phases()->where('id', $phaseData['id'])->update(['sequence' => $phaseData['sequence']]);
        }

        return back()->with('success', 'Phases reordered.');
    }
}
