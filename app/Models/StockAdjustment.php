<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAdjustment extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'inventory_item_id', 'warehouse_id', 'physical_count', 'system_count',
        'variance', 'adjustment_date', 'reason', 'adjusted_by', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'physical_count' => 'decimal:2',
            'system_count' => 'decimal:2',
            'variance' => 'decimal:2',
            'adjustment_date' => 'date',
        ];
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function adjustedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adjusted_by');
    }
}
