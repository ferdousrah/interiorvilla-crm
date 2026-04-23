<?php

namespace Database\Seeders;

use App\Models\Material;
use App\Models\MaterialServiceType;
use Illuminate\Database\Seeder;

class MaterialsSeeder extends Seeder
{
    public function run(): void
    {
        // Common residential + commercial interior materials
        $samples = [
            // MATERIALS
            ['cat' => 'material', 'name' => 'Plywood 18mm (Marine Grade)', 'unit' => 'sft',  'rate' => 160, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Plywood 12mm',                'unit' => 'sft',  'rate' => 130, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'MDF Board 18mm',              'unit' => 'sft',  'rate' => 110, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Veneer Sheet',                'unit' => 'sft',  'rate' => 220, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Laminate Sheet',              'unit' => 'sft',  'rate' => 85,  'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'PVC Board',                   'unit' => 'sft',  'rate' => 180, 'groups' => ['Commercial']],
            ['cat' => 'material', 'name' => 'Gypsum Board (False Ceiling)','unit' => 'sft',  'rate' => 75,  'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'POP (Plaster of Paris)',      'unit' => 'sft',  'rate' => 50,  'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Wall Paint (Premium)',        'unit' => 'sft',  'rate' => 35,  'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Wallpaper',                   'unit' => 'sft',  'rate' => 120, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Ceramic Tile (Floor)',        'unit' => 'sft',  'rate' => 95,  'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Vitrified Tile',              'unit' => 'sft',  'rate' => 140, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Marble',                      'unit' => 'sft',  'rate' => 380, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Engineered Wood Flooring',    'unit' => 'sft',  'rate' => 260, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Vinyl Flooring',              'unit' => 'sft',  'rate' => 90,  'groups' => ['Commercial']],
            ['cat' => 'material', 'name' => 'Door Handle (Premium)',       'unit' => 'pcs',  'rate' => 1200,'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Kitchen Hardware Set',        'unit' => 'set',  'rate' => 8500,'groups' => ['Residential']],
            ['cat' => 'material', 'name' => 'Modular Kitchen Cabinet',     'unit' => 'rft',  'rate' => 4500,'groups' => ['Residential']],
            ['cat' => 'material', 'name' => 'Wardrobe (Custom)',           'unit' => 'sft',  'rate' => 1800,'groups' => ['Residential']],
            ['cat' => 'material', 'name' => 'LED Panel Light',             'unit' => 'pcs',  'rate' => 850, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Chandelier',                  'unit' => 'pcs',  'rate' => 15000,'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Electrical Wiring (Per Point)','unit'=> 'nos', 'rate' => 350, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Switch Board (Premium)',      'unit' => 'pcs',  'rate' => 1800,'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Glass Partition',             'unit' => 'sft',  'rate' => 420, 'groups' => ['Commercial']],
            ['cat' => 'material', 'name' => 'Curtain & Blinds',            'unit' => 'sft',  'rate' => 180, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'material', 'name' => 'Upholstery Fabric',           'unit' => 'mtr',  'rate' => 450, 'groups' => ['Residential', 'Commercial']],

            // LABOR
            ['cat' => 'labor', 'name' => 'Carpenter (Skilled)',           'unit' => 'day',  'rate' => 1200, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'labor', 'name' => 'Carpenter (Helper)',            'unit' => 'day',  'rate' => 700,  'groups' => ['Residential', 'Commercial']],
            ['cat' => 'labor', 'name' => 'Painter',                       'unit' => 'day',  'rate' => 900,  'groups' => ['Residential', 'Commercial']],
            ['cat' => 'labor', 'name' => 'Electrician',                   'unit' => 'day',  'rate' => 1100, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'labor', 'name' => 'Plumber',                       'unit' => 'day',  'rate' => 1000, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'labor', 'name' => 'Mason / Tile Installer',        'unit' => 'day',  'rate' => 950,  'groups' => ['Residential', 'Commercial']],
            ['cat' => 'labor', 'name' => 'Installation Team (Project)',   'unit' => 'ls',   'rate' => 25000,'groups' => ['Residential', 'Commercial']],

            // SUBCONTRACTOR
            ['cat' => 'subcontractor', 'name' => 'False Ceiling Contractor','unit'=> 'sft',  'rate' => 120, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'subcontractor', 'name' => 'HVAC / AC Installation', 'unit'=> 'ls',   'rate' => 45000,'groups' => ['Commercial']],
            ['cat' => 'subcontractor', 'name' => 'Fire Safety System',     'unit'=> 'ls',   'rate' => 35000,'groups' => ['Commercial']],
            ['cat' => 'subcontractor', 'name' => '3D Rendering (Per View)','unit'=> 'nos',  'rate' => 3500, 'groups' => ['Residential', 'Commercial', 'Architectural']],

            // TRANSPORT
            ['cat' => 'transport', 'name' => 'Local Transport (Pickup)',   'unit'=> 'trip', 'rate' => 1500, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'transport', 'name' => 'Long Distance Transport',    'unit'=> 'trip', 'rate' => 5500, 'groups' => ['Residential', 'Commercial']],

            // OVERHEAD
            ['cat' => 'overhead', 'name' => 'Site Supervision',            'unit'=> 'day',  'rate' => 1500, 'groups' => ['Residential', 'Commercial']],
            ['cat' => 'overhead', 'name' => 'Design & Documentation',      'unit'=> 'ls',   'rate' => 15000,'groups' => ['Residential', 'Commercial', 'Architectural']],

            // CONTINGENCY
            ['cat' => 'contingency', 'name' => 'Buffer (5% of materials)', 'unit'=> 'ls',   'rate' => 5000, 'groups' => ['Residential', 'Commercial']],
        ];

        $categories = config('services_catalog.service_categories');
        $count = 0;

        foreach ($samples as $s) {
            $material = Material::create([
                'category'     => $s['cat'],
                'name'         => $s['name'],
                'unit'         => $s['unit'],
                'default_rate' => $s['rate'],
                'is_active'    => true,
            ]);

            foreach ($s['groups'] as $group) {
                if (!isset($categories[$group])) continue;
                // Link to ALL service types in the group
                foreach ($categories[$group] as $type) {
                    MaterialServiceType::create([
                        'material_id'  => $material->id,
                        'service_group'=> $group,
                        'service_type' => $type,
                    ]);
                }
            }
            $count++;
        }

        $this->command->info("✓ Seeded {$count} sample materials with service type links");
    }
}
