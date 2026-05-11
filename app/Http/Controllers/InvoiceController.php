<?php

namespace App\Http\Controllers;

use App\Mail\InvoiceMail;
use App\Models\AccountHead;
use App\Models\Client;
use App\Models\ClientReceipt;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Project;
use App\Models\Quotation;
use App\Models\Setting;
use App\Services\AccountingService;
use App\Services\CodeGeneratorService;
use App\Support\NumberToWords;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function __construct(
        private CodeGeneratorService $codeGenerator,
        private AccountingService $accounting
    ) {}

    public function dashboard(): Response
    {
        $this->authorize('viewAny', Invoice::class);

        $monthStart = now()->startOfMonth();
        $monthEnd   = now()->endOfMonth();
        $lastMonth  = now()->subMonthNoOverflow();
        $lastStart  = $lastMonth->copy()->startOfMonth();
        $lastEnd    = $lastMonth->copy()->endOfMonth();

        // Cash-basis month revenue + expenses
        $revenueThisMonth = (float) ClientReceipt::whereBetween('receipt_date', [$monthStart, $monthEnd])->sum('amount');
        $revenueLastMonth = (float) ClientReceipt::whereBetween('receipt_date', [$lastStart, $lastEnd])->sum('amount');
        $expensesThisMonth = (float) \App\Models\Expense::whereBetween('expense_date', [$monthStart, $monthEnd])->sum('amount');
        $expensesLastMonth = (float) \App\Models\Expense::whereBetween('expense_date', [$lastStart, $lastEnd])->sum('amount');

        // Outstanding receivables: grand_total - paid_amount on open invoices
        $totalReceivables = (float) Invoice::whereNotIn('status', ['paid', 'cancelled'])
            ->selectRaw('COALESCE(SUM(grand_total - paid_amount), 0) as total')
            ->value('total');

        // Outstanding payables: approved/received POs minus payments made
        $poOutstanding = (float) \App\Models\PurchaseOrder::whereNotIn('status', ['cancelled', 'draft'])
            ->sum('grand_total');
        $vendorPaid = (float) \App\Models\VendorPayment::sum('amount');
        $totalPayables = max(0, $poOutstanding - $vendorPaid);

        // Cash & wallet balance — sum all asset heads in the 10xx range except
        // bank (1002). Covers Cash in Hand, Petty Cash, bKash, Nagad, Rocket,
        // and any user-added cash-like accounts under code 10xx.
        $cashBalance = (float) \App\Models\JournalLine::whereHas('accountHead', function ($q) {
            $q->whereHas('group', fn($g) => $g->where('type', 'asset'))
              ->where('code', 'like', '10%')
              ->where('code', '!=', '1002');
        })
            ->selectRaw('SUM(CASE WHEN type="debit" THEN amount ELSE -amount END) as balance')
            ->value('balance');

        // Bank balance — code 1002 (Bank Account) plus any user-added bank
        // accounts that follow the 1002xx pattern.
        $bankBalance = (float) \App\Models\JournalLine::whereHas('accountHead', function ($q) {
            $q->whereHas('group', fn($g) => $g->where('type', 'asset'))
              ->where(function ($q2) {
                  $q2->where('code', '1002')->orWhere('code', 'like', '1002%');
              });
        })
            ->selectRaw('SUM(CASE WHEN type="debit" THEN amount ELSE -amount END) as balance')
            ->value('balance');

        $stats = [
            'total_receivables' => $totalReceivables,
            'total_payables'    => $totalPayables,
            'revenue_month'     => $revenueThisMonth,
            'revenue_last_month'=> $revenueLastMonth,
            'revenue_delta_pct' => $revenueLastMonth > 0
                ? round((($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth) * 100, 1)
                : null,
            'expenses_month'    => $expensesThisMonth,
            'expenses_last_month' => $expensesLastMonth,
            'expenses_delta_pct'=> $expensesLastMonth > 0
                ? round((($expensesThisMonth - $expensesLastMonth) / $expensesLastMonth) * 100, 1)
                : null,
            'net_profit_month'  => $revenueThisMonth - $expensesThisMonth,
            'cash_balance'      => $cashBalance,
            'bank_balance'      => $bankBalance,
            'open_invoice_count'=> Invoice::whereNotIn('status', ['paid', 'cancelled'])->count(),
            'overdue_count'     => Invoice::whereNotIn('status', ['paid', 'cancelled'])->where('due_date', '<', today())->count(),
        ];

        $recentInvoices = Invoice::with(['client', 'lead'])
            ->orderByDesc('invoice_date')
            ->limit(6)
            ->get();

        $overdueInvoices = Invoice::with(['client', 'lead'])
            ->whereNotIn('status', ['paid', 'cancelled'])
            ->where('due_date', '<', today())
            ->orderBy('due_date')
            ->limit(6)
            ->get()
            ->map(function ($inv) {
                $inv->balance_due = (float) $inv->grand_total - (float) $inv->paid_amount;
                return $inv;
            });

        // Revenue by income source — 3 canonical sources defined in config
        // (Visit Charge / 3D Design / Project). Cash-basis: sums client_receipts.
        $incomeSources = config('services_catalog.income_sources', []);
        $revenueBySource = $this->buildRevenueBySource($incomeSources);

        return Inertia::render('Accounts/Dashboard', [
            'stats'           => $stats,
            'recentInvoices'  => $recentInvoices,
            'overdueInvoices' => $overdueInvoices,
            'revenueBySource' => $revenueBySource,
        ]);
    }

    /** Build revenue breakdown for this month / this year / all-time, bucketed by income_source */
    private function buildRevenueBySource(array $sources): array
    {
        $windows = [
            'this_month' => [now()->startOfMonth(), now()->endOfDay()],
            'this_year'  => [now()->startOfYear(), now()->endOfDay()],
            'all_time'   => [null, null],
        ];

        $result = [];
        foreach ($windows as $key => [$from, $to]) {
            $query = ClientReceipt::query();
            if ($from) $query->where('receipt_date', '>=', $from);
            if ($to)   $query->where('receipt_date', '<=', $to);

            // Group by the real column (MySQL strict mode rejects grouping by a SELECT alias)
            $rows = $query
                ->selectRaw('income_source, SUM(amount) as total, COUNT(*) as receipts')
                ->groupBy('income_source')
                ->get()
                ->keyBy(fn ($r) => $r->income_source ?? 'Unclassified');

            $buckets = [];
            foreach ($sources as $src) {
                $row = $rows->get($src);
                $buckets[] = [
                    'source'   => $src,
                    'total'    => (float) ($row->total ?? 0),
                    'receipts' => (int)   ($row->receipts ?? 0),
                ];
            }
            if ($unc = $rows->get('Unclassified')) {
                if ((float) $unc->total > 0) {
                    $buckets[] = [
                        'source'   => 'Unclassified',
                        'total'    => (float) $unc->total,
                        'receipts' => (int)   $unc->receipts,
                    ];
                }
            }

            $result[$key] = [
                'total'   => array_sum(array_column($buckets, 'total')),
                'buckets' => $buckets,
            ];
        }

        return $result;
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Invoice::class);

        $invoices = Invoice::with(['client', 'lead', 'project'])
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->client_id, fn($q, $c) => $q->where('client_id', $c))
            ->when($request->lead_id, fn($q, $l) => $q->where('lead_id', $l))
            ->orderByDesc('invoice_date')
            ->paginate(25)->withQueryString();

        return Inertia::render('Accounts/Invoices/Index', [
            'invoices' => $invoices,
            'filters' => $request->only(['status', 'client_id', 'lead_id', 'project_id']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Invoice::class);

        $prefill = [
            'lead_id'      => $request->get('lead_id'),
            'client_id'    => $request->get('client_id'),
            'project_id'   => $request->get('project_id'),
            'quotation_id' => null,
            'quotation'    => null,
            'items'        => null,
            'vat_pct'      => null,
            'discount_amount' => null,
            'terms'        => null,
        ];

        // If creating from an approved quotation, prefill entity refs + line items
        if ($qid = $request->get('quotation_id')) {
            $quotation = Quotation::with('items')->find($qid);
            if ($quotation && in_array($quotation->status, ['approved', 'converted'])) {
                $prefill['quotation_id']    = $quotation->id;
                $prefill['quotation']       = ['id' => $quotation->id, 'code' => $quotation->code, 'display_code' => $quotation->display_code];
                $prefill['client_id']       = $quotation->client_id ?: $prefill['client_id'];
                $prefill['lead_id']         = $quotation->lead_id   ?: $prefill['lead_id'];
                $prefill['project_id']      = $quotation->project_id ?: $prefill['project_id'];
                $prefill['vat_pct']         = (float) $quotation->vat_pct;
                $prefill['discount_amount'] = (float) $quotation->discount_amount;
                $prefill['terms']           = $quotation->terms;
                $prefill['items']           = $quotation->items->map(fn($it) => [
                    'description' => trim(($it->item_name ? $it->item_name . "\n" : '') . ($it->description ?? '')),
                    'unit'        => $it->unit,
                    'quantity'    => (string) $it->quantity,
                    'unit_rate'   => (string) $it->unit_rate,
                ])->values()->all();
            }
        }

        return Inertia::render('Accounts/Invoices/Create', [
            'clients'  => Client::where('is_active', true)->select('id', 'name', 'code', 'phone')->orderBy('name')->get(),
            'leads'    => Lead::whereNotIn('status', ['won', 'lost'])->select('id', 'name', 'phone', 'code')->orderBy('name')->get(),
            'projects' => Project::whereNotIn('status', ['completed', 'cancelled'])->select('id', 'name', 'code')->get(),
            'approvedQuotations' => Quotation::whereIn('status', ['approved', 'converted'])
                ->whereNull('deleted_at')
                ->with(['client:id,name', 'lead:id,name'])
                ->orderByDesc('created_at')
                ->get()
                ->map(fn($q) => [
                    'id'           => $q->id,
                    'code'         => $q->code,
                    'display_code' => $q->display_code,
                    'subject'      => $q->subject,
                    'grand_total'  => (float) $q->grand_total,
                    'party'        => $q->client?->name ?? $q->lead?->name ?? '—',
                ])
                ->values(),
            'incomeSources' => config('services_catalog.income_sources', []),
            'prefill'  => $prefill,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Invoice::class);

        $incomeSources = config('services_catalog.income_sources', []);

        $validated = $request->validate([
            'client_id'   => 'nullable|uuid|exists:clients,id',
            'lead_id'     => 'nullable|uuid|exists:leads,id',
            'project_id'  => 'nullable|uuid|exists:projects,id',
            'quotation_id' => 'nullable|uuid|exists:quotations,id',
            'income_source' => ['nullable', 'string', 'in:' . implode(',', $incomeSources)],
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'vat_pct' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'status' => 'required|in:draft,sent',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:1000',
            'items.*.unit' => 'nullable|string|max:30',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_rate' => 'required|numeric|min:0',
            'items.*.sequence' => 'nullable|integer',
        ]);

        if (empty($validated['client_id']) && empty($validated['lead_id'])) {
            return back()->withErrors(['client_id' => 'Select a client or at least a lead.'])->withInput();
        }

        // Smart default if the user left income_source blank:
        // project-attached → Project, lead-only → Visit Charge.
        if (empty($validated['income_source'])) {
            $validated['income_source'] = !empty($validated['project_id']) ? 'Project'
                : (!empty($validated['lead_id']) ? 'Visit Charge' : 'Project');
        }

        $invoice = DB::transaction(function () use ($validated) {
            $code = $this->codeGenerator->generate('INV', 'invoices');

            $subtotal = collect($validated['items'])->sum(fn($i) => $i['quantity'] * $i['unit_rate']);
            $vatPct = $validated['vat_pct'] ?? 0;
            $vatAmount = $subtotal * ($vatPct / 100);
            $discount = $validated['discount_amount'] ?? 0;
            $grandTotal = $subtotal + $vatAmount - $discount;

            $invoice = Invoice::create(array_merge(
                \Illuminate\Support\Arr::except($validated, ['items']),
                [
                    'code' => $code,
                    'subtotal' => $subtotal,
                    'vat_amount' => $vatAmount,
                    'grand_total' => $grandTotal,
                    'created_by' => auth()->id(),
                ]
            ));

            foreach ($validated['items'] as $idx => $item) {
                $invoice->lineItems()->create(array_merge($item, [
                    'total' => $item['quantity'] * $item['unit_rate'],
                    'sequence' => $item['sequence'] ?? $idx,
                ]));
            }

            // If linked to a quotation, mark it as converted (one quotation → one invoice)
            if (!empty($validated['quotation_id'])) {
                Quotation::where('id', $validated['quotation_id'])->update(['status' => 'converted']);
            }

            return $invoice;
        });

        // Post journal entry via observer or directly
        $this->accounting->postInvoiceCreated($invoice->fresh(['client', 'lead']));

        return redirect()->route('accounts.invoices.show', $invoice)->with('success', 'Invoice created.');
    }

    public function show(Invoice $invoice): Response
    {
        $this->authorize('view', $invoice);

        $invoice->load(['client', 'lead', 'project', 'quotation', 'lineItems', 'receipts.accountHead', 'createdBy']);

        $logoPath = Setting::get('quotation_logo') ?: Setting::get('company_logo');
        $sigPath  = Setting::get('company_signature');

        return Inertia::render('Accounts/Invoices/Show', [
            'invoice' => $invoice,
            'accountHeads' => AccountHead::whereHas('group', fn($q) => $q->where('type', 'asset'))
                ->where('is_active', true)->select('id', 'name', 'code')->get(),
            'company' => [
                'name'      => Setting::get('company_name', 'Interior Villa'),
                'tagline'   => Setting::get('company_tagline', 'Build Your Dream'),
                'email'     => Setting::get('company_email'),
                'phone'     => Setting::get('company_phone'),
                'phone2'    => Setting::get('company_phone2'),
                'address'   => Setting::get('company_address'),
                'ceo_name'  => Setting::get('company_ceo_name'),
                'ceo_title' => Setting::get('company_ceo_title', 'CEO'),
                'logo'      => $logoPath ? asset('storage/' . $logoPath) : null,
                'signature' => $sigPath ? asset('storage/' . $sigPath) : null,
            ],
            'grandTotalInWords' => NumberToWords::toBdt((float) $invoice->grand_total),
        ]);
    }

    public function edit(Invoice $invoice): Response
    {
        $this->authorize('update', $invoice);
        $invoice->load(['client', 'lead', 'project', 'lineItems']);
        return Inertia::render('Accounts/Invoices/Edit', [
            'invoice' => $invoice,
            'clients' => Client::where('is_active', true)->select('id', 'name', 'code')->get(),
            'leads'   => Lead::whereNotIn('status', ['won', 'lost'])->select('id', 'name', 'phone', 'code')->orderBy('name')->get(),
            'projects' => Project::whereNotIn('status', ['completed', 'cancelled'])->select('id', 'name', 'code')->get(),
        ]);
    }

    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        $this->authorize('update', $invoice);

        abort_if($invoice->status === 'paid', 403, 'Cannot edit a paid invoice.');

        $validated = $request->validate([
            'due_date' => 'required|date',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'status' => 'required|in:draft,sent,cancelled',
        ]);

        $invoice->update($validated);

        return back()->with('success', 'Invoice updated.');
    }

    public function destroy(Invoice $invoice): RedirectResponse
    {
        $this->authorize('delete', $invoice);

        // Refuse if any payment has already been recorded — cash-basis books would
        // otherwise show a phantom receipt against a non-existent invoice.
        if ($invoice->receipts()->exists() || (float) $invoice->paid_amount > 0) {
            return back()->with('error',
                'Cannot delete: this invoice has payment receipts. Reverse the receipts first, then try again.');
        }

        DB::transaction(function () use ($invoice) {
            // Reverse the journal entry posted when this invoice was created so
            // Accounts Receivable + Revenue stay in balance.
            \App\Models\JournalEntry::where('reference_type', 'invoice')
                ->where('reference_id', $invoice->id)
                ->delete(); // journal_lines cascade via FK

            $invoice->delete(); // soft-delete (recoverable via DB restore)
        });

        return redirect()->route('accounts.invoices.index')->with('success', 'Invoice deleted.');
    }

    public function pdf(Invoice $invoice)
    {
        $this->authorize('view', $invoice);
        $invoice->load(['client', 'lead', 'lineItems', 'createdBy']);

        $pdf = Pdf::loadView('invoices.public.show', $this->buildViewPayload($invoice, true))
            ->setPaper('a4');

        return $pdf->download("Invoice-{$invoice->code}.pdf");
    }

    /** Public read-only invoice page — opened via signed URL from email/WhatsApp */
    public function showPublic(Invoice $invoice)
    {
        $invoice->load(['client', 'lead', 'lineItems', 'createdBy']);

        return view('invoices.public.show', array_merge(
            $this->buildViewPayload($invoice, false),
            ['pdfUrl' => URL::temporarySignedRoute('invoices.public.pdf', now()->addDays(30), ['invoice' => $invoice->id])]
        ));
    }

    /** Returns a 30-day signed URL clients can open without logging in */
    public function shareLink(Invoice $invoice): JsonResponse
    {
        $this->authorize('view', $invoice);

        return response()->json([
            'url' => URL::temporarySignedRoute(
                'invoices.public.show',
                now()->addDays(30),
                ['invoice' => $invoice->id]
            ),
        ]);
    }

    /** Send invoice by email to the client (Resend / SMTP / etc.) */
    public function sendEmail(Request $request, Invoice $invoice): RedirectResponse
    {
        $this->authorize('view', $invoice);

        $validated = $request->validate([
            'to'             => 'required|string',
            'cc'             => 'nullable|string',
            'custom_message' => 'nullable|string|max:2000',
        ]);

        $invoice->load(['client', 'lead', 'lineItems', 'createdBy']);

        $publicUrl = URL::temporarySignedRoute(
            'invoices.public.show',
            now()->addDays(30),
            ['invoice' => $invoice->id]
        );

        $mailable = new InvoiceMail($invoice, $publicUrl, $validated['custom_message'] ?? '');

        $tos = collect(explode(',', $validated['to']))->map(fn($e) => trim($e))->filter();
        $ccs = collect(explode(',', $validated['cc'] ?? ''))->map(fn($e) => trim($e))->filter();

        $send = Mail::to($tos->all());
        if ($ccs->isNotEmpty()) $send->cc($ccs->all());

        try {
            $send->send($mailable);
        } catch (\Throwable $e) {
            return back()->with('error', 'Email send failed: ' . $e->getMessage());
        }

        return back()->with('success', "Invoice {$invoice->code} sent to " . $tos->implode(', ') . '.');
    }

    /**
     * Builds the data payload used by both the public web view and the PDF
     * generator so the two stay perfectly in sync.
     */
    private function buildViewPayload(Invoice $invoice, bool $isPdf): array
    {
        $resolveImage = function (?string $path) use ($isPdf): ?string {
            if (!$path) return null;
            if ($isPdf) {
                $abs = storage_path('app/public/' . $path);
                if (is_file($abs)) {
                    return 'data:image/' . pathinfo($abs, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($abs));
                }
                return null;
            }
            return asset('storage/' . $path);
        };

        return [
            'invoice'            => $invoice,
            'companyName'        => Setting::get('company_name', 'Interior Villa'),
            'companyTagline'     => Setting::get('company_tagline', 'Build Your Dream'),
            'companyEmail'       => Setting::get('company_email'),
            'companyPhone'       => Setting::get('company_phone'),
            'companyPhone2'      => Setting::get('company_phone2'),
            'companyAddress'     => Setting::get('company_address'),
            'companyCeoName'     => Setting::get('company_ceo_name'),
            'companyCeoTitle'    => Setting::get('company_ceo_title', 'CEO'),
            'companyLogo'        => $resolveImage(Setting::get('quotation_logo') ?: Setting::get('company_logo')),
            'companySignature'   => $resolveImage(Setting::get('company_signature')),
            'grandTotalInWords'  => NumberToWords::toBdt((float) $invoice->grand_total),
            'isPdf'              => $isPdf,
        ];
    }
}
