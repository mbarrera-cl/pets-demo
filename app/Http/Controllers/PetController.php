<?php

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

            return redirect()
                ->route('pets.index')
                ->with('success', 'Pet registered successfully!');
        } catch (\Exception $e) {
            Log::error('Failed to register pet', ['error' => $e->getMessage()]);

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Failed to register pet. Please try again.');
        }
    }

    public function index(Request $request): Response
    {
        $query = Pet::byOwner($request->user()->email);

        if ($request->filled('type') && in_array($request->type, ['dog', 'cat'])) {
            $query->ofType($request->type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('breed', 'like', "%{$search}%");
            });
        }

        $sort = $request->get('sort', 'newest');
        match ($sort) {
            'oldest' => $query->oldest(),
            'name'   => $query->orderBy('name'),
            'age'    => $query->orderBy('age'),
            default  => $query->latest(),
        };

        $pets = $query->paginate(9)->withQueryString();

        $stats = [
            'total' => Pet::byOwner($request->user()->email)->count(),
            'dogs'  => Pet::byOwner($request->user()->email)->ofType('dog')->count(),
            'cats'  => Pet::byOwner($request->user()->email)->ofType('cat')->count(),
        ];

        return Inertia::render('Pets/Index', [
            'pets'    => $pets,
            'stats'   => $stats,
            'filters' => (object) $request->only(['type', 'search', 'sort']),
        ]);
    }

    public function destroy(Request $request, Pet $pet): RedirectResponse
    {
        if ($pet->owner_email !== $request->user()->email) {
            abort(403);
        }

        $petName = $pet->name;
        $pet->delete();

        Log::info('Pet deleted', [
            'user_id'  => $request->user()->id,
            'pet_name' => $petName,
        ]);

        return redirect()
            ->route('pets.index')
            ->with('success', "{$petName} has been removed.");
    }
}
