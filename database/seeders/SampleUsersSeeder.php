<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Creates one sample user for each canonical role.
 * All sample users share the same password so they're easy to test with:
 *
 *   Password: Pass@123
 *
 * Admin login (existing):    admin@interiorvilla.com    / Admin@123
 * Accounts:                  accounts@interiorvilla.com / Pass@123
 * Sales Manager:             sales.manager@…            / Pass@123
 * Sales Executive:           sales.exec@…               / Pass@123
 * Site Engineer:             site.engineer@…            / Pass@123
 */
class SampleUsersSeeder extends Seeder
{
    public function run(): void
    {
        $samples = [
            [
                'email' => 'admin@interiorvilla.com',
                'name'  => 'Super Admin',
                'pass'  => 'Admin@123',
                'role'  => 'admin',
            ],
            [
                'email' => 'accounts@interiorvilla.com',
                'name'  => 'Accounts Officer',
                'pass'  => 'Pass@123',
                'role'  => 'accounts',
            ],
            [
                'email' => 'sales.manager@interiorvilla.com',
                'name'  => 'Sales Manager',
                'pass'  => 'Pass@123',
                'role'  => 'sales_manager',
            ],
            [
                'email' => 'sales.exec@interiorvilla.com',
                'name'  => 'Sales Executive',
                'pass'  => 'Pass@123',
                'role'  => 'sales_executive',
            ],
            [
                'email' => 'site.engineer@interiorvilla.com',
                'name'  => 'Site Engineer',
                'pass'  => 'Pass@123',
                'role'  => 'site_engineer',
            ],
        ];

        foreach ($samples as $s) {
            $user = User::firstOrCreate(
                ['email' => $s['email']],
                [
                    'name'                 => $s['name'],
                    'password'             => Hash::make($s['pass']),
                    'must_change_password' => false,
                    'is_active'            => true,
                ]
            );

            // Clear any old roles (in case they were migrated via RoleSeeder)
            // and assign the canonical role for this user.
            $user->syncRoles([$s['role']]);
        }

        $this->command->info('✓ Sample users seeded (one per role, password: Pass@123)');
    }
}
