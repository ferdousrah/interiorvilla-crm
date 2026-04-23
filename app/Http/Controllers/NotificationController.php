<?php

namespace App\Http\Controllers;

use App\Models\InAppNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $notifications = InAppNotification::where('user_id', auth()->id())
            ->orderByDesc('created_at')
            ->paginate(30);

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'unread_count'  => InAppNotification::where('user_id', auth()->id())->unread()->count(),
        ]);
    }

    public function markRead(InAppNotification $notification): RedirectResponse
    {
        if ($notification->user_id !== auth()->id()) abort(403);
        $notification->update(['read_at' => now()]);
        return back();
    }

    public function markAllRead(): RedirectResponse
    {
        InAppNotification::where('user_id', auth()->id())
            ->unread()
            ->update(['read_at' => now()]);

        return back()->with('success', 'All notifications marked as read.');
    }

    public function destroy(InAppNotification $notification): RedirectResponse
    {
        if ($notification->user_id !== auth()->id()) abort(403);
        $notification->delete();
        return back();
    }
}
