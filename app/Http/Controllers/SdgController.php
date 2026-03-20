<?php

namespace App\Http\Controllers;

use App\Http\Requests\SdgRequest;
use App\Models\Sdg;
use App\Services\SdgService;
use Illuminate\Http\Request;
use Intervention\Image\Facades\Image;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SdgController extends Controller
{
    public function __construct(
        protected SdgService $sdgService
    ) {}
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $sdgs = Sdg::all();
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
