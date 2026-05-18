@extends('layouts.app')
@section('title', 'PRS Record')

@section('content')
    <h1>PRS Record · {{ $record->customerDetail?->full_name }}</h1>
    <p class="muted">ID Card {{ $record->customerDetail?->person_id_no }} · {{ $record->record_type }}</p>

    <div class="card">
        <h2>Employment</h2>
        <p>Grade: {{ $record->teachingGrade?->description ?? '—' }}</p>
        <p>Pay Point: {{ $record->payPoint?->code ?? '—' }}</p>
        <p>Scale: {{ $record->salaryScale?->scale ?? '—' }}</p>
        <p>Effective: {{ optional($record->effective_date)->format('Y-m-d') ?? '—' }}</p>
        <p>Status: <span class="badge">{{ $record->status }}</span></p>
    </div>

    @if ($record->status === 'pending_approval')
        <form method="POST" action="{{ route('prs-office.approve', $record) }}">
            @csrf
            <button type="submit">Approve record</button>
        </form>
    @endif

    <div class="card">
        <h2>Allowances</h2>
        @forelse ($record->allowances as $a)
            <p>{{ $a->allowance_code }} — {{ $a->description }} ({{ number_format($a->amount, 2) }})</p>
        @empty
            <p class="muted">No allowances on record.</p>
        @endforelse
    </div>

    <div class="card">
        <h2>Remarks</h2>
        @forelse ($record->remarksLog as $r)
            <p>{{ $r->remark }} <span class="muted">— {{ $r->officer }} · {{ $r->created_at->format('Y-m-d') }}</span></p>
        @empty
            <p class="muted">No remarks logged.</p>
        @endforelse
    </div>
@endsection
