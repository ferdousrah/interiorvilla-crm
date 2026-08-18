<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Notable clients shown on the company profile PDF's "Our Clients" page.
 * Standalone content, managed in Settings > Company Profile.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_clients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->string('logo', 255)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_clients');
    }
};
