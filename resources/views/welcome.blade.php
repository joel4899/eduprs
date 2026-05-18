@extends('layouts.app')

@section('title', 'Welcome')

@section('content')
    <div class="card">
        <h1>PRS System</h1>
        <p class="muted">Personnel Records Section · Ministry for Education · Government of Malta</p>
        <p>
            @auth
                Welcome back. Go to the <a href="{{ route('dashboard') }}">dashboard</a>.
            @else
                <a href="{{ route('login') }}">Sign in</a> to continue.
            @endauth
        </p>
    </div>
@endsection
