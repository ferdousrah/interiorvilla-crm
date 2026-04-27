<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stores the material name as a separate field on the quotation line item.
 *
 * The PDF / public quotation view shows the material name as a bold title on
 * top of the description. We snapshot it (rather than join through material_id)
 * so the printed quotation stays stable even if the master material is later
 * renamed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotation_items', function (Blueprint $table) {
            $table->string('item_name', 200)->nullable()->after('category');
        });
    }

    public function down(): void
    {
        Schema::table('quotation_items', function (Blueprint $table) {
            $table->dropColumn('item_name');
        });
    }
};
