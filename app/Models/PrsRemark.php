<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrsRemark extends Model
{
    protected $fillable = ['prs_record_id', 'remark', 'officer'];

    /** @return BelongsTo<PrsRecord, $this> */
    public function prsRecord(): BelongsTo
    {
        return $this->belongsTo(PrsRecord::class);
    }
}
