<?php

namespace App\Models;

use App\Concerns\FilterBySdg;
use Carbon\Carbon;
use App\Models\Sdg;
use App\Models\Goal;
use App\Models\User;
use App\Models\TaskProductivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Task extends Model
{
    use HasFactory, FilterBySdg;

    protected $fillable = [
        'goal_id',
        'sdg_id',
        'title',
        'slug',
        'description',
        'status',
        'remarks',
        'deadline',
        'user_id',
    ];


    protected $casts = [
        'deadline' => 'datetime',
    ];

    // This model ensures the deadline is set to the end of the day (11:59:59 PM)
    public function setDeadlineAttribute($value)
    {
        $this->attributes['deadline'] = Carbon::parse($value, config('app.timezone'))->endOfDay();
        // $this->attributes['deadline'] = Carbon::parse($value)->endOfDay();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function goal(): BelongsTo
    {
        return $this->belongsTo(Goal::class);
    }

    public function sdg(): BelongsTo
    {
        return $this->belongsTo(Sdg::class);
    }

    public function taskProductivities(): HasMany
    {
        return $this->hasMany(TaskProductivity::class);
    }

    public function getRouteKeyName()
    {
        return 'slug';
    }
}
