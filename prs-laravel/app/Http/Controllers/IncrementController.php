<?php

namespace App\Http\Controllers;

use App\Models\Increment;
use Illuminate\Http\Request;
use Illuminate\View\View;

class IncrementController extends Controller
{
    public function index(Request $request): View
    {
        $status = $request->query('status'); // pending | granted | not_granted

        $query = Increment::with(['customerDetail', 'payPoint', 'prsRecord'])
            ->latest('from_date');

        if ($status === 'pending') {
            $query->where('granted_status', Increment::GRANT_PENDING);
        } elseif ($status === 'granted') {
            $query->where('granted_status', Increment::GRANT_GRANTED);
        } elseif ($status === 'not_granted') {
            $query->where('granted_status', Increment::GRANT_NOT_GRANTED);
        }

        return view('increments.index', [
            'increments' => $query->paginate(25),
            'status' => $status,
            'pendingCount' => Increment::where('granted_status', Increment::GRANT_PENDING)->count(),
        ]);
    }

    public function show(Increment $increment): View
    {
        $increment->load(['customerDetail', 'payPoint', 'prsRecord']);

        return view('increments.show', ['increment' => $increment]);
    }

    public function grant(Request $request, Increment $increment): \Illuminate\Http\RedirectResponse
    {
        $data = $request->validate([
            'granted_status' => 'required|in:1,2',
            'remarks_hod' => 'nullable|string|max:5000',
        ]);

        $increment->update([
            'granted_status' => (int) $data['granted_status'],
            'remarks_hod' => $data['remarks_hod'] ?? $increment->remarks_hod,
        ]);

        return redirect()
            ->route('increments.show', $increment)
            ->with('status', 'Increment decision recorded.');
    }
}
