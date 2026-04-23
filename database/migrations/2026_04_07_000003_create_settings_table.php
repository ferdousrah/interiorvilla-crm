<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key', 100)->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Seed defaults
        $defaults = [
            'app_name'      => 'Interior Villa',
            'company_name'  => 'Interior Villa BD',
            'company_email' => 'info@interiorvilla.com',
            'company_phone' => '+880 1XXX-XXXXXX',
            'company_phone2'=> '',
            'company_address'=> 'Dhaka, Bangladesh',
            'company_logo'  => '',
            'currency_symbol'=> '৳',
            'tax_label'     => 'VAT',
            'default_tax_pct'=> '0',
        ];

        foreach ($defaults as $key => $value) {
            DB::table('settings')->insert([
                'key' => $key, 'value' => $value,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
