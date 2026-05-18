<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeachingGrade extends Model
{
    protected $fillable = ['code', 'description', 'salary_scale_id'];

    /** @return BelongsTo<SalaryScale, $this> */
    public function salaryScale(): BelongsTo
    {
        return $this->belongsTo(SalaryScale::class);
    }
}
