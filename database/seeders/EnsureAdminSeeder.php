<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Guarantees a usable admin account exists on every boot.
 *
 * - If admin@interiorvilla.com does NOT exist → creates it with Admin@123.
 * - If it DOES exist → leaves the password untouched (user may have changed it)
 *   and just re-asserts is_active = true + admin role.
 *
 * Safe to run on every container restart — never overwrites a live password.
 */
class EnsureAdminSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'admin@interiorvilla.com'],
            [
                'name'                 => 'Super Admin',
                'password'             => Hash::make('Admin@123'),
                'must_change_password' => false,
                'is_active'            => true,
            ]
        );

        // Keep the admin account reachable even if someone flipped it off.
        if (!$user->is_active) {
            $user->update(['is_active' => true]);
        }

        // Make sure the admin role is attached (won't duplicate if already there).
        if (!$user->hasRole('admin')) {
            $user->assignRole('admin');
        }
    }
}
