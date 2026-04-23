<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryItem extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'code', 'name', 'category_id', 'unit', 'reorder_level',
        'standard_rate', 'description', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'reorder_level' => 'decimal:2',
            'standard_rate' => 'decimal:2',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ItemCategory::class, 'category_id');
    }

    public function stockTransactions(): HasMany
    {
        return $this->hasMany(StockTransaction::class);
    }

    public function stockAdjustments(): HasMany
    {
        return $this->hasMany(StockAdjustment::class);
    }

    public function currentStock(string $warehouseId = null)
    {
        $query = $this->stockTransactions();
        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }
        return $query->sum('quantity');
    }
}
