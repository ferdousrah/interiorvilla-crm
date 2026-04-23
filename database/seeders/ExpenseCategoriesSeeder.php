<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            ['Rent',             'rent'],
            ['Salaries',         'salaries'],
            ['Utilities',        'utilities'],
            ['Transport',        'transport'],
            ['Marketing',        'marketing'],
            ['Office Supplies',  'office-supplies'],
            ['Maintenance',      'maintenance'],
            ['Entertainment',    'entertainment'],
            ['Other',            'other'],
        ];

        foreach ($defaults as $i => [$name, $slug]) {
            ExpenseCategory::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'is_active' => true, 'sort_order' => $i],
            );
        }
    }
}
