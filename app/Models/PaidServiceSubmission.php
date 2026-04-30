<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaidServiceSubmission extends Model
{
    use HasUuids, SoftDeletes, Auditable;

    protected $fillable = [
        'code', 'lead_id', 'description', 'amount', 'service_date',
        'income_source', 'payment_method', 'account_head_id', 'reference', 'notes',
        'status', 'submitted_by', 'reviewed_by', 'reviewed_at', 'review_notes',
        'invoice_id', 'client_receipt_id',
    ];

    protected function casts(): array
    {
        return [
            'service_date' => 'date',
            'reviewed_at'  => 'datetime',
            'amount'       => 'decimal:2',
        ];
    }

    public function lead(): BelongsTo           { return $this->belongsTo(Lead::class); }
    public function accountHead(): BelongsTo    { return $this->belongsTo(AccountHead::class); }
    public function submittedBy(): BelongsTo    { return $this->belongsTo(User::class, 'submitted_by'); }
    public function reviewedBy(): BelongsTo     { return $this->belongsTo(User::class, 'reviewed_by'); }
    public function invoice(): BelongsTo        { return $this->belongsTo(Invoice::class); }
    public function clientReceipt(): BelongsTo  { return $this->belongsTo(ClientReceipt::class); }

    public function isPending(): bool  { return $this->status === 'pending'; }
    public function isApproved(): bool { return $this->status === 'approved'; }
    public function isRejected(): bool { return $this->status === 'rejected'; }

    public function scopePending($q)  { return $q->where('status', 'pending'); }

    public function toArray(): array
    {
        $array = parent::toArray();
        foreach (['submittedBy' => 'submitted_by', 'reviewedBy' => 'reviewed_by', 'accountHead' => 'account_head_id'] as $rel => $fk) {
            if ($this->relationLoaded($rel)) {
                $array[$fk]  = $this->getAttribute($fk);
                $array[$rel] = $this->getRelation($rel)?->toArray();
            }
        }
        return $array;
    }
}
