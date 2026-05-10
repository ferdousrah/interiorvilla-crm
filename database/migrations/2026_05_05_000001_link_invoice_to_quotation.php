<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->uuid('quotation_id')->nullable()->after('project_id');
            $table->foreign('quotation_id')->references('id')->on('quotations')->nullOnDelete();
            $table->index('quotation_id');
        });

        Schema::table('invoice_line_items', function (Blueprint $table) {
            $table->string('unit', 30)->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['quotation_id']);
            $table->dropIndex(['quotation_id']);
            $table->dropColumn('quotation_id');
        });

        Schema::table('invoice_line_items', function (Blueprint $table) {
            $table->dropColumn('unit');
        });
    }
};
