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

    // // This model ensures the end_date is set to the end of the day (11:59:59 PM)
    // public function setEndDateAttribute($value)
    // {
    //     $this->attributes['end_date'] = Carbon::parse($value)->endOfDay();
    // }

    // public function setStartDateAttribute($value)
    // {
    //     $this->attributes['start_date'] = Carbon::parse($value)->now();
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

    public function sdg(): BelongsTo
    {
        return $this->belongsTo(Sdg::class);
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
}
