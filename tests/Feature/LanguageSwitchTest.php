<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LanguageSwitchTest extends TestCase
{
    use RefreshDatabase;

    public function test_language_switch_to_spanish()
    {
        $response = $this->post('/language/es');

        $response->assertRedirect();
        $this->assertEquals('es', session('locale'));
    }

    public function test_language_switch_to_english()
    {
        $response = $this->post('/language/en');

        $response->assertRedirect();
        $this->assertEquals('en', session('locale'));
    }

    public function test_unsupported_locale_returns_404()
    {
        $this->post('/language/fr')->assertNotFound();
    }

    public function test_translations_shared_with_inertia_in_english()
    {
        $user = User::factory()->create();

        $this->withSession(['locale' => 'en'])
             ->actingAs($user)
             ->get('/my-pets')
             ->assertInertia(fn ($page) =>
                 $page->where('locale', 'en')
                      ->has('translations')
             );
    }

    public function test_translations_shared_with_inertia_in_spanish()
    {
        $user = User::factory()->create();

        $this->withSession(['locale' => 'es'])
             ->actingAs($user)
             ->get('/my-pets')
             ->assertInertia(fn ($page) =>
                 $page->where('locale', 'es')
                      ->has('translations')
             );
    }

    public function test_locale_persists_across_requests()
    {
        $user = User::factory()->create();

        // Cambiar a español
        $this->post('/language/es');

        // La siguiente request debe tener locale 'es'
        $this->actingAs($user)
             ->get('/my-pets')
             ->assertInertia(fn ($page) =>
                 $page->where('locale', 'es')
             );
    }
}
