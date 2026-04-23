<?php

namespace App\Models;

use App\Traits\Auditable;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory, HasUuids, SoftDeletes, Auditable;

    protected $fillable = [
        'code', 'name', 'client_id', 'lead_id', 'type', 'status',
        'site_address', 'area_sqft', 'start_date', 'expected_end_date',
        'actual_end_date', 'contract_value', 'budget_limit',
        'site_engineer_id', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'expected_end_date' => 'date',
            'actual_end_date' => 'date',
            'contract_value' => 'decimal:2',
            'budget_limit' => 'decimal:2',
            'area_sqft' => 'decimal:2',
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

    public function siteEngineer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'site_engineer_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function phases(): HasMany
    {
        return $this->hasMany(ProjectPhase::class)->orderBy('sequence');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(ProjectNote::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function costItems(): HasMany
    {
        return $this->hasMany(ProjectCostItem::class)->orderBy('sequence');
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    /**
     * Preserve FK columns and expose loaded camelCase relations under their
     * original camelCase keys (Laravel's default serialization snake-cases the
     * relation key and overwrites the FK column — e.g. `site_engineer_id` gets
     * replaced by the user relation payload).
     */
    public function toArray(): array
    {
        $array = parent::toArray();

        foreach (['siteEngineer' => 'site_engineer_id', 'createdBy' => 'created_by'] as $rel => $fk) {
            if ($this->relationLoaded($rel)) {
                $array[$fk]  = $this->getAttribute($fk);
                $array[$rel] = $this->{$rel}?->toArray();
            }
        }

        return $array;
    }
}
