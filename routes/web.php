<?php

use App\Http\Controllers\GoalController;
use App\Http\Controllers\TaskProductivityController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SdgController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
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
    Route::resource('roles', RoleController::class);
    Route::resource('users', UserController::class);

    Route::prefix('goals/{goal:slug}')->group(function () {
        Route::resource('tasks', TaskController::class);
    });

    Route::get('tasks/{task:slug}/submit', [TaskProductivityController::class, 'submit'])->name('tasks.submit');
    Route::post('tasks/{task:slug}/submit', [TaskProductivityController::class, 'storeSubmission'])->name('tasks.submit.store');
    Route::put('submissions/{submission}/approve', [TaskProductivityController::class, 'approveSubmission'])->name('submissions.approve');
});

require __DIR__ . '/settings.php';
