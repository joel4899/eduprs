<?php

return [

    /*
    |--------------------------------------------------------------------------
    | PRS application options
    |--------------------------------------------------------------------------
    |
    | These are read via `config('prs.*')` so they survive `config:cache` in
    | production. Do NOT call env() outside of this file for these keys.
    |
    */

    // When true, all module routes require an authenticated user.
    // Keep true in every deployed environment.
    'require_auth' => filter_var(env('PRS_REQUIRE_AUTH', true), FILTER_VALIDATE_BOOLEAN),

];
