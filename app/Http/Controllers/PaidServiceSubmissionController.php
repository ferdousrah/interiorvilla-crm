<?php

namespace App\Http\Controllers;

use App\Models\ClientReceipt;
use App\Models\Client;
use App\Models\InAppNotification;
use App\Models\Invoice;
use App\Models\InvoiceLineItem;
use App\Models\PaidServiceSubmission;
use App\Services\AccountingService;
use App\Services\CodeGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PaidServiceSubmissionController extends Controller
{
    public function __construct(
        private CodeGeneratorService $codeGenerator,
        private AccountingService $accounting,
    ) {}

    /**
     * Anyone with `record.payments` (admin + accounts) can review the queue.
     */
    private function ensureApprover(): void
    {
        abort_unless(auth()->user()->can('record.payments'), 403, 'You do not have permission to review paid services.');
    }

    public function index(Request $request): Response
    {
        $this->ensureApprover();

        $status = $request->get('status', 'pending');

        $submissions = PaidServiceSubmission::with(['lead.client', 'accountHead', 'submittedBy', 'reviewedBy'])
            ->when(in_array($status, ['pending', 'approved', 'rejected']), fn($q) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        $counts = [
            'pending'  => PaidServiceSubmission::where('status', 'pending')->count(),
            'approved' => PaidServiceSubmission::where('status', 'approved')->count(),
            'rejected' => PaidServiceSubmission::where('status', 'rejected')->count(),
        ];

        return Inertia::render('Accounts/PaidServiceApprovals/Index', [
            'submissions' => $submissions,
            'counts'      => $counts,
            'filters'     => ['status' => $status],
        ]);
    }

    /**
     * Approve → create the Invoice + ClientReceipt and post GL entries.
     */
    public function approve(PaidServiceSubmission $submission): RedirectResponse
    {
        $this->ensureApprover();

        if (!$submission->isPending()) {
            return back()->with('error', 'Only pending submissions can be approved.');
        }

        $submission->load('lead');
        $lead = $submission->lead;

        // Auto-create a client from the lead if needed (paid services for a
        // lead that hasn't been converted yet still need a client for the invoice).
        $clientId = $lead->client_id;
        if (!$clientId) {
            $client = Client::create([
                'code'         => $this->codeGenerator->generate('CL', 'clients'),
                'type'         => $lead->type ?? 'individual',
                'name'         => $lead->name,
                'company_name' => $lead->company_name,
                'phone'        => $lead->phone,
                'email'        => $lead->email,
                'address'      => $lead->address,
                'created_by'   => auth()->id(),
            ]);
            $clientId = $client->id;
            $lead->update(['client_id' => $clientId]);
        }

        [$invoice, $receipt] = DB::transaction(function () use ($submission, $clientId, $lead) {
            $invoice = Invoice::create([
                'code'            => $this->codeGenerator->generate('INV', 'invoices'),
                'client_id'       => $clientId,
                'lead_id'         => $lead->id,
                'status'          => 'paid',
                'invoice_date'    => $submission->service_date,
                'due_date'        => $submission->service_date,
                'subtotal'        => $submission->amount,
                'vat_pct'         => 0,
                'vat_amount'      => 0,
                'discount_amount' => 0,
                'grand_total'     => $submission->amount,
                'income_source'   => $submission->income_source,
                'paid_amount'     => $submission->amount,
                'notes'           => $submission->notes,
                'created_by'      => $submission->submitted_by,
            ]);

            InvoiceLineItem::create([
                'invoice_id'  => $invoice->id,
                'description' => $submission->description,
                'quantity'    => 1,
                'unit_rate'   => $submission->amount,
                'total'       => $submission->amount,
                'sequence'    => 0,
            ]);

            $receipt = ClientReceipt::create([
                'code'            => $this->codeGenerator->generate('RCP', 'client_receipts'),
                'client_id'       => $clientId,
                'lead_id'         => $lead->id,
                'invoice_id'      => $invoice->id,
                'amount'          => $submission->amount,
                'income_source'   => $submission->income_source,
                'receipt_date'    => $submission->service_date,
                'payment_method'  => $submission->payment_method,
                'reference'       => $submission->reference,
                'account_head_id' => $submission->account_head_id,
                'notes'           => $submission->notes,
                'created_by'      => $submission->submitted_by,
            ]);

            $submission->update([
                'status'            => 'approved',
                'reviewed_by'       => auth()->id(),
                'reviewed_at'       => now(),
                'review_notes'      => null,
                'invoice_id'        => $invoice->id,
                'client_receipt_id' => $receipt->id,
            ]);

            return [$invoice, $receipt];
        });

        // Post GL entries outside the transaction
        $this->accounting->postInvoiceCreated($invoice->fresh(['client', 'lead']));
        $this->accounting->postClientReceiptRecorded($receipt->fresh(['client', 'lead']));

        $this->notifySubmitter($submission, 'approved');

        return back()->with('success', "Approved — {$invoice->code} / {$receipt->code} posted to ledger.");
    }

    public function reject(Request $request, PaidServiceSubmission $submission): RedirectResponse
    {
        $this->ensureApprover();

        if (!$submission->isPending()) {
            return back()->with('error', 'Only pending submissions can be rejected.');
        }

        $validated = $request->validate([
            'review_notes' => 'required|string|max:500',
        ]);

        $submission->update([
            'status'       => 'rejected',
            'reviewed_by'  => auth()->id(),
            'reviewed_at'  => now(),
            'review_notes' => $validated['review_notes'],
        ]);

        $this->notifySubmitter($submission, 'rejected', $validated['review_notes']);

        return back()->with('success', "Submission {$submission->code} rejected.");
    }

    private function notifySubmitter(PaidServiceSubmission $submission, string $outcome, ?string $reason = null): void
    {
        if (!$submission->submitted_by || $submission->submitted_by === auth()->id()) return;

        try {
            $title = $outcome === 'approved'
                ? "Paid service approved — {$submission->code}"
                : "Paid service rejected — {$submission->code}";
            $message = $outcome === 'approved'
                ? "Your submission of BDT " . number_format((float) $submission->amount, 2) . " has been approved and posted."
                : "Your submission was rejected. Reason: {$reason}";

            InAppNotification::send(
                userId:   $submission->submitted_by,
                type:     "paid_service.{$outcome}",
                title:    $title,
                message:  $message,
                link:     route('crm.leads.show', $submission->lead_id),
                icon:     $outcome === 'approved' ? '✅' : '❌',
                causedBy: auth()->id(),
            );
        } catch (\Throwable $e) {
            Log::warning('Paid service notify submitter failed', ['error' => $e->getMessage()]);
        }
    }
}
