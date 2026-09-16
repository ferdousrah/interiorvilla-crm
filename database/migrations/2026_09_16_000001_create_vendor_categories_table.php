<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Manageable vendor categories (previously a hardcoded list in the
 * vendor forms). Seeds the former static values so existing vendors'
 * category strings keep matching.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100)->unique();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        $defaults = ['furniture', 'fabric', 'lighting', 'flooring', 'paint', 'hardware', 'electrical', 'plumbing', 'contractor', 'other'];
        foreach ($defaults as $i => $name) {
            DB::table('vendor_categories')->insert([
                'id'         => (string) Str::uuid(),
                'name'       => $name,
                'sort_order' => $i,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_categories');
    }
};
