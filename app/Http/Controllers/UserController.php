<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\User;
use App\Models\Role;
use App\Models\Sdg;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Intervention\Image\Facades\Image;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        $staffUsers = User::with('roles')
            ->where('current_sdg_id', $user->current_sdg_id)
            ->where('id', '!=', $user->id)
            ->role(['staff', 'project-manager', 'admin', 'super-admin'])
            ->get()
            ->map(function ($user) {
                return [
                    'id'        => $user->id,
                    'user_slug' => $user->user_slug,
                    'name'      => $user->name,
                    'email'     => $user->email,
                    'avatar'    => $user->avatar,
                    'is_online' => $user->is_online,
                    'roles'     => $user->roles->map(fn($role) => ['name' => $role->name])->toArray(),
                ];
            });

        return Inertia::render('users/index', compact('staffUsers'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $roles = Role::all();
        $sdgs = Sdg::all();
        return Inertia::render('users/create', compact('roles', 'sdgs'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request)
    {
        $user = User::create([
            'name'     => $request->name,
            'user_slug' => Str::slug($request->name),
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'current_sdg_id' => Auth::user()->current_sdg_id,
        ]);

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['avatar' => $path]);
        }

        // Assign role – $request->role is now an ID
        $user->assignRole($request->role);

        // Attach SDGs if any
        if ($request->has('sdgs') && is_array($request->sdgs)) {
            $user->sdgs()->attach($request->sdgs);
        }

        $user->save(); // not strictly needed if create already saved, but okay

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return Inertia::render('users/show', [
            'user' => [
                'id'          => $user->id,
                'user_slug'   => $user->user_slug,
                'name'        => $user->name,
                'email'       => $user->email,
                'avatar'      => $user->avatar,
                'created_at'  => $user->created_at,
                'roles'       => $user->roles->map(fn($r) => ['name' => $r->name]),
                'permissions' => $user->getAllPermissions()->pluck('name'),
                'sdgs'        => $user->sdgs->map(fn($s) => ['id' => $s->id, 'name' => $s->name]),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        return Inertia::render('users/edit', [
            'user' => [
                'id' => $user->id,
                'user_slug' => $user->user_slug,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'roles' => $user->roles->map(fn($r) => ['id' => $r->id, 'name' => $r->name]),
                'sdgs' => $user->sdgs->map(fn($s) => ['id' => $s->id, 'name' => $s->name]),
            ],
            'roles' => Role::all(['id', 'name']),
            'sdgs' => Sdg::all(['id', 'name']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UserRequest $request, User $user)
    {
        $data = [
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'email' => $request->email,
        ];

        // Update password only if provided
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['avatar' => $path]);
        }

        // Sync role (single role)
        $user->syncRoles([$request->role]);

        // Sync SDGs
        if ($request->has('sdgs') && is_array($request->sdgs)) {
            $user->sdgs()->sync($request->sdgs);
        }

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        if ($user) {
            $user->delete();
            return redirect()->route('users.index')->with('success', 'User deleted successfully.');
        }
        return redirect()->back()->with('error', 'Unable to delete user, please try again.');
    }
}
