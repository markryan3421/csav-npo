<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SdgRequest extends FormRequest
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
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'cover_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'The SDG name is required.',
            'name.max' => 'The SDG name cannot exceed 255 characters.',
            'cover_photo.image' => 'The cover photo must be an image.',
            'cover_photo.mimes' => 'The cover photo must be a valid image file.',
            'cover_photo.max' => 'The cover photo must not exceed 2MB.',
        ];
    }
}
