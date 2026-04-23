<?php

namespace App\Models;

use App\Traits\Auditable;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasUuids;

    protected $fillable = [
        'code', 'account_head_id', 'expense_category_id', 'project_id', 'amount',
        'expense_date', 'paid_from', 'description', 'reference', 'receipt_path', 'created_by',
        'status', 'submitted_by', 'approved_by', 'approved_at', 'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'amount'       => 'decimal:2',
            'expense_date' => 'date',
            'approved_at'  => 'datetime',
        ];
    }

    public function isPending(): bool  { return $this->status === 'pending'; }
    public function isApproved(): bool { return $this->status === 'approved'; }
    public function isRejected(): bool { return $this->status === 'rejected'; }

    public function accountHead(): BelongsTo
    {
        return $this->belongsTo(AccountHead::class, 'account_head_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }

    public function paidFrom(): BelongsTo
    {
        return $this->belongsTo(AccountHead::class, 'paid_from');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Preserve FK columns + expose camelCase relations under their original
     * keys (Laravel's serializer would otherwise snake-case relation keys and
     * overwrite the FK columns).
     */
    public function toArray(): array
    {
        $array = parent::toArray();

        foreach ([
            'submittedBy' => 'submitted_by',
            'approvedBy'  => 'approved_by',
            'createdBy'   => 'created_by',
        ] as $rel => $fk) {
            if ($this->relationLoaded($rel)) {
                $array[$fk]  = $this->getAttribute($fk);
                $array[$rel] = $this->{$rel}?->toArray();
            }
        }

        return $array;
    }
}
