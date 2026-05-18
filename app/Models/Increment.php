<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Increment extends Model
{
    public const GRANT_PENDING = 0;
    public const GRANT_GRANTED = 1;
    public const GRANT_NOT_GRANTED = 2;

    protected $fillable = [
        'customer_detail_id', 'prs_record_id', 'pay_point_id',
        'current_grade', 'scale_step', 'increment_step',
        'next_salary', 'probation_expiry_date',
        'from_date', 'wef', 'granted_status', 'officer',
        'sent_to_salaries', 'added_to_prs', 'sent_to_gozo',
        'mark_to_print', 'prs_printed', 'send_by_date',
        'remarks', 'remarks_hod', 'prs_reason', 'add_emoluments', 'file_number',
    ];

    protected $casts = [
        'next_salary' => 'decimal:4',
        'probation_expiry_date' => 'date',
        'from_date' => 'date',
        'wef' => 'date',
        'send_by_date' => 'date',
        'sent_to_salaries' => 'boolean',
        'added_to_prs' => 'boolean',
        'sent_to_gozo' => 'boolean',
        'mark_to_print' => 'boolean',
        'prs_printed' => 'boolean',
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

    /** @return BelongsTo<PayPoint, $this> */
    public function payPoint(): BelongsTo
    {
        return $this->belongsTo(PayPoint::class);
    }
}
