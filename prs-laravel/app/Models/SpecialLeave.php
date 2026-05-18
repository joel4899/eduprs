<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpecialLeave extends Model
{
    public const STATUSES = ['pending', 'meeting_done', 'gp47_sent', 'closed'];

    protected $fillable = [
        'customer_detail_id', 'leave_type_id', 'paid', 'from_date', 'to_date',
        'total_days', 'num_of_hrs', 'nature', 'dob_child',
        'show_in_gp47', 'include_formula', 'discipline', 'teaching_non_teaching',
        'officer', 'comments', 'officer_comments', 'added_at',
        'status', 'meeting_date',
    ];

    protected $casts = [
        'paid' => 'boolean',
        'from_date' => 'date',
        'to_date' => 'date',
        'total_days' => 'decimal:2',
        'dob_child' => 'date',
        'show_in_gp47' => 'boolean',
        'include_formula' => 'boolean',
        'discipline' => 'boolean',
        'added_at' => 'datetime',
        'meeting_date' => 'date',
    ];

    /** @return BelongsTo<CustomerDetail, $this> */
    public function customerDetail(): BelongsTo
    {
        return $this->belongsTo(CustomerDetail::class);
    }

    /** @return BelongsTo<TypeOfLeave, $this> */
    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(TypeOfLeave::class, 'leave_type_id');
    }
}
