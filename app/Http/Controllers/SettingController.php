<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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

    public function uploadQuotationLogo(Request $request): RedirectResponse
    {
        $request->validate([
            'logo' => 'required|image|mimes:png,jpg,jpeg,svg,webp|max:2048',
        ]);

        $old = Setting::get('quotation_logo');
        if ($old && Storage::disk('public')->exists($old)) {
            Storage::disk('public')->delete($old);
        }

        $path = $request->file('logo')->store('quotation-logos', 'public');
        Setting::set('quotation_logo', $path);

        return back()->with('success', 'Quotation logo updated successfully.');
    }

    public function removeQuotationLogo(): RedirectResponse
    {
        $old = Setting::get('quotation_logo');
        if ($old && Storage::disk('public')->exists($old)) {
            Storage::disk('public')->delete($old);
        }
        Setting::set('quotation_logo', '');

        return back()->with('success', 'Quotation logo removed.');
    }

    /**
     * Wipes all transactional data so the system starts fresh.
     *
     * Wipes: leads, clients, quotations, cost estimations, projects, tasks,
     * vendors, requisitions, purchase orders, GRNs, stock movements,
     * invoices, receipts, vendor payments, expenses, journal entries,
     * notifications, and audit logs.
     *
     * Keeps: users, roles/permissions, settings, materials catalog,
     * inventory item master, chart of accounts, expense categories,
     * quotation templates, HR data, and the company's leave types.
     */
    public function clearSampleData(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()->hasRole('admin'), 403);

        $request->validate([
            'confirmation' => 'required|in:DELETE',
        ]);

        // Order doesn't matter because we disable FK constraints — but listed
        // grouped by module for clarity.
        $tables = [
            // Notifications + audit (reference everything else)
            'in_app_notifications', 'audit_logs',

            // Accounts
            'journal_lines', 'journal_entries',
            'invoice_line_items', 'client_receipts', 'invoices',
            'vendor_payments', 'expenses',

            // Stock movements
            'stock_transactions', 'stock_adjustments',

            // Procurement
            'grn_items', 'goods_receipt_notes',
            'purchase_order_items', 'purchase_orders',
            'requisition_items', 'purchase_requisitions',
            'vendors',

            // Projects + tasks
            'task_attachments', 'tasks',
            'project_cost_items', 'project_notes', 'project_phases', 'project_members',
            'projects',

            // Sales
            'quotation_items', 'quotations',
            'cost_estimation_items', 'cost_estimations',

            // CRM + clients
            'lead_activities', 'leads',
            'client_contacts', 'clients',
        ];

        DB::transaction(function () use ($tables) {
            Schema::disableForeignKeyConstraints();
            foreach ($tables as $t) {
                if (Schema::hasTable($t)) {
                    DB::table($t)->truncate();
                }
            }
            Schema::enableForeignKeyConstraints();
        });

        return back()->with('success', 'Sample data cleared. Master configuration (users, settings, materials, chart of accounts) is preserved.');
    }
}
