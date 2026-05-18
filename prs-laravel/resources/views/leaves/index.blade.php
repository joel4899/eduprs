@extends('layouts.app')
@section('title', 'Leaves')

@section('content')
    <h1>Leaves</h1>
    <p class="muted">
        Sick & special leaves, GP47.
        <a href="{{ route('leaves.meeting-done') }}">{{ $meetingDoneCount }} meeting-done</a>
    </p>

    <h2>Sick leave</h2>
    <table>
        <thead><tr><th>Employee</th><th>Type</th><th>Year</th><th>Days</th><th>Status</th></tr></thead>
        <tbody>
            @forelse ($sick as $s)
                <tr>
                    <td>{{ $s->customerDetail?->full_name }}</td>
                    <td>{{ $s->leaveType?->leave_type ?? '—' }}</td>
                    <td>{{ $s->year }}</td>
                    <td>{{ $s->total_days }}</td>
                    <td><span class="badge">{{ $s->status }}</span></td>
                </tr>
            @empty
                <tr><td colspan="5" class="muted">No sick leave records.</td></tr>
            @endforelse
        </tbody>
    </table>
    {{ $sick->links() }}

    <h2>Special leave</h2>
    <table>
        <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr></thead>
        <tbody>
            @forelse ($special as $s)
                <tr>
                    <td>{{ $s->customerDetail?->full_name }}</td>
                    <td>{{ $s->leaveType?->leave_type ?? '—' }}</td>
                    <td>{{ optional($s->from_date)->format('Y-m-d') }}</td>
                    <td>{{ optional($s->to_date)->format('Y-m-d') }}</td>
                    <td>{{ $s->total_days }}</td>
                    <td><span class="badge">{{ $s->status }}</span></td>
                </tr>
            @empty
                <tr><td colspan="6" class="muted">No special leave records.</td></tr>
            @endforelse
        </tbody>
    </table>
    {{ $special->links() }}
@endsection
