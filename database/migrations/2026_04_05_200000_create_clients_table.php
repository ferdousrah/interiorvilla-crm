<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->enum('type', ['individual', 'corporate'])->default('individual');
            $table->string('name', 150);
            $table->string('company_name', 150)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('phone', 20);
            $table->string('secondary_phone', 20)->nullable();
            $table->text('address')->nullable();
            $table->string('area', 100)->nullable();
            $table->string('city', 100)->default('Dhaka');
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('client_contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('client_id')->constrained('clients')->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('designation', 100)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('phone', 20);
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_contacts');
        Schema::dropIfExists('clients');
    }
};
