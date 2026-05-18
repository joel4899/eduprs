@extends('layouts.app')
@section('title', 'Increments')

@section('content')
    <h1>Increments <span class="badge amber">{{ $pendingCount }} pending</span></h1>

    <p>
        <a href="{{ route('increments.index') }}">All</a>
        · <a href="{{ route('increments.index', ['status' => 'pending']) }}">Pending</a>
        · <a href="{{ route('increments.index', ['status' => 'granted']) }}">Granted</a>
        · <a href="{{ route('increments.index', ['status' => 'not_granted']) }}">Not granted</a>
    </p>

    <table>
        <thead>
            <tr><th>Employee</th><th>Grade</th><th>Pay Point</th><th>From</th><th>WEF</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
            @forelse ($increments as $i)
                <tr>
                    <td>{{ $i->customerDetail?->full_name }}</td>
                    <td>{{ $i->current_grade ?? '—' }}</td>
                    <td>{{ $i->payPoint?->code ?? '—' }}</td>
                    <td>{{ optional($i->from_date)->format('Y-m-d') ?? '—' }}</td>
                    <td>{{ optional($i->wef)->format('Y-m-d') ?? '—' }}</td>
                    <td>
                        @if ($i->granted_status === 1)
                            <span class="badge green">Granted</span>
                        @elseif ($i->granted_status === 2)
                            <span class="badge">Not granted</span>
                        @else
                            <span class="badge amber">Pending</span>
                        @endif
                    </td>
                    <td><a href="{{ route('increments.show', $i) }}">View</a></td>
                </tr>
            @empty
                <tr><td colspan="7" class="muted">No increments recorded.</td></tr>
            @endforelse
        </tbody>
    </table>
    {{ $increments->links() }}
@endsection
