<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Materials catalog
        Schema::create('materials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('category', ['material', 'labor', 'subcontractor', 'transport', 'overhead', 'contingency', 'other'])->default('material');
            $table->string('name', 200);
            $table->string('unit', 30)->default('ls');
            $table->decimal('default_rate', 15, 2)->default(0);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Many-to-many: material ↔ service type
        // A single service_type is identified by group + name (e.g. Residential / Apartment Interior Design)
        Schema::create('material_service_types', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('material_id')->constrained('materials')->cascadeOnDelete();
            $table->string('service_group', 50);
            $table->string('service_type', 150);
            $table->timestamps();
            $table->unique(['material_id', 'service_group', 'service_type'], 'mat_svc_unique');
            $table->index(['service_group', 'service_type']);
        });

        // Add service fields to cost_estimations
        Schema::table('cost_estimations', function (Blueprint $table) {
            $table->string('service_group', 50)->nullable()->after('title');
            $table->string('service_type', 150)->nullable()->after('service_group');
        });

        // Add material_id FK to cost_estimation_items
        Schema::table('cost_estimation_items', function (Blueprint $table) {
            $table->foreignUuid('material_id')->nullable()->after('cost_estimation_id')->constrained('materials')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('cost_estimation_items', function (Blueprint $table) {
            $table->dropForeign(['material_id']);
            $table->dropColumn('material_id');
        });
        Schema::table('cost_estimations', function (Blueprint $table) {
            $table->dropColumn(['service_group', 'service_type']);
        });
        Schema::dropIfExists('material_service_types');
        Schema::dropIfExists('materials');
    }
};
