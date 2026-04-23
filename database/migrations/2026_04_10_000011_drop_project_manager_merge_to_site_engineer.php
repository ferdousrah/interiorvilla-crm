<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Backfill: copy project_manager_id into site_engineer_id for any project
        // where site_engineer_id is still NULL. Same person in this business.
        DB::statement('UPDATE projects SET site_engineer_id = project_manager_id
                       WHERE site_engineer_id IS NULL AND project_manager_id IS NOT NULL');

        Schema::table('projects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('project_manager_id');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->foreignUuid('project_manager_id')->nullable()->after('budget_limit')
                ->constrained('users')->nullOnDelete();
        });
    }
};
