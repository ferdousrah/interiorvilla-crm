<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1) Long descriptions on line items (was string 250)
        Schema::table('quotation_items', function (Blueprint $table) {
            $table->text('description')->change();
        });

        // 2) Additional quotation-level charges
        Schema::table('quotations', function (Blueprint $table) {
            $table->date('document_date')->nullable()->after('valid_until');
            $table->string('service_group', 50)->nullable()->after('subject');
            $table->string('service_type', 100)->nullable()->after('service_group');
            $table->decimal('transportation_amount', 15, 2)->default(0)->after('vat_amount');
            $table->decimal('supervision_pct', 5, 2)->default(0)->after('transportation_amount');
            $table->decimal('supervision_amount', 15, 2)->default(0)->after('supervision_pct');
        });

        // Backfill document_date from created_at so old records render cleanly
        DB::statement('UPDATE quotations SET document_date = DATE(created_at) WHERE document_date IS NULL');
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn([
                'document_date', 'service_group', 'service_type',
                'transportation_amount', 'supervision_pct', 'supervision_amount',
            ]);
        });

        Schema::table('quotation_items', function (Blueprint $table) {
            $table->string('description', 250)->change();
        });
    }
};
