<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_cost_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained('projects')->cascadeOnDelete();
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
        Schema::dropIfExists('project_cost_items');
    }
};
