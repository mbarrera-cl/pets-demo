<?php

namespace Tests\Feature\Admin;

use App\Models\Breed;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminBreedCrudTest extends TestCase
{
    use RefreshDatabase;

    // ─── Index ────────────────────────────────────────────────────────────────

    public function test_breed_index_accessible_for_admin(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/admin/breeds')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Breeds/Index'));
    }

    public function test_breed_index_forbidden_for_regular_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/admin/breeds')->assertForbidden();
    }

    public function test_breed_index_filter_by_type(): void
    {
        $admin = User::factory()->admin()->create();
        Breed::create(['name' => 'Labrador', 'type' => 'dog', 'is_active' => true, 'sort_order' => 0]);
        Breed::create(['name' => 'Persian',  'type' => 'cat', 'is_active' => true, 'sort_order' => 0]);

        $this->actingAs($admin)->get('/admin/breeds?type=dog')
            ->assertInertia(fn ($page) => $page->where('breeds.total', 1));
    }

    public function test_breed_index_filter_by_status(): void
    {
        $admin = User::factory()->admin()->create();
        Breed::create(['name' => 'Labrador', 'type' => 'dog', 'is_active' => true,  'sort_order' => 0]);
        Breed::create(['name' => 'Beagle',   'type' => 'dog', 'is_active' => false, 'sort_order' => 1]);

        $this->actingAs($admin)->get('/admin/breeds?status=inactive')
            ->assertInertia(fn ($page) => $page->where('breeds.total', 1));
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function test_create_page_accessible(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/admin/breeds/create')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Breeds/Create'));
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function test_store_creates_breed(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post('/admin/breeds', [
            'name'       => 'Schnauzer',
            'type'       => 'dog',
            'is_active'  => true,
            'sort_order' => 5,
        ])->assertRedirect('/admin/breeds');

        $this->assertDatabaseHas('breeds', [
            'name' => 'Schnauzer',
            'type' => 'dog',
        ]);
    }

    public function test_store_fails_duplicate_name_same_type(): void
    {
        $admin = User::factory()->admin()->create();
        Breed::create(['name' => 'Poodle', 'type' => 'dog', 'is_active' => true, 'sort_order' => 0]);

        $this->actingAs($admin)->post('/admin/breeds', [
            'name' => 'Poodle',
            'type' => 'dog',
        ])->assertSessionHasErrors('name');
    }

    public function test_store_allows_same_name_different_type(): void
    {
        $admin = User::factory()->admin()->create();
        Breed::create(['name' => 'Mixed', 'type' => 'dog', 'is_active' => true, 'sort_order' => 0]);

        $this->actingAs($admin)->post('/admin/breeds', [
            'name'      => 'Mixed',
            'type'      => 'cat',
            'is_active' => true,
        ])->assertRedirect('/admin/breeds');

        $this->assertDatabaseHas('breeds', ['name' => 'Mixed', 'type' => 'cat']);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function test_update_changes_breed_data(): void
    {
        $admin = User::factory()->admin()->create();
        $breed = Breed::create(['name' => 'Old Name', 'type' => 'dog', 'is_active' => true, 'sort_order' => 0]);

        $this->actingAs($admin)->put("/admin/breeds/{$breed->id}", [
            'name'       => 'New Name',
            'type'       => 'dog',
            'is_active'  => false,
            'sort_order' => 10,
        ])->assertRedirect('/admin/breeds');

        $breed->refresh();
        $this->assertEquals('New Name', $breed->name);
        $this->assertFalse($breed->is_active);
        $this->assertEquals(10, $breed->sort_order);
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────

    public function test_destroy_deletes_breed(): void
    {
        $admin = User::factory()->admin()->create();
        $breed = Breed::create(['name' => 'Bulldog', 'type' => 'dog', 'is_active' => true, 'sort_order' => 0]);

        $this->actingAs($admin)->delete("/admin/breeds/{$breed->id}")
            ->assertRedirect('/admin/breeds');

        $this->assertDatabaseMissing('breeds', ['id' => $breed->id]);
    }

    public function test_destroy_forbidden_for_regular_user(): void
    {
        $user  = User::factory()->create();
        $breed = Breed::create(['name' => 'Bulldog', 'type' => 'dog', 'is_active' => true, 'sort_order' => 0]);

        $this->actingAs($user)->delete("/admin/breeds/{$breed->id}")->assertForbidden();

        $this->assertDatabaseHas('breeds', ['id' => $breed->id]);
    }

    // ─── PetController ────────────────────────────────────────────────────────

    public function test_pet_create_page_receives_breeds_prop(): void
    {
        $user = User::factory()->create();
        // Force email verification state
        $user->email_verified_at = now();
        $user->save();

        Breed::create(['name' => 'Labrador', 'type' => 'dog', 'is_active' => true,  'sort_order' => 0]);
        Breed::create(['name' => 'Persian',  'type' => 'cat', 'is_active' => true,  'sort_order' => 0]);
        Breed::create(['name' => 'Inactive', 'type' => 'dog', 'is_active' => false, 'sort_order' => 1]);

        $this->actingAs($user)->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Pets/Create')
                ->has('breeds', 2) // only active breeds
            );
    }
}
