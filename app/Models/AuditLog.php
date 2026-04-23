<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'user_id', 'user_name', 'action', 'model_type', 'model_id',
        'model_label', 'old_values', 'new_values', 'ip_address',
        'user_agent', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }

    /**
     * Log an action.
     */
    public static function log(
        string $action,
        ?string $modelType = null,
        ?string $modelId = null,
        ?string $modelLabel = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): self {
        $user = auth()->user();
        $request = request();

        return static::create([
            'user_id'     => $user?->id,
            'user_name'   => $user?->name ?? 'System',
            'action'      => $action,
            'model_type'  => $modelType,
            'model_id'    => $modelId,
            'model_label' => $modelLabel,
            'old_values'  => $oldValues,
            'new_values'  => $newValues,
            'ip_address'  => $request?->ip(),
            'user_agent'  => substr($request?->userAgent() ?? '', 0, 500),
            'created_at'  => now(),
        ]);
    }
}
