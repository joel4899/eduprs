<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_is_public(): void
    {
        $this->get('/')->assertOk();
    }

    public function test_login_page_is_public(): void
    {
        $this->get('/login')->assertOk()->assertSee('Sign in');
    }

    public function test_app_redirects_anonymous_users_to_login(): void
    {
        $this->get('/app')->assertRedirect('/login');
    }

    public function test_app_renders_for_authenticated_user(): void
    {
        $user = User::create([
            'name' => 'Test Officer',
            'email' => 'test@example.com',
            'role' => 'super-admin',
            'password' => bcrypt('password'),
        ]);

        $response = $this->actingAs($user)->get('/app');
        $response->assertOk();
        // The edu SPA mounts into #root; the auth badge shows the user.
        $response->assertSee('id="root"', false);
        $response->assertSee('Test Officer');
    }

    public function test_role_is_injected_into_window(): void
    {
        $user = User::create([
            'name' => 'Marisa Test',
            'email' => 'marisa-test@example.com',
            'role' => 'prs-office',
            'password' => bcrypt('password'),
        ]);

        $this->actingAs($user)->get('/app')
            ->assertOk()
            ->assertSee('"role":"prs-office"', false);
    }

    public function test_login_attempt_with_valid_creds_redirects_to_app(): void
    {
        User::create([
            'name' => 'Logged In',
            'email' => 'login@example.com',
            'role' => 'leaves',
            'password' => bcrypt('password'),
        ]);

        $this->post('/login', [
            'email' => 'login@example.com',
            'password' => 'password',
        ])->assertRedirect('/app');
    }

    public function test_login_attempt_with_bad_creds_returns_validation_error(): void
    {
        User::create([
            'name' => 'Anyone',
            'email' => 'someone@example.com',
            'role' => 'super-admin',
            'password' => bcrypt('correct-password'),
        ]);

        $this->from('/login')->post('/login', [
            'email' => 'someone@example.com',
            'password' => 'wrong-password',
        ])->assertSessionHasErrors('email');
    }
}
