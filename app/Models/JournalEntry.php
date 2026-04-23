<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JournalEntry extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'code', 'reference_type', 'reference_id', 'description',
        'entry_date', 'created_by', 'created_at',
    ];

    protected function casts(): array
    {
        return ['entry_date' => 'date'];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalLine::class, 'journal_id');
    }
}
