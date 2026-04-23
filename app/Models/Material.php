<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Material extends Model
{
    use HasUuids, Auditable;

    protected $fillable = [
        'category', 'name', 'unit', 'default_rate', 'description', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'default_rate' => 'decimal:2',
            'is_active'    => 'boolean',
        ];
    }

    public function serviceTypes(): HasMany
    {
        return $this->hasMany(MaterialServiceType::class);
    }

    /**
     * Check if this material is available for a given service group + type.
     */
    public function isAvailableFor(?string $group, ?string $type): bool
    {
        if (!$group && !$type) return true;
        $q = $this->serviceTypes();
        if ($group) $q->where('service_group', $group);
        if ($type)  $q->where('service_type', $type);
        return $q->exists();
    }
}
