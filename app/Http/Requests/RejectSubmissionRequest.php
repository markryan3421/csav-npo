<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'remarks' => ['required', 'string', 'min:3'],
        ];
    }

    public function messages(): array
    {
        return [
            'remarks.required' => 'A rejection reason is required.',
            'remarks.min'      => 'The rejection reason must be at least 3 characters.',
        ];
    }
}