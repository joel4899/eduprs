<?php

namespace App\Http\Controllers;

use App\Models\Confirmation;
use App\Models\Increment;
use App\Models\PayPoint;
use App\Models\Progression;
use App\Models\PrsRecord;
use App\Models\SickLeave;
use App\Models\SpecialLeave;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __invoke(): View
    {
        return view('dashboard', [
            'counts' => [
                'prs_pending' => PrsRecord::where('status', 'pending_approval')->count(),
                'increments_pending' => Increment::where('granted_status', Increment::GRANT_PENDING)->count(),
                'progressions_pending' => Progression::where('decision', 'pending')->count(),
                'confirmations_pending' => Confirmation::where('status', 'pending')->count(),
                'leaves_meeting_done' => SickLeave::where('status', 'meeting_done')->count()
                    + SpecialLeave::where('status', 'meeting_done')->count(),
                'pay_points_total' => PayPoint::count(),
            ],
        ]);
    }
}
