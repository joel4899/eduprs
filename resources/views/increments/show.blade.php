@extends('layouts.app')
@section('title', 'Increment')

@section('content')
    <h1>Increment · {{ $increment->customerDetail?->full_name }}</h1>
    <div class="card">
        <p>Current grade: {{ $increment->current_grade ?? '—' }}</p>
        <p>Scale step / Increment step: {{ $increment->scale_step ?? '—' }} / {{ $increment->increment_step ?? '—' }}</p>
        <p>Next salary: {{ $increment->next_salary ?? '—' }}</p>
        <p>From date: {{ optional($increment->from_date)->format('Y-m-d') ?? '—' }}</p>
        <p>WEF: {{ optional($increment->wef)->format('Y-m-d') ?? '—' }}</p>
        <p>Probation expiry: {{ optional($increment->probation_expiry_date)->format('Y-m-d') ?? '—' }}</p>
        <p>Officer: {{ $increment->officer ?? '—' }}</p>
        <p>Remarks: {{ $increment->remarks ?? '—' }}</p>
        <p>HOD remarks: {{ $increment->remarks_hod ?? '—' }}</p>
        <p>Granted: {{ ['Pending', 'Granted', 'Not granted'][$increment->granted_status] ?? '—' }}</p>
    </div>

    @if ($increment->granted_status === 0)
        <form method="POST" action="{{ route('increments.grant', $increment) }}" class="card">
            @csrf
            <p>Record decision:</p>
            <label><input type="radio" name="granted_status" value="1" required> Granted</label>
            <label><input type="radio" name="granted_status" value="2"> Not granted</label>
            <p><textarea name="remarks_hod" placeholder="HOD remarks (optional)" rows="3" style="width: 100%;"></textarea></p>
            <button type="submit">Save</button>
        </form>
    @endif
@endsection
