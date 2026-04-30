<?php

namespace App\Http\Controllers;

use App\Mail\LeadAssignedMail;
use App\Models\AccountHead;
use App\Models\Client;
use App\Models\ClientReceipt;
use App\Models\InAppNotification;
use App\Models\Invoice;
use App\Models\InvoiceLineItem;
use App\Models\Lead;
use App\Models\Project;
use App\Models\User;
use App\Services\AccountingService;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function __construct(
        private CodeGeneratorService $codeGenerator,
        private AccountingService $accounting
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Lead::class);

        $user = auth()->user();
        $query = Lead::with(['assignedTo', 'client'])->whereNull('deleted_at');

        // Sales executives see only their assigned leads
        if ($this->scopeToUser($user)) {
            $query->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id)->orWhere('created_by', $user->id);
            });
        }

        $leads = $query->get()->groupBy('status');
        $users = User::where('is_active', true)->select('id', 'name')->get();

        return Inertia::render('CRM/Index', [
            'leads'            => $leads,
            'users'            => $users,
            'canAssign'        => $user->can('assign', Lead::class),
            'serviceCategories'=> config('services_catalog.service_categories'),
        ]);
    }

    /**
     * Helper: should we scope the query to records assigned to/created by this user?
     */
    private function scopeToUser($user): bool
    {
        return $user->hasRole('sales_executive')
            && !$user->hasAnyRole(['admin', 'sales_manager']);
    }

    public function dashboard(): Response
    {
        $this->authorize('viewAny', Lead::class);

        $now = now();
        $monthStart = $now->copy()->startOfMonth();

        $stats = [
            'total_active'      => Lead::whereNotIn('status', ['won', 'lost'])->count(),
            'new_this_month'    => Lead::where('created_at', '>=', $monthStart)->count(),
            'won_this_month'    => Lead::where('status', 'won')->where('converted_at', '>=', $monthStart)->count(),
            'pipeline_value'    => Lead::whereNotIn('status', ['won', 'lost'])->sum('estimated_value'),
            'overdue_followups' => Lead::whereNotNull('follow_up_at')
                ->where('follow_up_at', '<', $now)
                ->whereNotIn('status', ['won', 'lost'])
                ->count(),
        ];

        // Conversion rate: won / (won+lost) in last 90 days
        $wonCount  = Lead::where('status', 'won')->where('updated_at', '>=', $now->copy()->subDays(90))->count();
        $lostCount = Lead::where('status', 'lost')->where('updated_at', '>=', $now->copy()->subDays(90))->count();
        $stats['conversion_rate'] = ($wonCount + $lostCount) > 0
            ? round(($wonCount / ($wonCount + $lostCount)) * 100)
            : 0;

        // Pipeline by status
        $byStatus = Lead::select('status', DB::raw('count(*) as count'), DB::raw('sum(estimated_value) as value'))
            ->groupBy('status')
            ->get()
            ->map(fn($r) => ['status' => $r->status, 'count' => $r->count, 'value' => (float)$r->value]);

        // By source
        $bySource = Lead::select('source', DB::raw('count(*) as count'),
            DB::raw('sum(case when status="won" then 1 else 0 end) as won'))
            ->groupBy('source')
            ->orderByDesc('count')
            ->get()
            ->map(fn($r) => ['source' => $r->source, 'count' => $r->count, 'won' => (int)$r->won]);

        // Monthly trend last 6 months
        $monthly = collect();
        for ($i = 5; $i >= 0; $i--) {
            $m     = $now->copy()->subMonths($i);
            $start = $m->copy()->startOfMonth();
            $end   = $m->copy()->endOfMonth();
            $monthly->push([
                'month'   => $m->format('M Y'),
                'created' => Lead::whereBetween('created_at', [$start, $end])->count(),
                'won'     => Lead::where('status', 'won')->whereBetween('converted_at', [$start, $end])->count(),
            ]);
        }

        // Recent activities (with lead name + performer)
        $recentActivities = \App\Models\LeadActivity::with(['lead:id,name', 'performedBy:id,name'])
            ->orderByDesc('performed_at')
            ->limit(8)
            ->get();

        // Upcoming follow-ups (next 7 days + overdue) — include assignee
        $upcomingFollowups = Lead::with('assignedTo:id,name')
            ->whereNotNull('follow_up_at')
            ->whereNotIn('status', ['won', 'lost'])
            ->where('follow_up_at', '<=', $now->copy()->addDays(7))
            ->orderBy('follow_up_at')
            ->limit(10)
            ->get(['id', 'name', 'phone', 'status', 'follow_up_at', 'assigned_to']);

        return Inertia::render('CRM/Dashboard', [
            'stats'              => $stats,
            'by_status'          => $byStatus,
            'by_source'          => $bySource,
            'monthly_trend'      => $monthly,
            'recent_activities'  => $recentActivities,
            'upcoming_followups' => $upcomingFollowups,
        ]);
    }

    public function list(Request $request): Response
    {
        $this->authorize('viewAny', Lead::class);

        $user = auth()->user();
        $query = Lead::with(['assignedTo'])
            ->whereNull('deleted_at');

        if ($this->scopeToUser($user)) {
            $query->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id)->orWhere('created_by', $user->id);
            });
        }

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }
        if ($source = $request->get('source')) {
            $query->where('source', $source);
        }
        if ($assignedTo = $request->get('assigned_to')) {
            $query->where('assigned_to', $assignedTo);
        }

        $leads = $query->orderByDesc('created_at')->paginate(25)->withQueryString();
        $users = User::where('is_active', true)->select('id', 'name')->get();

        return Inertia::render('CRM/Leads/Index', [
            'leads'   => $leads,
            'users'   => $users,
            'filters' => $request->only('search', 'status', 'source', 'assigned_to'),
        ]);
    }

    public function reports(): Response
    {
        $this->authorize('viewAny', Lead::class);

        $now = now();

        // Summary
        $total = Lead::count();
        $won   = Lead::where('status', 'won')->count();
        $lost  = Lead::where('status', 'lost')->count();
        $summary = [
            'total'    => $total,
            'won'      => $won,
            'lost'     => $lost,
            'win_rate' => ($won + $lost) > 0 ? round(($won / ($won + $lost)) * 100) : 0,
        ];

        // Full funnel
        $funnel = Lead::select('status', DB::raw('count(*) as count'), DB::raw('sum(estimated_value) as value'))
            ->groupBy('status')
            ->get()
            ->map(fn($r) => ['status' => $r->status, 'count' => $r->count, 'value' => (float)$r->value]);

        // Sources
        $sources = Lead::select('source', DB::raw('count(*) as count'),
            DB::raw('sum(case when status="won" then 1 else 0 end) as won'))
            ->groupBy('source')
            ->orderByDesc('count')
            ->get()
            ->map(fn($r) => ['source' => $r->source, 'count' => (int)$r->count, 'won' => (int)$r->won]);

        // Lost reasons
        $lostReasons = Lead::where('status', 'lost')
            ->whereNotNull('lost_reason')
            ->select('lost_reason', DB::raw('count(*) as count'))
            ->groupBy('lost_reason')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn($r) => ['reason' => $r->lost_reason, 'count' => $r->count]);

        // Team performance
        $team = Lead::select('assigned_to', DB::raw('count(*) as assigned'),
            DB::raw('sum(case when status="won" then 1 else 0 end) as won'))
            ->whereNotNull('assigned_to')
            ->groupBy('assigned_to')
            ->with('assignedTo:id,name')
            ->get()
            ->map(fn($r) => [
                'user_id'  => $r->assigned_to,
                'name'     => $r->assignedTo?->name ?? 'Unknown',
                'assigned' => (int)$r->assigned,
                'won'      => (int)$r->won,
            ])
            ->sortByDesc('won')
            ->values();

        // Monthly last 12
        $monthly = collect();
        for ($i = 11; $i >= 0; $i--) {
            $m     = $now->copy()->subMonths($i);
            $start = $m->copy()->startOfMonth();
            $end   = $m->copy()->endOfMonth();
            $monthly->push([
                'month'   => $m->format('M Y'),
                'created' => Lead::whereBetween('created_at', [$start, $end])->count(),
                'won'     => Lead::where('status', 'won')->whereBetween('converted_at', [$start, $end])->count(),
                'lost'    => Lead::where('status', 'lost')->whereBetween('updated_at', [$start, $end])->count(),
            ]);
        }

        return Inertia::render('CRM/Reports', [
            'summary'      => $summary,
            'funnel'       => $funnel,
            'sources'      => $sources,
            'lost_reasons' => $lostReasons,
            'team'         => $team,
            'monthly'      => $monthly,
        ]);
    }

    public function followUps(Request $request): Response
    {
        $this->authorize('viewAny', Lead::class);

        $user = auth()->user();
        $query = Lead::with(['assignedTo'])
            ->whereNotNull('follow_up_at')
            ->whereNotIn('status', ['won', 'lost']);

        if ($this->scopeToUser($user)) {
            $query->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id)->orWhere('created_by', $user->id);
            });
        }

        $leads = $query->orderBy('follow_up_at')->paginate(25);

        return Inertia::render('CRM/FollowUps', [
            'leads' => $leads,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Lead::class);

        return Inertia::render('CRM/Leads/Create', [
            'users'            => User::where('is_active', true)->select('id', 'name')->get(),
            'canAssign'        => auth()->user()->can('assign', Lead::class),
            'serviceCategories'=> config('services_catalog.service_categories'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Lead::class);

        $validated = $request->validate([
            'type'            => 'nullable|in:individual,corporate',
            'name'            => 'required|string|max:150',
            'company_name'    => 'nullable|string|max:150|required_if:type,corporate',
            'phone'           => 'required|string|max:20',
            'email'           => 'nullable|email|max:150',
            'address'         => 'nullable|string|max:500',
            'source'          => 'required|in:referral,facebook,instagram,website,walk_in,cold_call,exhibition,other',
            'project_type'    => 'nullable|string|max:100',
            'service_group'   => 'nullable|string|max:50',
            'service_type'    => 'nullable|string|max:150',
            'estimated_value' => 'nullable|numeric|min:0',
            'assigned_to'     => 'nullable|uuid|exists:users,id',
            'follow_up_at'    => 'nullable|date',
            'notes'           => 'nullable|string',
        ]);

        // Sales executive: force assigned_to to themselves (they can't assign to others)
        if (!auth()->user()->can('assign', Lead::class)) {
            $validated['assigned_to'] = auth()->id();
        }

        $code = $this->codeGenerator->generate('LD', 'leads');
        $lead = Lead::create(array_merge($validated, [
            'code'       => $code,
            'created_by' => auth()->id(),
        ]));

        // Notify the assignee if it's not the current user
        if ($lead->assigned_to && $lead->assigned_to !== auth()->id()) {
            $this->notifyAssignee($lead);
        }

        return redirect()->route('crm.index')->with('success', 'Lead created successfully.');
    }

    public function show(Lead $lead): Response
    {
        $this->authorize('view', $lead);

        $lead->load(['assignedTo', 'client', 'activities.performedBy', 'createdBy', 'project', 'invoices']);

        return Inertia::render('CRM/Leads/Show', [
            'lead'  => $lead,
            'users' => User::where('is_active', true)->select('id', 'name')->get(),
            'accountHeads' => AccountHead::whereHas('group', fn($q) => $q->where('type', 'asset'))
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'incomeSources' => config('services_catalog.income_sources', []),
        ]);
    }

    /**
     * One-shot paid-service entry from the Lead page.
     *
     * Creates a fully-paid Invoice + its ClientReceipt + posts both journal
     * entries in one request. Used for visit charges, 3D-only design fees, and
     * other small services where cash/bKash is collected on the spot and the
     * full invoice → mark-sent → receive-payment dance is overkill. The lead
     * itself is NOT converted — it stays in the pipeline.
     */
    public function storePaidService(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);
        $this->authorize('create', Invoice::class);

        $incomeSources = config('services_catalog.income_sources', []);

        $validated = $request->validate([
            'description'     => 'required|string|max:250',
            'amount'          => 'required|numeric|min:0.01',
            'service_date'    => 'required|date',
            'income_source'   => ['required', 'string', 'in:' . implode(',', $incomeSources)],
            'payment_method'  => 'required|in:cash,bank_transfer,cheque,bkash,nagad,rocket,other',
            'account_head_id' => 'required|uuid|exists:account_heads,id',
            'reference'       => 'nullable|string|max:150',
            'notes'           => 'nullable|string|max:500',
        ]);

        $result = DB::transaction(function () use ($validated, $lead) {
            $invoice = Invoice::create([
                'code'            => $this->codeGenerator->generate('INV', 'invoices'),
                'client_id'       => $lead->client_id,
                'lead_id'         => $lead->id,
                'status'          => 'paid',
                'invoice_date'    => $validated['service_date'],
                'due_date'        => $validated['service_date'],
                'subtotal'        => $validated['amount'],
                'vat_pct'         => 0,
                'vat_amount'      => 0,
                'discount_amount' => 0,
                'grand_total'     => $validated['amount'],
                'income_source'   => $validated['income_source'],
                'paid_amount'     => $validated['amount'],
                'notes'           => $validated['notes'] ?? null,
                'created_by'      => auth()->id(),
            ]);

            InvoiceLineItem::create([
                'invoice_id'  => $invoice->id,
                'description' => $validated['description'],
                'quantity'    => 1,
                'unit_rate'   => $validated['amount'],
                'total'       => $validated['amount'],
                'sequence'    => 0,
            ]);

            $receipt = ClientReceipt::create([
                'code'            => $this->codeGenerator->generate('RCP', 'client_receipts'),
                'client_id'       => $lead->client_id,
                'lead_id'         => $lead->id,
                'invoice_id'      => $invoice->id,
                'amount'          => $validated['amount'],
                'income_source'   => $validated['income_source'],
                'receipt_date'    => $validated['service_date'],
                'payment_method'  => $validated['payment_method'],
                'reference'       => $validated['reference'] ?? null,
                'account_head_id' => $validated['account_head_id'],
                'notes'           => $validated['notes'] ?? null,
                'created_by'      => auth()->id(),
            ]);

            return [$invoice, $receipt];
        });

        [$invoice, $receipt] = $result;

        // Post journal entries (A/R debit + Revenue credit, then Cash/Bank debit + A/R credit)
        $this->accounting->postInvoiceCreated($invoice->fresh(['client', 'lead']));
        $this->accounting->postClientReceiptRecorded($receipt->fresh(['client', 'lead']));

        return back()->with('success', "Paid service logged — {$invoice->code} / {$receipt->code}.");
    }

    public function edit(Lead $lead): Response
    {
        $this->authorize('update', $lead);

        return Inertia::render('CRM/Leads/Edit', [
            'lead'             => $lead,
            'users'            => User::where('is_active', true)->select('id', 'name')->get(),
            'canAssign'        => auth()->user()->can('assign', $lead),
            'serviceCategories'=> config('services_catalog.service_categories'),
        ]);
    }

    public function update(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);

        $validated = $request->validate([
            'type'            => 'nullable|in:individual,corporate',
            'name'            => 'required|string|max:150',
            'company_name'    => 'nullable|string|max:150|required_if:type,corporate',
            'phone'           => 'required|string|max:20',
            'email'           => 'nullable|email|max:150',
            'address'         => 'nullable|string|max:500',
            'source'          => 'required|in:referral,facebook,instagram,website,walk_in,cold_call,exhibition,other',
            'status'          => 'sometimes|in:new,contacted,qualified,proposal_sent,won,lost',
            'project_type'    => 'nullable|string|max:100',
            'service_group'   => 'nullable|string|max:50',
            'service_type'    => 'nullable|string|max:150',
            'estimated_value' => 'nullable|numeric|min:0',
            'assigned_to'     => 'nullable|uuid|exists:users,id',
            'follow_up_at'    => 'nullable|date',
            'notes'           => 'nullable|string',
        ]);

        // Sales executives can't reassign — strip the field if they don't have permission
        if (!auth()->user()->can('assign', $lead)) {
            unset($validated['assigned_to']);
        }

        $oldAssignee = $lead->assigned_to;
        $lead->update($validated);

        // Notify the new assignee if assignment changed and it's not the current user
        $newAssignee = $lead->fresh()->assigned_to;
        if ($newAssignee && $newAssignee !== $oldAssignee && $newAssignee !== auth()->id()) {
            $this->notifyAssignee($lead);
        }

        return redirect()->route('crm.leads.show', $lead)->with('success', 'Lead updated.');
    }

    public function destroy(Lead $lead): RedirectResponse
    {
        $this->authorize('delete', $lead);
        $lead->delete();
        return redirect()->route('crm.index')->with('success', 'Lead deleted.');
    }

    public function updateStatus(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);

        $validated = $request->validate([
            'status'           => 'required|in:new,contacted,qualified,proposal_sent,won,lost',
            'lost_reason'      => 'required_if:status,lost|nullable|string',
            'create_project'   => 'nullable|boolean',
            'project_name'     => 'nullable|string|max:200',
            'site_engineer_id' => 'nullable|uuid|exists:users,id',
        ]);

        $oldStatus = $lead->status;

        DB::transaction(function () use ($validated, $lead) {
            $lead->update([
                'status'       => $validated['status'],
                'lost_reason'  => $validated['lost_reason'] ?? null,
                'converted_at' => $validated['status'] === 'won' ? now() : null,
            ]);

            if ($validated['status'] === 'won' && ($validated['create_project'] ?? false)) {
                $codeService = app(CodeGeneratorService::class);
                $code = $codeService->generate('PRJ', 'projects');

                $client = $lead->client;
                if (!$client) {
                    $clientCode = $codeService->generate('CL', 'clients');
                    $client = Client::create([
                        'code'         => $clientCode,
                        'type'         => $lead->type ?? 'individual',
                        'name'         => $lead->name,
                        'company_name' => $lead->company_name,
                        'phone'        => $lead->phone,
                        'email'        => $lead->email,
                        'address'      => $lead->address,
                        'created_by'   => auth()->id(),
                    ]);
                    $lead->update(['client_id' => $client->id]);
                }

                Project::create([
                    'code'             => $code,
                    'name'             => $validated['project_name'] ?? "Project for {$lead->name}",
                    'client_id'        => $client->id,
                    'lead_id'          => $lead->id,
                    'type'             => 'residential',
                    'status'           => 'survey',
                    'site_address'     => $lead->address ?? '',
                    'site_engineer_id' => $validated['site_engineer_id'] ?? null,
                    'created_by'       => auth()->id(),
                ]);
            }
        });

        // Notify the lead creator if status actually changed
        if ($oldStatus !== $validated['status']) {
            $oldLabel = ucfirst(str_replace('_', ' ', $oldStatus ?? '—'));
            $newLabel = ucfirst(str_replace('_', ' ', $validated['status']));
            $body     = "Status changed: {$oldLabel} → {$newLabel}";
            if ($validated['status'] === 'lost' && !empty($validated['lost_reason'])) {
                $body .= "\nReason: {$validated['lost_reason']}";
            }
            $lead->notifyCreator(
                type:     'lead.status',
                headline: "Lead status updated — {$lead->name}",
                body:     $body,
                icon:     '🔄',
            );
        }

        return back()->with('success', 'Lead status updated.');
    }

    public function followUpDone(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);
        $lead->update(['follow_up_at' => null]);
        return back()->with('success', 'Follow-up marked as done.');
    }

    public function convertToClient(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);

        if ($lead->client_id) {
            return back()->with('error', 'Lead is already linked to a client.');
        }

        $codeService = app(CodeGeneratorService::class);
        $code = $codeService->generate('CL', 'clients');

        $client = Client::create([
            'code'         => $code,
            'type'         => $lead->type ?? 'individual',
            'name'         => $lead->name,
            'company_name' => $lead->company_name,
            'phone'        => $lead->phone,
            'email'        => $lead->email,
            'address'      => $lead->address,
            'created_by'   => auth()->id(),
        ]);

        $lead->update(['client_id' => $client->id]);

        return redirect()->route('clients.show', $client)->with('success', 'Lead converted to client.');
    }

    /**
     * Send in-app + email notification to the lead's assignee.
     * Failures are logged but never break the parent request.
     */
    private function notifyAssignee(Lead $lead): void
    {
        $assignee = User::find($lead->assigned_to);
        if (!$assignee || !$assignee->is_active) return;

        $assignedBy = auth()->user();
        $leadUrl    = route('crm.leads.show', $lead->id);

        // 1) In-app notification
        try {
            $causerLabel = $assignedBy ? " by {$assignedBy->name}" : '';
            $title = $lead->type === 'corporate' && !empty($lead->company_name)
                ? "Lead assigned: {$lead->company_name} ({$lead->name})"
                : "Lead assigned: {$lead->name}";

            InAppNotification::send(
                userId:   $assignee->id,
                type:     'lead.assigned',
                title:    $title,
                message:  "Phone: {$lead->phone}" . ($lead->source ? " · Source: {$lead->source}" : '') . $causerLabel,
                link:     $leadUrl,
                icon:     '🎯',
                causedBy: $assignedBy?->id,
            );
        } catch (\Throwable $e) {
            Log::warning('Failed to create in-app notification for lead assignment', [
                'lead_id' => $lead->id, 'assignee_id' => $assignee->id, 'error' => $e->getMessage(),
            ]);
        }

        // 2) Email — only if the assignee has an email address
        if (empty($assignee->email)) return;

        try {
            Mail::to($assignee->email)->send(new LeadAssignedMail(
                lead: $lead,
                assignee: $assignee,
                assignedBy: $assignedBy,
                leadUrl: $leadUrl,
            ));
        } catch (\Throwable $e) {
            Log::warning('Failed to send lead-assignment email', [
                'lead_id' => $lead->id, 'assignee_email' => $assignee->email, 'error' => $e->getMessage(),
            ]);
        }
    }
}
