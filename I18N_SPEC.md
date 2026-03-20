# Spec: Multi-idioma (EN / ES)
## Laravel Localization + Inertia.js + React

---

## Estrategia

Laravel gestiona las traducciones en el servidor (`lang/`). Inertia las inyecta como prop global en cada request. React las consume con un helper `t()` sin librerías externas. El usuario cambia el idioma con un POST que persiste en la sesión.

```
[Usuario hace click EN/ES]
        ↓
POST /language/{locale}   →   Session::put('locale', 'es')
        ↓
Middleware SetLocale       →   App::setLocale('es')
        ↓
HandleInertiaRequests      →   share({ locale, translations })
        ↓
React helper t('key')      →   muestra texto traducido
```

---

## Archivos a crear / modificar

| Archivo | Acción |
|---------|--------|
| `lang/en.json` | Crear |
| `lang/es.json` | Crear |
| `app/Http/Middleware/SetLocale.php` | Crear |
| `app/Http/Controllers/LanguageController.php` | Crear |
| `resources/js/hooks/useTranslation.js` | Crear |
| `bootstrap/app.php` | Modificar — registrar middleware |
| `app/Http/Middleware/HandleInertiaRequests.php` | Modificar — compartir locale y traducciones |
| `routes/web.php` | Modificar — agregar ruta de cambio de idioma |
| `resources/js/Layouts/AuthLayout.jsx` | Modificar — agregar selector de idioma |
| `resources/js/Pages/Auth/Login.jsx` | Modificar — usar `t()` |
| `resources/js/Pages/Auth/Register.jsx` | Modificar — usar `t()` |
| `resources/js/Pages/Auth/ForgotPassword.jsx` | Modificar — usar `t()` |
| `resources/js/Pages/Auth/ResetPassword.jsx` | Modificar — usar `t()` |
| `resources/js/Pages/Auth/VerifyEmail.jsx` | Modificar — usar `t()` |
| `resources/js/Pages/Pets/Create.jsx` | Modificar — usar `t()` |
| `resources/js/Pages/Pets/Index.jsx` | Modificar — usar `t()` |

---

## Fase 1: Archivos de traducción

### `lang/en.json`

```json
{
  "app_name": "PetRegistry",

  "nav.my_pets": "My Pets",
  "nav.register_pet": "Register Pet",
  "nav.sign_out": "Sign out",

  "auth.login.title": "Welcome Back",
  "auth.login.subtitle": "Sign in to your account",
  "auth.login.email": "Email",
  "auth.login.password": "Password",
  "auth.login.forgot_password": "Forgot password?",
  "auth.login.remember_me": "Remember me",
  "auth.login.submit": "Sign In",
  "auth.login.submitting": "Signing in…",
  "auth.login.no_account": "Don't have an account?",
  "auth.login.create_one": "Create one",

  "auth.register.title": "Create Account",
  "auth.register.subtitle": "Join us to register your pets",
  "auth.register.name": "Full Name",
  "auth.register.name_placeholder": "e.g. Jane Smith",
  "auth.register.email": "Email",
  "auth.register.password": "Password",
  "auth.register.password_placeholder": "Min 8 chars, uppercase, number, symbol",
  "auth.register.password_hint": "Uppercase · Number · Symbol (@$!%*#?&)",
  "auth.register.confirm_password": "Confirm Password",
  "auth.register.confirm_placeholder": "Repeat your password",
  "auth.register.submit": "Create Account",
  "auth.register.submitting": "Creating account…",
  "auth.register.has_account": "Already have an account?",
  "auth.register.sign_in": "Sign in",
  "auth.register.fix_errors": "Please fix the following:",

  "auth.forgot.title": "Forgot Password",
  "auth.forgot.subtitle": "Enter your email to receive a reset link",
  "auth.forgot.submit": "Send Reset Link",
  "auth.forgot.submitting": "Sending…",
  "auth.forgot.back": "Back to Sign In",
  "auth.forgot.check_title": "Check Your Email",
  "auth.forgot.check_subtitle": "We sent you a reset link",

  "auth.reset.title": "Reset Password",
  "auth.reset.subtitle": "Choose a strong new password",
  "auth.reset.new_password": "New Password",
  "auth.reset.confirm_password": "Confirm Password",
  "auth.reset.submit": "Reset Password",
  "auth.reset.submitting": "Resetting…",
  "auth.reset.password_hint": "Uppercase · Number · Symbol (@$!%*#?&)",

  "auth.verify.title": "Verify Your Email",
  "auth.verify.description": "Please click the verification link in your email before continuing.",
  "auth.verify.resend": "Resend Verification Email",
  "auth.verify.resending": "Sending…",
  "auth.verify.sign_out": "Sign out",

  "pets.create.title": "Pet Registration",
  "pets.create.subtitle": "Register your furry friend with us",
  "pets.create.view_my_pets": "My Pets →",
  "pets.create.type_label": "Pet Type",
  "pets.create.dog_label": "Dog",
  "pets.create.dog_desc": "Loyal companion",
  "pets.create.cat_label": "Cat",
  "pets.create.cat_desc": "Independent spirit",
  "pets.create.name_label": "Pet Name",
  "pets.create.name_placeholder": "e.g. Buddy",
  "pets.create.breed_label": "Breed",
  "pets.create.breed_placeholder": "e.g. Labrador",
  "pets.create.age_label": "Age (years)",
  "pets.create.age_placeholder": "e.g. 3",
  "pets.create.owner_section": "Owner Information",
  "pets.create.submit": "Register Pet",
  "pets.create.submitting": "Registering…",

  "pets.index.title": "My Pets",
  "pets.index.subtitle": "All your registered furry friends",
  "pets.index.register_btn": "+ Register Pet",
  "pets.index.stat_total": "Total pets",
  "pets.index.stat_dogs": "Dogs",
  "pets.index.stat_cats": "Cats",
  "pets.index.search_placeholder": "Search by name or breed…",
  "pets.index.filter_all": "All",
  "pets.index.filter_dogs": "🐶 Dogs",
  "pets.index.filter_cats": "🐱 Cats",
  "pets.index.sort_newest": "Newest first",
  "pets.index.sort_oldest": "Oldest first",
  "pets.index.sort_name": "Name A–Z",
  "pets.index.sort_age": "By age",
  "pets.index.search_btn": "Search",
  "pets.index.no_breed": "No breed specified",
  "pets.index.age_less_than_1": "Less than 1 year",
  "pets.index.age_1_year": "1 year old",
  "pets.index.age_years": ":age years old",
  "pets.index.registered_on": "Registered",
  "pets.index.remove": "Remove",
  "pets.index.are_you_sure": "Are you sure?",
  "pets.index.cancel": "Cancel",
  "pets.index.confirm_remove": "Yes, remove",
  "pets.index.empty_title": "No pets registered yet",
  "pets.index.empty_subtitle": "Register your first furry friend!",
  "pets.index.empty_btn": "Register a pet",
  "pets.index.no_results_title": "No pets match your search",
  "pets.index.no_results_subtitle": "Try adjusting your filters",
  "pets.index.clear_filters": "Clear filters"
}
```

### `lang/es.json`

```json
{
  "app_name": "PetRegistry",

  "nav.my_pets": "Mis Mascotas",
  "nav.register_pet": "Registrar Mascota",
  "nav.sign_out": "Cerrar sesión",

  "auth.login.title": "Bienvenido",
  "auth.login.subtitle": "Ingresa a tu cuenta",
  "auth.login.email": "Correo electrónico",
  "auth.login.password": "Contraseña",
  "auth.login.forgot_password": "¿Olvidaste tu contraseña?",
  "auth.login.remember_me": "Recordarme",
  "auth.login.submit": "Ingresar",
  "auth.login.submitting": "Ingresando…",
  "auth.login.no_account": "¿No tienes una cuenta?",
  "auth.login.create_one": "Crear una",

  "auth.register.title": "Crear Cuenta",
  "auth.register.subtitle": "Únete para registrar a tus mascotas",
  "auth.register.name": "Nombre completo",
  "auth.register.name_placeholder": "Ej. Juan Pérez",
  "auth.register.email": "Correo electrónico",
  "auth.register.password": "Contraseña",
  "auth.register.password_placeholder": "Mín. 8 caracteres, mayúscula, número, símbolo",
  "auth.register.password_hint": "Mayúscula · Número · Símbolo (@$!%*#?&)",
  "auth.register.confirm_password": "Confirmar Contraseña",
  "auth.register.confirm_placeholder": "Repite tu contraseña",
  "auth.register.submit": "Crear Cuenta",
  "auth.register.submitting": "Creando cuenta…",
  "auth.register.has_account": "¿Ya tienes una cuenta?",
  "auth.register.sign_in": "Ingresar",
  "auth.register.fix_errors": "Por favor corrige los siguientes errores:",

  "auth.forgot.title": "Olvidé mi Contraseña",
  "auth.forgot.subtitle": "Ingresa tu correo para recibir un enlace de restablecimiento",
  "auth.forgot.submit": "Enviar Enlace",
  "auth.forgot.submitting": "Enviando…",
  "auth.forgot.back": "Volver al inicio de sesión",
  "auth.forgot.check_title": "Revisa tu Correo",
  "auth.forgot.check_subtitle": "Te enviamos un enlace de restablecimiento",

  "auth.reset.title": "Restablecer Contraseña",
  "auth.reset.subtitle": "Elige una nueva contraseña segura",
  "auth.reset.new_password": "Nueva Contraseña",
  "auth.reset.confirm_password": "Confirmar Contraseña",
  "auth.reset.submit": "Restablecer Contraseña",
  "auth.reset.submitting": "Restableciendo…",
  "auth.reset.password_hint": "Mayúscula · Número · Símbolo (@$!%*#?&)",

  "auth.verify.title": "Verifica tu Correo",
  "auth.verify.description": "Haz clic en el enlace de verificación que enviamos a tu correo antes de continuar.",
  "auth.verify.resend": "Reenviar correo de verificación",
  "auth.verify.resending": "Enviando…",
  "auth.verify.sign_out": "Cerrar sesión",

  "pets.create.title": "Registro de Mascotas",
  "pets.create.subtitle": "Registra a tu amigo peludo con nosotros",
  "pets.create.view_my_pets": "Mis Mascotas →",
  "pets.create.type_label": "Tipo de Mascota",
  "pets.create.dog_label": "Perro",
  "pets.create.dog_desc": "Compañero fiel",
  "pets.create.cat_label": "Gato",
  "pets.create.cat_desc": "Espíritu independiente",
  "pets.create.name_label": "Nombre de la Mascota",
  "pets.create.name_placeholder": "Ej. Max",
  "pets.create.breed_label": "Raza",
  "pets.create.breed_placeholder": "Ej. Labrador",
  "pets.create.age_label": "Edad (años)",
  "pets.create.age_placeholder": "Ej. 3",
  "pets.create.owner_section": "Información del Dueño",
  "pets.create.submit": "Registrar Mascota",
  "pets.create.submitting": "Registrando…",

  "pets.index.title": "Mis Mascotas",
  "pets.index.subtitle": "Todos tus amigos peludos registrados",
  "pets.index.register_btn": "+ Registrar Mascota",
  "pets.index.stat_total": "Total mascotas",
  "pets.index.stat_dogs": "Perros",
  "pets.index.stat_cats": "Gatos",
  "pets.index.search_placeholder": "Buscar por nombre o raza…",
  "pets.index.filter_all": "Todos",
  "pets.index.filter_dogs": "🐶 Perros",
  "pets.index.filter_cats": "🐱 Gatos",
  "pets.index.sort_newest": "Más recientes",
  "pets.index.sort_oldest": "Más antiguos",
  "pets.index.sort_name": "Nombre A–Z",
  "pets.index.sort_age": "Por edad",
  "pets.index.search_btn": "Buscar",
  "pets.index.no_breed": "Sin raza especificada",
  "pets.index.age_less_than_1": "Menos de 1 año",
  "pets.index.age_1_year": "1 año",
  "pets.index.age_years": ":age años",
  "pets.index.registered_on": "Registrado el",
  "pets.index.remove": "Eliminar",
  "pets.index.are_you_sure": "¿Estás seguro?",
  "pets.index.cancel": "Cancelar",
  "pets.index.confirm_remove": "Sí, eliminar",
  "pets.index.empty_title": "Aún no tienes mascotas registradas",
  "pets.index.empty_subtitle": "¡Registra a tu primer amigo peludo!",
  "pets.index.empty_btn": "Registrar mascota",
  "pets.index.no_results_title": "Ninguna mascota coincide con tu búsqueda",
  "pets.index.no_results_subtitle": "Intenta ajustar los filtros",
  "pets.index.clear_filters": "Limpiar filtros"
}
```

---

## Fase 2: Middleware `SetLocale`

```php
<?php
// app/Http/Middleware/SetLocale.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    private const SUPPORTED = ['en', 'es'];
    private const DEFAULT   = 'en';

    public function handle(Request $request, Closure $next): Response
    {
        $locale = Session::get('locale', config('app.locale', self::DEFAULT));

        if (! in_array($locale, self::SUPPORTED)) {
            $locale = self::DEFAULT;
        }

        App::setLocale($locale);

        return $next($request);
    }
}
```

---

## Fase 3: Registrar middleware en `bootstrap/app.php`

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->web(append: [
        \App\Http\Middleware\SetLocale::class,           // ← agregar primero
        \App\Http\Middleware\HandleInertiaRequests::class,
        \App\Http\Middleware\SecurityHeaders::class,
    ]);
})
```

---

## Fase 4: Controlador de idioma

```php
<?php
// app/Http/Controllers/LanguageController.php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class LanguageController extends Controller
{
    private const SUPPORTED = ['en', 'es'];

    public function switch(Request $request, string $locale): RedirectResponse
    {
        if (! in_array($locale, self::SUPPORTED)) {
            abort(404);
        }

        Session::put('locale', $locale);

        return redirect()->back();
    }
}
```

---

## Fase 5: Ruta de cambio de idioma en `routes/web.php`

```php
// Agregar antes de los grupos de rutas (pública, sin auth)
Route::post('/language/{locale}', [\App\Http\Controllers\LanguageController::class, 'switch'])
    ->name('language.switch')
    ->where('locale', 'en|es');
```

---

## Fase 6: Compartir traducciones con Inertia

```php
// app/Http/Middleware/HandleInertiaRequests.php

public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'flash' => [
            'success' => $request->session()->get('success'),
            'error'   => $request->session()->get('error'),
            'warning' => $request->session()->get('warning'),
            'info'    => $request->session()->get('info'),
            'status'  => $request->session()->get('status'),
        ],
        'auth' => [
            'user' => $request->user() ? [
                'id'             => $request->user()->id,
                'name'           => $request->user()->name,
                'email'          => $request->user()->email,
                'email_verified' => $request->user()->hasVerifiedEmail(),
            ] : null,
        ],
        // ── i18n ──────────────────────────────────────────
        'locale'       => app()->getLocale(),
        'translations' => $this->loadTranslations(),
    ];
}

private function loadTranslations(): array
{
    $locale = app()->getLocale();
    $path   = lang_path("{$locale}.json");

    if (! file_exists($path)) {
        $path = lang_path('en.json');
    }

    return json_decode(file_get_contents($path), true) ?? [];
}
```

---

## Fase 7: Hook React `useTranslation`

```js
// resources/js/hooks/useTranslation.js

import { usePage } from '@inertiajs/react';

export function useTranslation() {
    const { translations, locale } = usePage().props;

    /**
     * Traduce una clave. Soporta reemplazo de parámetros:
     *   t('pets.index.age_years', { age: 3 }) → "3 años" / "3 years old"
     */
    function t(key, params = {}) {
        let text = translations?.[key] ?? key;

        Object.entries(params).forEach(([param, value]) => {
            text = text.replace(`:${param}`, value);
        });

        return text;
    }

    return { t, locale };
}
```

---

## Fase 8: Selector de idioma — componente reutilizable

```jsx
// resources/js/Components/LanguageSwitcher.jsx

import { router } from '@inertiajs/react';
import { useTranslation } from '@/hooks/useTranslation';

export default function LanguageSwitcher() {
    const { locale } = useTranslation();

    function switchTo(lang) {
        router.post(`/language/${lang}`, {}, { preserveScroll: true });
    }

    return (
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
            <button
                onClick={() => switchTo('en')}
                className={`px-2.5 py-1.5 transition ${
                    locale === 'en'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
                EN
            </button>
            <button
                onClick={() => switchTo('es')}
                className={`px-2.5 py-1.5 transition ${
                    locale === 'es'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
                ES
            </button>
        </div>
    );
}
```

---

## Fase 9: Agregar selector en `AuthLayout`

```jsx
// resources/js/Layouts/AuthLayout.jsx

import LanguageSwitcher from '@/Components/LanguageSwitcher';

export default function AuthLayout({ title, subtitle, children }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Selector de idioma arriba a la derecha */}
                <div className="flex justify-end mb-4">
                    <LanguageSwitcher />
                </div>

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

---

## Fase 10: Aplicar `t()` en cada página

### `Login.jsx` — ejemplo de uso

```jsx
import { useTranslation } from '@/hooks/useTranslation';

export default function Login() {
    const { flash } = usePage().props;
    const { t } = useTranslation();

    // ...

    return (
        <AuthLayout title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
            <form onSubmit={submit} ...>
                <label>{t('auth.login.email')}</label>
                <input placeholder="jane@example.com" ... />

                <div className="flex justify-between">
                    <label>{t('auth.login.password')}</label>
                    <Link href="/forgot-password">{t('auth.login.forgot_password')}</Link>
                </div>

                <label>
                    <input type="checkbox" ... />
                    <span>{t('auth.login.remember_me')}</span>
                </label>

                <button>
                    {processing ? t('auth.login.submitting') : t('auth.login.submit')}
                </button>

                <p>
                    {t('auth.login.no_account')}{' '}
                    <Link href="/register">{t('auth.login.create_one')}</Link>
                </p>
            </form>
        </AuthLayout>
    );
}
```

### `Index.jsx` — edad con parámetro

```jsx
const { t } = useTranslation();

// Reemplaza la función AGE_LABEL actual:
const AGE_LABEL = (age) => {
    if (age === 0) return t('pets.index.age_less_than_1');
    if (age === 1) return t('pets.index.age_1_year');
    return t('pets.index.age_years', { age });
};

// Nav con selector integrado:
<nav ...>
    <div className="flex items-center gap-6">
        <span>🐾 {t('app_name')}</span>
        <Link href="/my-pets">{t('nav.my_pets')}</Link>
        <Link href="/">{t('nav.register_pet')}</Link>
    </div>
    <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <span>{auth?.user?.name}</span>
        <button onClick={() => router.post('/logout')}>{t('nav.sign_out')}</button>
    </div>
</nav>
```

### `Create.jsx` — tipo de mascota traducido

```jsx
// PET_TYPES ahora usa t() en lugar de strings fijos
// Se define DENTRO del componente para acceder a t():

export default function Create() {
    const { t } = useTranslation();

    const PET_TYPES = [
        { value: 'dog', emoji: '🐶', label: t('pets.create.dog_label'), description: t('pets.create.dog_desc') },
        { value: 'cat', emoji: '🐱', label: t('pets.create.cat_label'), description: t('pets.create.cat_desc') },
    ];

    // ...
}
```

---

## Fase 11: Mensajes de validación backend en español

Laravel tiene strings de validación predefinidos. Para traducirlos:

```bash
# Publicar los archivos de idioma de Laravel
php artisan lang:publish
```

Esto crea `lang/en/` con `validation.php`, `auth.php`, `passwords.php`, `pagination.php`. Luego crear `lang/es/` con las traducciones correspondientes.

### `lang/es/validation.php` — fragmento clave

```php
<?php

return [
    'required'  => 'El campo :attribute es obligatorio.',
    'email'     => 'El campo :attribute debe ser una dirección de correo válida.',
    'min'       => [
        'string' => 'El campo :attribute debe tener al menos :min caracteres.',
    ],
    'max'       => [
        'string' => 'El campo :attribute no debe exceder :max caracteres.',
    ],
    'unique'    => 'El :attribute ya está registrado.',
    'confirmed' => 'La confirmación de :attribute no coincide.',
    'integer'   => 'El campo :attribute debe ser un número entero.',
    'in'        => 'El valor seleccionado para :attribute no es válido.',
    'regex'     => 'El formato de :attribute no es válido.',

    'attributes' => [
        'name'       => 'nombre',
        'email'      => 'correo electrónico',
        'password'   => 'contraseña',
        'age'        => 'edad',
        'type'       => 'tipo',
        'breed'      => 'raza',
        'owner_name' => 'nombre del dueño',
    ],
];
```

### `lang/es/auth.php`

```php
<?php

return [
    'failed'   => 'Credenciales incorrectas.',
    'password' => 'La contraseña es incorrecta.',
    'throttle' => 'Demasiados intentos. Por favor intenta en :seconds segundos.',
];
```

### `lang/es/passwords.php`

```php
<?php

return [
    'reset'     => 'Tu contraseña ha sido restablecida.',
    'sent'      => 'Te enviamos el enlace de restablecimiento.',
    'throttled' => 'Por favor espera antes de intentar de nuevo.',
    'token'     => 'El token de restablecimiento no es válido.',
    'user'      => 'No encontramos un usuario con ese correo.',
];
```

---

## Fase 12: Tests

```php
<?php
// tests/Feature/LanguageSwitchTest.php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LanguageSwitchTest extends TestCase
{
    use RefreshDatabase;

    public function test_language_switch_to_spanish()
    {
        $response = $this->post('/language/es');

        $response->assertRedirect();
        $this->assertEquals('es', session('locale'));
    }

    public function test_language_switch_to_english()
    {
        $response = $this->post('/language/en');

        $response->assertRedirect();
        $this->assertEquals('en', session('locale'));
    }

    public function test_unsupported_locale_returns_404()
    {
        $this->post('/language/fr')->assertNotFound();
    }

    public function test_translations_shared_with_inertia_in_english()
    {
        $user = User::factory()->create();

        $this->withSession(['locale' => 'en'])
             ->actingAs($user)
             ->get('/my-pets')
             ->assertInertia(fn ($page) =>
                 $page->where('locale', 'en')
                      ->has('translations')
             );
    }

    public function test_translations_shared_with_inertia_in_spanish()
    {
        $user = User::factory()->create();

        $this->withSession(['locale' => 'es'])
             ->actingAs($user)
             ->get('/my-pets')
             ->assertInertia(fn ($page) =>
                 $page->where('locale', 'es')
                      ->has('translations')
             );
    }

    public function test_locale_persists_across_requests()
    {
        $user = User::factory()->create();

        // Cambiar a español
        $this->post('/language/es');

        // La siguiente request debe tener locale 'es'
        $this->actingAs($user)
             ->get('/my-pets')
             ->assertInertia(fn ($page) =>
                 $page->where('locale', 'es')
             );
    }
}
```

---

## Checklist de implementación

### Backend
- [ ] Crear `lang/en.json`
- [ ] Crear `lang/es.json`
- [ ] Crear `app/Http/Middleware/SetLocale.php`
- [ ] Registrar `SetLocale` en `bootstrap/app.php` (antes de `HandleInertiaRequests`)
- [ ] Crear `app/Http/Controllers/LanguageController.php`
- [ ] Agregar ruta `POST /language/{locale}` en `routes/web.php`
- [ ] Actualizar `HandleInertiaRequests::share()` con `locale` y `translations`
- [ ] `php artisan lang:publish`
- [ ] Crear `lang/es/validation.php`, `lang/es/auth.php`, `lang/es/passwords.php`

### Frontend
- [ ] Crear `resources/js/hooks/useTranslation.js`
- [ ] Crear `resources/js/Components/LanguageSwitcher.jsx`
- [ ] Actualizar `AuthLayout.jsx` con `<LanguageSwitcher />`
- [ ] Actualizar `Login.jsx` — reemplazar strings por `t()`
- [ ] Actualizar `Register.jsx` — reemplazar strings por `t()`
- [ ] Actualizar `ForgotPassword.jsx` — reemplazar strings por `t()`
- [ ] Actualizar `ResetPassword.jsx` — reemplazar strings por `t()`
- [ ] Actualizar `VerifyEmail.jsx` — reemplazar strings por `t()`
- [ ] Actualizar `Create.jsx` — mover `PET_TYPES` dentro del componente, usar `t()`
- [ ] Actualizar `Index.jsx` — agregar `<LanguageSwitcher />` en nav, usar `t()` en todo

### Tests y verificación
- [ ] Crear `tests/Feature/LanguageSwitchTest.php`
- [ ] `php artisan test`
- [ ] Verificar cambio EN → ES en el browser (todas las pantallas)
- [ ] Verificar que el idioma persiste al navegar entre páginas
- [ ] Verificar mensajes de validación en español al tener `locale=es`
