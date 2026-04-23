<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CostEstimationItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'cost_estimation_id', 'material_id', 'category', 'description', 'unit',
        'quantity', 'estimated_rate', 'estimated_total',
        'actual_total', 'notes', 'sequence',
    ];

    protected function casts(): array
    {
        return [
            'quantity'        => 'decimal:2',
            'estimated_rate'  => 'decimal:2',
            'estimated_total' => 'decimal:2',
            'actual_total'    => 'decimal:2',
        ];
    }

    public function costEstimation(): BelongsTo
    {
        return $this->belongsTo(CostEstimation::class);
    }
}
