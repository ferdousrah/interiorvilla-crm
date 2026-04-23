<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@interiorvilla.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('Admin@123'),
                'must_change_password' => false,
                'is_active' => true,
            ]
        );

        $admin->assignRole('super_admin');
    }
}
