<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Make client_id nullable so invoices can be raised against a Lead
            // that hasn't been converted to a client yet (e.g. visit charge,
            // 3D-only service billed against a prospect).
            $table->foreignUuid('client_id')->nullable()->change();

            // Link an invoice to a Lead (lightweight, pre-project paid services)
            $table->foreignUuid('lead_id')->nullable()->after('client_id')
                ->constrained('leads')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lead_id');
            $table->foreignUuid('client_id')->nullable(false)->change();
        });
    }
};
