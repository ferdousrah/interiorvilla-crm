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
        'code', 'revision_no', 'parent_quotation_id',
        'client_id', 'lead_id', 'project_id', 'subject', 'service_group', 'service_type',
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

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Quotation::class, 'parent_quotation_id');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(Quotation::class, 'parent_quotation_id')->orderBy('revision_no');
    }

    /**
     * Returns the revision-1 quotation (the original) for this lineage.
     * If this quotation IS the original, returns itself.
     */
    public function rootQuotation(): self
    {
        return $this->parent_quotation_id ? $this->parent->rootQuotation() : $this;
    }

    /**
     * All revisions in this lineage (including the original), ordered.
     */
    public function lineage()
    {
        $root = $this->rootQuotation();
        return self::where('id', $root->id)
            ->orWhere('parent_quotation_id', $root->id)
            ->orderBy('revision_no')
            ->get();
    }

    /**
     * Display label like "Q-2026-001" or "Q-2026-001 Rev 02".
     */
    public function getDisplayCodeAttribute(): string
    {
        return $this->revision_no > 1
            ? sprintf('%s Rev %02d', $this->code, $this->revision_no)
            : $this->code;
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

        $array['display_code'] = $this->display_code;

        return $array;
    }
}
