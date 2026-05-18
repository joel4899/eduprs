<?php

namespace App\Http\Controllers;

use App\Models\SickLeave;
use App\Models\SpecialLeave;
use Illuminate\Http\Request;
use Illuminate\View\View;

class LeavesController extends Controller
{
    public function index(Request $request): View
    {
        $status = $request->query('status'); // pending | meeting_done | gp47_sent | closed

        $sick = SickLeave::with(['customerDetail', 'leaveType'])
            ->when($status, fn ($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate(15, ['*'], 'sick_page');

        $special = SpecialLeave::with(['customerDetail', 'leaveType'])
            ->when($status, fn ($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate(15, ['*'], 'special_page');

        return view('leaves.index', [
            'sick' => $sick,
            'special' => $special,
            'status' => $status,
            'meetingDoneCount' => SickLeave::where('status', 'meeting_done')->count()
                + SpecialLeave::where('status', 'meeting_done')->count(),
        ]);
    }

    public function meetingDone(): View
    {
        $sick = SickLeave::with(['customerDetail', 'leaveType'])
            ->where('status', 'meeting_done')
            ->orderBy('meeting_date', 'desc')
            ->paginate(20, ['*'], 'sick_page');

        $special = SpecialLeave::with(['customerDetail', 'leaveType'])
            ->where('status', 'meeting_done')
            ->orderBy('meeting_date', 'desc')
            ->paginate(20, ['*'], 'special_page');

        return view('leaves.meeting-done', [
            'sick' => $sick,
            'special' => $special,
        ]);
    }
}
