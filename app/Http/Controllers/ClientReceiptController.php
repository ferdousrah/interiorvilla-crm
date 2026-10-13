<?php

namespace App\Http\Controllers;

use App\Models\AccountHead;
use App\Models\Client;
use App\Models\ClientReceipt;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Services\AccountingService;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ClientReceiptController extends Controller
{
    public function __construct(
        private CodeGeneratorService $codeGenerator,
        private AccountingService $accounting
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Invoice::class);

        $receipts = ClientReceipt::with(['client', 'invoice.client', 'accountHead'])
            ->when($request->search, fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('code', 'like', "%{$s}%")
                ->orWhere('reference', 'like', "%{$s}%")
                ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$s}%"))
                ->orWhereHas('invoice', fn ($i) => $i->where('code', 'like', "%{$s}%")
                    ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$s}%")))))
            ->when($request->payment_method, fn ($q, $m) => $q->where('payment_method', $m))
            ->when($request->account_head_id, fn ($q, $a) => $q->where('account_head_id', $a))
            ->when($request->from, fn ($q, $d) => $q->whereDate('receipt_date', '>=', $d))
            ->when($request->to, fn ($q, $d) => $q->whereDate('receipt_date', '<=', $d))
            ->orderByDesc('receipt_date')->orderByDesc('created_at')
            ->paginate(25)->withQueryString();

        // Open invoices (balance > 0) — for the inline receipt form dropdown
        $openInvoices = Invoice::with('client:id,name')
            ->whereNotIn('status', ['paid', 'cancelled'])
            ->select('id', 'code', 'client_id', 'grand_total', 'paid_amount', 'income_source')
            ->orderByDesc('invoice_date')
            ->get()
            ->map(fn($inv) => [
                'id'            => $inv->id,
                'code'          => $inv->code,
                'client_id'     => $inv->client_id,
                'client'        => $inv->client ? ['id' => $inv->client->id, 'name' => $inv->client->name] : null,
                'grand_total'   => (float) $inv->grand_total,
                'paid_amount'   => (float) $inv->paid_amount,
                'balance_due'   => (float) $inv->grand_total - (float) $inv->paid_amount,
                'income_source' => $inv->income_source,
            ])
            ->filter(fn($inv) => $inv['balance_due'] > 0)
            ->values();

        // Asset account heads suitable as deposit destinations (10xx range)
        $depositAccounts = AccountHead::whereHas('group', fn($q) => $q->where('type', 'asset'))
            ->where('is_active', true)
            ->where('code', 'like', '10%')
            ->orderBy('code')
            ->get(['id', 'code', 'name']);

        return Inertia::render('Accounts/Receipts/Index', [
            'receipts'        => $receipts,
            'filters'         => $request->only(['search', 'payment_method', 'account_head_id', 'from', 'to']),
            'invoices'        => $openInvoices,
            'depositAccounts' => $depositAccounts,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Invoice::class);

        return Inertia::render('Accounts/Receipts/Create', [
            'clients' => Client::where('is_active', true)->select('id', 'name', 'code')->get(),
            'accountHeads' => AccountHead::whereHas('group', fn($q) => $q->where('type', 'asset'))
                ->where('is_active', true)->select('id', 'name', 'code')->get(),
            'incomeSources' => config('services_catalog.income_sources'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Invoice::class);

        $validated = $request->validate([
            'client_id' => 'nullable|uuid|exists:clients,id',
            'lead_id' => 'nullable|uuid|exists:leads,id',
            'invoice_id' => 'nullable|uuid|exists:invoices,id',
            'project_id' => 'nullable|uuid|exists:projects,id',
            'amount' => 'required|numeric|min:0.01',
            'income_source' => 'nullable|string|max:50',
            'receipt_date' => 'required|date',
            'payment_method' => 'required|in:cash,bank_transfer,cheque,bkash,nagad,rocket,other',
            'reference' => 'nullable|string|max:150',
            'account_head_id' => 'required|uuid|exists:account_heads,id',
            'notes' => 'nullable|string',
        ]);

        if (empty($validated['client_id']) && empty($validated['lead_id'])) {
            return back()->withErrors(['client_id' => 'Receipt must be tied to a client or a lead.'])->withInput();
        }

        $receipt = DB::transaction(function () use ($validated) {
            // Auto-inherit income_source from the linked invoice when the user
            // doesn't pick one — keeps revenue-by-source reports clean without
            // asking for it again at receipt time.
            if (empty($validated['income_source']) && !empty($validated['invoice_id'])) {
                $validated['income_source'] = Invoice::where('id', $validated['invoice_id'])->value('income_source');
            }

            $code = $this->codeGenerator->generate('RCP', 'client_receipts');
            $receipt = ClientReceipt::create(array_merge($validated, [
                'code' => $code,
                'created_by' => auth()->id(),
            ]));

            // Update invoice paid amount
            if ($receipt->invoice_id) {
                $invoice = Invoice::find($receipt->invoice_id);
                $invoice->increment('paid_amount', $receipt->amount);
                $invoice->refresh();

                $status = $invoice->paid_amount >= $invoice->grand_total ? 'paid' : 'partially_paid';
                $invoice->update(['status' => $status]);
            }

            return $receipt;
        });

        $this->accounting->postClientReceiptRecorded($receipt->fresh(['client']));

        // If recorded from an invoice page, send the user back there so they
        // can immediately see the updated balance / status.
        if ($receipt->invoice_id) {
            return redirect()->route('accounts.invoices.show', $receipt->invoice_id)
                ->with('success', "Payment of {$receipt->amount} recorded.");
        }

        return redirect()->route('accounts.receipts.index')->with('success', 'Receipt recorded.');
    }

    public function show(ClientReceipt $receipt): Response
    {
        $this->authorize('viewAny', Invoice::class);
        $receipt->load(['client', 'invoice', 'accountHead', 'project', 'createdBy']);
        return Inertia::render('Accounts/Receipts/Show', ['receipt' => $receipt]);
    }

    /** Receipts are edited in a modal on the list page. */
    public function edit(ClientReceipt $receipt): RedirectResponse
    {
        return redirect()->route('accounts.receipts.index');
    }

    /**
     * Correct a receipt. The linked invoice's paid amount and status follow
     * the new amount, and the ledger entry is re-posted.
     */
    public function update(Request $request, ClientReceipt $receipt): RedirectResponse
    {
        $this->authorize('create', Invoice::class);

        $validated = $request->validate([
            'amount'          => 'required|numeric|min:0.01',
            'receipt_date'    => 'required|date',
            'payment_method'  => 'required|in:cash,bank_transfer,cheque,bkash,nagad,rocket,other',
            'reference'       => 'nullable|string|max:150',
            'account_head_id' => 'required|uuid|exists:account_heads,id',
            'notes'           => 'nullable|string',
        ]);

        $invoice   = $receipt->invoice_id ? Invoice::find($receipt->invoice_id) : null;
        $oldAmount = (float) $receipt->amount;
        $newAmount = round((float) $validated['amount'], 2);

        if ($invoice) {
            $maxAllowed = round((float) $invoice->grand_total - ((float) $invoice->paid_amount - $oldAmount), 2);
            if ($newAmount > $maxAllowed) {
                return back()->withErrors([
                    'amount' => 'Amount cannot exceed ' . number_format($maxAllowed, 2) . " — the balance of invoice {$invoice->code}.",
                ]);
            }
        }

        DB::transaction(function () use ($receipt, $validated, $invoice, $oldAmount, $newAmount) {
            $receipt->update($validated);

            if ($invoice) {
                $this->adjustInvoicePaid($invoice, $newAmount - $oldAmount);
            }

            JournalEntry::where('reference_type', 'client_receipt')
                ->where('reference_id', $receipt->id)
                ->delete(); // cascades to journal_lines
        });

        $this->accounting->postClientReceiptRecorded($receipt->fresh(['client', 'lead']));

        return back()->with('success', "Receipt {$receipt->code} updated.");
    }

    /** Delete a receipt and reverse it: invoice paid amount/status and the ledger entry. */
    public function destroy(ClientReceipt $receipt): RedirectResponse
    {
        abort_unless(auth()->user()->hasRole('admin'), 403, 'Only an admin can delete receipts.');

        DB::transaction(function () use ($receipt) {
            JournalEntry::where('reference_type', 'client_receipt')
                ->where('reference_id', $receipt->id)
                ->delete();

            $invoice = $receipt->invoice_id ? Invoice::find($receipt->invoice_id) : null;
            $amount  = (float) $receipt->amount;

            $receipt->delete();

            if ($invoice) {
                $this->adjustInvoicePaid($invoice, -$amount);
            }
        });

        return back()->with('success', "Receipt {$receipt->code} deleted and reversed.");
    }

    /** Shift an invoice's paid amount by $delta and re-derive its status from what is now paid. */
    private function adjustInvoicePaid(Invoice $invoice, float $delta): void
    {
        $paid = max(round((float) $invoice->paid_amount + $delta, 2), 0);

        $attrs = ['paid_amount' => $paid];
        if ($invoice->status !== 'cancelled') {
            $attrs['status'] = $paid >= (float) $invoice->grand_total
                ? 'paid'
                : ($paid > 0 ? 'partially_paid' : 'sent');
        }

        $invoice->update($attrs);
    }
}
