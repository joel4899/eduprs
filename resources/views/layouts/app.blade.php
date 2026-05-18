<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'PRS System') · {{ config('app.name') }}</title>
    <style>
        :root { --ink:#0f172a; --ink-2:#475569; --muted:#94a3b8; --line:#e2e8f0; --bg:#f8fafc; --brand:#0b5cff; }
        * { box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; margin: 0; color: var(--ink); background: var(--bg); }
        a { color: var(--brand); text-decoration: none; }
        a:hover { text-decoration: underline; }
        .topbar { background:#fff; border-bottom: 1px solid var(--line); padding: 12px 24px; display: flex; align-items: center; gap: 16px; }
        .brand { font-weight: 700; color: var(--ink); font-size: 16px; }
        .container { max-width: 720px; margin: 0 auto; padding: 24px; }
        h1 { font-size: 22px; margin: 0 0 16px; }
        .card { background: #fff; border: 1px solid var(--line); border-radius: 6px; padding: 24px; margin-bottom: 16px; }
        .muted { color: var(--muted); font-size: 12px; }
        code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-size: 11px; }
    </style>
</head>
<body>
    <div class="topbar">
        <div class="brand">{{ config('app.name') }}</div>
        <div style="margin-left: auto; font-size: 13px; color: var(--ink-2); display:flex; align-items:center; gap:12px;">
            @auth
                {{ auth()->user()->name }}
                <a href="{{ route('app') }}">Open app</a>
                <form method="POST" action="{{ route('logout') }}" style="display:inline;">
                    @csrf
                    <button type="submit" style="background:transparent; border:0; color:var(--brand); cursor:pointer; padding:0; font:inherit;">Sign out</button>
                </form>
            @else
                <a href="{{ route('login') }}">Sign in</a>
            @endauth
        </div>
    </div>

    <main class="container">
        @yield('content')
    </main>
</body>
</html>
