<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SopPayPoint extends Model
{
    protected $fillable = ['pay_point_id', 'title', 'procedure_text', 'effective_date'];

    protected $casts = ['effective_date' => 'date'];

    /** @return BelongsTo<PayPoint, $this> */
    public function payPoint(): BelongsTo
    {
        return $this->belongsTo(PayPoint::class);
    }
}
