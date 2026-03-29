<?php

namespace App\Models;

use App\Concerns\FilterBySdg;
use App\Concerns\FilterGoalByStaff;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class Goal extends Model
{
    use FilterBySdg, FilterGoalByStaff;

    protected $fillable = [
        'project_manager_id',
        'sdg_id',
        'title',
        'slug',
        'description',
        'start_date',
        'end_date',
        'status',
        'type', // 'short' or 'long'
        'compliance_percentage',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'compliance_percentage' => 'decimal:2',
    ];

    // }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected $attributes = [
        'compliance_percentage' => 0,
    ];

    public static function forStaff()
    {
        $userId = Auth::id();
        return static::whereHas('assignedUsers', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        });
    }

    public function sdgs()
    {
        return $this->goalWithSdgs();
    }

    public function projectManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'project_manager_id');
    }

    public function assignedUsers()
    {
        return $this->belongsToMany(User::class, 'goal_user', 'goal_id', 'user_id')
            ->withTimestamps();
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function goalWithSdgs() 
    {
        return $this->belongsToMany(Sdg::class, 'goal_sdg', 'goal_id', 'sdg_id')->withTimestamps();
    }
}
