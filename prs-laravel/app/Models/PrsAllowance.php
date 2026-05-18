<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrsAllowance extends Model
{
    protected $fillable = [
        'prs_record_id', 'allowance_code', 'description',
        'amount', 'effective_from', 'effective_to',
    ];

    protected $casts = [
        'amount' => 'decimal:4',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    /** @return BelongsTo<PrsRecord, $this> */
    public function prsRecord(): BelongsTo
    {
        return $this->belongsTo(PrsRecord::class);
    }
}
