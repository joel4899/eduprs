@extends('layouts.app')
@section('title', 'Sign in')

@section('content')
    <div class="card" style="max-width: 420px; margin: 40px auto;">
        <h1>Sign in</h1>
        <p class="muted">Enter your PRS officer credentials.</p>

        @if ($errors->any())
            <div style="background:#fee2e2; color:#991b1b; border:1px solid #fecaca; padding:10px 14px; border-radius:6px; margin-bottom:16px;">
                {{ $errors->first() }}
            </div>
        @endif

        <form method="POST" action="{{ route('login.attempt') }}">
            @csrf
            <p>
                <label style="display:block; font-size:12px; color:var(--ink-2); margin-bottom:4px;">Email</label>
                <input type="email" name="email" value="{{ old('email') }}" required autofocus
                       style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px;">
            </p>
            <p>
                <label style="display:block; font-size:12px; color:var(--ink-2); margin-bottom:4px;">Password</label>
                <input type="password" name="password" required
                       style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px;">
            </p>
            <p><label><input type="checkbox" name="remember" value="1"> Remember me</label></p>
            <button type="submit"
                    style="background:var(--brand); color:#fff; border:0; padding:10px 16px; border-radius:6px; cursor:pointer; font-weight:600;">
                Sign in
            </button>
        </form>

        <div class="muted" style="margin-top:24px; font-size:11px; line-height:1.6;">
            <strong>Demo accounts</strong> (password is <code>password</code> for every one):<br>
            <code>admin@prs.test</code> — Super Admin<br>
            <code>marisa@prs.test</code> — PRS Office<br>
            <code>karl@prs.test</code> — Recruitment<br>
            <code>roberta@prs.test</code> — Salaries / Increments<br>
            <code>janet@prs.test</code> — Leaves<br>
            <code>francesca@prs.test</code> — Confirmation of Appointment<br>
            <code>alex@prs.test</code> — Discipline &amp; HR Plan<br>
            <code>pauline@prs.test</code> — Health &amp; Safety<br>
            <code>thomas@prs.test</code> — Forms &amp; Documents<br>
            <code>carmen@prs.test</code> — Terminations<br>
            <code>joseph@prs.test</code> — Transfers &amp; Promotions<br>
            <code>george@prs.test</code> — Progressions<br>
            <code>maria@prs.test</code> — Pay Points
        </div>
    </div>
@endsection
