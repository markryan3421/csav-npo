<?php

use App\Http\Controllers\SdgController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::get('dashboard', [SdgController::class, 'index'])->name('dashboard');

    Route::resource('sdg', SdgController::class);
});

require __DIR__ . '/settings.php';
