<?php

namespace App\Services;

use App\Models\AccountHead;
use App\Models\ClientReceipt;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\PurchaseOrder;
use App\Models\VendorPayment;
use Illuminate\Support\Facades\DB;

class AccountingService
{
    public function postInvoiceCreated(Invoice $invoice): void
    {
        $ar = AccountHead::where('code', '1100')->firstOrFail();
        $revenue = AccountHead::where('code', '4001')->firstOrFail();

        $this->createJournalEntry(
            'invoice',
            $invoice->id,
            "Invoice {$invoice->code} - " . ($invoice->client?->name ?? $invoice->lead?->name ?? 'Walk-in'),
            $invoice->invoice_date,
            $invoice->created_by,
            [
                ['account_head_id' => $ar->id, 'type' => 'debit', 'amount' => $invoice->grand_total],
                ['account_head_id' => $revenue->id, 'type' => 'credit', 'amount' => $invoice->grand_total],
            ]
        );
    }

    public function postClientReceiptRecorded(ClientReceipt $receipt): void
    {
        $ar = AccountHead::where('code', '1100')->firstOrFail();

        $this->createJournalEntry(
            'client_receipt',
            $receipt->id,
            "Receipt {$receipt->code} - " . ($receipt->client?->name ?? $receipt->lead?->name ?? 'Walk-in'),
            $receipt->receipt_date,
            $receipt->created_by,
            [
                ['account_head_id' => $receipt->account_head_id, 'type' => 'debit', 'amount' => $receipt->amount],
                ['account_head_id' => $ar->id, 'type' => 'credit', 'amount' => $receipt->amount],
            ]
        );
    }

    public function postPurchaseOrderApproved(PurchaseOrder $po): void
    {
        $materialPurchase = AccountHead::where('code', '5001')->firstOrFail();
        $ap = AccountHead::where('code', '2100')->firstOrFail();

        $this->createJournalEntry(
            'po',
            $po->id,
            "Purchase Order {$po->code} - {$po->vendor->name}",
            $po->order_date,
            $po->created_by,
            [
                ['account_head_id' => $materialPurchase->id, 'type' => 'debit', 'amount' => $po->grand_total],
                ['account_head_id' => $ap->id, 'type' => 'credit', 'amount' => $po->grand_total],
            ]
        );
    }

    public function postVendorPaymentMade(VendorPayment $payment): void
    {
        $ap = AccountHead::where('code', '2100')->firstOrFail();

        $this->createJournalEntry(
            'vendor_payment',
            $payment->id,
            "Payment {$payment->code} - {$payment->vendor->name}",
            $payment->payment_date,
            $payment->created_by,
            [
                ['account_head_id' => $ap->id, 'type' => 'debit', 'amount' => $payment->amount],
                ['account_head_id' => $payment->account_head_id, 'type' => 'credit', 'amount' => $payment->amount],
            ]
        );
    }

    public function postExpenseRecorded(Expense $expense): void
    {
        $this->createJournalEntry(
            'expense',
            $expense->id,
            "Expense {$expense->code} - {$expense->description}",
            $expense->expense_date,
            $expense->created_by,
            [
                ['account_head_id' => $expense->account_head_id, 'type' => 'debit', 'amount' => $expense->amount],
                ['account_head_id' => $expense->paid_from, 'type' => 'credit', 'amount' => $expense->amount],
            ]
        );
    }

    private function createJournalEntry(
        string $referenceType,
        string $referenceId,
        string $description,
        $entryDate,
        string $createdBy,
        array $lines
    ): JournalEntry {
        return DB::transaction(function () use ($referenceType, $referenceId, $description, $entryDate, $createdBy, $lines) {
            $codeService = app(CodeGeneratorService::class);
            $code = $codeService->generate('JE', 'journal_entries');

            $entry = JournalEntry::create([
                'code' => $code,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'description' => $description,
                'entry_date' => $entryDate,
                'created_by' => $createdBy,
                'created_at' => now(),
            ]);

            foreach ($lines as $line) {
                JournalLine::create(array_merge($line, [
                    'journal_id' => $entry->id,
                    'created_at' => now(),
                ]));
            }

            return $entry;
        });
    }
}
