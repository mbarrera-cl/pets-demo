<?php

namespace Tests\Feature\Admin;

use App\Models\Breed;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AdminPetShowTest extends TestCase
{
    use RefreshDatabase;

    private function makePet(array $attrs = []): Pet
    {
        return Pet::create(array_merge([
            'name'        => 'Buddy',
            'type'        => 'dog',
            'breed'       => 'Labrador Retriever',
            'age'         => 3,
            'owner_name'  => 'Test Owner',
            'owner_email' => 'owner@example.com',
        ], $attrs));
    }

    private function fakeClaudeResponse(array $conditions): void
    {
        Http::fake([
            'api.anthropic.com/*' => Http::response([
                'content' => [['text' => json_encode($conditions)]],
            ], 200),
        ]);
    }

    // ─── Show page ────────────────────────────────────────────────────────────

    public function test_pet_show_accessible_for_admin(): void
    {
        $admin = User::factory()->admin()->create();
        $pet   = $this->makePet();

        $this->actingAs($admin)->get("/admin/pets/{$pet->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Pets/Show'));
    }

    public function test_pet_show_forbidden_for_regular_user(): void
    {
        $user = User::factory()->create();
        $pet  = $this->makePet();

        $this->actingAs($user)->get("/admin/pets/{$pet->id}")->assertForbidden();
    }

    public function test_pet_show_returns_correct_pet_data(): void
    {
        $admin = User::factory()->admin()->create();
        $pet   = $this->makePet(['name' => 'Max', 'breed' => 'Beagle']);

        $this->actingAs($admin)->get("/admin/pets/{$pet->id}")
            ->assertInertia(fn ($page) => $page
                ->where('pet.name', 'Max')
                ->where('pet.breed', 'Beagle')
            );
    }

    public function test_pet_show_passes_stored_health_info_as_prop(): void
    {
        $admin      = User::factory()->admin()->create();
        $conditions = [['name' => 'Hip Dysplasia', 'description' => 'Test', 'symptoms' => 'Limping', 'prevention' => 'Exercise']];
        Breed::create([
            'name'        => 'Labrador Retriever',
            'type'        => 'dog',
            'is_active'   => true,
            'sort_order'  => 0,
            'health_info' => ['en' => $conditions],
        ]);
        $pet = $this->makePet(['breed' => 'Labrador Retriever', 'type' => 'dog']);

        $this->actingAs($admin)
            ->withSession(['locale' => 'en'])
            ->get("/admin/pets/{$pet->id}")
            ->assertInertia(fn ($page) => $page->has('healthInfo'));
    }

    // ─── Health insights endpoint ─────────────────────────────────────────────

    public function test_health_endpoint_returns_stored_breed_info(): void
    {
        $admin      = User::factory()->admin()->create();
        $conditions = [['name' => 'Hip Dysplasia', 'description' => 'Test', 'symptoms' => 'Limping', 'prevention' => 'Exercise']];
        Breed::create([
            'name'        => 'Labrador Retriever',
            'type'        => 'dog',
            'is_active'   => true,
            'sort_order'  => 0,
            'health_info' => ['en' => $conditions],
        ]);
        $pet = $this->makePet(['breed' => 'Labrador Retriever', 'type' => 'dog']);

        $response = $this->actingAs($admin)
            ->withSession(['locale' => 'en'])
            ->getJson("/admin/pets/{$pet->id}/health-insights");

        $response->assertOk()->assertJsonPath('conditions.0.name', 'Hip Dysplasia');
        Http::assertNothingSent();
    }

    public function test_health_endpoint_calls_claude_when_no_cache(): void
    {
        $admin      = User::factory()->admin()->create();
        $conditions = [['name' => 'Elbow Dysplasia', 'description' => 'Joint issue', 'symptoms' => 'Limping', 'prevention' => 'Weight management']];
        $this->fakeClaudeResponse($conditions);

        $pet = $this->makePet(['breed' => 'Golden Retriever', 'type' => 'dog']);

        $response = $this->actingAs($admin)->getJson("/admin/pets/{$pet->id}/health-insights");

        $response->assertOk()->assertJsonPath('conditions.0.name', 'Elbow Dysplasia');
        Http::assertSentCount(1);
    }

    public function test_health_endpoint_stores_result_in_breeds_table(): void
    {
        $admin      = User::factory()->admin()->create();
        $conditions = [['name' => 'Hip Dysplasia', 'description' => 'Test', 'symptoms' => 'Limping', 'prevention' => 'Exercise']];
        $this->fakeClaudeResponse($conditions);

        $breed = Breed::create(['name' => 'Labrador Retriever', 'type' => 'dog', 'is_active' => true, 'sort_order' => 0]);
        $pet   = $this->makePet(['breed' => 'Labrador Retriever', 'type' => 'dog']);

        $this->actingAs($admin)
            ->withSession(['locale' => 'en'])
            ->getJson("/admin/pets/{$pet->id}/health-insights");

        $breed->refresh();
        $this->assertNotNull($breed->health_info);
        $this->assertEquals('Hip Dysplasia', $breed->health_info['en'][0]['name']);
    }

    public function test_health_endpoint_uses_laravel_cache_for_unknown_breed(): void
    {
        $admin      = User::factory()->admin()->create();
        $conditions = [['name' => 'Respiratory Issues', 'description' => 'Test', 'symptoms' => 'Coughing', 'prevention' => 'Clean air']];
        $this->fakeClaudeResponse($conditions);

        // Breed not in breeds table — will use Laravel cache
        $pet = $this->makePet(['breed' => 'Unknown Mix', 'type' => 'dog']);

        // First call → Claude
        $this->actingAs($admin)->getJson("/admin/pets/{$pet->id}/health-insights")->assertOk();
        Http::assertSentCount(1);

        // Second call → cache (Claude NOT called again)
        Http::fake(['api.anthropic.com/*' => Http::response(['content' => [['text' => '[]']]], 200)]);
        $this->actingAs($admin)->getJson("/admin/pets/{$pet->id}/health-insights")->assertOk();
        Http::assertNothingSent();
    }

    public function test_health_endpoint_refresh_clears_cache(): void
    {
        $admin      = User::factory()->admin()->create();
        $conditions = [['name' => 'Updated Condition', 'description' => 'New', 'symptoms' => 'New', 'prevention' => 'New']];
        $this->fakeClaudeResponse($conditions);

        $breed = Breed::create([
            'name'        => 'Labrador Retriever',
            'type'        => 'dog',
            'is_active'   => true,
            'sort_order'  => 0,
            'health_info' => ['en' => [['name' => 'Old Condition', 'description' => 'Old', 'symptoms' => 'Old', 'prevention' => 'Old']]],
        ]);
        $pet = $this->makePet(['breed' => 'Labrador Retriever', 'type' => 'dog']);

        $response = $this->actingAs($admin)
            ->withSession(['locale' => 'en'])
            ->getJson("/admin/pets/{$pet->id}/health-insights?refresh=1");

        $response->assertOk()->assertJsonPath('conditions.0.name', 'Updated Condition');
        Http::assertSentCount(1);
    }

    public function test_health_endpoint_returns_empty_for_pet_without_breed(): void
    {
        $admin = User::factory()->admin()->create();
        $pet   = $this->makePet(['breed' => null]);

        $this->actingAs($admin)->getJson("/admin/pets/{$pet->id}/health-insights")
            ->assertOk()
            ->assertJsonPath('conditions', []);
    }
}
