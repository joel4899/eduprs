<?php

use App\Http\Controllers\AppController;
use App\Http\Controllers\Auth\LoginController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => view('welcome'))->name('home');

// ─────────────────────────────────────────────────────────────────
// Authentication (email + password)
// ─────────────────────────────────────────────────────────────────
Route::get('/login', [LoginController::class, 'showForm'])->name('login');
Route::post('/login', [LoginController::class, 'login'])->name('login.attempt');
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

// ─────────────────────────────────────────────────────────────────
// The edu React SPA, mounted at /app. All in-app navigation is
// client-side, so a single Laravel route covers every "module" view.
// ─────────────────────────────────────────────────────────────────
$middleware = ['web'];
if (config('prs.require_auth')) {
    $middleware[] = 'auth';
}

Route::middleware($middleware)->group(function () {
    Route::get('/app', AppController::class)->name('app');
    Route::get('/dashboard', AppController::class)->name('dashboard');
});
