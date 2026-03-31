<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subject'  => ['required', 'string', 'max:255'],
            'comments' => ['nullable', 'string'],
            'files'    => ['required', 'array'],
            'files.*'  => ['file', 'mimes:doc,docx,pdf,xls,xlsx,ppt,pptx', 'max:20480'],
        ];
    }

    public function messages(): array
    {
        return [
            'subject.required' => 'A subject is required.',
            'files.required'   => 'At least one file must be uploaded.',
            'files.*.mimes'    => 'Only doc, docx, pdf, xls, xlsx, ppt, and pptx files are allowed.',
            'files.*.max'      => 'Each file must not exceed 20MB.',
        ];
    }
}