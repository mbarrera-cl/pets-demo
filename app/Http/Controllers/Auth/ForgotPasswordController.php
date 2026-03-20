<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class ForgotPasswordController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    public function store(ForgotPasswordRequest $request): RedirectResponse
    {
        // Siempre devuelve el mismo mensaje para no revelar si el email existe
        Password::sendResetLink($request->only('email'));

        return redirect()->back()
            ->with('status', 'If an account exists for that email, a reset link has been sent.');
    }
}
