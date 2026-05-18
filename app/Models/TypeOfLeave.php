<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeOfLeave extends Model
{
    protected $table = 'types_of_leave';

    protected $fillable = [
        'leave_type', 'official_name', 'paid', 'show_in_gp47',
        'include_formula', 'insert_date', 'num_of_hrs', 'comments',
    ];

    protected $casts = [
        'paid' => 'boolean',
        'show_in_gp47' => 'boolean',
        'include_formula' => 'boolean',
        'insert_date' => 'boolean',
        'num_of_hrs' => 'boolean',
    ];
}
