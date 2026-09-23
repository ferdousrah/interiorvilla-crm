<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Direct purchases (no requisition / PO approval / GRN): a purchase is
 * recorded as already received, delivered either into a warehouse
 * (stock) or straight to a project site.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->string('delivery_type', 10)->nullable()->after('status'); // stock | site
            $table->foreignUuid('warehouse_id')->nullable()->after('delivery_type')
                ->constrained('warehouses')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('warehouse_id');
            $table->dropColumn('delivery_type');
        });
    }
};
