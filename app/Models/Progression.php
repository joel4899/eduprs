<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Progression extends Model
{
    public const TRACKS = [
        'teachers', 'non_teaching', 'eo_hos',
        'lse_kge_qual', 'lse_kge_i', 'lse_kge_ii', 'lse_kge_iii',
    ];

    public const DECISIONS = ['pending', 'approved', 'rejected', 'deferred'];

    protected $fillable = [
        'customer_detail_id', 'prs_record_id', 'track',
        'from_grade_id', 'to_grade_id',
        'eligibility_date', 'decision_date', 'effective_date',
        'decision', 'qualification_subject',
        'service_years', 'unpaid_leave_years',
        'officer', 'notes',
    ];

    protected $casts = [
        'eligibility_date' => 'date',
        'decision_date' => 'date',
        'effective_date' => 'date',
        'service_years' => 'decimal:2',
        'unpaid_leave_years' => 'decimal:2',
    ];

    /** @return BelongsTo<CustomerDetail, $this> */
    public function customerDetail(): BelongsTo
    {
        return $this->belongsTo(CustomerDetail::class);
    }

    /** @return BelongsTo<PrsRecord, $this> */
    public function prsRecord(): BelongsTo
    {
        return $this->belongsTo(PrsRecord::class);
    }

    /** @return BelongsTo<TeachingGrade, $this> */
    public function fromGrade(): BelongsTo
    {
        return $this->belongsTo(TeachingGrade::class, 'from_grade_id');
    }

    /** @return BelongsTo<TeachingGrade, $this> */
    public function toGrade(): BelongsTo
    {
        return $this->belongsTo(TeachingGrade::class, 'to_grade_id');
    }

    /** @return HasMany<ProgressionHistory, $this> */
    public function history(): HasMany
    {
        return $this->hasMany(ProgressionHistory::class);
    }
}
