<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->string('name', 150);
            $table->enum('type', ['supplier', 'subcontractor', 'both']);
            $table->string('category', 100)->nullable();
            $table->string('contact_person', 150)->nullable();
            $table->string('phone', 20);
            $table->string('email', 150)->nullable();
            $table->text('address')->nullable();
            $table->string('bank_name', 150)->nullable();
            $table->string('bank_account', 50)->nullable();
            $table->string('bank_routing', 20)->nullable();
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};
