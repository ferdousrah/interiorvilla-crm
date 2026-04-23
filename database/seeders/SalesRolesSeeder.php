<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class SalesRolesSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure new permission exists
        Permission::firstOrCreate(['name' => 'assign.leads', 'guard_name' => 'web']);

        // ── Sales Admin: full lead management + assign + view clients ──
        $salesAdmin = Role::firstOrCreate(['name' => 'sales_admin', 'guard_name' => 'web']);
        $salesAdmin->syncPermissions([
            'view.leads', 'create.leads', 'edit.leads', 'delete.leads', 'assign.leads',
            'view.clients', 'create.clients', 'edit.clients',
            'view.projects',
        ]);

        // ── Sales Executive: view/edit ONLY own assigned leads (scoped in Policy) ──
        $salesExec = Role::firstOrCreate(['name' => 'sales_executive', 'guard_name' => 'web']);
        $salesExec->syncPermissions([
            'view.leads', 'create.leads', 'edit.leads',
            'view.clients',
        ]);

        $this->command->info('✓ sales_admin and sales_executive roles created');
        $this->command->info('  sales_admin: full leads access + assign to executives');
        $this->command->info('  sales_executive: only sees leads assigned to them (scoped)');
    }
}
