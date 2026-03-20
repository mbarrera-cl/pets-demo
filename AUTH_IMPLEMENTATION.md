# Implementación de Autenticación
## Laravel 13 + React + Inertia.js

---

## Stack y Dependencias

```bash
# Laravel Sanctum para autenticación web con sesiones
composer require laravel/sanctum

# Resend o SMTP para emails transaccionales
# (ya incluido en Laravel: Illuminate\Mail)

# Opcional: rate limiting avanzado
# (ya incluido en Laravel: ThrottleRequests)
```

---

## Fase 1: Configuración Base

### 1.1 Publicar config de Sanctum

```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

### 1.2 Crear tabla de sessions (si no existe)

```bash
php artisan session:table
php artisan migrate
```

### 1.3 Configurar `.env`

```env
APP_DEBUG=false
APP_ENV=production

# Sesiones en base de datos (más seguro que cookies simples)
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

# Contraseñas hasheadas con bcrypt fuerte
BCRYPT_ROUNDS=12

# Configuración de email
MAIL_MAILER=smtp
MAIL_HOST=smtp.resend.com
MAIL_PORT=465
MAIL_USERNAME=resend
MAIL_PASSWORD=your-api-key
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=noreply@tudominio.com
MAIL_FROM_NAME="${APP_NAME}"
```

### 1.4 Configurar `config/session.php`

```php
'secure' => env('SESSION_SECURE_COOKIE', true),
'same_site' => 'lax',
'encrypt' => true,
'http_only' => true,
```

---

## Fase 2: Migraciones

### 2.1 Tabla `users` (ya existe en Laravel, verificar campos)

```php
// database/migrations/0001_01_01_000000_create_users_table.php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name', 100);
    $table->string('email', 150)->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');
    $table->boolean('is_active')->default(true);
    $table->rememberToken();
    $table->timestamps();

    $table->index('email');
    $table->index('created_at');
});
```

### 2.2 Tabla `password_reset_tokens` (ya existe en Laravel)

```php
Schema::create('password_reset_tokens', function (Blueprint $table) {
    $table->string('email')->primary();
    $table->string('token');
    $table->timestamp('created_at')->nullable();
});
```

### 2.3 Tabla `login_attempts` (nueva — para auditoría)

```bash
php artisan make:migration create_login_attempts_table
```

```php
// database/migrations/xxxx_create_login_attempts_table.php
Schema::create('login_attempts', function (Blueprint $table) {
    $table->id();
    $table->string('email', 150);
    $table->string('ip_address', 45);
    $table->boolean('successful');
    $table->timestamp('attempted_at')->useCurrent();

    $table->index(['email', 'attempted_at']);
    $table->index(['ip_address', 'attempted_at']);
});
```

```bash
php artisan migrate
```

---

## Fase 3: Modelo User

```php
<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use Notifiable;

    protected $fillable = ['name', 'email', 'password'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'is_active'         => 'boolean',
    ];

    // Mutator: normalizar email a minúsculas
    protected function email(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => strtolower(trim($value)),
        );
    }

    // Mutator: sanitizar nombre
    protected function name(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => trim(strip_tags($value)),
        );
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
```

---

## Fase 4: Form Requests

### 4.1 RegisterRequest

```bash
php artisan make:request Auth/RegisterRequest
```

```php
<?php
// app/Http/Requests/Auth/RegisterRequest.php

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
            'name'                  => 'required|string|min:2|max:100',
            'email'                 => 'required|email:rfc,dns|max:150|unique:users',
            'password'              => [
                'required',
                'string',
                'min:8',
                'max:72',           // bcrypt limit
                'confirmed',        // requiere password_confirmation
                'regex:/[A-Z]/',    // al menos una mayúscula
                'regex:/[0-9]/',    // al menos un número
                'regex:/[@$!%*#?&]/', // al menos un símbolo
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique'              => 'This email is already registered.',
            'password.min'              => 'Password must be at least 8 characters.',
            'password.regex'            => 'Password must contain uppercase, number, and symbol.',
            'password.confirmed'        => 'Passwords do not match.',
        ];
    }
}
```

### 4.2 LoginRequest

```bash
php artisan make:request Auth/LoginRequest
```

```php
<?php
// app/Http/Requests/Auth/LoginRequest.php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'    => 'required|email:rfc|max:150',
            'password' => 'required|string|max:72',
            'remember' => 'boolean',
        ];
    }
}
```

### 4.3 ForgotPasswordRequest

```bash
php artisan make:request Auth/ForgotPasswordRequest
```

```php
<?php
// app/Http/Requests/Auth/ForgotPasswordRequest.php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email:rfc|max:150',
        ];
    }
}
```

### 4.4 ResetPasswordRequest

```bash
php artisan make:request Auth/ResetPasswordRequest
```

```php
<?php
// app/Http/Requests/Auth/ResetPasswordRequest.php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token'    => 'required|string',
            'email'    => 'required|email:rfc|max:150',
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
}
```

---

## Fase 5: Controladores

### 5.1 RegisterController

```bash
php artisan make:controller Auth/RegisterController
```

```php
<?php
// app/Http/Controllers/Auth/RegisterController.php

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
                'password' => $request->password, // el cast 'hashed' lo encripta automáticamente
            ]);

            event(new Registered($user)); // dispara el email de verificación

            Auth::login($user);

            Log::info('User registered', ['email' => $user->email]);

            return redirect()->route('pets.create')
                ->with('success', 'Account created! Please verify your email.');
        } catch (\Exception $e) {
            Log::error('Registration failed', ['error' => $e->getMessage()]);

            return redirect()->back()->withInput()->with('error', 'Registration failed. Please try again.');
        }
    }
}
```

### 5.2 LoginController

```bash
php artisan make:controller Auth/LoginController
```

```php
<?php
// app/Http/Controllers/Auth/LoginController.php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class LoginController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        // Rate limiting manual por email+IP (además del throttle de rutas)
        $key = 'login:' . Str::lower($request->email) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            return redirect()->back()
                ->withInput($request->only('email', 'remember'))
                ->with('error', "Too many attempts. Try again in {$seconds} seconds.");
        }

        if (! Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            RateLimiter::hit($key, 300); // bloquea 5 minutos tras 5 intentos

            Log::warning('Failed login attempt', [
                'email' => $request->email,
                'ip'    => $request->ip(),
            ]);

            return redirect()->back()
                ->withInput($request->only('email', 'remember'))
                ->withErrors(['email' => 'Invalid credentials.']);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate(); // previene session fixation

        Log::info('User logged in', [
            'user_id' => Auth::id(),
            'ip'      => $request->ip(),
        ]);

        return redirect()->intended(route('pets.create'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        $userId = Auth::id();

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken(); // regenerar CSRF token

        Log::info('User logged out', ['user_id' => $userId]);

        return redirect()->route('login');
    }
}
```

### 5.3 ForgotPasswordController

```bash
php artisan make:controller Auth/ForgotPasswordController
```

```php
<?php
// app/Http/Controllers/Auth/ForgotPasswordController.php

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
        // Laravel envía el email con el token automáticamente
        // IMPORTANTE: siempre devuelve el mismo mensaje para no revelar si el email existe
        Password::sendResetLink($request->only('email'));

        return redirect()->back()
            ->with('status', 'If an account exists for that email, a reset link has been sent.');
    }
}
```

### 5.4 ResetPasswordController

```bash
php artisan make:controller Auth/ResetPasswordController
```

```php
<?php
// app/Http/Controllers/Auth/ResetPasswordController.php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResetPasswordRequest;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class ResetPasswordController extends Controller
{
    public function create(string $token): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => request()->query('email', ''),
        ]);
    }

    public function store(ResetPasswordRequest $request): RedirectResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password'       => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));

                Log::info('Password reset successfully', ['email' => $user->email]);
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect()->route('login')
                ->with('success', 'Password reset successfully. Please log in.');
        }

        return redirect()->back()
            ->withInput($request->only('email'))
            ->withErrors(['email' => __($status)]);
    }
}
```

### 5.5 VerifyEmailController

```bash
php artisan make:controller Auth/VerifyEmailController
```

```php
<?php
// app/Http/Controllers/Auth/VerifyEmailController.php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VerifyEmailController extends Controller
{
    public function notice(): Response
    {
        return Inertia::render('Auth/VerifyEmail');
    }

    public function verify(EmailVerificationRequest $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->route('pets.create');
        }

        $request->fulfill(); // marca email como verificado y dispara evento

        event(new Verified($request->user()));

        return redirect()->route('pets.create')
            ->with('success', 'Email verified successfully!');
    }

    public function resend(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->route('pets.create');
        }

        $request->user()->sendEmailVerificationNotification();

        return redirect()->back()
            ->with('status', 'Verification link sent!');
    }
}
```

---

## Fase 6: Rutas

```php
<?php
// routes/web.php

use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\PetController;
use Illuminate\Support\Facades\Route;

// --- Rutas públicas con rate limiting ---
Route::middleware('throttle:10,1')->group(function () {

    // Registro
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);

    // Login
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);

    // Recuperar contraseña
    Route::get('/forgot-password', [ForgotPasswordController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'store'])->name('password.email');

    // Reset de contraseña
    Route::get('/reset-password/{token}', [ResetPasswordController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [ResetPasswordController::class, 'store'])->name('password.update');
});

// --- Rutas protegidas (requieren autenticación) ---
Route::middleware('auth')->group(function () {

    // Logout
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    // Verificación de email
    Route::get('/verify-email', [VerifyEmailController::class, 'notice'])->name('verification.notice');
    Route::get('/verify-email/{id}/{hash}', [VerifyEmailController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('/email/verification-notification', [VerifyEmailController::class, 'resend'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    // Rutas de la app (requieren email verificado)
    Route::middleware('verified')->group(function () {
        Route::middleware('throttle:30,1')->group(function () {
            Route::get('/', [PetController::class, 'create'])->name('pets.create');
            Route::post('/pets', [PetController::class, 'store'])->name('pets.store');
        });
    });
});
```

---

## Fase 7: Middleware — Compartir datos de auth con Inertia

```php
<?php
// app/Http/Middleware/HandleInertiaRequests.php

public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'flash' => [
            'success' => $request->session()->get('success'),
            'error'   => $request->session()->get('error'),
            'status'  => $request->session()->get('status'),
        ],
        'auth' => [
            'user' => $request->user() ? [
                'id'              => $request->user()->id,
                'name'            => $request->user()->name,
                'email'           => $request->user()->email,
                'email_verified'  => $request->user()->hasVerifiedEmail(),
            ] : null,
        ],
    ];
}
```

---

## Fase 8: Componentes React

### 8.1 Layout compartido — `resources/js/Layouts/AuthLayout.jsx`

```jsx
export default function AuthLayout({ title, subtitle, children }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900 mb-1">{title}</h1>
                    {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
                </div>
                {children}
            </div>
        </div>
    );
}
```

### 8.2 Pantalla de Registro — `resources/js/Pages/Auth/Register.jsx`

```jsx
import { useForm, Link } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/register', { onFinish: () => setData('password', '') && setData('password_confirmation', '') });
    }

    return (
        <AuthLayout title="Create Account" subtitle="Join us to register your pets">
            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
                <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
                    <h3 className="text-sm font-semibold text-red-800 mb-2">Please fix the following:</h3>
                    <ul className="space-y-1">
                        {Object.entries(errors).map(([field, error]) => (
                            <li key={field} className="text-sm text-red-700 flex items-start gap-2">
                                <span className="text-red-500">•</span>
                                <span>{error}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        disabled={processing}
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="e.g. Jane Smith"
                        autoComplete="name"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="email"
                        disabled={processing}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="e.g. jane@example.com"
                        autoComplete="email"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Password <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="password"
                        disabled={processing}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Min 8 chars, uppercase, number, symbol"
                        autoComplete="new-password"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
                    <p className="mt-1 text-xs text-gray-400">Uppercase · Number · Symbol (@$!%*#?&)</p>
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="password"
                        disabled={processing}
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="Repeat your password"
                        autoComplete="new-password"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.password_confirmation ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.password_confirmation && <p className="mt-1.5 text-xs text-red-500">{errors.password_confirmation}</p>}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {processing ? 'Creating account…' : 'Create Account'}
                </button>

                <p className="text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
                </p>
            </form>
        </AuthLayout>
    );
}
```

### 8.3 Pantalla de Login — `resources/js/Pages/Auth/Login.jsx`

```jsx
import { useForm, Link, usePage } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';

export default function Login() {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e) {
        e.preventDefault();
        post('/login', { onFinish: () => setData('password', '') });
    }

    return (
        <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
            {/* Flash error (ej. too many attempts) */}
            {flash?.error && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm">
                    {flash.error}
                </div>
            )}

            {/* Flash success (ej. password reset exitoso) */}
            {flash?.success && (
                <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
                    {flash.success}
                </div>
            )}

            <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                        type="email"
                        disabled={processing}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="jane@example.com"
                        autoComplete="email"
                        autoFocus
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                    <div className="flex justify-between mb-1.5">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                    <input
                        type="password"
                        disabled={processing}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Your password"
                        autoComplete="current-password"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                </label>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {processing ? 'Signing in…' : 'Sign In'}
                </button>

                <p className="text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-indigo-600 font-medium hover:underline">Create one</Link>
                </p>
            </form>
        </AuthLayout>
    );
}
```

### 8.4 Recuperar Contraseña — `resources/js/Pages/Auth/ForgotPassword.jsx`

```jsx
import { useForm, Link, usePage } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';

export default function ForgotPassword() {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({ email: '' });

    function submit(e) {
        e.preventDefault();
        post('/forgot-password');
    }

    // Si ya se envió el link, mostrar pantalla de confirmación
    if (flash?.status) {
        return (
            <AuthLayout title="Check Your Email" subtitle="We sent you a link">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center space-y-4">
                    <div className="text-5xl">📬</div>
                    <p className="text-gray-600 text-sm">{flash.status}</p>
                    <Link href="/login" className="inline-block text-indigo-600 text-sm font-medium hover:underline">
                        Back to Sign In
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Forgot Password" subtitle="Enter your email to receive a reset link">
            <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                        type="email"
                        disabled={processing}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="jane@example.com"
                        autoComplete="email"
                        autoFocus
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {processing ? 'Sending…' : 'Send Reset Link'}
                </button>

                <p className="text-center text-sm text-gray-500">
                    <Link href="/login" className="text-indigo-600 font-medium hover:underline">Back to Sign In</Link>
                </p>
            </form>
        </AuthLayout>
    );
}
```

### 8.5 Reset de Contraseña — `resources/js/Pages/Auth/ResetPassword.jsx`

```jsx
import { useForm, Link } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/reset-password', { onFinish: () => setData('password', '') && setData('password_confirmation', '') });
    }

    return (
        <AuthLayout title="Reset Password" subtitle="Choose a strong new password">
            {Object.keys(errors).length > 0 && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4">
                    <ul className="space-y-1">
                        {Object.entries(errors).map(([field, error]) => (
                            <li key={field} className="text-sm text-red-700 flex items-start gap-2">
                                <span className="text-red-500">•</span>
                                <span>{error}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                {/* Email (readonly — viene del link) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="email"
                        className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-600 outline-none"
                    />
                </div>

                {/* New Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        New Password <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="password"
                        disabled={processing}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Min 8 chars, uppercase, number, symbol"
                        autoComplete="new-password"
                        autoFocus
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
                </div>

                {/* Confirm */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="password"
                        disabled={processing}
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="Repeat new password"
                        autoComplete="new-password"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.password_confirmation ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {processing ? 'Resetting…' : 'Reset Password'}
                </button>
            </form>
        </AuthLayout>
    );
}
```

### 8.6 Verificar Email — `resources/js/Pages/Auth/VerifyEmail.jsx`

```jsx
import { useForm, usePage } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';

export default function VerifyEmail() {
    const { flash, auth } = usePage().props;
    const { post, processing } = useForm({});

    function resend(e) {
        e.preventDefault();
        post('/email/verification-notification');
    }

    function logout(e) {
        e.preventDefault();
        post('/logout');
    }

    return (
        <AuthLayout title="Verify Your Email" subtitle={`We sent a link to ${auth.user?.email}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5 text-center">
                <div className="text-5xl">📧</div>

                <p className="text-sm text-gray-600">
                    Please click the verification link in your email before continuing.
                </p>

                {flash?.status && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
                        {flash.status}
                    </div>
                )}

                <form onSubmit={resend}>
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60"
                    >
                        {processing ? 'Sending…' : 'Resend Verification Email'}
                    </button>
                </form>

                <form onSubmit={logout}>
                    <button type="submit" className="text-sm text-gray-500 hover:underline">
                        Sign out
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
}
```

---

## Fase 9: Actualizar StorePetRequest para ownership

```php
// app/Http/Requests/StorePetRequest.php

public function authorize(): bool
{
    return $this->user() !== null; // solo usuarios autenticados
}

public function rules(): array
{
    return [
        'name'  => 'required|string|max:100|min:2',
        'type'  => 'required|in:dog,cat',
        'breed' => 'nullable|string|max:100',
        'age'   => 'required|integer|min:0|max:100',
    ];
    // owner_name y owner_email ya no vienen del form — se toman del usuario autenticado
}
```

### Actualizar PetController para usar el usuario autenticado

```php
// app/Http/Controllers/PetController.php

public function store(StorePetRequest $request): RedirectResponse
{
    try {
        $validated = $request->validated();

        $validated['owner_name']  = $request->user()->name;
        $validated['owner_email'] = $request->user()->email;

        Pet::create($validated);

        Log::info('Pet registered', [
            'user_id'  => $request->user()->id,
            'pet_name' => $validated['name'],
        ]);

        return redirect()->route('pets.create')->with('success', 'Pet registered successfully!');
    } catch (\Exception $e) {
        Log::error('Failed to register pet', ['error' => $e->getMessage()]);

        return redirect()->back()->withInput()->with('error', 'Failed to register pet. Please try again.');
    }
}
```

---

## Fase 10: Tests de Autenticación

```bash
php artisan make:test Feature/Auth/AuthenticationTest
```

```php
<?php
// tests/Feature/Auth/AuthenticationTest.php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_user_and_redirects()
    {
        $response = $this->post('/register', [
            'name'                  => 'Jane Doe',
            'email'                 => 'jane@example.com',
            'password'              => 'Secret@123',
            'password_confirmation' => 'Secret@123',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', ['email' => 'jane@example.com']);
        $this->assertAuthenticated();
    }

    public function test_register_fails_with_weak_password()
    {
        $response = $this->post('/register', [
            'name'                  => 'Jane Doe',
            'email'                 => 'jane@example.com',
            'password'              => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertGuest();
    }

    public function test_register_fails_with_duplicate_email()
    {
        User::factory()->create(['email' => 'jane@example.com']);

        $response = $this->post('/register', [
            'name'                  => 'Jane Doe',
            'email'                 => 'jane@example.com',
            'password'              => 'Secret@123',
            'password_confirmation' => 'Secret@123',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_login_succeeds_with_valid_credentials()
    {
        $user = User::factory()->create(['password' => bcrypt('Secret@123')]);

        $response = $this->post('/login', [
            'email'    => $user->email,
            'password' => 'Secret@123',
        ]);

        $response->assertRedirect();
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_fails_with_invalid_credentials()
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email'    => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_logout_unauthenticates_user()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post('/logout');

        $response->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_pets_page_requires_auth()
    {
        $response = $this->get('/');

        $response->assertRedirect('/login');
    }

    public function test_rate_limiting_blocks_after_5_failed_attempts()
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', ['email' => $user->email, 'password' => 'wrong']);
        }

        $response = $this->post('/login', ['email' => $user->email, 'password' => 'wrong']);

        $response->assertSessionHas('error');
    }
}
```

---

## Checklist de Implementación

### Fase 1 — Setup (30 min)
- [ ] `composer require laravel/sanctum`
- [ ] `php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"`
- [ ] `php artisan session:table && php artisan migrate`
- [ ] Actualizar `.env` con SESSION_ENCRYPT=true, BCRYPT_ROUNDS=12, APP_DEBUG=false
- [ ] Crear migración `login_attempts`

### Fase 2 — Backend (2-3 horas)
- [ ] Actualizar `User` model (implement `MustVerifyEmail`, casts, mutators)
- [ ] Crear `RegisterRequest`, `LoginRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`
- [ ] Crear `RegisterController`, `LoginController`, `ForgotPasswordController`, `ResetPasswordController`, `VerifyEmailController`
- [ ] Actualizar `routes/web.php`
- [ ] Actualizar `HandleInertiaRequests` con datos de auth
- [ ] Actualizar `StorePetRequest` y `PetController` para ownership

### Fase 3 — Frontend (2-3 horas)
- [ ] Crear `AuthLayout.jsx`
- [ ] Crear `Pages/Auth/Register.jsx`
- [ ] Crear `Pages/Auth/Login.jsx`
- [ ] Crear `Pages/Auth/ForgotPassword.jsx`
- [ ] Crear `Pages/Auth/ResetPassword.jsx`
- [ ] Crear `Pages/Auth/VerifyEmail.jsx`

### Fase 4 — Tests y Verificación (1-2 horas)
- [ ] Crear `tests/Feature/Auth/AuthenticationTest.php`
- [ ] `php artisan test`
- [ ] Probar flujo completo manualmente
- [ ] Verificar que rutas protegidas redirigen a /login
- [ ] Verificar email de verificación llega correctamente
- [ ] Verificar email de reset password llega correctamente
- [ ] Verificar si bloquea con mas de 5 intentos fallidos

---

## Seguridad — Resumen de medidas implementadas

| Medida | Implementación |
|--------|---------------|
| Passwords hasheadas | bcrypt con 12 rounds (`BCRYPT_ROUNDS=12`) |
| Rate limiting por IP+email | `RateLimiter` en `LoginController` (5 intentos) |
| Rate limiting de rutas | `throttle:10,1` en todas las rutas públicas |
| Session fixation | `$request->session()->regenerate()` en login |
| CSRF regenerado en logout | `$request->session()->regenerateToken()` |
| Sesiones encriptadas | `SESSION_ENCRYPT=true` |
| Cookies seguras | `SESSION_SECURE_COOKIE=true`, `http_only=true` |
| Email de verificación | `MustVerifyEmail` + middleware `verified` |
| Tokens de reset expiran | Laravel lo maneja por defecto (60 min) |
| No revelar si email existe | `ForgotPasswordController` siempre mismo mensaje |
| Passwords limpiados en frontend | `onFinish` limpia campos password |
| Ownership de mascotas | owner_name/email tomados del usuario autenticado |
| Logging de acciones | Login, logout, registro, errores |
| Input sanitizado | Mutators en el modelo User |
| Máximo 5 intentos fallidos de login|
