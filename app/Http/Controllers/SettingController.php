<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Settings/General', [
            'settings' => Setting::allAsArray(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'app_name'          => 'required|string|max:100',
            'company_name'      => 'required|string|max:150',
            'company_tagline'   => 'nullable|string|max:100',
            'company_email'     => 'nullable|email|max:150',
            'company_phone'     => 'nullable|string|max:30',
            'company_phone2'    => 'nullable|string|max:30',
            'company_address'   => 'nullable|string|max:500',
            'company_ceo_name'  => 'nullable|string|max:100',
            'company_ceo_title' => 'nullable|string|max:50',
            'currency_symbol'   => 'nullable|string|max:10',
            'tax_label'         => 'nullable|string|max:30',
            'default_tax_pct'   => 'nullable|numeric|min:0|max:100',
            'theme_color'       => 'nullable|string|max:30',
            'sidebar_color'     => 'nullable|string|max:30',
        ]);

        $fields = [
            'app_name', 'company_name', 'company_tagline',
            'company_email', 'company_phone', 'company_phone2', 'company_address',
            'company_ceo_name', 'company_ceo_title',
            'currency_symbol', 'tax_label', 'default_tax_pct',
            'theme_color', 'sidebar_color',
        ];

        foreach ($fields as $key) {
            if ($request->has($key)) {
                Setting::set($key, $request->input($key) ?? '');
            }
        }

        return back()->with('success', 'Settings saved successfully.');
    }

    public function uploadLogo(Request $request): RedirectResponse
    {
        $request->validate([
            'logo' => 'required|image|mimes:png,jpg,jpeg,svg,webp|max:2048',
        ]);

        // Delete old logo
        $oldLogo = Setting::get('company_logo');
        if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
            Storage::disk('public')->delete($oldLogo);
        }

        $path = $request->file('logo')->store('logos', 'public');
        Setting::set('company_logo', $path);

        return back()->with('success', 'Logo updated successfully.');
    }

    public function removeLogo(): RedirectResponse
    {
        $oldLogo = Setting::get('company_logo');
        if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
            Storage::disk('public')->delete($oldLogo);
        }
        Setting::set('company_logo', '');

        return back()->with('success', 'Logo removed.');
    }

    public function uploadSignature(Request $request): RedirectResponse
    {
        $request->validate([
            'signature' => 'required|image|mimes:png,jpg,jpeg,webp|max:1024',
        ]);

        $oldSignature = Setting::get('company_signature');
        if ($oldSignature && Storage::disk('public')->exists($oldSignature)) {
            Storage::disk('public')->delete($oldSignature);
        }

        $path = $request->file('signature')->store('signatures', 'public');
        Setting::set('company_signature', $path);

        return back()->with('success', 'Signature updated successfully.');
    }

    public function removeSignature(): RedirectResponse
    {
        $oldSignature = Setting::get('company_signature');
        if ($oldSignature && Storage::disk('public')->exists($oldSignature)) {
            Storage::disk('public')->delete($oldSignature);
        }
        Setting::set('company_signature', '');

        return back()->with('success', 'Signature removed.');
    }
}
