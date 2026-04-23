<?php

namespace App\Models;

use App\Traits\Auditable;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasUuids, SoftDeletes, Auditable;

    protected $fillable = [
        'code', 'client_id', 'lead_id', 'project_id', 'status', 'invoice_date', 'due_date',
        'subtotal', 'vat_pct', 'vat_amount', 'discount_amount', 'grand_total',
        'income_source', 'paid_amount', 'notes', 'terms', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date' => 'date',
            'due_date' => 'date',
            'subtotal' => 'decimal:2',
            'vat_pct' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(InvoiceLineItem::class)->orderBy('sequence');
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(ClientReceipt::class);
    }

    /**
     * Keep the `created_by` FK visible and expose the loaded relation under
     * the camelCase `createdBy` key (Laravel would otherwise snake_case the
     * relation and clobber the FK column).
     */
    public function toArray(): array
    {
        $array = parent::toArray();

        if ($this->relationLoaded('createdBy')) {
            $array['created_by'] = $this->getAttribute('created_by');
            $array['createdBy']  = $this->createdBy?->toArray();
        }

        return $array;
    }
}
