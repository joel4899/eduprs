@extends('layouts.app')
@section('title', 'Dashboard')

@section('content')
    <h1>Dashboard</h1>

    <div class="grid">
        <div class="card stat">
            <div class="num">{{ $counts['prs_pending'] }}</div>
            <div class="lbl"><a href="{{ route('prs-office.index') }}">PRS Office · Pending Approvals</a></div>
        </div>
        <div class="card stat">
            <div class="num">{{ $counts['leaves_meeting_done'] }}</div>
            <div class="lbl"><a href="{{ route('leaves.meeting-done') }}">Leaves · Meeting Done</a></div>
        </div>
        <div class="card stat">
            <div class="num">{{ $counts['confirmations_pending'] }}</div>
            <div class="lbl"><a href="{{ route('confirmation.index') }}">Confirmations · Pending</a></div>
        </div>
        <div class="card stat">
            <div class="num">{{ $counts['progressions_pending'] }}</div>
            <div class="lbl"><a href="{{ route('progressions.index') }}">Progressions · Pending</a></div>
        </div>
        <div class="card stat">
            <div class="num">{{ $counts['increments_pending'] }}</div>
            <div class="lbl"><a href="{{ route('increments.index') }}">Increments · Pending</a></div>
        </div>
        <div class="card stat">
            <div class="num">{{ $counts['pay_points_total'] }}</div>
            <div class="lbl"><a href="{{ route('pay-points.index') }}">Pay Points · Total</a></div>
        </div>
    </div>
@endsection
