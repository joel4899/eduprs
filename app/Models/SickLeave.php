<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SickLeave extends Model
{
    public const STATUSES = ['pending', 'meeting_done', 'gp47_sent', 'closed'];

    protected $fillable = [
        'customer_detail_id', 'leave_type_id', 'year', 'total_days',
        'officer', 'comments', 'added_at', 'status', 'meeting_date',
    ];

    protected $casts = [
        'total_days' => 'decimal:2',
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
