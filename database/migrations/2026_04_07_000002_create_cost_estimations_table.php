<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the old project-scoped table
        Schema::dropIfExists('project_cost_items');

        Schema::create('cost_estimations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->string('title', 250);
            $table->foreignUuid('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->foreignUuid('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignUuid('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->enum('status', ['draft', 'final'])->default('draft');
            $table->decimal('total_estimated', 15, 2)->default(0);
            $table->decimal('total_actual', 15, 2)->default(0);
            $table->decimal('markup_pct', 5, 2)->default(20);
            $table->decimal('markup_amount', 15, 2)->default(0);
            $table->decimal('suggested_quote', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('cost_estimation_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cost_estimation_id')->constrained('cost_estimations')->cascadeOnDelete();
            $table->enum('category', [
                'material', 'labor', 'subcontractor', 'transport',
                'overhead', 'contingency', 'other',
            ])->default('material');
            $table->string('description', 250);
            $table->string('unit', 30)->default('ls');
            $table->decimal('quantity', 10, 2)->default(1);
            $table->decimal('estimated_rate', 15, 2)->default(0);
            $table->decimal('estimated_total', 15, 2)->default(0);
            $table->decimal('actual_total', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->integer('sequence')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cost_estimation_items');
        Schema::dropIfExists('cost_estimations');
    }
};
