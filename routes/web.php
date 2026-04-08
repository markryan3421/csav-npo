<?php

use App\Http\Controllers\GoalController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TaskProductivityController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SdgController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

// Broadcasting auth route (outside auth middleware)
Route::post('/broadcasting/auth', function () {
    try {
        return Broadcast::auth(request());
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 403);
    }
})->middleware(['web', 'auth']); // Add 'auth' middleware

// Route::middleware(['auth'])->group(function () {
//     Route::get('/api/notifications', [NotificationController::class, 'index']);
//     Route::put('/api/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
//     Route::put('/api/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
// });

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [SdgController::class, 'index'])->name('dashboard');

    Route::resource('sdg', SdgController::class);

    Route::get('/change-sdg/{sdg:slug}', [SdgController::class, 'changeSdg'])->name('sdg.changeSdg');
    Route::resource('goals', GoalController::class)->middleware('permission:access goal');
    Route::resource('permissions', PermissionController::class)->middleware('permission:access permission');
    Route::resource('roles', RoleController::class)->middleware('permission:access role');
    Route::resource('users', UserController::class)->middleware('permission:access user');

    Route::prefix('goals/{goal:slug}')->group(function () {
        Route::resource('tasks', TaskController::class);
    });

    // Submit form
    Route::get('tasks/{task:slug}/submit', [TaskProductivityController::class, 'submit'])->name('tasks.submit');

    // Submit
    Route::post('tasks/{task:slug}/submit', [TaskProductivityController::class, 'storeSubmission'])->name('tasks.submit.store');

    // Approved submission
    Route::put('submissions/{submission}/approve', [TaskProductivityController::class, 'approveSubmission'])->name('submissions.approve');

    // Reject Routes
    Route::get('submissions/{submission:id}/reject', [TaskProductivityController::class, 'rejectSubmissionForm'])->name('submissions.reject.form');
    Route::post('submissions/{submission:id}/reject', [TaskProductivityController::class, 'reject'])->name('submissions.reject.store');

    // Resubmit Routes
    Route::get('tasks/{task:slug}/submissions/{task_productivity:id}/resubmit-form', [TaskProductivityController::class, 'showResubmitForm'])->name('tasks.submissions.resubmit.form');
    Route::put('tasks/{task:slug}/submissions/{task_productivity:id}/resubmit', [TaskProductivityController::class, 'resubmit'])->name('tasks.submissions.resubmit.store');

    // Request Resubmission Routes
    Route::put('tasks/{task:slug}/request-resubmission', [TaskProductivityController::class, 'requestResubmission'])->name('tasks.request-resubmission');
    Route::put('tasks/{task:slug}/approve-resubmission', [TaskProductivityController::class, 'approveResubmission'])->name('tasks.approve-resubmission');
    Route::put('tasks/{task:slug}/reject-resubmission', [TaskProductivityController::class, 'rejectResubmission'])->name('tasks.reject-resubmission');

    // Late Submit Routes
    Route::get('tasks/{task:slug}/late-resubmit', [TaskProductivityController::class, 'lateResubmitForm'])->name('tasks.late-resubmit.form');
    Route::put('tasks/{task:slug}/late-resubmit', [TaskProductivityController::class, 'storeLateResubmit'])->name('tasks.late-resubmit.store');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/logs', [LogController::class, 'index'])->name('logs.index');
});

require __DIR__ . '/settings.php';
