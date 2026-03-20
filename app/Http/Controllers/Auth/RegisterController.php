<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class RegisterController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(RegisterRequest $request): RedirectResponse
    {
        try {
            $user = User::create([
                'name'     => $request->name,
                'email'    => $request->email,
                'password' => $request->password,
            ]);

            event(new Registered($user));

            Auth::login($user);

            Log::info('User registered', ['email' => $user->email]);

            return redirect()->route('verification.notice');
        } catch (\Exception $e) {
            Log::error('Registration failed', ['error' => $e->getMessage()]);

            return redirect()->back()->withInput()->with('error', 'Registration failed. Please try again.');
        }
    }
}
