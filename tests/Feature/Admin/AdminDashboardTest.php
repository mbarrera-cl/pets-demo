<?php

namespace Tests\Feature\Admin;

use App\Models\Pet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_redirects_guests_to_login(): void
    {
        $this->get('/admin')->assertRedirect('/login');
    }

    public function test_dashboard_forbidden_for_regular_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/admin')->assertForbidden();
    }

    public function test_dashboard_accessible_for_admin(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/admin')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Dashboard'));
    }

    public function test_dashboard_returns_correct_stat_keys(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/admin')
            ->assertInertia(fn ($page) =>
                $page->has('stats.total_users')
                     ->has('stats.active_users')
                     ->has('stats.admin_users')
                     ->has('stats.total_pets')
                     ->has('stats.dogs')
                     ->has('stats.cats')
                     ->has('stats.new_users_30d')
                     ->has('stats.new_pets_30d')
            );
    }

    public function test_dashboard_stat_counts_correct(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(2)->create();

        Pet::create(['name' => 'Rex',  'type' => 'dog', 'age' => 1, 'owner_name' => 'A', 'owner_email' => 'a@a.com']);
        Pet::create(['name' => 'Luna', 'type' => 'cat', 'age' => 2, 'owner_name' => 'B', 'owner_email' => 'b@b.com']);

        $this->actingAs($admin)->get('/admin')
            ->assertInertia(fn ($page) =>
                $page->where('stats.total_users', 3)  // 1 admin + 2 regular
                     ->where('stats.total_pets',  2)
                     ->where('stats.dogs',         1)
                     ->where('stats.cats',         1)
            );
    }

    public function test_dashboard_recent_pets_limited_to_5(): void
    {
        $admin = User::factory()->admin()->create();

        for ($i = 1; $i <= 7; $i++) {
            Pet::create(['name' => "Pet {$i}", 'type' => 'dog', 'age' => 1, 'owner_name' => 'A', 'owner_email' => 'a@a.com']);
        }

        $this->actingAs($admin)->get('/admin')
            ->assertInertia(fn ($page) => $page->has('recentPets', 5));
    }

    public function test_dashboard_recent_users_limited_to_5(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(6)->create();

        $this->actingAs($admin)->get('/admin')
            ->assertInertia(fn ($page) => $page->has('recentUsers', 5));
    }
}
