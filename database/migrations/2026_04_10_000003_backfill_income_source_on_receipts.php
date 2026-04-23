<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Pre-existing receipts were all project-driven. Default them to
        // 'Project' so revenue-by-source reports don't show a huge unclassified
        // bucket. New receipts (visit/3D/etc.) explicitly set their own source.
        DB::table('client_receipts')
            ->whereNull('income_source')
            ->update(['income_source' => 'Project']);
    }

    public function down(): void
    {
        // No-op: we can't distinguish backfilled rows from legitimate 'Project' ones.
    }
};
