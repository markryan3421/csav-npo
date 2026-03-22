<?php

namespace App\Http\Controllers;

use App\Http\Requests\SdgRequest;
use App\Models\Sdg;
use App\Services\SdgService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SdgController extends Controller
{
    // Service for creating and updating SDGs
    public function __construct(
        protected SdgService $sdgService
    ) {}

    public function changeSdg(Sdg $sdg)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Persist the selected SDG on the user — index() reads this
        $user->update(['current_sdg_id' => $sdg->id]);
        session(['sdg_id' => $sdg->id]);

        // ✅ Simple redirect — index() will read current_sdg_id
        return redirect()->route('goals.index')
            ->with('success', 'SDG changed successfully.');
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        /** @var \App\Models\User $user */
        $sdgs = Auth::user()->sdgs;
        return Inertia::render('dashboard', compact('sdgs'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('sdgs/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SdgRequest $request)
    {
        $this->sdgService->createSdg($request->validated(), Auth::id());

        return redirect('/dashboard')->with('success', 'SDG created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Sdg $sdg)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Sdg $sdg)
    {
        return Inertia::render('sdgs/edit', compact('sdg'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SdgRequest $request, Sdg $sdg)
    {
        $this->sdgService->updateSdg($sdg, $request->validated());

        return redirect('/dashboard')->with('success', 'SDG updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sdg $sdg)
    {
        $sdg->delete();

        return redirect()->back()->with('success', 'SDG deleted successfully.');
    }
}
