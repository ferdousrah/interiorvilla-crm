<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('service_group', 50)->nullable()->after('project_type');
            $table->string('service_type', 150)->nullable()->after('service_group');
        });

        Schema::table('client_receipts', function (Blueprint $table) {
            $table->string('income_source', 50)->nullable()->after('amount');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['service_group', 'service_type']);
        });
        Schema::table('client_receipts', function (Blueprint $table) {
            $table->dropColumn('income_source');
        });
    }
};
