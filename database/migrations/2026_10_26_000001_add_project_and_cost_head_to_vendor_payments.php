<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Vendor payments that are not against a purchase (a carpenter paid for
 * work, a painter, a mistri) are a direct cost: they carry the project
 * they were for and the expense head they are booked to.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_payments', function (Blueprint $table) {
            $table->foreignUuid('project_id')->nullable()->after('po_id')
                ->constrained('projects')->nullOnDelete();
            $table->foreignUuid('cost_head_id')->nullable()->after('project_id')
                ->constrained('account_heads')->nullOnDelete();
        });

        // Payments already made against a purchase belong to that purchase's project.
        DB::table('vendor_payments')
            ->whereNotNull('po_id')
            ->update(['project_id' => DB::raw('(SELECT project_id FROM purchase_orders WHERE purchase_orders.id = vendor_payments.po_id)')]);
    }

    public function down(): void
    {
        Schema::table('vendor_payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cost_head_id');
            $table->dropConstrainedForeignId('project_id');
        });
    }
};
