@extends('layouts.app')
@section('title', 'Confirmation of Appointment')

@section('content')
    <h1>Confirmation of Appointment <span class="badge amber">{{ $pendingCount }} pending</span></h1>
    <p class="muted">Probationary confirmations — audit, college, DG, PRS insertion.</p>

    <table>
        <thead>
            <tr>
                <th>Employee</th><th>Type</th><th>Probation Start</th><th>Probation End</th>
                <th>Status</th><th>Inserted in PRS</th><th></th>
            </tr>
        </thead>
        <tbody>
            @forelse ($confirmations as $c)
                <tr>
                    <td>{{ $c->customerDetail?->full_name }}</td>
                    <td>{{ $c->confirmation_type }}</td>
                    <td>{{ optional($c->probation_start)->format('Y-m-d') ?? '—' }}</td>
                    <td>{{ optional($c->probation_end)->format('Y-m-d') ?? '—' }}</td>
                    <td><span class="badge {{ $c->status === 'confirmed' ? 'green' : 'amber' }}">{{ $c->status }}</span></td>
                    <td>{{ $c->inserted_in_prs ? 'Yes' : 'No' }}</td>
                    <td><a href="{{ route('confirmation.show', $c) }}">View</a></td>
                </tr>
            @empty
                <tr><td colspan="7" class="muted">No confirmations recorded.</td></tr>
            @endforelse
        </tbody>
    </table>
    {{ $confirmations->links() }}
@endsection
