<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuotationTemplate extends Model
{
    use HasUuids, Auditable;

    protected $fillable = [
        'name', 'service_group', 'service_type', 'description',
        'default_terms', 'default_supervision_pct', 'is_active', 'sort_order',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active'              => 'boolean',
            'sort_order'             => 'integer',
            'default_supervision_pct'=> 'decimal:2',
        ];
    }

    public function sections(): HasMany
    {
        return $this->hasMany(QuotationTemplateSection::class, 'template_id')->orderBy('sort_order');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
