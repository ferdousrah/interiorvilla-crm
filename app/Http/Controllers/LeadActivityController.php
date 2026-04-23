<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LeadActivityController extends Controller
{
    public function store(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);

        $validated = $request->validate([
            'type' => 'required|in:call,email,whatsapp,site_visit,meeting,note',
            'summary' => 'required|string',
            'next_action' => 'nullable|string',
            'next_action_at' => 'nullable|date',
            'performed_at' => 'required|date',
        ]);

        $lead->activities()->create(array_merge($validated, [
            'performed_by' => auth()->id(),
        ]));

        // Auto-update follow_up_at if next_action_at is set
        if (!empty($validated['next_action_at'])) {
            $lead->update(['follow_up_at' => $validated['next_action_at']]);
        }

        return back()->with('success', 'Activity logged.');
    }

    public function destroy(LeadActivity $activity): RedirectResponse
    {
        $this->authorize('update', $activity->lead);
        $activity->delete();
        return back()->with('success', 'Activity deleted.');
    }
}
