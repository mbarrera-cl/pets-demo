# Plan: Enfermedades por Raza con Claude API

## Contexto

El admin panel ya tiene una tabla de mascotas (`/admin/pets`) pero las filas no son clickeables — no existe página de detalle. Se quiere: al hacer clic en una mascota, abrir una página de detalle que muestre la información del animal **más** las principales enfermedades/condiciones de salud de su raza, obtenidas dinámicamente desde la **API de Claude**.

Las enfermedades se cachean por raza (no por mascota) en la columna `health_info` de la tabla `breeds`. Si la raza no está en esa tabla (campo libre en pets), se usa Laravel Cache con TTL de 7 días.

---

## Archivos a CREAR (4)

| Archivo | Propósito |
|---|---|
| `database/migrations/2026_03_24_000004_add_health_info_to_breeds_table.php` | Agrega columna `health_info` JSON nullable a `breeds` |
| `app/Services/BreedHealthService.php` | Llama a la API de Claude, cachea el resultado |
| `resources/js/Pages/Admin/Pets/Show.jsx` | Página de detalle del pet con sección de salud |
| `tests/Feature/Admin/AdminPetShowTest.php` | Tests del show y endpoint de salud |

---

## Archivos a MODIFICAR (7)

| Archivo | Cambio |
|---|---|
| `app/Http/Controllers/Admin/AdminPetController.php` | Agregar método `show()` y `healthInsights()` |
| `resources/js/Pages/Admin/Pets/Index.jsx` | Hacer filas clickeables (link a `/admin/pets/{id}`) |
| `routes/web.php` | Rutas `admin.pets.show` y `admin.pets.health` |
| `config/services.php` | Agregar bloque `anthropic` |
| `.env` + `.env.example` | Agregar `ANTHROPIC_API_KEY` |
| `app/Models/Breed.php` | Agregar `health_info` a `$fillable` y cast JSON |
| `lang/en.json` + `lang/es.json` | Claves `admin.pet_show.*` y `admin.health.*` |

---

## Migración

```php
// 2026_03_24_000004_add_health_info_to_breeds_table.php
$table->json('health_info')->nullable()->after('sort_order');
```

---

## BreedHealthService

```php
// app/Services/BreedHealthService.php
namespace App\Services;

use App\Models\Breed;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class BreedHealthService
{
    public function getConditions(string $breedName, string $type): array
    {
        if (!$breedName) return [];

        // 1. Buscar en tabla breeds
        $breed = Breed::where('name', $breedName)->where('type', $type)->first();
        if ($breed?->health_info) {
            return $breed->health_info;
        }

        // 2. Buscar en Laravel cache
        $cacheKey = 'breed_health_' . Str::slug("{$type}_{$breedName}");
        $conditions = Cache::remember($cacheKey, now()->addDays(7), function () use ($breedName, $type) {
            return $this->fetchFromClaude($breedName, $type);
        });

        // 3. Persistir en breeds si existe el registro
        if ($breed && !$breed->health_info) {
            $breed->update(['health_info' => $conditions]);
        }

        return $conditions;
    }

    private function fetchFromClaude(string $breedName, string $type): array
    {
        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.api_key'),
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model'      => config('services.anthropic.model'),
            'max_tokens' => 1024,
            'messages'   => [[
                'role'    => 'user',
                'content' => "List the 5 most common health conditions for a {$type} of breed \"{$breedName}\". For each condition provide: name, description (1-2 sentences), symptoms (comma-separated), and prevention tips. Respond ONLY with a valid JSON array, no extra text. Format: [{\"name\":\"...\",\"description\":\"...\",\"symptoms\":\"...\",\"prevention\":\"...\"}]",
            ]],
        ]);

        if ($response->failed()) return [];

        $content = $response->json('content.0.text', '[]');
        return json_decode($content, true) ?? [];
    }
}
```

---

## AdminPetController — métodos nuevos

```php
public function show(Pet $pet): Response
{
    $breedModel = $pet->breed
        ? Breed::where('name', $pet->breed)->where('type', $pet->type)->first()
        : null;

    return Inertia::render('Admin/Pets/Show', [
        'pet'        => $pet,
        'healthInfo' => $breedModel?->health_info, // null = frontend lo pide async
    ]);
}

public function healthInsights(Request $request, Pet $pet): JsonResponse
{
    if ($request->boolean('refresh')) {
        $cacheKey = 'breed_health_' . Str::slug("{$pet->type}_{$pet->breed}");
        Cache::forget($cacheKey);
        Breed::where('name', $pet->breed)->where('type', $pet->type)
             ->update(['health_info' => null]);
    }

    $service    = app(BreedHealthService::class);
    $conditions = $service->getConditions($pet->breed ?? '', $pet->type);

    return response()->json([
        'conditions' => $conditions,
        'breed'      => $pet->breed,
    ]);
}
```

---

## Rutas (web.php)

```php
Route::get('/pets/{pet}',                [AdminPetController::class, 'show'])->name('pets.show');
Route::get('/pets/{pet}/health-insights',[AdminPetController::class, 'healthInsights'])->name('pets.health');
```

---

## config/services.php

```php
'anthropic' => [
    'api_key' => env('ANTHROPIC_API_KEY'),
    'model'   => env('ANTHROPIC_MODEL', 'claude-haiku-4-5-20251001'),
],
```

---

## .env / .env.example

```
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

---

## Show.jsx — estructura de la página

```
[← Todas las Mascotas]

🐶 Buddy                                [Badge: Dog]
Labrador Retriever · 3 años
Dueño: John Doe  john@example.com
Registrado: 15 mar 2026

───────────────────────────────────────────────
🏥 Condiciones de salud comunes — Labrador Retriever

[Spinner mientras carga desde Claude]

┌──────────────────────────────────────┐
│ 1. Hip Dysplasia                     │
│ Descripción: ...                     │
│ Síntomas: ...                        │
│ Prevención: ...                      │
└──────────────────────────────────────┘
(× 5 condiciones)

[🔄 Actualizar] · Generado por Claude AI
───────────────────────────────────────────────
```

---

## Claves de traducción (en/es)

```json
"admin.pet_show.back":         "← All Pets" / "← Todas las Mascotas"
"admin.pet_show.owner_label":  "Owner" / "Dueño"
"admin.pet_show.registered":   "Registered" / "Registrado"
"admin.pet_show.age_years":    ":age years" / ":age años"
"admin.pet_show.age_less_1":   "< 1 year" / "< 1 año"
"admin.pet_show.no_breed":     "Mixed / No breed" / "Sin raza especificada"

"admin.health.title":          "Common Health Conditions" / "Condiciones de salud comunes"
"admin.health.subtitle":       "for :breed" / "para :breed"
"admin.health.loading":        "Consulting Claude AI…" / "Consultando Claude AI…"
"admin.health.no_breed":       "No breed specified — no health info available." / "Sin raza — no hay info disponible."
"admin.health.no_data":        "No health data found for this breed." / "No se encontró información para esta raza."
"admin.health.symptoms":       "Symptoms" / "Síntomas"
"admin.health.prevention":     "Prevention" / "Prevención"
"admin.health.refresh":        "Refresh" / "Actualizar"
"admin.health.powered_by":     "Generated by Claude AI" / "Generado por Claude AI"
"admin.health.error":          "Could not load health info. Try again." / "No se pudo cargar. Intenta de nuevo."
```

---

## Tests (8 casos)

```
test_pet_show_accessible_for_admin
test_pet_show_forbidden_for_regular_user
test_pet_show_returns_correct_pet_data
test_health_endpoint_returns_stored_breed_info
test_health_endpoint_calls_claude_when_no_cache          // Http::fake()
test_health_endpoint_stores_result_in_breeds_table       // Http::fake()
test_health_endpoint_uses_laravel_cache_for_unknown_breed// Http::fake()
test_health_endpoint_refresh_clears_cache                // Http::fake()
```

---

## Orden de implementación

```
1.  Migración health_info en breeds
2.  Breed model (fillable + cast)
3.  BreedHealthService
4.  config/services.php + .env
5.  AdminPetController (show + healthInsights)
6.  routes/web.php (2 rutas nuevas)
7.  Admin/Pets/Show.jsx
8.  Admin/Pets/Index.jsx (filas clickeables)
9.  lang/en.json + lang/es.json
10. Tests
11. php artisan migrate
12. php artisan test
```

---

## Verificación

```bash
php artisan migrate
php artisan test   # 92 existentes + 8 nuevos = 100 esperados
```

Browser:
1. `/admin/pets` → filas clickeables (cursor pointer, hover azul)
2. Click en mascota → `/admin/pets/{id}` con detalle
3. Raza con breed → spinner → 5 condiciones (~2-3s primera vez)
4. Recargar → datos instantáneos (cacheados en breeds)
5. "Refresh" → re-consulta Claude
6. Sin raza → mensaje "Sin raza — no hay info disponible"
7. API key inválida → error gracioso (no 500)
