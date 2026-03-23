<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoleRequest;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $roles = Role::with('permissions')->latest()->paginate(5);
        $permissions = Permission::get()->groupBy('module');
        return Inertia::render('roles/index', compact('roles', 'permissions'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RoleRequest $request)
    {
        $role = Role::create([
            'label' => $request->label,
            'name' => Str::slug($request->label),
            'description' => $request->description,
        ]);

        if ($role) {
            // Sync the permissions to the newly created role
            $role->syncPermissions($request->permissions);

            return redirect()->route('roles.index')->with('success', 'Role created successfully along with its permissions.');
        }
        return redirect()->back()->with('error', 'Unable to create role, please try again.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(RoleRequest $request, Role $role)
    {
        if ($role) {
            $role->update([
                'label' => $request->label,
                'name' => Str::slug($request->label),
                'description' => $request->description,
            ]);

            $role->save();

            // Sync the permissions to the newly created role
            $role->syncPermissions($request->permissions);

            return redirect()->route('roles.index')->with('success', 'Role updated successfully along with its permissions.');
        }
        return redirect()->back()->with('error', 'Unable to update role, please try again.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role)
    {
        if ($role) {
            $role->delete();

            return redirect()->route('roles.index')->with('success', 'Role deleted successfully along with its permissions.');
        }
        return redirect()->back()->with('error', 'Unable to delete role, please try again.');
    }
}
