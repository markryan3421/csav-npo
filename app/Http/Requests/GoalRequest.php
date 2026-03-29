<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'project_manager_id' => 'required|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'required|in:long,short',
            'assigned_users' => 'array',
            'assigned_users.*' => 'exists:users,id',
            // sdg_id is now optional since we set it from sdg_ids
            'sdg_id' => 'sometimes|exists:sdgs,id',
            // sdg_ids is required for multi-SDG assignment
            'sdg_ids' => 'required|array|min:1',
            'sdg_ids.*' => 'exists:sdgs,id',
        ];
    }
    
    public function messages(): array
    {
        return [
            'title.required' => 'Please provide a goal title.',
            'description.required' => 'Please provide a goal description.',
            'start_date.required' => 'Please select a start date.',
            'end_date.required' => 'Please select an end date.',
            'end_date.after_or_equal' => 'End date must be after or equal to start date.',
            'sdg_ids.required' => 'Please select at least one SDG for this goal.',
            'sdg_ids.min' => 'Please select at least one SDG for this goal.',
        ];
    }
}