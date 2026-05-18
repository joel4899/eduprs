@extends('layouts.app')
@section('title', 'Progression')

@section('content')
    <h1>Progression · {{ $progression->customerDetail?->full_name }}</h1>
    <div class="card">
        <p>Track: {{ $progression->track }}</p>
        <p>From → To: {{ $progression->fromGrade?->code ?? '—' }} → {{ $progression->toGrade?->code ?? '—' }}</p>
        <p>Service years: {{ $progression->service_years ?? '—' }}</p>
        <p>Unpaid leave years: {{ $progression->unpaid_leave_years ?? '—' }}</p>
        <p>Eligibility / Decision / Effective:
            {{ optional($progression->eligibility_date)->format('Y-m-d') ?? '—' }} /
            {{ optional($progression->decision_date)->format('Y-m-d') ?? '—' }} /
            {{ optional($progression->effective_date)->format('Y-m-d') ?? '—' }}
        </p>
        <p>Decision: <span class="badge">{{ $progression->decision }}</span></p>
        <p>Notes: {{ $progression->notes ?? '—' }}</p>
    </div>

    <div class="card">
        <h2>History</h2>
        @forelse ($progression->history as $h)
            <p>{{ $h->from_status ?? '—' }} → <strong>{{ $h->to_status }}</strong>
                <span class="muted">— {{ $h->changed_by }} · {{ $h->created_at->format('Y-m-d') }}</span></p>
        @empty
            <p class="muted">No history entries.</p>
        @endforelse
    </div>
@endsection
