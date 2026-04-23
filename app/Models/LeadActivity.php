<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadActivity extends Model
{
    use HasUuids;

    protected $fillable = [
        'lead_id', 'type', 'summary', 'next_action', 'next_action_at',
        'performed_by', 'performed_at',
    ];

    protected function casts(): array
    {
        return [
            'next_action_at' => 'datetime',
            'performed_at' => 'datetime',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function toArray(): array
    {
        $array = parent::toArray();
        if ($this->relationLoaded('performedBy')) {
            $array['performed_by'] = $this->getAttribute('performed_by');
            $array['performedBy']  = $this->performedBy?->toArray();
        }
        return $array;
    }
}
