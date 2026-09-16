<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class VendorCategory extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'sort_order'];
}
