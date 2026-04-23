<?php

namespace Database\Seeders;

use App\Models\ItemCategory;
use Illuminate\Database\Seeder;

class InventoryCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'Furniture', 'Fabric', 'Lighting', 'Flooring',
            'Hardware', 'Paint', 'Tools', 'Electrical', 'Other',
        ];

        foreach ($defaults as $i => $name) {
            ItemCategory::firstOrCreate(
                ['name' => $name],
                ['is_active' => true, 'sort_order' => $i],
            );
        }
    }
}
