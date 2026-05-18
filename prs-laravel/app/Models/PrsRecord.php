<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PrsRecord extends Model
{
    protected $fillable = [
        'customer_detail_id', 'teaching_grade_id', 'pay_point_id', 'salary_scale_id',
        'record_type', 'effective_date', 'end_date', 'reason', 'status', 'remarks',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'end_date' => 'date',
    ];

    /** @return BelongsTo<CustomerDetail, $this> */
    public function customerDetail(): BelongsTo
    {
        return $this->belongsTo(CustomerDetail::class);
    }

    /** @return BelongsTo<TeachingGrade, $this> */
    public function teachingGrade(): BelongsTo
    {
        return $this->belongsTo(TeachingGrade::class);
    }

    /** @return BelongsTo<PayPoint, $this> */
    public function payPoint(): BelongsTo
    {
        return $this->belongsTo(PayPoint::class);
    }

    /** @return BelongsTo<SalaryScale, $this> */
    public function salaryScale(): BelongsTo
    {
        return $this->belongsTo(SalaryScale::class);
    }

    /** @return HasMany<PrsAllowance, $this> */
    public function allowances(): HasMany
    {
        return $this->hasMany(PrsAllowance::class);
    }

    /** @return HasMany<PrsRemark, $this> */
    public function remarksLog(): HasMany
    {
        return $this->hasMany(PrsRemark::class);
    }
}
