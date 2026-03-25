<?php

use App\Models\Goal;
use App\Models\Sdg;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('task_productivities', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Sdg::class, 'sdg_id')->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Goal::class, 'goal_id')->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Task::class, 'task_id')->constrained()->cascadeOnDelete();
            $table->foreignIdFor(User::class, 'user_id')->constrained()->cascadeOnDelete();

            $table->string('subject');
            $table->text('comments')->nullable();
            $table->date('date');

            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->text('remarks');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_productivities');
    }
};
