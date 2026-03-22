<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class GoalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'project_manager_id' => 'required|exists:users,id',
            'sdg_id' => 'required|exists:sdgs,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'start_date'         => ['required', 'date', 'after_or_equal:today'],
            'end_date'           => [
                'required',
                'date',
                'after_or_equal:start_date',
            ],
            'type' => 'required|in:short,long',
            'assigned_users.*' => [
                'nullable',
                'exists:users,id',
                // function ($attribute, $value, $fail) {
                //     $user = User::find($value);
                //     if (!$user) {
                //         return $fail("Selected user does not exist.");
                //     }
                //     if ($user->id === Auth::id()) {
                //         return $fail("You cannot assign a goal to yourself.");
                //     }
                //     if (!$user->hasRole('staff')) {
                //         return $fail("Only users with the 'staff' role can be assigned.");
                //     }
                // }
            ],
        ];
        return $rules;
    }

    public function messages()
    {
        return [
            'project_manager_id.required' => 'Project manager is required.',
            'project_manager_id.exists' => 'Project manager does not exist.',
            'sdg_id.required' => 'SDG is required.',
            'sdg_id.exists' => 'SDG does not exist.',
            'title.required' => 'Title is required.',
            'title.max' => 'Title cannot exceed 255 characters.',
            'description.required' => 'Description is required.',
            'start_date.required' => 'Start date is required.',
            'start_date.date' => 'Start date must be a date.',
            'start_date.after_or_equal' => 'Start date must be after or equal to today.',
            'end_date.required' => 'End date is required.',
            'end_date.date' => 'End date must be a date.',
            'end_date.after_or_equal' => 'End date must be after or equal to start date.',
            'type.required' => 'Type is required.',
            'type.in' => 'Type must be either short or long.',
            'assigned_users.*.exists' => 'Selected user does not exist.',
        ];
    }
}
