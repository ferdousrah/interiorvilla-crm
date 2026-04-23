<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('income_source', 50)->nullable()->after('grand_total');
        });

        // Backfill: any existing invoice attached to a project is a 'Project' income.
        // Lead-only (no project) fallback left NULL so the user can classify.
        DB::table('invoices')
            ->whereNull('income_source')
            ->whereNotNull('project_id')
            ->update(['income_source' => 'Project']);
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('income_source');
        });
    }
};
