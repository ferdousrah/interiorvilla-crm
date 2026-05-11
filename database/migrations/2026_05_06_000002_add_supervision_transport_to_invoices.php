<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('transportation_amount', 15, 2)->default(0)->after('vat_amount');
            $table->decimal('supervision_pct', 5, 2)->default(0)->after('transportation_amount');
            $table->decimal('supervision_amount', 15, 2)->default(0)->after('supervision_pct');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['transportation_amount', 'supervision_pct', 'supervision_amount']);
        });
    }
};
