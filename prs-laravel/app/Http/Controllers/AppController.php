<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class AppController extends Controller
{
    /**
     * Render the edu React SPA. All internal navigation lives client-side,
     * so we only need one Laravel route to serve the shell.
     */
    public function __invoke(): View
    {
        return view('app');
    }
}
