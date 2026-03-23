<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class UserRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:3000',
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $this->route('user')?->id,
            'role' => 'required|exists:roles,name',
            'sdgs' => 'nullable|array',
            'sdgs.*' => 'exists:sdgs,id',
        ];

        // If password is present, require confirmation
        if ($this->filled('password')) {
            $rules['password'] = 'required|confirmed|min:8';
            $rules['password_confirmation'] = 'required';
        } else {
            $rules['password'] = 'nullable';
            $rules['password_confirmation'] = 'nullable';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'avatar.image' => 'The avatar must be an image.',
            'avatar.mimes' => 'The avatar must be a file of type: jpeg,png,jpg,gif,svg,webp.',
            'avatar.max' => 'The avatar may not be greater than 3000 kilobytes.',
            'name.required' => 'The name field is required.',
            'name.string' => 'The name must be a string.',
            'name.max' => 'The name may not be greater than 255 characters.',
            'email.required' => 'The email field is required.',
            'email.string' => 'The email must be a string.',
            'email.lowercase' => 'The email must be a lowercase string.',
            'email.email' => 'The email must be a valid email address.',
            'email.max' => 'The email may not be greater than 255 characters.',
            'email.unique' => 'The email has already been taken.',
            'password.required' => 'The password field is required.',
            'password.confirmed' => 'The password confirmation does not match.',
            'role.exists' => 'The selected role does not exist.',
            'sdgs.array' => 'The SDGs must be an array.',
            'sdgs.*.exists' => 'One or more selected SDGs do not exist.',
        ];
    }
}
