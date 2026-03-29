<?php

namespace App\Concerns;

use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

trait FilterBySdg
{
    /**
     * Laravel will automatically call this method when the model boots.
     */
    protected static function bootFilterBySdg()
    {
        static::creating(function (Model $model) {
            if (Auth::check() && Auth::user()->current_sdg_id) {
                $model->sdg_id = Auth::user()->current_sdg_id;
            }
        });

    }

    /**
     * Manual scope for filtering by SDG via the pivot table.
     * Use this when you need to filter goals by SDG explicitly.
     */
    public function scopeForSdg(Builder $query, $sdgId = null)
    {
        $sdgId = $sdgId ?? (Auth::check() ? Auth::user()->current_sdg_id : null);
        
        if ($sdgId) {
            return $query->whereHas('goalWithSdgs', function ($q) use ($sdgId) {
                $q->where('sdg_id', $sdgId);
            });
        }

        return $query;
    }
    
    /**
     * Scope to get goals associated with the current user's SDG.
     */
    public function scopeForCurrentSdg(Builder $query)
    {
        if (Auth::check() && Auth::user()->current_sdg_id) {
            return $query->whereHas('goalWithSdgs', function ($q) {
                $q->where('sdg_id', Auth::user()->current_sdg_id);
            });
        }
        
        return $query;
    }
}