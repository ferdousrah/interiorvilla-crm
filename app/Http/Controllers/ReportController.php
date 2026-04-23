<?php

namespace App\Http\Controllers;

use App\Models\AccountHead;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\JournalLine;
use App\Models\Project;
use App\Models\Setting;
use App\Models\Vendor;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Invoice::class);
        return Inertia::render('Accounts/Reports/Index');
    }

    /** Trial Balance */
    public function trialBalance(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $asOf = $request->get('as_of') ?: now()->toDateString();

        $balances = AccountHead::with('group')
            ->where('is_active', true)
            ->orderBy('code')
            ->get()
            ->map(function ($account) use ($asOf) {
                $debit  = (float) $account->journalLines()
                    ->whereHas('journal', fn ($q) => $q->whereDate('entry_date', '<=', $asOf))
                    ->where('type', 'debit')->sum('amount');
                $credit = (float) $account->journalLines()
                    ->whereHas('journal', fn ($q) => $q->whereDate('entry_date', '<=', $asOf))
                    ->where('type', 'credit')->sum('amount');

                $opening = (float) ($account->opening_balance ?? 0);
                $net = $opening + $debit - $credit;

                return [
                    'id'     => $account->id,
                    'code'   => $account->code,
                    'name'   => $account->name,
                    'group'  => $account->group?->name,
                    'debit'  => $net > 0 ? $net  : 0,
                    'credit' => $net < 0 ? -$net : 0,
                ];
            })
            ->filter(fn ($b) => $b['debit'] > 0 || $b['credit'] > 0)
            ->values();

        return $this->render($request, 'Accounts/Reports/TrialBalance', 'reports.pdf.trial-balance', [
            'balances' => $balances,
            'asOf'     => $asOf,
        ], "Trial-Balance-{$asOf}");
    }

    /** Client Ledger */
    public function clientLedger(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $clientId = $request->get('client_id');
        $from     = $request->get('from');
        $to       = $request->get('to');

        $client = $clientId ? Client::find($clientId) : null;
        $transactions = collect();

        if ($client) {
            $invoices = $client->invoices()
                ->when($from, fn ($q) => $q->whereDate('invoice_date', '>=', $from))
                ->when($to,   fn ($q) => $q->whereDate('invoice_date', '<=', $to))
                ->get()
                ->map(fn ($i) => [
                    'date'        => (string) $i->invoice_date?->toDateString(),
                    'type'        => 'invoice',
                    'reference'   => $i->code,
                    'description' => 'Invoice raised',
                    'amount'      => (float) $i->grand_total,
                ]);

            $receipts = $client->receipts()
                ->when($from, fn ($q) => $q->whereDate('receipt_date', '>=', $from))
                ->when($to,   fn ($q) => $q->whereDate('receipt_date', '<=', $to))
                ->get()
                ->map(fn ($r) => [
                    'date'        => (string) $r->receipt_date?->toDateString(),
                    'type'        => 'receipt',
                    'reference'   => $r->code,
                    'description' => ucfirst(str_replace('_', ' ', $r->payment_method ?? 'payment')) . ' received',
                    'amount'      => (float) $r->amount,
                ]);

            $transactions = $invoices->merge($receipts)->sortBy('date')->values();

            // Running balance (invoice increases, receipt decreases)
            $balance = 0;
            $transactions = $transactions->map(function ($t) use (&$balance) {
                $balance += $t['type'] === 'invoice' ? $t['amount'] : -$t['amount'];
                $t['running_balance'] = $balance;
                return $t;
            });
        }

        return $this->render($request, 'Accounts/Reports/ClientLedger', 'reports.pdf.client-ledger', [
            'client'       => $client,
            'transactions' => $transactions,
            'clients'      => Client::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'phone']),
            'filters'      => compact('clientId', 'from', 'to') + ['client_id' => $clientId],
        ], $client ? "Client-Ledger-{$client->code}" : 'Client-Ledger');
    }

    /** Vendor Ledger */
    public function vendorLedger(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $vendorId = $request->get('vendor_id');
        $from     = $request->get('from');
        $to       = $request->get('to');

        $vendor = $vendorId ? Vendor::find($vendorId) : null;
        $transactions = collect();

        if ($vendor) {
            $pos = $vendor->purchaseOrders()
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->when($from, fn ($q) => $q->whereDate('order_date', '>=', $from))
                ->when($to,   fn ($q) => $q->whereDate('order_date', '<=', $to))
                ->get()
                ->map(fn ($p) => [
                    'date'        => (string) $p->order_date?->toDateString(),
                    'type'        => 'purchase_order',
                    'reference'   => $p->code,
                    'description' => 'Purchase order placed',
                    'amount'      => (float) $p->grand_total,
                ]);

            $payments = $vendor->payments()
                ->when($from, fn ($q) => $q->whereDate('payment_date', '>=', $from))
                ->when($to,   fn ($q) => $q->whereDate('payment_date', '<=', $to))
                ->get()
                ->map(fn ($p) => [
                    'date'        => (string) $p->payment_date?->toDateString(),
                    'type'        => 'payment',
                    'reference'   => $p->code,
                    'description' => 'Payment made',
                    'amount'      => (float) $p->amount,
                ]);

            $transactions = $pos->merge($payments)->sortBy('date')->values();

            $balance = 0;
            $transactions = $transactions->map(function ($t) use (&$balance) {
                $balance += $t['type'] === 'purchase_order' ? $t['amount'] : -$t['amount'];
                $t['running_balance'] = $balance;
                return $t;
            });
        }

        return $this->render($request, 'Accounts/Reports/VendorLedger', 'reports.pdf.vendor-ledger', [
            'vendor'       => $vendor,
            'transactions' => $transactions,
            'vendors'      => Vendor::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'phone']),
            'filters'      => ['vendor_id' => $vendorId, 'from' => $from, 'to' => $to],
        ], $vendor ? "Vendor-Ledger-{$vendor->code}" : 'Vendor-Ledger');
    }

    /** Cash & Bank Statement */
    public function cashBankStatement(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $accountId = $request->get('account_head_id');
        $from      = $request->get('from');
        $to        = $request->get('to');

        $accountHead = $accountId ? AccountHead::find($accountId) : null;
        $transactions = collect();
        $openingBalance = null;
        $closingBalance = null;

        if ($accountHead) {
            // Opening = sum of debits - credits BEFORE from-date (or 0 if no from-date)
            if ($from) {
                $openingDebit  = (float) $accountHead->journalLines()
                    ->whereHas('journal', fn ($q) => $q->whereDate('entry_date', '<', $from))
                    ->where('type', 'debit')->sum('amount');
                $openingCredit = (float) $accountHead->journalLines()
                    ->whereHas('journal', fn ($q) => $q->whereDate('entry_date', '<', $from))
                    ->where('type', 'credit')->sum('amount');
                $openingBalance = (float) ($accountHead->opening_balance ?? 0) + $openingDebit - $openingCredit;
            } else {
                $openingBalance = (float) ($accountHead->opening_balance ?? 0);
            }

            $lines = JournalLine::with('journal')
                ->where('account_head_id', $accountHead->id)
                ->when($from, fn ($q) => $q->whereHas('journal', fn ($j) => $j->whereDate('entry_date', '>=', $from)))
                ->when($to,   fn ($q) => $q->whereHas('journal', fn ($j) => $j->whereDate('entry_date', '<=', $to)))
                ->get()
                ->sortBy(fn ($l) => $l->journal?->entry_date)
                ->values();

            $balance = $openingBalance;
            $transactions = $lines->map(function ($l) use (&$balance) {
                $debit  = $l->type === 'debit'  ? (float) $l->amount : 0.0;
                $credit = $l->type === 'credit' ? (float) $l->amount : 0.0;
                $balance += $debit - $credit;
                return [
                    'date'            => (string) $l->journal?->entry_date?->toDateString(),
                    'description'    => $l->journal?->narration ?? '',
                    'reference'      => $l->journal?->reference_type,
                    'debit'          => $debit,
                    'credit'         => $credit,
                    'running_balance'=> $balance,
                ];
            });
            $closingBalance = $balance;
        }

        return $this->render($request, 'Accounts/Reports/CashBankStatement', 'reports.pdf.cash-bank-statement', [
            'accountHead'    => $accountHead,
            'transactions'   => $transactions,
            'openingBalance' => $openingBalance,
            'closingBalance' => $closingBalance,
            'accountHeads'   => AccountHead::whereHas('group', fn ($q) => $q->where('type', 'asset'))
                ->where('is_active', true)->orderBy('code')->get(['id', 'code', 'name']),
            'filters'        => ['account_head_id' => $accountId, 'from' => $from, 'to' => $to],
        ], $accountHead ? "Cash-Bank-{$accountHead->code}" : 'Cash-Bank-Statement');
    }

    /** Project P&L */
    public function projectPL(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $projectId = $request->get('project_id');
        $project = null;
        $revenue = collect();
        $expenses = collect();
        $profit = 0;

        if ($projectId) {
            $project = Project::with(['invoices', 'purchaseOrders', 'expenses.accountHead', 'expenses.category'])
                ->find($projectId);

            if ($project) {
                $revenue = $project->invoices->map(fn ($i) => [
                    'description' => "Invoice {$i->code}",
                    'amount'      => (float) $i->grand_total,
                    'date'        => (string) $i->invoice_date?->toDateString(),
                ])->values();

                $poLines = $project->purchaseOrders
                    ->whereNotIn('status', ['cancelled'])
                    ->map(fn ($p) => [
                        'description' => "PO {$p->code}",
                        'amount'      => (float) $p->grand_total,
                        'date'        => (string) $p->order_date?->toDateString(),
                    ]);

                $expenseLines = $project->expenses->map(fn ($e) => [
                    'description' => $e->description ?: ($e->category?->name ?? $e->accountHead?->name ?? 'Expense'),
                    'amount'      => (float) $e->amount,
                    'date'        => (string) $e->expense_date?->toDateString(),
                ]);

                $expenses = $poLines->merge($expenseLines)->values();

                $totalRev = $revenue->sum('amount');
                $totalExp = $expenses->sum('amount');
                $profit = $totalRev - $totalExp;
            }
        }

        return $this->render($request, 'Accounts/Reports/ProjectPL', 'reports.pdf.project-pl', [
            'project'  => $project,
            'revenue'  => $revenue,
            'expenses' => $expenses,
            'profit'   => $profit,
            'projects' => Project::orderBy('name')->get(['id', 'name', 'code', 'contract_value']),
            'filters'  => ['project_id' => $projectId],
        ], $project ? "Project-PL-{$project->code}" : 'Project-PL');
    }

    /** Outstanding Receivables (unpaid invoices) */
    public function receivables(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $invoices = Invoice::with(['client', 'lead'])
            ->whereNotIn('status', ['paid', 'cancelled'])
            ->orderBy('due_date')
            ->get()
            ->map(function ($invoice) {
                $days = now()->startOfDay()->diffInDays($invoice->due_date, false);
                $invoice->overdue_days = $days < 0 ? abs($days) : 0;
                $invoice->aging_bucket = $this->agingBucket((int) $days);
                $invoice->balance_due  = (float) $invoice->grand_total - (float) $invoice->paid_amount;
                if ($days < 0 && $invoice->status !== 'overdue') {
                    $invoice->status = 'overdue';
                }
                return $invoice;
            })
            ->filter(fn ($i) => $i->balance_due > 0)
            ->values();

        $totalReceivable = (float) $invoices->sum('balance_due');

        return $this->render($request, 'Accounts/Reports/Receivables', 'reports.pdf.receivables', [
            'invoices'        => $invoices,
            'totalReceivable' => $totalReceivable,
        ], 'Receivables-' . now()->toDateString());
    }

    /** Outstanding Payables — grouped by PO so the report matches the UI */
    public function payables(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        // Build a per-PO payables list (outstanding = grand_total - allocated vendor_payments)
        $pos = \App\Models\PurchaseOrder::with('vendor')
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->orderBy('order_date')
            ->get();

        // Total payments per PO (via vendor_payments.po_id)
        $paidByPo = \App\Models\VendorPayment::selectRaw('po_id, SUM(amount) as total')
            ->whereNotNull('po_id')
            ->groupBy('po_id')
            ->pluck('total', 'po_id');

        $purchaseOrders = $pos->map(function ($po) use ($paidByPo) {
            $po->amount_paid  = (float) ($paidByPo[$po->id] ?? 0);
            $po->balance_due  = max(0, (float) $po->grand_total - $po->amount_paid);
            return $po;
        })
        ->filter(fn ($po) => $po->balance_due > 0)
        ->values();

        $totalPayable = (float) $purchaseOrders->sum('balance_due');

        return $this->render($request, 'Accounts/Reports/Payables', 'reports.pdf.payables', [
            'purchaseOrders' => $purchaseOrders,
            'totalPayable'   => $totalPayable,
        ], 'Payables-' . now()->toDateString());
    }

    public function export(Request $request, string $type)
    {
        return back()->with('error', 'Export coming soon.');
    }

    private function agingBucket(int $days): string
    {
        if ($days >= 0) return 'current';
        $overdue = abs($days);
        if ($overdue <= 30) return '1-30';
        if ($overdue <= 60) return '31-60';
        if ($overdue <= 90) return '61-90';
        return '90+';
    }

    /**
     * Render either an Inertia page OR a DomPDF download based on ?format=pdf.
     * Keeps each report method free of the branching boilerplate.
     */
    private function render(Request $request, string $inertiaView, string $pdfView, array $data, string $filename)
    {
        if ($request->get('format') === 'pdf') {
            $data += $this->companyData();
            $pdf = Pdf::loadView($pdfView, $data)->setPaper('a4');
            return $pdf->download("{$filename}.pdf");
        }

        return Inertia::render($inertiaView, $data);
    }

    private function companyData(): array
    {
        $logoPath = Setting::get('company_logo');
        $logoSrc = null;
        if ($logoPath) {
            $abs = storage_path('app/public/' . $logoPath);
            if (is_file($abs)) {
                $logoSrc = 'data:image/' . pathinfo($abs, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($abs));
            }
        }

        return [
            'companyName'    => Setting::get('company_name', 'Interior Villa'),
            'companyAddress' => Setting::get('company_address'),
            'companyEmail'   => Setting::get('company_email'),
            'companyPhone'   => Setting::get('company_phone'),
            'companyLogo'    => $logoSrc,
            'generatedAt'    => now()->format('d M Y, h:i A'),
        ];
    }
}
