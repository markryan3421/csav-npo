<?php

namespace App\Concerns;

use Illuminate\Support\Facades\Auth;

trait FilterGoalByStaff
{
    public function scopeForStaff($query)
    {
        return $query->whereHas('assignedUsers', function ($q) {
            $q->where('user_id', '=', Auth::id());
        });
    }
}
