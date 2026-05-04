<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lets the salesperson write a custom "Bill To" block on a quotation
 * (overrides the auto-generated company / attn / address rendering).
 *
 * If left blank, the existing client/lead-based rendering is used.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->text('bill_to')->nullable()->after('subject');
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn('bill_to');
        });
    }
};
