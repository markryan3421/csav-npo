<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $currentSdg = null;

        if ($user = $request->user()) {
            // Option 1: from the user's current_sdg_id (cached in model)
            $currentSdg = $user->currentSdg;

            // Option 2: from the session
            // if ($sdgId = session('sdg_id')) {
            //     $currentSdg = Sdg::find($sdgId);
            // }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'roles' => fn() => $request->user()?->roles->pluck('name'),
                'permissions' => fn() => $request->user()?->getAllPermissions()->pluck('name'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentSdg' => $currentSdg ? [
                'id'   => $currentSdg->id,
                'name' => $currentSdg->name,
                'slug' => $currentSdg->slug,
            ] : null,
        ];
    }
}
