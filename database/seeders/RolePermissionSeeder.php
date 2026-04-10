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
                'actions' => ['access', 'view', 'create', 'edit', 'delete'],
                'label'   => 'User',
            ],
            'role' => [
                'actions' => ['access', 'view', 'create', 'edit', 'delete'],
                'label'   => 'Role',
            ],
            'sdg' => [
                'actions' => ['access', 'view', 'create', 'edit', 'delete'],
                'label'   => 'Sustainable Development Goal',
            ],
            'goal' => [
                'actions' => ['access', 'view', 'create', 'edit', 'delete'],
                'label'   => 'Goal',
            ],
            'task' => [
                'actions' => ['access', 'view', 'create', 'edit', 'delete'],
                'label'   => 'Task',
            ],
            'permission' => [
                'actions' => ['access', 'view', 'create', 'edit', 'delete'],
                'label'   => 'Permission',
            ],
            'productivity' => [
                'actions' => [
                    'access',
                    'submit',
                    'resubmit',
                    'request resubmission',
                    'approve resubmission',
                    'approve',
                    'reject'
                ],
                'label' => 'Productivity',
            ],
        ];

        // Create permissions
        foreach ($resources as $resource => $config) {
            foreach ($config['actions'] as $action) {
                $permissionName = $action . '-' . $resource;

                Permission::firstOrCreate(
                    ['name' => $permissionName, 'guard_name' => 'web'],
                    [
                        'module'      => $resource,
                        'label'       => ucfirst($action) . ' ' . $config['label'],
                        'description' => "Allow user to $action " . $config['label'] . ($resource !== 'productivity' ? 's' : ''),
                        'is_active'   => true,
                    ]
                );
            }
        }

        // Create roles with labels and descriptions
        $superAdminRole = Role::firstOrCreate(
            ['name' => 'super-admin', 'guard_name' => 'web'],
            [
                'label'       => 'Super Admin',
                'description' => 'Complete system access with all permissions including role and permission management.',
                'is_active'   => true,
            ]
        );

        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'web'],
            [
                'label'       => 'Admin',
                'description' => 'Full system access except role and permission management.',
                'is_active'   => true,
            ]
        );

        $managerRole = Role::firstOrCreate(
            ['name' => 'project-manager', 'guard_name' => 'web'],
            [
                'label'       => 'Project Manager',
                'description' => 'Can manage goals and tasks, and approve/reject productivity submissions.',
                'is_active'   => true,
            ]
        );

        $staffRole = Role::firstOrCreate(
            ['name' => 'staff', 'guard_name' => 'web'],
            [
                'label'       => 'Staff',
                'description' => 'Can submit and manage their own productivity entries.',
                'is_active'   => true,
            ]
        );

        // ============================================================
        // SUPER ADMIN - Everything (all permissions)
        // ============================================================
        $superAdminRole->givePermissionTo(Permission::all());

        // ============================================================
        // ADMIN - Everything EXCEPT role & permission module
        // (including access permissions for all modules except role/permission)
        // ============================================================
        $adminPermissions = Permission::where('module', '!=', 'role')
            ->where('module', '!=', 'permission')
            ->get();
        $adminRole->syncPermissions($adminPermissions);

        // ============================================================
        // PROJECT MANAGER - Goals + Tasks (all CRUD + access) + Productivity approvals + access
        // ============================================================
        $managerPermissions = Permission::where(function ($query) {
            // Goal and Task modules - all actions (access, view, create, edit, delete)
            $query->whereIn('module', ['goal', 'task']);
        })->orWhere(function ($query) {
            // Productivity access + approval actions only
            $query->where('module', 'productivity')
                ->whereIn('name', [
                    'access productivity',
                    'approve productivity',
                    'reject productivity',
                    'approve resubmission productivity'
                ]);
        })->get();

        $managerRole->syncPermissions($managerPermissions);

        // ============================================================
        // STAFF - Only productivity access + submission actions
        // ============================================================
        $staffPermissions = Permission::where('module', 'productivity')
            ->whereIn('name', [
                'access productivity',
                'submit productivity',
                'resubmit productivity',
                'request resubmission productivity'
            ])
            ->get();

        $staffRole->syncPermissions($staffPermissions);

        // ============================================================
        // Create users with appropriate SDG assignments
        // ============================================================
        $allSdgs = Sdg::all();
        $sdgIds = $allSdgs->pluck('id')->toArray();

        // Create Super Admin user
        $superAdminUser = User::firstOrCreate(
            ['email' => 'superadmin@gmail.com'],
            [
                'name' => 'Super Admin',
                'password' => bcrypt('password'),
                'user_slug' => Str::slug('Super Admin'),
            ]
        );
        $superAdminUser->assignRole($superAdminRole);
        $superAdminUser->sdgs()->sync($sdgIds);

        // Create Admin user
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Admin',
                'password' => bcrypt('password'),
                'user_slug' => Str::slug('Admin'),
            ]
        );
        $adminUser->assignRole($adminRole);
        $adminUser->sdgs()->sync($sdgIds);

        // Create Project Manager user
        $managerUser = User::firstOrCreate(
            ['email' => 'projectmanager@gmail.com'],
            [
                'name' => 'Project Manager',
                'password' => bcrypt('password'),
                'user_slug' => Str::slug('Project Manager'),
            ]
        );
        $managerUser->assignRole($managerRole);
        $managerUser->sdgs()->sync($sdgIds);

        // Create Staff user
        $staffUser = User::firstOrCreate(
            ['email' => 'staff@gmail.com'],
            [
                'name' => 'Staff',
                'password' => bcrypt('password'),
                'user_slug' => Str::slug('Staff'),
            ]
        );
        $staffUser->assignRole($staffRole);
        $staffUser->sdgs()->sync($sdgIds);
    }
}
