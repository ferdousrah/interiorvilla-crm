<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds revision tracking to quotations.
 *
 * - revision_no:        1 for original, 2+ for each subsequent revision
 * - parent_quotation_id: points back to the original (revision 1)
 * - status: adds 'superseded' for old revisions that have been replaced
 *
 * The unique constraint on `code` is replaced by a composite unique on
 * (code, revision_no) so all revisions of a quotation share the same code
 * (e.g. Q-2026-001 stays Q-2026-001 across revisions; only the suffix differs).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->integer('revision_no')->default(1)->after('code');
            $table->foreignUuid('parent_quotation_id')->nullable()->after('revision_no')
                  ->constrained('quotations')->nullOnDelete();

            $table->dropUnique('quotations_code_unique');
            $table->unique(['code', 'revision_no'], 'quotations_code_revision_unique');
        });

        // Add 'superseded' to status enum (MySQL only — SQLite stores as plain string)
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE quotations MODIFY COLUMN status ENUM(
                'draft','sent','under_review','approved','rejected','expired','converted','superseded'
            ) NOT NULL DEFAULT 'draft'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            // Revert any superseded rows so the enum change can succeed
            DB::table('quotations')->where('status', 'superseded')->update(['status' => 'sent']);
            DB::statement("ALTER TABLE quotations MODIFY COLUMN status ENUM(
                'draft','sent','under_review','approved','rejected','expired','converted'
            ) NOT NULL DEFAULT 'draft'");
        }

        Schema::table('quotations', function (Blueprint $table) {
            $table->dropUnique('quotations_code_revision_unique');
            $table->dropConstrainedForeignId('parent_quotation_id');
            $table->dropColumn('revision_no');
            $table->unique('code', 'quotations_code_unique');
        });
    }
};
