<?php

namespace App\Http\Controllers;

use App\Models\CustomerDetail;
use App\Models\PrsRecord;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PrsOfficeController extends Controller
{
    public function index(Request $request): View
    {
        $records = PrsRecord::with(['customerDetail', 'teachingGrade', 'payPoint'])
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->latest('effective_date')
            ->paginate(25);

        return view('prs-office.index', [
            'records' => $records,
            'approvalQueue' => PrsRecord::where('status', 'pending_approval')->count(),
        ]);
    }

    public function show(PrsRecord $prsRecord): View
    {
        $prsRecord->load(['customerDetail', 'teachingGrade', 'payPoint', 'salaryScale', 'allowances', 'remarksLog']);

        return view('prs-office.show', ['record' => $prsRecord]);
    }

    public function approve(PrsRecord $prsRecord): \Illuminate\Http\RedirectResponse
    {
        $prsRecord->update(['status' => 'active']);

        return redirect()
            ->route('prs-office.show', $prsRecord)
            ->with('status', 'PRS record approved.');
    }
}
