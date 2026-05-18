@extends('layouts.app')
@section('title', 'Confirmation')

@section('content')
    <h1>Confirmation · {{ $confirmation->customerDetail?->full_name }}</h1>
    <div class="card">
        <p>Type: {{ $confirmation->confirmation_type }}</p>
        <p>Probation: {{ optional($confirmation->probation_start)->format('Y-m-d') }}
            → {{ optional($confirmation->probation_end)->format('Y-m-d') }}</p>
        <p>Confirmation date: {{ optional($confirmation->confirmation_date)->format('Y-m-d') ?? '—' }}</p>
        <p>Audit by: {{ $confirmation->audit_by ?? '—' }}</p>
        <p>College decision: {{ $confirmation->college_decision ?? '—' }}</p>
        <p>DG decision date: {{ optional($confirmation->dg_decision_date)->format('Y-m-d') ?? '—' }}</p>
        <p>Inserted in PRS: {{ $confirmation->inserted_in_prs ? 'Yes' : 'No' }}</p>
        <p>Status: <span class="badge">{{ $confirmation->status }}</span></p>
        <p>Notes: {{ $confirmation->notes ?? '—' }}</p>
    </div>
@endsection
