<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerDetail extends Model
{
    protected $fillable = [
        'person_id_no', 'ni_number', 'employee_no', 'salutation_id',
        'person_name', 'person_surname', 'person_birth_surname',
        'gender_id', 'date_of_birth', 'commencement_date', 'citizenship',
        'marital_status', 'date_of_marriage', 'spouse_id',
        'father_name', 'father_surname',
        'door_number', 'house_name', 'street_subdivision', 'street_name',
        'locality_id', 'post_code', 'birth_country',
        'door_number_2', 'house_name_2', 'street_subdivision_2', 'street_name_2',
        'locality_name_2', 'post_code_2', 'birth_country_2',
        'telephone_no', 'mobile_no', 'email_address',
        'present_employment', 'post_of_employment', 'position', 'teaching_of', 'department',
        'conf_correct', 'conf_by', 'conf_correct_on',
        'still_in_service', 'resigned',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'commencement_date' => 'date',
        'date_of_marriage' => 'date',
        'conf_correct_on' => 'datetime',
        'conf_correct' => 'boolean',
        'still_in_service' => 'boolean',
        'resigned' => 'boolean',
    ];

    /** @return BelongsTo<PersonGender, $this> */
    public function gender(): BelongsTo
    {
        return $this->belongsTo(PersonGender::class, 'gender_id');
    }

    /** @return BelongsTo<Salutation, $this> */
    public function salutation(): BelongsTo
    {
        return $this->belongsTo(Salutation::class);
    }

    /** @return BelongsTo<Village, $this> */
    public function locality(): BelongsTo
    {
        return $this->belongsTo(Village::class, 'locality_id');
    }

    /** @return HasMany<PrsRecord, $this> */
    public function prsRecords(): HasMany
    {
        return $this->hasMany(PrsRecord::class);
    }

    /** @return HasMany<Confirmation, $this> */
    public function confirmations(): HasMany
    {
        return $this->hasMany(Confirmation::class);
    }

    /** @return HasMany<Progression, $this> */
    public function progressions(): HasMany
    {
        return $this->hasMany(Progression::class);
    }

    /** @return HasMany<Increment, $this> */
    public function increments(): HasMany
    {
        return $this->hasMany(Increment::class);
    }

    /** @return HasMany<SickLeave, $this> */
    public function sickLeaves(): HasMany
    {
        return $this->hasMany(SickLeave::class);
    }

    /** @return HasMany<SpecialLeave, $this> */
    public function specialLeaves(): HasMany
    {
        return $this->hasMany(SpecialLeave::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->person_name} {$this->person_surname}");
    }
}
