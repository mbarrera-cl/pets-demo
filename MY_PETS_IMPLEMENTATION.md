# Implementación: Mis Mascotas
## Vista moderna de mascotas registradas

---

## Contexto importante — Fix de migración

La migración actual tiene `owner_email` como `unique`, lo que impide registrar más de una mascota por usuario. Hay que removerlo antes de implementar esta feature.

---

## Fase 1: Migración — Quitar unique de owner_email

```bash
php artisan make:migration remove_unique_from_owner_email_in_pets_table
```

```php
<?php
// database/migrations/xxxx_remove_unique_from_owner_email_in_pets_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropUnique(['owner_email']);
            // El índice simple para búsquedas se mantiene
        });
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->unique('owner_email');
        });
    }
};
```

```bash
php artisan migrate
```

---

## Fase 2: Actualizar StorePetRequest — Quitar unique

```php
// app/Http/Requests/StorePetRequest.php
// Remover 'unique:pets' de owner_email (ya no aplica)
// La regla quedará solo en RegisterRequest para users

public function rules(): array
{
    return [
        'name'  => 'required|string|max:100|min:2',
        'type'  => 'required|in:dog,cat',
        'breed' => 'nullable|string|max:100',
        'age'   => 'required|integer|min:0|max:100',
    ];
}
```

---

## Fase 3: Actualizar PetController — Agregar index y destroy

```php
<?php
// app/Http/Controllers/PetController.php

namespace App\Http\Controllers;

use App\Http\Requests\StorePetRequest;
use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PetController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Pets/Create');
    }

    public function store(StorePetRequest $request): RedirectResponse
    {
        try {
            $validated = $request->validated();

            $validated['owner_name']  = $request->user()->name;
            $validated['owner_email'] = $request->user()->email;

            Pet::create($validated);

            Log::info('Pet registered successfully', [
                'user_id'  => $request->user()->id,
                'pet_name' => $validated['name'],
            ]);

            return redirect()->route('pets.index')
                ->with('success', 'Pet registered successfully!');
        } catch (\Exception $e) {
            Log::error('Failed to register pet', ['error' => $e->getMessage()]);

            return redirect()->back()->withInput()
                ->with('error', 'Failed to register pet. Please try again.');
        }
    }

    public function index(Request $request): Response
    {
        $query = Pet::byOwner($request->user()->email);

        // Filtro por tipo
        if ($request->filled('type') && in_array($request->type, ['dog', 'cat'])) {
            $query->ofType($request->type);
        }

        // Búsqueda por nombre o raza
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('breed', 'like', "%{$search}%");
            });
        }

        // Ordenar
        $sort = $request->get('sort', 'newest');
        match ($sort) {
            'oldest' => $query->oldest(),
            'name'   => $query->orderBy('name'),
            'age'    => $query->orderBy('age'),
            default  => $query->latest(),
        };

        $pets = $query->paginate(9)->withQueryString();

        // Stats del usuario
        $stats = [
            'total' => Pet::byOwner($request->user()->email)->count(),
            'dogs'  => Pet::byOwner($request->user()->email)->ofType('dog')->count(),
            'cats'  => Pet::byOwner($request->user()->email)->ofType('cat')->count(),
        ];

        return Inertia::render('Pets/Index', [
            'pets'    => $pets,
            'stats'   => $stats,
            'filters' => $request->only(['type', 'search', 'sort']),
        ]);
    }

    public function destroy(Request $request, Pet $pet): RedirectResponse
    {
        // Verificar ownership — solo el dueño puede eliminar
        if ($pet->owner_email !== $request->user()->email) {
            abort(403);
        }

        $petName = $pet->name;
        $pet->delete();

        Log::info('Pet deleted', [
            'user_id'  => $request->user()->id,
            'pet_name' => $petName,
        ]);

        return redirect()->route('pets.index')
            ->with('success', "{$petName} has been removed.");
    }
}
```

---

## Fase 4: Actualizar Rutas

```php
// routes/web.php — dentro del grupo ['verified', 'throttle:30,1']

Route::middleware(['verified', 'throttle:30,1'])->group(function () {
    Route::get('/', [PetController::class, 'create'])->name('pets.create');
    Route::post('/pets', [PetController::class, 'store'])->name('pets.store');

    // Nueva ruta
    Route::get('/my-pets', [PetController::class, 'index'])->name('pets.index');
    Route::delete('/pets/{pet}', [PetController::class, 'destroy'])->name('pets.destroy');
});
```

---

## Fase 5: Componente React — `resources/js/Pages/Pets/Index.jsx`

```jsx
import { useState } from 'react';
import { Link, router, usePage, useForm } from '@inertiajs/react';

// ─── Constantes ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    dog: { emoji: '🐶', label: 'Dog',  color: 'amber'  },
    cat: { emoji: '🐱', label: 'Cat',  color: 'purple' },
};

const AGE_LABEL = (age) => {
    if (age === 0) return 'Less than 1 year';
    return age === 1 ? '1 year old' : `${age} years old`;
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatCard({ emoji, label, value, color }) {
    const colors = {
        indigo: 'from-indigo-500 to-indigo-600',
        amber:  'from-amber-400 to-amber-500',
        purple: 'from-purple-500 to-purple-600',
    };
    return (
        <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white shadow-sm`}>
            <p className="text-3xl mb-1">{emoji}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm opacity-80">{label}</p>
        </div>
    );
}

function PetCard({ pet, onDelete }) {
    const cfg = TYPE_CONFIG[pet.type];
    const [confirming, setConfirming] = useState(false);

    const bgColors = {
        amber:  'bg-amber-50  border-amber-100',
        purple: 'bg-purple-50 border-purple-100',
    };

    const badgeColors = {
        amber:  'bg-amber-100  text-amber-700',
        purple: 'bg-purple-100 text-purple-700',
    };

    return (
        <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            {/* Header con emoji */}
            <div className={`${bgColors[cfg.color]} border-b px-5 py-4 flex items-center justify-between`}>
                <span className="text-4xl">{cfg.emoji}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColors[cfg.color]}`}>
                    {cfg.label}
                </span>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
                    {pet.breed
                        ? <p className="text-sm text-gray-500">{pet.breed}</p>
                        : <p className="text-sm text-gray-400 italic">No breed specified</p>
                    }
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                        <span className="text-gray-400">🎂</span>
                        {AGE_LABEL(pet.age)}
                    </span>
                </div>

                <p className="text-xs text-gray-400">
                    Registered {new Date(pet.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                    })}
                </p>
            </div>

            {/* Footer con acción eliminar */}
            <div className="px-5 py-3 border-t border-gray-50 flex justify-end">
                {!confirming ? (
                    <button
                        onClick={() => setConfirming(true)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                        Remove
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">Are you sure?</span>
                        <button
                            onClick={() => setConfirming(false)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onDelete(pet.id)}
                            className="text-xs font-medium text-red-500 hover:text-red-700"
                        >
                            Yes, remove
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyState({ hasFilters, onClear }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <p className="text-6xl mb-4">{hasFilters ? '🔍' : '🐾'}</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
                {hasFilters ? 'No pets match your search' : 'No pets registered yet'}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
                {hasFilters
                    ? 'Try adjusting your filters'
                    : 'Register your first furry friend!'
                }
            </p>
            {hasFilters ? (
                <button
                    onClick={onClear}
                    className="text-sm text-indigo-600 font-medium hover:underline"
                >
                    Clear filters
                </button>
            ) : (
                <Link
                    href="/"
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-purple-700 transition"
                >
                    Register a pet
                </Link>
            )}
        </div>
    );
}

function Pagination({ links }) {
    return (
        <div className="flex items-center justify-center gap-1 mt-8">
            {links.map((link, i) => (
                <button
                    key={i}
                    disabled={!link.url || link.active}
                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        link.active
                            ? 'bg-indigo-600 text-white font-semibold'
                            : link.url
                            ? 'text-gray-600 hover:bg-gray-100'
                            : 'text-gray-300 cursor-not-allowed'
                    }`}
                />
            ))}
        </div>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Index({ pets, stats, filters }) {
    const { flash, auth } = usePage().props;
    const { delete: destroy, processing } = useForm({});

    const [search, setSearch]   = useState(filters.search ?? '');
    const [type, setType]       = useState(filters.type ?? '');
    const [sort, setSort]       = useState(filters.sort ?? 'newest');

    const hasFilters = !!(filters.search || filters.type);

    function applyFilters(overrides = {}) {
        const params = { search, type, sort, ...overrides };
        // Limpiar parámetros vacíos
        Object.keys(params).forEach((k) => !params[k] && delete params[k]);
        router.get('/my-pets', params, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch('');
        setType('');
        setSort('newest');
        router.get('/my-pets', {}, { preserveState: false });
    }

    function handleDelete(petId) {
        destroy(`/pets/${petId}`, { preserveScroll: true });
    }

    function handleSearchKeyDown(e) {
        if (e.key === 'Enter') applyFilters({ search });
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            {/* Nav */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <span className="font-semibold text-gray-900">🐾 PetRegistry</span>
                        <div className="hidden sm:flex items-center gap-4 text-sm">
                            <Link
                                href="/my-pets"
                                className="text-indigo-600 font-medium border-b-2 border-indigo-600 pb-0.5"
                            >
                                My Pets
                            </Link>
                            <Link href="/" className="text-gray-500 hover:text-gray-800 transition">
                                Register Pet
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 hidden sm:block">{auth?.user?.name}</span>
                        <button
                            onClick={() => router.post('/logout')}
                            className="text-sm text-gray-400 hover:text-gray-700 transition"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

                {/* Flash */}
                {flash?.success && (
                    <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
                        {flash.success}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Pets</h1>
                        <p className="text-sm text-gray-500 mt-0.5">All your registered furry friends</p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-purple-700 transition"
                    >
                        <span>+</span> Register Pet
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <StatCard emoji="🐾" label="Total pets"  value={stats.total} color="indigo" />
                    <StatCard emoji="🐶" label="Dogs"        value={stats.dogs}  color="amber"  />
                    <StatCard emoji="🐱" label="Cats"        value={stats.cats}  color="purple" />
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Search by name or breed…"
                                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                            />
                        </div>

                        {/* Type filter */}
                        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
                            {[
                                { value: '',    label: 'All'  },
                                { value: 'dog', label: '🐶 Dogs' },
                                { value: 'cat', label: '🐱 Cats' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setType(opt.value);
                                        applyFilters({ type: opt.value });
                                    }}
                                    className={`px-4 py-2.5 transition ${
                                        type === opt.value
                                            ? 'bg-indigo-600 text-white font-medium'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Sort */}
                        <select
                            value={sort}
                            onChange={(e) => {
                                setSort(e.target.value);
                                applyFilters({ sort: e.target.value });
                            }}
                            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 bg-white text-gray-600 transition"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="name">Name A–Z</option>
                            <option value="age">By age</option>
                        </select>

                        {/* Buscar button */}
                        <button
                            onClick={() => applyFilters()}
                            className="px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Grid de mascotas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pets.data.length === 0 ? (
                        <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
                    ) : (
                        pets.data.map((pet) => (
                            <PetCard
                                key={pet.id}
                                pet={pet}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>

                {/* Paginación */}
                {pets.last_page > 1 && <Pagination links={pets.links} />}
            </div>
        </div>
    );
}
```

---

## Fase 6: Actualizar Create.jsx — Redirect a My Pets tras registro

En `resources/js/Pages/Pets/Create.jsx`, agregar un link de navegación al header:

```jsx
// Cambiar el header de Create.jsx para incluir nav a "My Pets"
<div className="flex items-center justify-between mb-8">
    <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-1">Pet Registration</h1>
        <p className="text-gray-500 text-sm">Register your furry friend with us</p>
    </div>
    <div className="flex flex-col items-end gap-1">
        <Link
            href="/my-pets"
            className="text-sm text-indigo-600 font-medium hover:underline"
        >
            View my pets →
        </Link>
        <button
            onClick={() => router.post('/logout')}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
            Sign out ({auth?.user?.name})
        </button>
    </div>
</div>
```

Y agregar `Link, router` a los imports:
```jsx
import { useForm, usePage, router, Link } from '@inertiajs/react';
```

---

## Fase 7: Tests

```bash
php artisan make:test Feature/PetIndexTest
```

```php
<?php
// tests/Feature/PetIndexTest.php

namespace Tests\Feature;

use App\Models\Pet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PetIndexTest extends TestCase
{
    use RefreshDatabase;

    private function userWithPets(int $count = 3): User
    {
        $user = User::factory()->create();

        for ($i = 1; $i <= $count; $i++) {
            Pet::create([
                'name'        => "Pet {$i}",
                'type'        => $i % 2 === 0 ? 'cat' : 'dog',
                'breed'       => 'Mixed',
                'age'         => $i,
                'owner_name'  => $user->name,
                'owner_email' => $user->email,
            ]);
        }

        return $user;
    }

    public function test_index_requires_authentication()
    {
        $this->get('/my-pets')->assertRedirect('/login');
    }

    public function test_index_shows_only_own_pets()
    {
        $user  = $this->userWithPets(2);
        $other = User::factory()->create();
        Pet::create([
            'name'        => 'Other Dog',
            'type'        => 'dog',
            'age'         => 1,
            'owner_name'  => $other->name,
            'owner_email' => $other->email,
        ]);

        $response = $this->actingAs($user)->get('/my-pets');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Pets/Index')
                 ->where('stats.total', 2)
        );
    }

    public function test_index_filters_by_type()
    {
        $user = $this->userWithPets(3); // 2 dogs, 1 cat

        $response = $this->actingAs($user)->get('/my-pets?type=dog');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->where('pets.total', 2)
        );
    }

    public function test_index_filters_by_search()
    {
        $user = User::factory()->create();
        Pet::create([
            'name' => 'Buddy', 'type' => 'dog', 'age' => 2,
            'owner_name' => $user->name, 'owner_email' => $user->email,
        ]);
        Pet::create([
            'name' => 'Luna', 'type' => 'cat', 'age' => 1,
            'owner_name' => $user->name, 'owner_email' => $user->email,
        ]);

        $response = $this->actingAs($user)->get('/my-pets?search=Buddy');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->where('pets.total', 1)
        );
    }

    public function test_delete_removes_own_pet()
    {
        $user = User::factory()->create();
        $pet  = Pet::create([
            'name' => 'Buddy', 'type' => 'dog', 'age' => 2,
            'owner_name' => $user->name, 'owner_email' => $user->email,
        ]);

        $response = $this->actingAs($user)->delete("/pets/{$pet->id}");

        $response->assertRedirect(route('pets.index'));
        $this->assertDatabaseMissing('pets', ['id' => $pet->id]);
    }

    public function test_delete_rejects_other_users_pet()
    {
        $user  = User::factory()->create();
        $other = User::factory()->create();
        $pet   = Pet::create([
            'name' => 'Buddy', 'type' => 'dog', 'age' => 2,
            'owner_name' => $other->name, 'owner_email' => $other->email,
        ]);

        $response = $this->actingAs($user)->delete("/pets/{$pet->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('pets', ['id' => $pet->id]);
    }

    public function test_stats_are_correct()
    {
        $user = $this->userWithPets(3); // 2 dogs, 1 cat

        $response = $this->actingAs($user)->get('/my-pets');

        $response->assertInertia(fn ($page) =>
            $page->where('stats.total', 3)
                 ->where('stats.dogs', 2)
                 ->where('stats.cats', 1)
        );
    }
}
```

```bash
php artisan test --filter PetIndexTest
```

---

## Checklist de Implementación

- [ ] Crear migración `remove_unique_from_owner_email`
- [ ] `php artisan migrate`
- [ ] Actualizar `StorePetRequest` — quitar validación `unique:pets`
- [ ] Agregar `index()` y `destroy()` en `PetController`
- [ ] Cambiar redirect en `store()` de `pets.create` a `pets.index`
- [ ] Agregar rutas `GET /my-pets` y `DELETE /pets/{pet}` en `web.php`
- [ ] Crear `resources/js/Pages/Pets/Index.jsx`
- [ ] Actualizar `Create.jsx` — agregar nav con link a My Pets + imports
- [ ] `php artisan test --filter PetIndexTest`

---

## Vista previa del diseño

```
┌─────────────────────────────────────────────────────────┐
│  🐾 PetRegistry    My Pets  Register Pet      Manuel ↩  │  ← Nav sticky
├─────────────────────────────────────────────────────────┤
│                                                         │
│  My Pets                          [+ Register Pet]      │  ← Header
│  All your registered furry friends                      │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ 🐾           │ │ 🐶           │ │ 🐱           │   │  ← Stats
│  │ 5            │ │ 3            │ │ 2            │   │
│  │ Total pets   │ │ Dogs         │ │ Cats         │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                         │
│  ┌──[🔍 Search name or breed...]──[All|🐶|🐱]─[↕]──┐  │  ← Filtros
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  ┌────────────────┐ ┌────────────────┐ ┌──────────────┐ │
│  │ 🐶             │ │ 🐱             │ │ 🐶           │ │  ← Cards
│  │          Dog   │ │          Cat   │ │        Dog   │ │
│  │─────────────── │ │─────────────── │ │──────────────│ │
│  │ Buddy          │ │ Luna           │ │ Max          │ │
│  │ Golden Retr.   │ │ Siamese        │ │ Labrador     │ │
│  │ 🎂 3 years old │ │ 🎂 1 year old  │ │ 🎂 5 years   │ │
│  │ Mar 19, 2026   │ │ Mar 20, 2026   │ │ Mar 20, 2026 │ │
│  │────────────────│ │────────────────│ │──────────────│ │
│  │         Remove │ │         Remove │ │       Remove │ │
│  └────────────────┘ └────────────────┘ └──────────────┘ │
│                                                         │
│              ← 1  2  3 →                                │  ← Paginación
└─────────────────────────────────────────────────────────┘
```
