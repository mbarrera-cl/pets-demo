<?php

namespace Tests\Feature;

use App\Models\Pet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PetIndexTest extends TestCase
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

    public function test_index_requires_authentication()
    {
        $this->get('/my-pets')->assertRedirect('/login');
    }

    public function test_index_shows_only_own_pets()
    {
        $user  = User::factory()->create();
        $other = User::factory()->create();

        $this->createPetFor($user, ['name' => 'My Dog']);
        $this->createPetFor($user, ['name' => 'My Cat', 'type' => 'cat']);
        $this->createPetFor($other, ['name' => 'Other Dog']);

        $response = $this->actingAs($user)->get('/my-pets');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Pets/Index')
                 ->where('stats.total', 2)
        );
    }

    public function test_stats_are_correct()
    {
        $user = User::factory()->create();
        $this->createPetFor($user, ['type' => 'dog']);
        $this->createPetFor($user, ['type' => 'dog']);
        $this->createPetFor($user, ['type' => 'cat']);

        $response = $this->actingAs($user)->get('/my-pets');

        $response->assertInertia(fn ($page) =>
            $page->where('stats.total', 3)
                 ->where('stats.dogs', 2)
                 ->where('stats.cats', 1)
        );
    }

    public function test_index_filters_by_type()
    {
        $user = User::factory()->create();
        $this->createPetFor($user, ['type' => 'dog']);
        $this->createPetFor($user, ['type' => 'dog']);
        $this->createPetFor($user, ['type' => 'cat']);

        $response = $this->actingAs($user)->get('/my-pets?type=dog');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->where('pets.total', 2)
        );
    }

    public function test_index_filters_by_search_name()
    {
        $user = User::factory()->create();
        $this->createPetFor($user, ['name' => 'Buddy']);
        $this->createPetFor($user, ['name' => 'Luna', 'type' => 'cat']);

        $response = $this->actingAs($user)->get('/my-pets?search=Buddy');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->where('pets.total', 1)
        );
    }

    public function test_index_filters_by_search_breed()
    {
        $user = User::factory()->create();
        $this->createPetFor($user, ['name' => 'Rex',  'breed' => 'Labrador']);
        $this->createPetFor($user, ['name' => 'Luna', 'breed' => 'Siamese', 'type' => 'cat']);

        $response = $this->actingAs($user)->get('/my-pets?search=Siamese');

        $response->assertInertia(fn ($page) =>
            $page->where('pets.total', 1)
        );
    }

    public function test_empty_state_when_no_pets()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/my-pets');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->where('stats.total', 0)
                 ->where('pets.total', 0)
        );
    }

    public function test_delete_removes_own_pet()
    {
        $user = User::factory()->create();
        $pet  = $this->createPetFor($user);

        $response = $this->actingAs($user)->delete("/pets/{$pet->id}");

        $response->assertRedirect(route('pets.index'));
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('pets', ['id' => $pet->id]);
    }

    public function test_delete_rejects_other_users_pet()
    {
        $user  = User::factory()->create();
        $other = User::factory()->create();
        $pet   = $this->createPetFor($other);

        $response = $this->actingAs($user)->delete("/pets/{$pet->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('pets', ['id' => $pet->id]);
    }

    public function test_delete_requires_authentication()
    {
        $user = User::factory()->create();
        $pet  = $this->createPetFor($user);

        $this->delete("/pets/{$pet->id}")->assertRedirect('/login');
    }

    public function test_filters_are_passed_to_view()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/my-pets?type=dog&search=buddy&sort=name');

        $response->assertInertia(fn ($page) =>
            $page->where('filters.type', 'dog')
                 ->where('filters.search', 'buddy')
                 ->where('filters.sort', 'name')
        );
    }
}
