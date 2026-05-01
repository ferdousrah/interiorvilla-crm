<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GrnItem extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'grn_id', 'po_item_id', 'quantity_received', 'condition', 'notes', 'created_at',
    ];

    protected function casts(): array
    {
        return ['quantity_received' => 'decimal:2'];
    }

    public function grn(): BelongsTo
    {
        return $this->belongsTo(GoodsReceiptNote::class, 'grn_id');
    }

    public function poItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderItem::class, 'po_item_id');
    }

    public function toArray(): array
    {
        $array = parent::toArray();
        if ($this->relationLoaded('poItem')) {
            $array['po_item_id'] = $this->getAttribute('po_item_id');
            $array['poItem']     = $this->poItem?->toArray();
        }
        return $array;
    }
}
