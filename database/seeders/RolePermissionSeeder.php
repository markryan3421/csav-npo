<?php

namespace Database\Seeders;

use App\Models\Sdg;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define resources and their actions with human‑readable labels
        $resources = [
            'user' => [
                'actions' => ['view', 'create', 'edit', 'delete'],
                'label'   => 'User',
            ],
            'role' => [
                'actions' => ['view', 'create', 'edit', 'delete'],
                'label'   => 'Role',
            ],
            'sdg' => [
                'actions' => ['view', 'create', 'edit', 'delete'],
                'label'   => 'Sustainable Development Goal',
            ],
            'goal' => [
                'actions' => ['view', 'create', 'edit', 'delete'],
                'label'   => 'Goal',
            ],
            'permission' => [
                'actions' => ['view'],
                'label'   => 'Permission',
            ],
        ];

        // Create permissions
        foreach ($resources as $resource => $config) {
            foreach ($config['actions'] as $action) {
                $permissionName = $action . ' ' . $resource;

                Permission::firstOrCreate(
                    ['name' => $permissionName, 'guard_name' => 'web'],
                    [
                        'module'      => $resource,
                        'label'       => ucfirst($action) . ' ' . $config['label'],
                        'description' => "Allow user to $action " . $config['label'] . 's',
                        'is_active'   => true,
                    ]
                );
            }
        }

        // Create roles with labels and descriptions
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'web'],
            [
                'label'       => 'Administrator',
                'description' => 'Full system access with all permissions.',
                'is_active'   => true,
            ]
        );

        $managerRole = Role::firstOrCreate(
            ['name' => 'project-manager', 'guard_name' => 'web'],
            [
                'label'       => 'Project Manager',
                'description' => 'Can manage most resources except delete operations.',
                'is_active'   => true,
            ]
        );

        $staffRole = Role::firstOrCreate(
            ['name' => 'staff', 'guard_name' => 'web'],
            [
                'label'       => 'Staff',
                'description' => 'Read‑only access to most resources.',
                'is_active'   => true,
            ]
        );

        // Assign all permissions to admin
        $adminRole->givePermissionTo(Permission::all());
        $allSdg = Sdg::all();

        // Create an admin user
        $adminUser = User::create([
            'name' => 'Admin',
            'email' => 'admin@gmail.com',
            'password' => bcrypt('password'),
            'user_slug' => Str::slug('Admin'),
        ]);

        $adminUser->assignRole($adminRole);
        $adminUser->sdgs()->sync($allSdg->pluck('id')->toArray());

        // Assign all permissions except those containing 'delete' to project‑manager
        $managerPermissions = Permission::where('name', 'not like', '%delete%')->get();
        $managerRole->syncPermissions($managerPermissions);

        // Assign only view permissions to staff
        $staffPermissions = Permission::where('name', 'like', 'view%')->get();
        $staffRole->syncPermissions($staffPermissions);
    }
}
