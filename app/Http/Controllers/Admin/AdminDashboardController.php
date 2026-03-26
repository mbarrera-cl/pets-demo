<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'total_users'   => User::count(),
            'active_users'  => User::where('is_active', true)->count(),
            'admin_users'   => User::where('role', 'admin')->count(),
            'total_pets'    => Pet::count(),
            'dogs'          => Pet::ofType('dog')->count(),
            'cats'          => Pet::ofType('cat')->count(),
            'new_users_30d' => User::where('created_at', '>=', now()->subDays(30))->count(),
            'new_pets_30d'  => Pet::where('created_at', '>=', now()->subDays(30))->count(),
        ];

        $recentPets = Pet::latest()
            ->limit(5)
            ->get(['id', 'name', 'type', 'breed', 'owner_name', 'owner_email', 'created_at']);

        $recentUsers = User::latest()
            ->limit(5)
            ->get(['id', 'name', 'email', 'role', 'is_active', 'created_at']);

        return Inertia::render('Admin/Dashboard', [
            'stats'       => $stats,
            'recentPets'  => $recentPets,
            'recentUsers' => $recentUsers,
        ]);
    }
}
