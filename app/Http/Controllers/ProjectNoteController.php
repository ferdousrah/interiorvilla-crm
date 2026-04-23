<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectNote;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProjectNoteController extends Controller
{
    public function store(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate(['note' => 'required|string']);

        $project->notes()->create(array_merge($validated, [
            'created_by' => auth()->id(),
        ]));

        return back()->with('success', 'Note added.');
    }

    public function update(Request $request, Project $project, ProjectNote $note): RedirectResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate(['note' => 'required|string']);
        $note->update($validated);

        return back()->with('success', 'Note updated.');
    }

    public function destroy(Project $project, ProjectNote $note): RedirectResponse
    {
        $this->authorize('update', $project);
        $note->delete();
        return back()->with('success', 'Note deleted.');
    }

    public function togglePin(Request $request, Project $project, ProjectNote $note): RedirectResponse
    {
        $this->authorize('update', $project);
        $note->update(['is_pinned' => !$note->is_pinned]);
        return back()->with('success', 'Note pin toggled.');
    }
}
