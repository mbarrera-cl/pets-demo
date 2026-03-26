<?php

namespace App\Services;

use App\Models\Breed;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BreedHealthService
{
    public function getConditions(string $breedName, string $type, string $locale = 'en'): array
    {
        if (!$breedName) {
            return [];
        }

        // 1. Buscar en tabla breeds (persistente, por idioma)
        $breed      = Breed::where('name', $breedName)->where('type', $type)->first();
        $healthInfo = $breed?->health_info ?? [];
        if (!empty($healthInfo[$locale])) {
            return $healthInfo[$locale];
        }

        // 2. Buscar en Laravel cache (7 días, por idioma)
        $cacheKey   = $this->cacheKey($type, $breedName, $locale);
        $conditions = Cache::remember($cacheKey, now()->addDays(7), function () use ($breedName, $type, $locale) {
            return $this->fetchFromClaude($breedName, $type, $locale);
        });

        // 3. Persistir en breeds si existe el registro (estructura por idioma)
        if ($breed && empty($healthInfo[$locale]) && !empty($conditions)) {
            $updated               = $healthInfo;
            $updated[$locale]      = $conditions;
            $breed->update(['health_info' => $updated]);
        }

        return $conditions;
    }

    public function clearCache(string $breedName, string $type, string $locale = 'en'): void
    {
        Cache::forget($this->cacheKey($type, $breedName, $locale));

        $breed = Breed::where('name', $breedName)->where('type', $type)->first();
        if ($breed?->health_info) {
            $updated = $breed->health_info;
            unset($updated[$locale]);
            $breed->update(['health_info' => empty($updated) ? null : $updated]);
        }
    }

    public function cacheKey(string $type, string $breedName, string $locale = 'en'): string
    {
        return 'breed_health_' . Str::slug("{$locale}_{$type}_{$breedName}");
    }

    private function fetchFromClaude(string $breedName, string $type, string $locale = 'en'): array
    {
        $langInstruction = $locale === 'es'
            ? 'Responde completamente en español.'
            : 'Respond in English.';

        try {
            $response = Http::withHeaders([
                'x-api-key'         => config('services.anthropic.api_key'),
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->timeout(30)->post('https://api.anthropic.com/v1/messages', [
                'model'      => config('services.anthropic.model'),
                'max_tokens' => 1024,
                'messages'   => [[
                    'role'    => 'user',
                    'content' => "List the 5 most common health conditions for a {$type} of breed \"{$breedName}\". "
                               . "For each condition provide: name, description (1-2 sentences), symptoms (comma-separated list), and prevention tips. "
                               . "{$langInstruction} "
                               . "Respond ONLY with a valid JSON array, no extra text or markdown. "
                               . 'Format: [{"name":"...","description":"...","symptoms":"...","prevention":"..."}]',
                ]],
            ]);

            if ($response->failed()) {
                Log::warning('Claude API request failed', [
                    'status' => $response->status(),
                    'breed'  => $breedName,
                ]);
                return [];
            }

            $content = $response->json('content.0.text', '[]');

            // Strip markdown code fences if Claude wraps the response
            $content = preg_replace('/^```(?:json)?\s*/i', '', trim($content));
            $content = preg_replace('/\s*```$/', '', $content);

            $decoded = json_decode(trim($content), true);

            return is_array($decoded) ? $decoded : [];
        } catch (\Exception $e) {
            Log::error('Claude API error', ['error' => $e->getMessage(), 'breed' => $breedName]);
            return [];
        }
    }
}
