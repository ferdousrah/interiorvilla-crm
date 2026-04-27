<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Distinguish individual vs corporate leads, mirroring the Client model.
 *
 * - type:         'individual' (default) or 'corporate'
 * - company_name: shown above the contact's name on quotations when set
 *
 * The contact person stays in `name`. For corporate leads, `name` becomes the
 * Attn: line beneath `company_name`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->enum('type', ['individual', 'corporate'])->default('individual')->after('name');
            $table->string('company_name', 150)->nullable()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['type', 'company_name']);
        });
    }
};
