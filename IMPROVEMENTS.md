# Guía de Mejoras - Ejemplos de Código

Este documento contiene ejemplos prácticos de cómo implementar las mejoras recomendadas en la revisión.

---

## 1. Crear FormRequest para Validación

**Archivo a crear:** `app/Http/Requests/StorePetRequest.php`

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePetRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Implementar cuando haya autenticación
        // return $this->user() !== null;
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'        => 'required|string|max:100|min:2',
            'type'        => 'required|in:dog,cat',
            'breed'       => 'nullable|string|max:100',
            'age'         => 'required|integer|min:0|max:100',
            'owner_name'  => 'required|string|max:100|min:2',
            'owner_email' => 'required|email:rfc,dns|max:150|unique:pets',
        ];
    }

    /**
     * Get custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'name.required'        => 'Pet name is required',
            'name.max'             => 'Pet name cannot exceed 100 characters',
            'type.required'        => 'Please select a pet type',
            'type.in'              => 'Invalid pet type selected',
            'age.required'         => 'Age is required',
            'age.min'              => 'Age cannot be negative',
            'age.max'              => 'Age cannot exceed 100 years',
            'owner_name.required'  => 'Owner name is required',
            'owner_email.required' => 'Owner email is required',
            'owner_email.email'    => 'Please provide a valid email address',
            'owner_email.unique'   => 'This email is already registered',
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     */
    public function attributes(): array
    {
        return [
            'owner_email' => 'email address',
            'owner_name'  => 'full name',
        ];
    }
}
```

---

## 2. Actualizar PetController

**Archivo a actualizar:** `app/Http/Controllers/PetController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePetRequest;
use App\Models\Pet;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class PetController extends Controller
{
    /**
     * Show the form for creating a new pet.
     */
    public function create(): Response
    {
        return Inertia::render('Pets/Create');
    }

    /**
     * Store a newly created pet in storage.
     *
     * @param StorePetRequest $request
     * @return RedirectResponse
     */
    public function store(StorePetRequest $request): RedirectResponse
    {
        try {
            $validated = $request->validated();

            Pet::create($validated);

            Log::info('Pet registered successfully', [
                'owner_email' => $validated['owner_email'],
                'pet_name'    => $validated['name'],
            ]);

            return redirect()
                ->route('pets.create')
                ->with('success', 'Pet registered successfully!');
        } catch (\Exception $e) {
            Log::error('Failed to register pet', [
                'error'   => $e->getMessage(),
                'email'   => $request->input('owner_email'),
            ]);

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Failed to register pet. Please try again.');
        }
    }

    /**
     * Show registered pets for the current user (when auth is implemented)
     */
    public function index(): Response
    {
        // Future implementation
        // $pets = Pet::byOwner(auth()->user()->email)->get();
        // return Inertia::render('Pets/Index', ['pets' => $pets]);
        return Inertia::render('Pets/Create');
    }
}
```

---

## 3. Mejorar el Modelo Pet

**Archivo a actualizar:** `app/Models/Pet.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

#[Fillable(['name', 'type', 'breed', 'age', 'owner_name', 'owner_email'])]
class Pet extends Model
{
    /**
     * Get all pets for a specific owner email
     */
    public function scopeByOwner($query, string $email)
    {
        return $query->where('owner_email', $email);
    }

    /**
     * Get pets of a specific type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Get pets older than specified age
     */
    public function scopeOlderThan($query, int $age)
    {
        return $query->where('age', '>=', $age);
    }

    /**
     * Sanitize and format pet name
     */
    protected function name(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => trim(strip_tags($value)),
        );
    }

    /**
     * Sanitize owner name
     */
    protected function ownerName(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => trim(strip_tags($value)),
        );
    }

    /**
     * Format email to lowercase
     */
    protected function ownerEmail(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => strtolower(trim($value)),
        );
    }

    /**
     * Validation rules for the model
     */
    public static array $rules = [
        'name'        => 'required|string|max:100',
        'type'        => 'required|in:dog,cat',
        'breed'       => 'nullable|string|max:100',
        'age'         => 'required|integer|min:0|max:100',
        'owner_name'  => 'required|string|max:100',
        'owner_email' => 'required|email|unique:pets',
    ];
}
```

---

## 4. Actualizar Rutas con Seguridad

**Archivo a actualizar:** `routes/web.php`

```php
<?php

use App\Http\Controllers\PetController;
use Illuminate\Support\Facades\Route;

// Public routes - sin autenticación por ahora
// En futuro, esto debería estar bajo middleware 'auth'
Route::middleware('throttle:10,1')->group(function () {
    Route::get('/', [PetController::class, 'create'])->name('pets.create');
    Route::post('/pets', [PetController::class, 'store'])->name('pets.store');
});

// Rutas protegidas para futuro (cuando se implemente auth)
// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::get('/my-pets', [PetController::class, 'index'])->name('pets.index');
//     Route::get('/pets/{pet}/edit', [PetController::class, 'edit'])->name('pets.edit');
//     Route::put('/pets/{pet}', [PetController::class, 'update'])->name('pets.update');
//     Route::delete('/pets/{pet}', [PetController::class, 'destroy'])->name('pets.destroy');
// });
```

---

## 5. Migration con Índices

**Archivo a actualizar:** `database/migrations/2026_03_19_235843_create_pets_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pets', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->enum('type', ['dog', 'cat']);
            $table->string('breed', 100)->nullable();
            $table->unsignedSmallInteger('age');
            $table->string('owner_name', 100);
            $table->string('owner_email', 150)->unique(); // Agregado índice único
            $table->timestamps();

            // Índices para queries comunes
            $table->index('owner_email');
            $table->index(['type', 'owner_email']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pets');
    }
};
```

---

## 6. Tests Feature Completos

**Archivo a crear:** `tests/Feature/PetRegistrationTest.php`

```php
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PetRegistrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test successful pet registration
     */
    public function test_pet_registration_succeeds_with_valid_data()
    {
        $response = $this->post('/pets', [
            'name'        => 'Buddy',
            'type'        => 'dog',
            'breed'       => 'Golden Retriever',
            'age'         => 3,
            'owner_name'  => 'John Doe',
            'owner_email' => 'john.doe@example.com',
        ]);

        $response->assertRedirect(route('pets.create'));
        $response->assertSessionHas('success', 'Pet registered successfully!');
        $this->assertDatabaseHas('pets', [
            'name'        => 'Buddy',
            'type'        => 'dog',
            'owner_email' => 'john.doe@example.com',
        ]);
    }

    /**
     * Test pet registration with invalid email
     */
    public function test_pet_registration_fails_with_invalid_email()
    {
        $response = $this->post('/pets', [
            'name'        => 'Buddy',
            'type'        => 'dog',
            'breed'       => 'Golden Retriever',
            'age'         => 3,
            'owner_name'  => 'John Doe',
            'owner_email' => 'invalid-email', // Invalid email
        ]);

        $response->assertSessionHasErrors('owner_email');
        $this->assertDatabaseMissing('pets', ['name' => 'Buddy']);
    }

    /**
     * Test pet registration fails with duplicate email
     */
    public function test_pet_registration_fails_with_duplicate_email()
    {
        $this->post('/pets', [
            'name'        => 'Buddy',
            'type'        => 'dog',
            'breed'       => 'Golden Retriever',
            'age'         => 3,
            'owner_name'  => 'John Doe',
            'owner_email' => 'john.doe@example.com',
        ]);

        $response = $this->post('/pets', [
            'name'        => 'Max',
            'type'        => 'cat',
            'breed'       => 'Siamese',
            'age'         => 5,
            'owner_name'  => 'John Doe',
            'owner_email' => 'john.doe@example.com', // Same email
        ]);

        $response->assertSessionHasErrors('owner_email');
    }

    /**
     * Test pet registration fails with missing required fields
     */
    public function test_pet_registration_fails_with_missing_required_fields()
    {
        $response = $this->post('/pets', [
            'name'        => 'Buddy',
            // Missing type, age, owner_name, owner_email
        ]);

        $response->assertSessionHasErrors(['type', 'age', 'owner_name', 'owner_email']);
    }

    /**
     * Test pet registration fails with invalid pet type
     */
    public function test_pet_registration_fails_with_invalid_pet_type()
    {
        $response = $this->post('/pets', [
            'name'        => 'Buddy',
            'type'        => 'bird', // Invalid type
            'breed'       => 'Golden Retriever',
            'age'         => 3,
            'owner_name'  => 'John Doe',
            'owner_email' => 'john.doe@example.com',
        ]);

        $response->assertSessionHasErrors('type');
    }

    /**
     * Test pet registration fails with negative age
     */
    public function test_pet_registration_fails_with_negative_age()
    {
        $response = $this->post('/pets', [
            'name'        => 'Buddy',
            'type'        => 'dog',
            'breed'       => 'Golden Retriever',
            'age'         => -1, // Negative age
            'owner_name'  => 'John Doe',
            'owner_email' => 'john.doe@example.com',
        ]);

        $response->assertSessionHasErrors('age');
    }

    /**
     * Test pet registration fails with name exceeding max length
     */
    public function test_pet_registration_fails_with_name_exceeding_max_length()
    {
        $response = $this->post('/pets', [
            'name'        => str_repeat('a', 101), // 101 characters
            'type'        => 'dog',
            'breed'       => 'Golden Retriever',
            'age'         => 3,
            'owner_name'  => 'John Doe',
            'owner_email' => 'john.doe@example.com',
        ]);

        $response->assertSessionHasErrors('name');
    }

    /**
     * Test GET request to pets create returns 200
     */
    public function test_pets_create_page_returns_200()
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
```

---

## 7. Configuración de Middleware Inertia Mejorada

**Archivo a actualizar:** `app/Http/Middleware/HandleInertiaRequests.php`

```php
<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info'    => $request->session()->get('info'),
            ],
            'csrf_token' => csrf_token(),
            'app' => [
                'name' => config('app.name'),
                'env'  => config('app.env'),
            ],
        ];
    }
}
```

---

## 8. Actualizar Frontend React con Error Summary

**Archivo a actualizar:** `resources/js/Pages/Pets/Create.jsx`

Solo la parte del formulario con error summary agregado:

```jsx
{/* Error Summary */}
{Object.keys(errors).length > 0 && (
    <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
        <h3 className="text-sm font-semibold text-red-800 mb-3">
            Please fix the following errors:
        </h3>
        <ul className="space-y-2">
            {Object.entries(errors).map(([field, error]) => (
                <li key={field} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{error}</span>
                </li>
            ))}
        </ul>
    </div>
)}

<form
    onSubmit={submit}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5"
>
    {/* Pet type selector */}
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
            Pet Type <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
            {PET_TYPES.map((pt) => (
                <button
                    key={pt.value}
                    type="button"
                    disabled={processing} // Agregado
                    onClick={() => setData('type', pt.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 py-4 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        data.type === pt.value
                            ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                >
                    <span className="text-3xl">{pt.emoji}</span>
                    <span className="text-sm font-semibold text-gray-800">{pt.label}</span>
                    <span className="text-xs text-gray-400">{pt.description}</span>
                </button>
            ))}
        </div>
        {errors.type && (
            <p className="mt-1.5 text-xs text-red-500">{errors.type}</p>
        )}
    </div>

    {/* Pet name - con disabled agregado */}
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Pet Name <span className="text-red-400">*</span>
        </label>
        <input
            type="text"
            disabled={processing}
            value={data.name}
            onChange={(e) => setData('name', e.target.value)}
            placeholder="e.g. Buddy"
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500/30 ${
                errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
            }`}
        />
        {errors.name && (
            <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>
        )}
    </div>

    {/* ... resto de los campos con disabled agregado */}

    {/* Submit Button */}
    <button
        type="submit"
        disabled={processing}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
        {processing && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
        )}
        {processing ? 'Registering…' : 'Register Pet'}
    </button>
</form>
```

---

## 9. Variables de Entorno Seguras

**Crear .env.example (versionar este archivo):**

```env
APP_NAME=PetRegistry
APP_ENV=local
APP_KEY=
APP_DEBUG=false
APP_URL=http://localhost

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false

QUEUE_CONNECTION=database
CACHE_STORE=database

MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@petregistry.local
MAIL_FROM_NAME="${APP_NAME}"
```

**Actualizar .gitignore:**

```
/.env
/.env.local
/.env.*.local
/.env.backup
/.env.production.backup
/storage/logs/
```

---

## 10. Agregar Session Table Migration

```bash
# Ejecutar para crear tabla de sessions
php artisan session:table
php artisan migrate
```

---

## Ejecución de Mejoras

```bash
# 1. Generar clase FormRequest
php artisan make:request StorePetRequest

# 2. Generar tabla de sessions
php artisan session:table
php artisan migrate

# 3. Crear tests
php artisan make:test Feature/PetRegistrationTest

# 4. Ejecutar tests
php artisan test

# 5. Ejecutar code style
./vendor/bin/pint

# 6. Para producción
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Resumen de Cambios

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `.env` | Desactivar DEBUG=false | CRÍTICA |
| `.gitignore` | Agregar .env | CRÍTICA |
| `routes/web.php` | Agregar throttle, auth middleware | ALTA |
| `app/Http/Controllers/PetController.php` | Usar StorePetRequest, error handling | ALTA |
| `app/Http/Requests/StorePetRequest.php` | Crear nuevo archivo | ALTA |
| `app/Models/Pet.php` | Agregar métodos, scopes, attributes | MEDIA |
| `database/migrations/...` | Agregar índices | MEDIA |
| `tests/Feature/PetRegistrationTest.php` | Crear tests completos | MEDIA |
| `resources/js/Pages/Pets/Create.jsx` | Error summary, disabled inputs | BAJA |

