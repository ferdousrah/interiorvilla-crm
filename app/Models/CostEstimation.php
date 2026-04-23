<?php

namespace App\Models;

use App\Traits\Auditable;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CostEstimation extends Model
{
    use HasUuids, SoftDeletes, Auditable;

    protected $fillable = [
        'code', 'title', 'service_group', 'service_type', 'lead_id', 'client_id', 'project_id',
        'status', 'total_estimated', 'total_actual', 'markup_pct', 'markup_amount',
        'suggested_quote', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'total_estimated' => 'decimal:2',
            'total_actual'    => 'decimal:2',
            'markup_pct'      => 'decimal:2',
            'markup_amount'   => 'decimal:2',
            'suggested_quote' => 'decimal:2',
        ];
    }

    public function lead(): BelongsTo { return $this->belongsTo(Lead::class); }
    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function project(): BelongsTo { return $this->belongsTo(Project::class); }
    public function createdBy(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function items(): HasMany { return $this->hasMany(CostEstimationItem::class)->orderBy('sequence'); }
}
