<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotation_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->string('service_group', 50)->nullable();
            $table->string('service_type', 100)->nullable();
            $table->text('description')->nullable();
            $table->text('default_terms')->nullable();
            $table->decimal('default_supervision_pct', 5, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['service_group', 'service_type', 'is_active']);
        });

        Schema::create('quotation_template_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('template_id')->constrained('quotation_templates')->cascadeOnDelete();
            $table->string('name', 150);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('quotation_template_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('section_id')->constrained('quotation_template_sections')->cascadeOnDelete();
            $table->foreignUuid('material_id')->nullable()->constrained('materials')->nullOnDelete();
            $table->text('description');
            $table->string('unit', 30)->default('sft');
            $table->decimal('default_quantity', 10, 2)->nullable();
            $table->decimal('default_rate', 12, 2)->default(0);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_template_items');
        Schema::dropIfExists('quotation_template_sections');
        Schema::dropIfExists('quotation_templates');
    }
};
