<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialServiceType extends Model
{
    protected $fillable = ['material_id', 'service_group', 'service_type'];

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
