<?php

namespace App\Concerns;

use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

trait FilterBySdg
{
    /**
     * Laravel will automatically call this method when the model boots.
     * It attaches tenant (SDG) logic to the model lifecycle.
     */
    protected static function bootFilterBySdg()
    {
        // Automatically add the sdg_id to the model before it's created
        static::creating(function (Model $model) {
            // Check if the user is logged in and if there is an sdg_id stored in session
            if (Auth::check() && Auth::user()->current_sdg_id) {
                // If so, assign the sdg_id to the model being created
                $model->sdg_id = Auth::user()->current_sdg_id;
            }
        });

        // Add a global query scope to only fetch records that belong to the current tenant (SDG)
        static::addGlobalScope('sdg', function (Builder $builder) {
            if (Auth::check() && Auth::user()->current_sdg_id) {
                // Automatically filter all queries to include only data from the current SDG
                $builder->where('sdg_id', Auth::user()->current_sdg_id);
            }
        });
    }

    /**
     * Optional: You can manually use this scope when querying.
     * Example: Task::forSdg()->get();
     */
    public function scopeForSdg(Builder $query)
    {
        // If an SDG is selected in session, filter the results by it
        if (Auth::check() && Auth::user()->current_sdg_id) {
            return $query->where('sdg_id', Auth::user()->current_sdg_id);
        }

        // Otherwise, return all (probably only for super admins)
        return $query;
    }
}
