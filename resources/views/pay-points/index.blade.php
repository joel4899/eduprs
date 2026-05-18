@extends('layouts.app')
@section('title', 'Pay Points')

@section('content')
    <h1>Pay Points</h1>

    <form method="GET" style="margin-bottom: 16px;">
        <input type="search" name="q" placeholder="Search code or description…" value="{{ request('q') }}">
        <button type="submit">Search</button>
    </form>

    <table>
        <thead><tr><th>Code</th><th>Description</th><th>Directorate / College</th><th>Active</th><th></th></tr></thead>
        <tbody>
            @forelse ($payPoints as $p)
                <tr>
                    <td><strong>{{ $p->code }}</strong></td>
                    <td>{{ $p->description }}</td>
                    <td>{{ $p->directorateCollege?->name ?? '—' }}</td>
                    <td>{{ $p->active ? 'Yes' : 'No' }}</td>
                    <td><a href="{{ route('pay-points.show', $p) }}">View</a></td>
                </tr>
            @empty
                <tr><td colspan="5" class="muted">No pay points configured.</td></tr>
            @endforelse
        </tbody>
    </table>
    {{ $payPoints->links() }}

    <div class="card" style="margin-top: 24px;">
        <h2>Add pay point</h2>
        <form method="POST" action="{{ route('pay-points.store') }}">
            @csrf
            <p><input type="text" name="code" placeholder="Code (e.g. 4101)" required maxlength="30"></p>
            <p><input type="text" name="description" placeholder="Description" required maxlength="200" style="width: 60%;"></p>
            <p>
                <select name="directorate_college_id">
                    <option value="">— Directorate / College —</option>
                    @foreach ($colleges as $c)
                        <option value="{{ $c->id }}">{{ $c->name }}</option>
                    @endforeach
                </select>
            </p>
            <p><label><input type="checkbox" name="active" value="1" checked> Active</label></p>
            <button type="submit">Add</button>
        </form>
    </div>
@endsection
