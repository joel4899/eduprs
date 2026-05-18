@extends('layouts.app')
@section('title', 'Progressions')

@section('content')
    <h1>Progressions{{ $track ? ' · ' . $track : '' }}</h1>
    <p class="muted">Scale-band progressions across all 7 tracks.</p>

    <div class="grid">
        @foreach ($tracks as $t)
            <a href="{{ route('progressions.index', ['track' => $t]) }}" class="card stat" style="text-decoration:none; color:inherit;">
                <div class="num">{{ $pendingByTrack[$t] ?? 0 }}</div>
                <div class="lbl">{{ str_replace('_', ' ', $t) }}</div>
            </a>
        @endforeach
    </div>

    <table>
        <thead>
            <tr><th>Employee</th><th>Track</th><th>From</th><th>To</th><th>Effective</th><th>Decision</th><th></th></tr>
        </thead>
        <tbody>
            @forelse ($progressions as $p)
                <tr>
                    <td>{{ $p->customerDetail?->full_name }}</td>
                    <td>{{ $p->track }}</td>
                    <td>{{ $p->fromGrade?->code ?? '—' }}</td>
                    <td>{{ $p->toGrade?->code ?? '—' }}</td>
                    <td>{{ optional($p->effective_date)->format('Y-m-d') ?? '—' }}</td>
                    <td><span class="badge">{{ $p->decision }}</span></td>
                    <td><a href="{{ route('progressions.show', $p) }}">View</a></td>
                </tr>
            @empty
                <tr><td colspan="7" class="muted">No progressions recorded.</td></tr>
            @endforelse
        </tbody>
    </table>
    {{ $progressions->links() }}
@endsection
