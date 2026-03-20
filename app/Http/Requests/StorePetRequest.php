<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name'  => 'required|string|max:100|min:2',
            'type'  => 'required|in:dog,cat',
            'breed' => 'nullable|string|max:100',
            'age'   => 'required|integer|min:0|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Pet name is required',
            'name.max'      => 'Pet name cannot exceed 100 characters',
            'type.required' => 'Please select a pet type',
            'type.in'       => 'Invalid pet type selected',
            'age.required'  => 'Age is required',
            'age.min'       => 'Age cannot be negative',
            'age.max'       => 'Age cannot exceed 100 years',
        ];
    }
}
