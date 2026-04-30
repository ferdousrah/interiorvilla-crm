<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Holds paid-service entries submitted from the lead page that are awaiting
 * accountant/admin approval. On approval, an Invoice + ClientReceipt + GL
 * entries are created and linked back here. On rejection, nothing is posted.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paid_service_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->foreignUuid('lead_id')->constrained('leads')->cascadeOnDelete();

            // Submission payload (what the sales user filled in)
            $table->string('description', 250);
            $table->decimal('amount', 15, 2);
            $table->date('service_date');
            $table->string('income_source', 50);
            $table->enum('payment_method', ['cash', 'bank_transfer', 'cheque', 'bkash', 'nagad', 'rocket', 'other']);
            $table->foreignUuid('account_head_id')->constrained('account_heads');
            $table->string('reference', 150)->nullable();
            $table->text('notes')->nullable();

            // Approval workflow
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignUuid('submitted_by')->constrained('users');
            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();

            // Posted records (set on approval)
            $table->foreignUuid('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignUuid('client_receipt_id')->nullable()->constrained('client_receipts')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paid_service_submissions');
    }
};
