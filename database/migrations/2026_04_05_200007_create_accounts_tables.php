<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->enum('type', ['asset', 'liability', 'equity', 'income', 'expense']);
            $table->timestamps();
        });

        Schema::create('account_heads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->string('name', 150);
            $table->foreignUuid('group_id')->constrained('account_groups');
            $table->foreignUuid('parent_id')->nullable()->constrained('account_heads')->nullOnDelete();
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->foreignUuid('client_id')->constrained('clients');
            $table->foreignUuid('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->enum('status', ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'])->default('draft');
            $table->date('invoice_date');
            $table->date('due_date');
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('vat_pct', 5, 2)->default(0);
            $table->decimal('vat_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->text('terms')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('invoice_line_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->string('description', 250);
            $table->decimal('quantity', 10, 2)->default(1);
            $table->decimal('unit_rate', 10, 2);
            $table->decimal('total', 15, 2);
            $table->integer('sequence')->default(0);
            $table->timestamps();
        });

        Schema::create('client_receipts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->foreignUuid('client_id')->constrained('clients');
            $table->foreignUuid('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignUuid('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->decimal('amount', 15, 2);
            $table->date('receipt_date');
            $table->enum('payment_method', ['cash', 'bank_transfer', 'cheque', 'bkash', 'nagad', 'rocket', 'other']);
            $table->string('reference', 150)->nullable();
            $table->foreignUuid('account_head_id')->constrained('account_heads');
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('vendor_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->foreignUuid('vendor_id')->constrained('vendors');
            $table->foreignUuid('po_id')->nullable()->constrained('purchase_orders')->nullOnDelete();
            $table->decimal('amount', 15, 2);
            $table->date('payment_date');
            $table->enum('payment_method', ['cash', 'bank_transfer', 'cheque', 'bkash', 'nagad', 'rocket', 'other']);
            $table->string('reference', 150)->nullable();
            $table->foreignUuid('account_head_id')->constrained('account_heads');
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->foreignUuid('account_head_id')->constrained('account_heads');
            $table->foreignUuid('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->decimal('amount', 15, 2);
            $table->date('expense_date');
            $table->foreignUuid('paid_from')->constrained('account_heads');
            $table->string('description', 250);
            $table->string('reference', 150)->nullable();
            $table->string('receipt_path')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('journal_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->string('reference_type', 50);
            $table->uuid('reference_id');
            $table->string('description', 250);
            $table->date('entry_date');
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamp('created_at')->nullable();

            $table->index(['reference_type', 'reference_id']);
        });

        Schema::create('journal_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('journal_id')->constrained('journal_entries')->cascadeOnDelete();
            $table->foreignUuid('account_head_id')->constrained('account_heads');
            $table->enum('type', ['debit', 'credit']);
            $table->decimal('amount', 15, 2);
            $table->string('description', 250)->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_lines');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('vendor_payments');
        Schema::dropIfExists('client_receipts');
        Schema::dropIfExists('invoice_line_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('account_heads');
        Schema::dropIfExists('account_groups');
    }
};
