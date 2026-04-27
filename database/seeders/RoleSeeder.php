<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Canonical role list (5 roles):
 *
 *   admin           — whole access, approves requisitions/expenses/invoices
 *   accounts        — accounts + procurement + inventory (no CRM)
 *   sales_manager   — create + assign leads, build cost estimations + quotations
 *   sales_executive — only their assigned leads, build cost estimations + quotations
 *   site_engineer   — update project status, submit project expenses
 *
 * Old roles (super_admin, project_manager, procurement_officer, hr_manager,
 * sales, sales_admin, employee) are retired. Their users are migrated to the
 * closest new role before the old roles are deleted.
 */
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Make sure every permission this app needs exists --------------------
        $permissions = [
            // CRM
            'view.clients', 'create.clients', 'edit.clients', 'delete.clients',
            'view.leads', 'create.leads', 'edit.leads', 'delete.leads', 'assign.leads',

            // Sales docs
            'create.cost_estimations', 'create.quotations', 'manage.materials',

            // Projects + tasks
            'view.projects', 'create.projects', 'edit.projects', 'delete.projects',
            'manage.tasks',

            // Procurement + inventory
            'view.procurement', 'create.purchase_orders', 'approve.purchase_orders',
            'view.inventory', 'manage.inventory',

            // Accounts
            'view.accounts', 'create.invoices', 'record.payments', 'view.reports',
            'submit.expenses', 'approve.expenses',

            // HR
            'manage.employees', 'manage.leaves', 'manage.attendance',

            // Admin
            'manage.users', 'manage.roles',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // 2. Define the 5 canonical roles + their permissions --------------------
        $roleMatrix = [
            'admin' => $permissions, // everything

            'accounts' => [
                'view.clients', 'view.leads', 'view.projects',
                'view.procurement', 'create.purchase_orders', 'approve.purchase_orders',
                'view.inventory', 'manage.inventory',
                'view.accounts', 'create.invoices', 'record.payments', 'view.reports',
                'submit.expenses', 'approve.expenses',
            ],

            'sales_manager' => [
                'view.clients', 'create.clients', 'edit.clients',
                'view.leads', 'create.leads', 'edit.leads', 'delete.leads', 'assign.leads',
                'create.cost_estimations', 'create.quotations', 'manage.materials',
                'view.projects',
            ],

            'sales_executive' => [
                'view.clients',
                'view.leads', 'create.leads', 'edit.leads',
                'create.cost_estimations', 'create.quotations', 'manage.materials',
                'view.projects',
            ],

            'site_engineer' => [
                'view.projects', 'manage.tasks',
                'view.inventory',
                'submit.expenses',
            ],
        ];

        foreach ($roleMatrix as $name => $perms) {
            $role = Role::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
            $role->syncPermissions($perms);
        }

        // 3. Migrate users on retired roles to the nearest new role --------------
        $migrations = [
            'super_admin'         => 'admin',
            'project_manager'     => 'site_engineer',
            'procurement_officer' => 'accounts',
            'hr_manager'          => 'admin',
            'sales'               => 'sales_manager',
            'sales_admin'         => 'sales_manager',
            'employee'            => 'site_engineer',
        ];

        foreach ($migrations as $old => $new) {
            $oldRole = Role::where('name', $old)->first();
            if (!$oldRole) continue;

            $newRole = Role::where('name', $new)->first();
            if ($newRole) {
                $userIds = DB::table('model_has_roles')
                    ->where('role_id', $oldRole->id)
                    ->pluck('model_id');

                foreach ($userIds as $uid) {
                    $user = User::find($uid);
                    if ($user && !$user->hasRole($new)) {
                        $user->assignRole($new);
                    }
                }
            }

            // Drop the old role entirely
            $oldRole->delete();
        }

        $this->command->info('✓ 5 canonical roles synced and legacy roles retired.');
    }
}
