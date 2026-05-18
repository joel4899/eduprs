<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayPoint extends Model
{
    protected $fillable = ['code', 'description', 'directorate_college_id', 'active'];

    protected $casts = ['active' => 'boolean'];

    /** @return BelongsTo<DirectorateCollege, $this> */
    public function directorateCollege(): BelongsTo
    {
        return $this->belongsTo(DirectorateCollege::class);
    }

    /** @return HasMany<SopPayPoint, $this> */
    public function sops(): HasMany
    {
        return $this->hasMany(SopPayPoint::class);
    }
}
