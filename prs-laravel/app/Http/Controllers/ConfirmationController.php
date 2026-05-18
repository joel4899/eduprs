<?php

namespace App\Http\Controllers;

use App\Models\Confirmation;
use App\Models\CustomerDetail;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ConfirmationController extends Controller
{
    public function index(Request $request): View
    {
        $confirmations = Confirmation::with(['customerDetail', 'prsRecord'])
            ->when(
                $request->query('status'),
                fn ($q, $s) => $q->where('status', $s)
            )
            ->latest('confirmation_date')
            ->paginate(25);

        return view('confirmation.index', [
            'confirmations' => $confirmations,
            'pendingCount' => Confirmation::where('status', 'pending')->count(),
        ]);
    }

    public function show(Confirmation $confirmation): View
    {
        $confirmation->load(['customerDetail', 'prsRecord']);

        return view('confirmation.show', ['confirmation' => $confirmation]);
    }

    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $data = $request->validate([
            'customer_detail_id' => 'required|exists:customer_details,id',
            'confirmation_type' => 'required|in:'.implode(',', Confirmation::TYPES),
            'probation_start' => 'nullable|date',
            'probation_end' => 'nullable|date|after_or_equal:probation_start',
            'notes' => 'nullable|string|max:2000',
        ]);

        $data['status'] = 'pending';
        $confirmation = Confirmation::create($data);

        return redirect()->route('confirmation.show', $confirmation);
    }
}
