<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Confirmation extends Model
{
    public const STATUSES = ['pending', 'confirmed', 'extended', 'terminated'];
    public const TYPES = ['probationary', 'indefinite'];

    protected $fillable = [
        'customer_detail_id', 'prs_record_id', 'confirmation_type',
        'probation_start', 'probation_end', 'confirmation_date',
        'status', 'audit_by', 'audit_date', 'college_decision',
        'dg_decision_date', 'inserted_in_prs', 'inserted_in_prs_date', 'notes',
    ];

    protected $casts = [
        'probation_start' => 'date',
        'probation_end' => 'date',
        'confirmation_date' => 'date',
        'audit_date' => 'date',
        'dg_decision_date' => 'date',
        'inserted_in_prs_date' => 'date',
        'inserted_in_prs' => 'boolean',
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
}
