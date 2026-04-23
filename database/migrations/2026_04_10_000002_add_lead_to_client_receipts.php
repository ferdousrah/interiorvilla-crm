<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_receipts', function (Blueprint $table) {
            $table->foreignUuid('client_id')->nullable()->change();
            $table->foreignUuid('lead_id')->nullable()->after('client_id')
                ->constrained('leads')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('client_receipts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lead_id');
            $table->foreignUuid('client_id')->nullable(false)->change();
        });
    }
};
