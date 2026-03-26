<?php

namespace Tests\Feature\Admin;

use App\Models\Pet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPetIndexTest extends TestCase
{
    use RefreshDatabase;

    private function createPetFor(User $user, array $overrides = []): Pet
    {
        return Pet::create(array_merge([
            'name'        => 'Buddy',
            'type'        => 'dog',
            'breed'       => 'Mixed',
            'age'         => 2,
            'owner_name'  => $user->name,
            'owner_email' => $user->email,
        ], $overrides));
    }

    public function test_admin_panel_redirects_guests_to_login(): void
    {
        $this->get('/admin/pets')->assertRedirect('/login');
    }

    public function test_admin_panel_redirects_unverified_admin(): void
    {
        $admin = User::factory()->admin()->unverified()->create();

        $this->actingAs($admin)->get('/admin/pets')
            ->assertRedirect('/verify-email');
    }

    public function test_admin_panel_forbidden_for_regular_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/admin/pets')
            ->assertForbidden();
    }

    public function test_admin_panel_accessible_for_admin_user(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/admin/pets')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Pets/Index'));
    }

    public function test_admin_panel_shows_all_pets_not_just_own(): void
    {
        $admin = User::factory()->admin()->create();
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $this->createPetFor($user1, ['name' => 'Rex']);
        $this->createPetFor($user2, ['name' => 'Luna', 'type' => 'cat']);

        $this->actingAs($admin)->get('/admin/pets')
            ->assertInertia(fn ($page) =>
                $page->where('stats.total', 2)
                     ->where('pets.total', 2)
            );
    }

    public function test_admin_stats_include_user_count(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(3)->create();

        $this->actingAs($admin)->get('/admin/pets')
            ->assertInertia(fn ($page) =>
                $page->has('stats.users')
                     ->where('stats.users', 4) // 3 regular + 1 admin
            );
    }

    public function test_admin_stats_correct_dogs_and_cats(): void
    {
        $admin = User::factory()->admin()->create();
        $user  = User::factory()->create();

        $this->createPetFor($user, ['type' => 'dog']);
        $this->createPetFor($user, ['type' => 'dog']);
        $this->createPetFor($user, ['type' => 'cat']);

        $this->actingAs($admin)->get('/admin/pets')
            ->assertInertia(fn ($page) =>
                $page->where('stats.dogs', 2)
                     ->where('stats.cats', 1)
            );
    }

    public function test_admin_search_filters_by_pet_name(): void
    {
        $admin = User::factory()->admin()->create();
        $user  = User::factory()->create();

        $this->createPetFor($user, ['name' => 'Buddy']);
        $this->createPetFor($user, ['name' => 'Luna', 'type' => 'cat']);

        $this->actingAs($admin)->get('/admin/pets?search=Buddy')
            ->assertInertia(fn ($page) =>
                $page->where('pets.total', 1)
            );
    }

    public function test_admin_search_filters_by_owner_email(): void
    {
        $admin = User::factory()->admin()->create();
        $user1 = User::factory()->create(['email' => 'alice@example.com']);
        $user2 = User::factory()->create(['email' => 'bob@example.com']);

        $this->createPetFor($user1);
        $this->createPetFor($user2);

        $this->actingAs($admin)->get('/admin/pets?search=alice')
            ->assertInertia(fn ($page) =>
                $page->where('pets.total', 1)
            );
    }

    public function test_admin_search_filters_by_owner_name(): void
    {
        $admin = User::factory()->admin()->create();
        $user1 = User::factory()->create(['name' => 'Alice Wonder']);
        $user2 = User::factory()->create(['name' => 'Bob Builder']);

        $this->createPetFor($user1);
        $this->createPetFor($user2);

        $this->actingAs($admin)->get('/admin/pets?search=Alice')
            ->assertInertia(fn ($page) =>
                $page->where('pets.total', 1)
            );
    }

    public function test_admin_type_filter_works(): void
    {
        $admin = User::factory()->admin()->create();
        $user  = User::factory()->create();

        $this->createPetFor($user, ['type' => 'dog']);
        $this->createPetFor($user, ['type' => 'dog']);
        $this->createPetFor($user, ['type' => 'cat']);

        $this->actingAs($admin)->get('/admin/pets?type=dog')
            ->assertInertia(fn ($page) =>
                $page->where('pets.total', 2)
            );
    }

    public function test_admin_filters_are_passed_to_view(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/admin/pets?type=dog&search=buddy&sort=owner')
            ->assertInertia(fn ($page) =>
                $page->where('filters.type', 'dog')
                     ->where('filters.search', 'buddy')
                     ->where('filters.sort', 'owner')
            );
    }

    public function test_admin_sort_by_owner_works(): void
    {
        $admin = User::factory()->admin()->create();
        $userA = User::factory()->create(['name' => 'Alice']);
        $userB = User::factory()->create(['name' => 'Zara']);

        $this->createPetFor($userB, ['name' => 'Rex']);
        $this->createPetFor($userA, ['name' => 'Buddy']);

        $response = $this->actingAs($admin)->get('/admin/pets?sort=owner');

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->where('pets.total', 2)
        );
    }
}
