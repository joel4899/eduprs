<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Gp47Form extends Model
{
    protected $table = 'gp47_forms';

    protected $fillable = [
        'customer_detail_id', 'year', 'issued_date',
        'reference_no', 'content', 'status',
    ];

    protected $casts = [
        'issued_date' => 'date',
    ];

    /** @return BelongsTo<CustomerDetail, $this> */
    public function customerDetail(): BelongsTo
    {
        return $this->belongsTo(CustomerDetail::class);
    }
}
