@extends('layouts.app')
@section('title', 'PRS Office')

@section('content')
    <h1>PRS Office <span class="badge amber">{{ $approvalQueue }} pending</span></h1>
    <p class="muted">Master personnel records — gatekeeper for all replications.</p>

    <table>
        <thead>
            <tr>
                <th>Employee</th>
                <th>ID Card</th>
                <th>Grade</th>
                <th>Pay Point</th>
                <th>Effective</th>
                <th>Status</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            @forelse ($records as $r)
                <tr>
                    <td>{{ $r->customerDetail?->full_name }}</td>
                    <td>{{ $r->customerDetail?->person_id_no }}</td>
                    <td>{{ $r->teachingGrade?->description ?? '—' }}</td>
                    <td>{{ $r->payPoint?->code ?? '—' }}</td>
                    <td>{{ optional($r->effective_date)->format('Y-m-d') ?? '—' }}</td>
                    <td><span class="badge">{{ $r->status }}</span></td>
                    <td><a href="{{ route('prs-office.show', $r) }}">View</a></td>
                </tr>
            @empty
                <tr><td colspan="7" class="muted">No PRS records yet.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div style="margin-top: 16px;">{{ $records->links() }}</div>
@endsection
