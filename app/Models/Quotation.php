<?php

namespace App\Models;

use App\Traits\Auditable;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quotation extends Model
{
    use HasUuids, SoftDeletes, Auditable;

    protected $fillable = [
        'code', 'client_id', 'lead_id', 'project_id', 'subject', 'service_group', 'service_type',
        'status', 'document_date', 'valid_until',
        'subtotal', 'discount_type', 'discount_value', 'discount_amount',
        'vat_pct', 'vat_amount',
        'transportation_amount', 'supervision_pct', 'supervision_amount',
        'grand_total',
        'terms', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'document_date'          => 'date',
            'valid_until'            => 'date',
            'subtotal'               => 'decimal:2',
            'discount_value'         => 'decimal:2',
            'discount_amount'        => 'decimal:2',
            'vat_pct'                => 'decimal:2',
            'vat_amount'             => 'decimal:2',
            'transportation_amount'  => 'decimal:2',
            'supervision_pct'        => 'decimal:2',
            'supervision_amount'     => 'decimal:2',
            'grand_total'            => 'decimal:2',
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

    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class)->orderBy('sequence');
    }

    /**
     * Prevent the `createdBy` relation from overwriting the `created_by` FK
     * column during JSON serialization. Expose the loaded relation under the
     * camelCase `createdBy` key so the frontend can read quotation.createdBy.
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
