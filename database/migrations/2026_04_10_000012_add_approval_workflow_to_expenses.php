<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->after('paid_from');
            $table->foreignUuid('submitted_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->foreignUuid('approved_by')->nullable()->after('submitted_by')->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->text('rejection_reason')->nullable()->after('approved_at');

            $table->index('status');
        });

        // All pre-existing expenses were direct accountant entries → mark approved.
        // Set submitted_by/approved_by/approved_at from created_by so the audit trail is complete.
        DB::statement('UPDATE expenses SET
            status = "approved",
            submitted_by = created_by,
            approved_by = created_by,
            approved_at = created_at
            WHERE status = "pending"');
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('submitted_by');
            $table->dropConstrainedForeignId('approved_by');
            $table->dropColumn(['status', 'approved_at', 'rejection_reason']);
        });
    }
};
