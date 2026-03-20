<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Register
    // -------------------------------------------------------------------------

    public function test_register_page_is_accessible()
    {
        $this->get('/register')->assertStatus(200);
    }

    public function test_register_creates_user_and_redirects_to_verify_email()
    {
        Notification::fake();

        $response = $this->post('/register', [
            'name'                  => 'Jane Doe',
            'email'                 => 'jane@example.com',
            'password'              => 'Secret@123',
            'password_confirmation' => 'Secret@123',
        ]);

        $response->assertRedirect(route('verification.notice'));
        $this->assertDatabaseHas('users', ['email' => 'jane@example.com']);
        $this->assertAuthenticated();
    }

    public function test_register_fails_with_weak_password()
    {
        $response = $this->post('/register', [
            'name'                  => 'Jane Doe',
            'email'                 => 'jane@example.com',
            'password'              => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertGuest();
    }

    public function test_register_fails_with_duplicate_email()
    {
        User::factory()->create(['email' => 'jane@example.com']);

        $response = $this->post('/register', [
            'name'                  => 'Jane Doe',
            'email'                 => 'jane@example.com',
            'password'              => 'Secret@123',
            'password_confirmation' => 'Secret@123',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_register_fails_with_mismatched_passwords()
    {
        $response = $this->post('/register', [
            'name'                  => 'Jane Doe',
            'email'                 => 'jane@example.com',
            'password'              => 'Secret@123',
            'password_confirmation' => 'Different@123',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertGuest();
    }

    // -------------------------------------------------------------------------
    // Login
    // -------------------------------------------------------------------------

    public function test_login_page_is_accessible()
    {
        $this->get('/login')->assertStatus(200);
    }

    public function test_login_succeeds_with_valid_credentials()
    {
        $user = User::factory()->create(['password' => bcrypt('Secret@123')]);

        $response = $this->post('/login', [
            'email'    => $user->email,
            'password' => 'Secret@123',
        ]);

        $response->assertRedirect();
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_fails_with_invalid_credentials()
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email'    => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_login_fails_with_wrong_email()
    {
        $response = $this->post('/login', [
            'email'    => 'notexists@example.com',
            'password' => 'Secret@123',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_rate_limiting_blocks_after_5_failed_attempts()
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'email'    => $user->email,
                'password' => 'wrong-password',
            ]);
        }

        $response = $this->post('/login', [
            'email'    => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHas('error');
        $this->assertGuest();
    }

    // -------------------------------------------------------------------------
    // Logout
    // -------------------------------------------------------------------------

    public function test_logout_unauthenticates_user()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $response->assertRedirect(route('login'));
        $this->assertGuest();
    }

    // -------------------------------------------------------------------------
    // Rutas protegidas
    // -------------------------------------------------------------------------

    public function test_pets_page_redirects_guests_to_login()
    {
        $this->get('/')->assertRedirect('/login');
    }

    public function test_pets_page_redirects_unverified_users_to_verify_email()
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->get('/')->assertRedirect(route('verification.notice'));
    }

    public function test_pets_page_accessible_for_verified_users()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/')->assertStatus(200);
    }

    // -------------------------------------------------------------------------
    // Forgot / Reset Password
    // -------------------------------------------------------------------------

    public function test_forgot_password_page_is_accessible()
    {
        $this->get('/forgot-password')->assertStatus(200);
    }

    public function test_forgot_password_always_returns_same_message()
    {
        $response = $this->post('/forgot-password', [
            'email' => 'notexists@example.com',
        ]);

        // No debe revelar si el email existe o no
        $response->assertSessionHas('status');
        $response->assertSessionMissing('errors');
    }

    // -------------------------------------------------------------------------
    // Guest middleware
    // -------------------------------------------------------------------------

    public function test_authenticated_users_cannot_access_login()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/login')->assertRedirect();
    }

    public function test_authenticated_users_cannot_access_register()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/register')->assertRedirect();
    }
}
