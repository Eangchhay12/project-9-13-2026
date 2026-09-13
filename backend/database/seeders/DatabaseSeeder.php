<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(['email' => 'sokha@example.com'], [
            'name' => 'Sokha Chan',
            'password' => Hash::make('password'),
            'role' => 'Administrator',
            'status' => 'Active',
        ]);
    }
}
