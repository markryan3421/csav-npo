<?php

namespace App\Http\Requests;

use App\Models\Goal;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Goal $goal */
        $goal = $this->route('goal');

        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'deadline' => [
                'required',
                'date',
                'after_or_equal:today',
                function ($attribute, $value, $fail) use ($goal) {
                    if ($goal && $goal->end_date) {
                        $taskDeadline = Carbon::parse($value);
                        $goalDeadline = Carbon::parse($goal->end_date);

                        if ($taskDeadline->gt($goalDeadline)) {
                            $fail("The {$attribute} cannot be later than the goal's deadline ({$goalDeadline->toFormattedDateString()}).");
                        }
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'    => 'A task title is required.',
            'deadline.required' => 'A deadline is required.',
            'deadline.date'     => 'The deadline must be a valid date.',
            'deadline.after_or_equal' => 'The deadline must be today or a future date.',
        ];
    }
}