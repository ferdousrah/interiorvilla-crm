<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AccountHead extends Model
{
    use HasUuids;

    protected $fillable = [
        'code', 'name', 'group_id', 'parent_id', 'opening_balance',
        'is_system', 'is_active', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'is_active' => 'boolean',
            'opening_balance' => 'decimal:2',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(AccountGroup::class, 'group_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(AccountHead::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(AccountHead::class, 'parent_id');
    }

    public function journalLines(): HasMany
    {
        return $this->hasMany(JournalLine::class);
    }
}
