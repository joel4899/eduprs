<?php

namespace App\Http\Controllers;

use App\Models\Progression;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ProgressionController extends Controller
{
    public function index(Request $request, ?string $track = null): View
    {
        $track = $track ?: $request->query('track');

        $query = Progression::with(['customerDetail', 'fromGrade', 'toGrade'])
            ->latest('effective_date');

        if ($track && in_array($track, Progression::TRACKS, true)) {
            $query->where('track', $track);
        }

        return view('progressions.index', [
            'progressions' => $query->paginate(25),
            'track' => $track,
            'tracks' => Progression::TRACKS,
            'pendingByTrack' => Progression::query()
                ->selectRaw('track, count(*) as c')
                ->where('decision', 'pending')
                ->groupBy('track')
                ->pluck('c', 'track')
                ->all(),
        ]);
    }

    public function show(Progression $progression): View
    {
        $progression->load(['customerDetail', 'fromGrade', 'toGrade', 'history']);

        return view('progressions.show', ['progression' => $progression]);
    }
}
