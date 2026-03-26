<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBreedRequest;
use App\Http\Requests\Admin\UpdateBreedRequest;
use App\Models\Breed;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminBreedController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Breed::query();

        if ($request->filled('type')) {
            $query->ofType($request->type);
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $sort = $request->get('sort', 'type');
        match ($sort) {
            'name'   => $query->orderBy('name'),
            'newest' => $query->latest(),
            default  => $query->orderBy('type')->orderBy('sort_order')->orderBy('name'),
        };

        $breeds = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Breeds/Index', [
            'breeds'  => $breeds,
            'filters' => (object) $request->only(['search', 'type', 'status', 'sort']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Breeds/Create');
    }

    public function store(StoreBreedRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['is_active']  = $request->boolean('is_active', true);
        $validated['sort_order'] = $request->integer('sort_order', 0);

        Breed::create($validated);

        return redirect()
            ->route('admin.breeds.index')
            ->with('success', 'Breed added successfully.');
    }

    public function edit(Breed $breed): Response
    {
        return Inertia::render('Admin/Breeds/Edit', [
            'breed' => [
                'id'         => $breed->id,
                'name'       => $breed->name,
                'type'       => $breed->type,
                'is_active'  => (bool) $breed->is_active,
                'sort_order' => $breed->sort_order,
            ],
        ]);
    }

    public function update(UpdateBreedRequest $request, Breed $breed): RedirectResponse
    {
        $validated = $request->validated();
        $validated['is_active']  = $request->boolean('is_active');
        $validated['sort_order'] = $request->integer('sort_order', 0);

        $breed->update($validated);

        return redirect()
            ->route('admin.breeds.index')
            ->with('success', 'Breed updated successfully.');
    }

    public function destroy(Breed $breed): RedirectResponse
    {
        $breed->delete();

        return redirect()
            ->route('admin.breeds.index')
            ->with('success', 'Breed deleted.');
    }
}
