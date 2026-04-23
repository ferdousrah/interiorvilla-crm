<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationTemplateItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'section_id', 'material_id', 'description', 'unit',
        'default_quantity', 'default_rate', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'default_quantity' => 'decimal:2',
            'default_rate'     => 'decimal:2',
            'sort_order'       => 'integer',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(QuotationTemplateSection::class, 'section_id');
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
