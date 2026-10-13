<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Money moved between the company's own cash, bank and wallet accounts. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fund_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->foreignUuid('from_account_id')->constrained('account_heads');
            $table->foreignUuid('to_account_id')->constrained('account_heads');
            $table->decimal('amount', 15, 2);
            $table->date('transfer_date');
            $table->string('reference', 150)->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fund_transfers');
    }
};
