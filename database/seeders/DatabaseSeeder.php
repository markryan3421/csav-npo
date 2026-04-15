<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Str;
use Database\Seeders\SdgSeeder;
use Illuminate\Database\Seeder;
use Database\Seeders\UserSeeder;
use Database\Seeders\GoalTaskSeeder;
use Database\Seeders\RolePermissionSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {

        $this->call([
            SdgSeeder::class,
        ]);

        // Create an admin user
        $this->call([
            RolePermissionSeeder::class,
        ]);

        $this->call([
            UserSeeder::class,
        ]);

        $this->call([
            GoalTaskSeeder::class,
        ]);
    }
}
