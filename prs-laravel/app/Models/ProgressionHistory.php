<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgressionHistory extends Model
{
    protected $table = 'progression_history';

    protected $fillable = [
        'progression_id', 'from_status', 'to_status', 'changed_by', 'change_notes',
    ];

    /** @return BelongsTo<Progression, $this> */
    public function progression(): BelongsTo
    {
        return $this->belongsTo(Progression::class);
    }
}
