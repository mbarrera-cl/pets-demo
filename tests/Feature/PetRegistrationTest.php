<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PetRegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function authenticatedUser(): User
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        return $user;
    }

    public function test_pet_registration_succeeds_with_valid_data()
    {
        $this->authenticatedUser();

        $response = $this->post('/pets', [
            'name'  => 'Buddy',
            'type'  => 'dog',
            'breed' => 'Golden Retriever',
            'age'   => 3,
        ]);

        $response->assertRedirect(route('pets.index'));
        $response->assertSessionHas('success', 'Pet registered successfully!');
        $this->assertDatabaseHas('pets', [
            'name' => 'Buddy',
            'type' => 'dog',
        ]);
    }

    public function test_pet_registration_fails_unauthenticated()
    {
        $response = $this->post('/pets', [
            'name' => 'Buddy',
            'type' => 'dog',
            'age'  => 3,
        ]);

        $response->assertRedirect('/login');
        $this->assertDatabaseMissing('pets', ['name' => 'Buddy']);
    }

    public function test_pet_registration_fails_with_missing_required_fields()
    {
        $this->authenticatedUser();

        $response = $this->post('/pets', [
            'name' => 'Buddy',
        ]);

        $response->assertSessionHasErrors(['type', 'age']);
    }

    public function test_pet_registration_fails_with_invalid_pet_type()
    {
        $this->authenticatedUser();

        $response = $this->post('/pets', [
            'name' => 'Buddy',
            'type' => 'bird',
            'age'  => 3,
        ]);

        $response->assertSessionHasErrors('type');
    }

    public function test_pet_registration_fails_with_negative_age()
    {
        $this->authenticatedUser();

        $response = $this->post('/pets', [
            'name' => 'Buddy',
            'type' => 'dog',
            'age'  => -1,
        ]);

        $response->assertSessionHasErrors('age');
    }

    public function test_pet_registration_fails_with_name_exceeding_max_length()
    {
        $this->authenticatedUser();

        $response = $this->post('/pets', [
            'name' => str_repeat('a', 101),
            'type' => 'dog',
            'age'  => 3,
        ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_pets_create_page_returns_200()
    {
        $this->authenticatedUser();

        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_owner_info_taken_from_authenticated_user()
    {
        $user = User::factory()->create([
            'name'  => 'Jane Doe',
            'email' => 'jane@example.com',
        ]);
        $this->actingAs($user);

        $this->post('/pets', [
            'name' => 'Luna',
            'type' => 'cat',
            'age'  => 2,
        ]);

        $this->assertDatabaseHas('pets', [
            'name'        => 'Luna',
            'owner_name'  => 'Jane Doe',
            'owner_email' => 'jane@example.com',
        ]);
    }
}
