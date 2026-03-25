<?php

use App\Models\TaskProductivity;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('task_productivity_files', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(TaskProductivity::class, 'task_productivity_id')->constrained()->cascadeOnDelete();
            $table->string('file_name');
            $table->string('file_size');
            $table->string('file_type');
            $table->string('file_path');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_productivity_files');
    }
};
