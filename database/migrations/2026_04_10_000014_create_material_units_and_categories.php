<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 30)->unique();       // sft, pcs, bag…
            $table->string('name', 80)->nullable();     // Square Feet, Pieces…
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('material_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 50)->unique();       // material, labor…
            $table->string('name', 80);                 // Materials, Labor…
            $table->string('icon', 10)->nullable();     // 🧱
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed defaults so existing Materials keep working
        $now = now();

        $units = [
            ['sft',  'Square Feet'],
            ['rft',  'Running Feet'],
            ['sqm',  'Square Metre'],
            ['mtr',  'Metre'],
            ['rmt',  'Running Metre'],
            ['pcs',  'Pieces'],
            ['nos',  'Number'],
            ['set',  'Set'],
            ['kg',   'Kilogram'],
            ['bag',  'Bag'],
            ['box',  'Box'],
            ['ltr',  'Litre'],
            ['day',  'Day'],
            ['hr',   'Hour'],
            ['trip', 'Trip'],
            ['ls',   'Lump Sum'],
        ];
        foreach ($units as $i => [$code, $name]) {
            DB::table('material_units')->insert([
                'id'         => \Illuminate\Support\Str::uuid(),
                'code'       => $code,
                'name'       => $name,
                'sort_order' => $i,
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $categories = [
            ['material',      'Materials',     '🧱'],
            ['labor',         'Labor',         '👷'],
            ['subcontractor', 'Subcontractor', '🏗️'],
            ['transport',     'Transport',     '🚛'],
            ['overhead',      'Overhead',      '🏢'],
            ['contingency',   'Contingency',   '🛡️'],
            ['other',         'Other',         '📦'],
        ];
        foreach ($categories as $i => [$slug, $name, $icon]) {
            DB::table('material_categories')->insert([
                'id'         => \Illuminate\Support\Str::uuid(),
                'slug'       => $slug,
                'name'       => $name,
                'icon'       => $icon,
                'sort_order' => $i,
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('material_units');
        Schema::dropIfExists('material_categories');
    }
};
