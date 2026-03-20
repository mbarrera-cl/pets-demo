<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => 'required|string|min:2|max:100',
            'email'    => 'required|email:rfc|max:150|unique:users',
            'password' => [
                'required',
                'string',
                'min:8',
                'max:72',
                'confirmed',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'regex:/[@$!%*#?&]/',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique'       => 'This email is already registered.',
            'password.min'       => 'Password must be at least 8 characters.',
            'password.regex'     => 'Password must contain an uppercase letter, a number, and a symbol (@$!%*#?&).',
            'password.confirmed' => 'Passwords do not match.',
        ];
    }
}
