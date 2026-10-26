<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorPayment extends Model
{
    use HasUuids;

    protected $fillable = [
        'code', 'vendor_id', 'po_id', 'project_id', 'cost_head_id', 'amount', 'payment_date',
        'payment_method', 'reference', 'account_head_id', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_date' => 'date',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_id');
    }

    public function accountHead(): BelongsTo
    {
        return $this->belongsTo(AccountHead::class, 'account_head_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /** Expense head a direct (no-purchase) payment is booked to, e.g. Labour Cost. */
    public function costHead(): BelongsTo
    {
        return $this->belongsTo(AccountHead::class, 'cost_head_id');
    }

    /** Paid for work or service, not against a purchase — the payment itself is the cost. */
    public function isDirectCost(): bool
    {
        return !$this->po_id && (bool) $this->cost_head_id;
    }
}
