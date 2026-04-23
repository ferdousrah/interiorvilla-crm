<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalLine extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'journal_id', 'account_head_id', 'type', 'amount', 'description', 'created_at',
    ];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2'];
    }

    public function journal(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_id');
    }

    public function accountHead(): BelongsTo
    {
        return $this->belongsTo(AccountHead::class, 'account_head_id');
    }
}
