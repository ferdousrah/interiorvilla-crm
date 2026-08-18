<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Standalone portfolio entries for the company profile PDF.
 * Deliberately independent from the projects module — content is
 * curated by hand in Settings → Company Profile.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('portfolio_projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title', 150);
            $table->string('type', 50)->default('residential');
            $table->string('location', 150)->nullable();
            $table->decimal('area_sqft', 12, 2)->nullable();
            $table->string('year', 10)->nullable();
            $table->text('description')->nullable();
            $table->json('photos')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_featured', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portfolio_projects');
    }
};
