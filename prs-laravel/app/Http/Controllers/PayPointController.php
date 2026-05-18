<?php

namespace App\Http\Controllers;

use App\Models\DirectorateCollege;
use App\Models\PayPoint;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PayPointController extends Controller
{
    public function index(Request $request): View
    {
        // ->query('q') can be array|string|null; coerce to string before
        // interpolating into a LIKE pattern so ?q[]=foo can't crash the page.
        $term = $request->string('q')->trim()->toString();

        $payPoints = PayPoint::with(['directorateCollege', 'sops'])
            ->when($term !== '', function ($q) use ($term) {
                $q->where(function ($w) use ($term) {
                    $w->where('code', 'like', "%{$term}%")
                        ->orWhere('description', 'like', "%{$term}%");
                });
            })
            ->orderBy('code')
            ->paginate(50);

        return view('pay-points.index', [
            'payPoints' => $payPoints,
            'colleges' => DirectorateCollege::orderBy('name')->get(),
        ]);
    }

    public function show(PayPoint $payPoint): View
    {
        $payPoint->load(['directorateCollege', 'sops']);

        return view('pay-points.show', ['payPoint' => $payPoint]);
    }

    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $data = $request->validate([
            'code' => 'required|string|max:30|unique:pay_points,code',
            'description' => 'required|string|max:200',
            'directorate_college_id' => 'nullable|exists:directorate_colleges,id',
            'active' => 'boolean',
        ]);

        $payPoint = PayPoint::create($data);

        return redirect()->route('pay-points.show', $payPoint);
    }
}
