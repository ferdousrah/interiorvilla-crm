<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\CostEstimation;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\LeadActivity;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\Task;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user  = auth()->user();
        $today = today();
        $now   = now();

        // ── KPI Stats ────────────────────────────
        $stats = [
            'active_projects'  => Project::whereNotIn('status', ['completed', 'cancelled'])->count(),
            'pending_leads'    => Lead::whereNotIn('status', ['won', 'lost'])->count(),
            'total_clients'    => Client::where('is_active', true)->count(),
            'overdue_invoices' => Invoice::where(function ($q) use ($today) {
                $q->where('status', 'overdue')
                  ->orWhere(fn($q2) => $q2->whereNotIn('status', ['paid', 'cancelled'])->where('due_date', '<', $today));
            })->count(),
            'total_receivable' => Invoice::whereNotIn('status', ['paid', 'cancelled'])
                ->selectRaw('SUM(grand_total - paid_amount) as total')->value('total') ?? 0,
            'monthly_revenue'  => Invoice::where('status', 'paid')
                ->where('invoice_date', '>=', $now->copy()->startOfMonth())
                ->sum('grand_total'),
        ];

        // ── Today's Section ──────────────────────
        $todaysFollowups = Lead::with('assignedTo')
            ->whereDate('follow_up_at', $today)
            ->whereNotIn('status', ['won', 'lost'])
            ->orderBy('follow_up_at')
            ->get(['id', 'name', 'phone', 'status', 'follow_up_at', 'assigned_to']);

        $overdueFollowups = Lead::with('assignedTo')
            ->where('follow_up_at', '<', $today)
            ->whereNotIn('status', ['won', 'lost'])
            ->orderBy('follow_up_at')
            ->limit(5)
            ->get(['id', 'name', 'phone', 'status', 'follow_up_at', 'assigned_to']);

        $todaysTasks = Task::with('project')
            ->where('assigned_to', $user->id)
            ->whereNotIn('status', ['done', 'cancelled'])
            ->where(function ($q) use ($today) {
                $q->whereDate('due_date', $today)
                  ->orWhere('due_date', '<', $today); // include overdue
            })
            ->orderBy('due_date')
            ->limit(10)
            ->get();

        $myPendingTasks = Task::with('project')
            ->where('assigned_to', $user->id)
            ->whereNotIn('status', ['done', 'cancelled'])
            ->orderBy('due_date')
            ->limit(8)
            ->get();

        // ── Projects ─────────────────────────────
        $recentProjects = Project::with(['client', 'projectManager'])
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        // ── Charts: Lead Pipeline ────────────────
        $leadsByStatus = Lead::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')->pluck('count', 'status')->toArray();

        // ── Charts: Monthly Revenue (last 6 months) ──
        $monthlyRevenue = collect();
        for ($i = 5; $i >= 0; $i--) {
            $m     = $now->copy()->subMonths($i);
            $start = $m->copy()->startOfMonth();
            $end   = $m->copy()->endOfMonth();
            $monthlyRevenue->push([
                'month'   => $m->format('M'),
                'revenue' => (float) Invoice::where('status', 'paid')->whereBetween('invoice_date', [$start, $end])->sum('grand_total'),
                'expense' => (float) Expense::whereBetween('expense_date', [$start, $end])->sum('amount'),
            ]);
        }

        // ── Charts: Lead Sources ─────────────────
        $leadsBySource = Lead::select('source', DB::raw('count(*) as count'))
            ->groupBy('source')->orderByDesc('count')->limit(6)
            ->pluck('count', 'source')->toArray();

        // ── Charts: Project Status ───────────────
        $projectsByStatus = Project::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')->pluck('count', 'status')->toArray();

        // ── Recent Activity ──────────────────────
        $recentActivities = LeadActivity::with('lead:id,name')
            ->orderByDesc('performed_at')
            ->limit(5)
            ->get(['id', 'lead_id', 'type', 'summary', 'performed_at']);

        // ── Pending Quotations ───────────────────
        $pendingQuotations = Quotation::with('client', 'lead')
            ->whereIn('status', ['draft', 'sent', 'under_review'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'code', 'subject', 'client_id', 'lead_id', 'status', 'grand_total', 'created_at']);

        return Inertia::render('Dashboard', [
            'stats'              => $stats,
            'todaysFollowups'    => $todaysFollowups,
            'overdueFollowups'   => $overdueFollowups,
            'todaysTasks'        => $todaysTasks,
            'myPendingTasks'     => $myPendingTasks,
            'recentProjects'     => $recentProjects,
            'leadsByStatus'      => $leadsByStatus,
            'monthlyRevenue'     => $monthlyRevenue,
            'leadsBySource'      => $leadsBySource,
            'projectsByStatus'   => $projectsByStatus,
            'recentActivities'   => $recentActivities,
            'pendingQuotations'  => $pendingQuotations,
        ]);
    }
}
