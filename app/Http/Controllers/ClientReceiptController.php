<?php

namespace App\Http\Controllers;

use App\Models\AccountHead;
use App\Models\Client;
use App\Models\ClientReceipt;
use App\Models\Invoice;
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
            ->orderByDesc('receipt_date')
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

    public function edit(ClientReceipt $receipt): Response
    {
        abort(403, 'Receipts cannot be edited.');
    }

    public function update(Request $request, ClientReceipt $receipt): RedirectResponse
    {
        abort(403, 'Receipts cannot be edited.');
    }

    public function destroy(ClientReceipt $receipt): RedirectResponse
    {
        abort(403, 'Receipts cannot be deleted.');
    }
}
