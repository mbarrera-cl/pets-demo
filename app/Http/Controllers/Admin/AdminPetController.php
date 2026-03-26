<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Breed;
use App\Models\Pet;
use App\Models\User;
use App\Services\BreedHealthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminPetController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Pet::query();

        if ($request->filled('type') && in_array($request->type, ['dog', 'cat'])) {
            $query->ofType($request->type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('breed', 'like', "%{$search}%")
                  ->orWhere('owner_name', 'like', "%{$search}%")
                  ->orWhere('owner_email', 'like', "%{$search}%");
            });
        }

        $sort = $request->get('sort', 'newest');
        match ($sort) {
            'oldest' => $query->oldest(),
            'name'   => $query->orderBy('name'),
            'age'    => $query->orderBy('age'),
            'owner'  => $query->orderBy('owner_name'),
            default  => $query->latest(),
        };

        $pets = $query->paginate(15)->withQueryString();

        $stats = [
            'total' => Pet::count(),
            'dogs'  => Pet::ofType('dog')->count(),
            'cats'  => Pet::ofType('cat')->count(),
            'users' => User::count(),
        ];

        return Inertia::render('Admin/Pets/Index', [
            'pets'    => $pets,
            'stats'   => $stats,
            'filters' => (object) $request->only(['type', 'search', 'sort']),
        ]);
    }

    public function show(Request $request, Pet $pet): Response
    {
        $locale     = $request->session()->get('locale', config('app.locale', 'en'));
        $breedModel = $pet->breed
            ? Breed::where('name', $pet->breed)->where('type', $pet->type)->first()
            : null;

        $healthInfo = $breedModel?->health_info[$locale] ?? null;

        return Inertia::render('Admin/Pets/Show', [
            'pet'        => $pet,
            'healthInfo' => $healthInfo,
        ]);
    }

    public function healthInsights(Request $request, Pet $pet): JsonResponse
    {
        $locale  = $request->session()->get('locale', config('app.locale', 'en'));
        $service = app(BreedHealthService::class);

        if ($request->boolean('refresh') && $pet->breed) {
            $service->clearCache($pet->breed, $pet->type, $locale);
        }

        $conditions = $service->getConditions($pet->breed ?? '', $pet->type, $locale);

        return response()->json([
            'conditions' => $conditions,
            'breed'      => $pet->breed,
        ]);
    }
}
