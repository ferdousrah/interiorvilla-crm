<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Lead;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\Invoice;
use App\Models\Vendor;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $q = trim($request->get('q', ''));
        if (strlen($q) < 2) return response()->json([]);

        $results = [];

        // Leads
        Lead::where('name', 'like', "%{$q}%")
            ->orWhere('phone', 'like', "%{$q}%")
            ->orWhere('code', 'like', "%{$q}%")
            ->limit(5)->get(['id', 'code', 'name', 'phone', 'status'])
            ->each(fn($r) => $results[] = [
                'type' => 'Lead', 'icon' => '🎯',
                'title' => $r->name, 'sub' => "{$r->code} · {$r->phone}",
                'url' => "/crm/leads/{$r->id}",
            ]);

        // Clients
        Client::where('name', 'like', "%{$q}%")
            ->orWhere('phone', 'like', "%{$q}%")
            ->orWhere('code', 'like', "%{$q}%")
            ->orWhere('company_name', 'like', "%{$q}%")
            ->limit(5)->get(['id', 'code', 'name', 'phone'])
            ->each(fn($r) => $results[] = [
                'type' => 'Client', 'icon' => '👤',
                'title' => $r->name, 'sub' => "{$r->code} · {$r->phone}",
                'url' => "/clients/{$r->id}",
            ]);

        // Projects
        Project::where('name', 'like', "%{$q}%")
            ->orWhere('code', 'like', "%{$q}%")
            ->limit(5)->get(['id', 'code', 'name', 'status'])
            ->each(fn($r) => $results[] = [
                'type' => 'Project', 'icon' => '📁',
                'title' => $r->name, 'sub' => "{$r->code} · {$r->status}",
                'url' => "/projects/{$r->id}",
            ]);

        // Quotations
        Quotation::where('code', 'like', "%{$q}%")
            ->orWhere('subject', 'like', "%{$q}%")
            ->limit(3)->get(['id', 'code', 'subject', 'status'])
            ->each(fn($r) => $results[] = [
                'type' => 'Quotation', 'icon' => '📄',
                'title' => $r->code, 'sub' => $r->subject,
                'url' => "/quotations/{$r->id}",
            ]);

        // Invoices
        Invoice::where('code', 'like', "%{$q}%")
            ->limit(3)->get(['id', 'code', 'status', 'grand_total'])
            ->each(fn($r) => $results[] = [
                'type' => 'Invoice', 'icon' => '🧾',
                'title' => $r->code, 'sub' => "৳" . number_format($r->grand_total, 0) . " · {$r->status}",
                'url' => "/accounts/invoices/{$r->id}",
            ]);

        // Vendors
        Vendor::where('name', 'like', "%{$q}%")
            ->orWhere('code', 'like', "%{$q}%")
            ->orWhere('phone', 'like', "%{$q}%")
            ->limit(3)->get(['id', 'code', 'name', 'phone'])
            ->each(fn($r) => $results[] = [
                'type' => 'Vendor', 'icon' => '🏪',
                'title' => $r->name, 'sub' => "{$r->code} · {$r->phone}",
                'url' => "/procurement/vendors/{$r->id}",
            ]);

        // Employees
        Employee::where('name', 'like', "%{$q}%")
            ->orWhere('code', 'like', "%{$q}%")
            ->orWhere('phone', 'like', "%{$q}%")
            ->limit(3)->get(['id', 'code', 'name', 'designation'])
            ->each(fn($r) => $results[] = [
                'type' => 'Employee', 'icon' => '👷',
                'title' => $r->name, 'sub' => "{$r->code}" . ($r->designation ? " · {$r->designation}" : ''),
                'url' => "/hr/employees/{$r->id}",
            ]);

        return response()->json(array_slice($results, 0, 15));
    }
}
