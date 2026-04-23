<?php

namespace App\Http\Middleware;

use App\Models\InAppNotification;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'avatar_path' => $request->user()->avatar_path,
                    'must_change_password' => $request->user()->must_change_password,
                    'roles' => $request->user()->getRoleNames(),
                    'permissions' => $request->user()->getAllPermissions()->pluck('name'),
                    'unread_notifications' => InAppNotification::where('user_id', $request->user()->id)->unread()->count(),
                    'recent_notifications' => InAppNotification::where('user_id', $request->user()->id)
                        ->orderByDesc('created_at')->limit(5)
                        ->get(['id', 'type', 'title', 'message', 'link', 'icon', 'read_at', 'created_at']),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
            ],
            'appSettings' => fn () => [
                'app_name'      => Setting::get('app_name', 'Interior Villa'),
                'company_name'  => Setting::get('company_name', 'Interior Villa BD'),
                'company_logo'  => Setting::get('company_logo') ? '/storage/' . Setting::get('company_logo') : null,
                'theme_color'   => Setting::get('theme_color', 'indigo'),
                'sidebar_color' => Setting::get('sidebar_color', 'slate_dark'),
            ],
            'integrations' => fn () => [
                'google_maps_key' => config('services.google_maps.key'),
            ],
            'ziggy' => fn () => array_merge((new Ziggy)->toArray(), [
                'location' => $request->url(),
            ]),
        ]);
    }
}
