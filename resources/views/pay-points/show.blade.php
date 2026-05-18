@extends('layouts.app')
@section('title', 'Pay Point')

@section('content')
    <h1>Pay Point · {{ $payPoint->code }}</h1>
    <div class="card">
        <p><strong>Description:</strong> {{ $payPoint->description }}</p>
        <p><strong>Directorate / College:</strong> {{ $payPoint->directorateCollege?->name ?? '—' }}</p>
        <p><strong>Status:</strong> {{ $payPoint->active ? 'Active' : 'Inactive' }}</p>
    </div>

    <div class="card">
        <h2>Standard Operating Procedures</h2>
        @forelse ($payPoint->sops as $s)
            <p><strong>{{ $s->title }}</strong>
                <span class="muted">{{ optional($s->effective_date)->format('Y-m-d') }}</span></p>
            <p>{{ $s->procedure_text }}</p>
        @empty
            <p class="muted">No SOPs attached.</p>
        @endforelse
    </div>
@endsection
