<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskProductivityFile extends Model
{
    protected $fillable = [
        'task_productivity_id',
        'file_name',
        'file_size',
        'file_type',
        'file_path',
    ];

    public function taskProductivity()
    {
        return $this->belongsTo(TaskProductivity::class);
    }
}
