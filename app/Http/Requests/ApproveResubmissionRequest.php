<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveResubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'deadline' => ['required', 'date', 'after_or_equal:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'deadline.required'        => 'A new deadline is required.',
            'deadline.date'            => 'The deadline must be a valid date.',
            'deadline.after_or_equal'  => 'The deadline must be today or a future date.',
        ];
    }
}