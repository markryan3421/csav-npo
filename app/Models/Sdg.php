<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;

class Sdg extends Model
{
    protected $fillable = [
        'cover_photo',
        'name',
        'description',
        'slug',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function getCoverPhotoAttribute($value)
    {
        return $value ? Storage::url($value) : null;
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'sdg_user', 'sdg_id', 'user_id')
            ->withTimestamps();
    }

    public function sdgWithGoals() {
        return $this->belongsToMany(Goal::class, 'goal_sdg', 'sdg_id', 'goal_id')->withTimestamps();
    }
}
