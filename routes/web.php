<?php

use App\Http\Controllers\GoalController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\SdgController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [SdgController::class, 'index'])->name('dashboard');

    Route::resource('sdg', SdgController::class);

    Route::get('/change-sdg/{sdg:slug}', [SdgController::class, 'changeSdg'])->name('sdg.changeSdg');
    Route::resource('goals', GoalController::class);
    Route::resource('permissions', PermissionController::class);
});

require __DIR__ . '/settings.php';
