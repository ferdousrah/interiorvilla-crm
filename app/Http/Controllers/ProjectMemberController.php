<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProjectMemberController extends Controller
{
    public function store(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'user_id' => 'required|uuid|exists:users,id',
            'role' => 'required|string|max:100',
        ]);

        $project->members()->firstOrCreate(
            ['user_id' => $validated['user_id']],
            array_merge($validated, ['assigned_at' => today()])
        );

        return back()->with('success', 'Member added.');
    }

    public function destroy(Project $project, ProjectMember $member): RedirectResponse
    {
        $this->authorize('update', $project);
        $member->delete();
        return back()->with('success', 'Member removed.');
    }
}
