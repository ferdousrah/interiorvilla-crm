<?php

namespace App\Traits;

use App\Models\AuditLog;

/**
 * Add this trait to any model to auto-log create/update/delete.
 * Override `getAuditLabel()` to customize the human-readable label.
 */
trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            if (!auth()->check()) return;
            AuditLog::log(
                'created',
                $model->getMorphClass(),
                $model->getKey(),
                $model->getAuditLabel(),
                null,
                $model->getAuditAttributes()
            );
        });

        static::updated(function ($model) {
            if (!auth()->check()) return;
            $dirty = $model->getDirty();
            if (empty($dirty)) return;

            // Exclude sensitive/noisy fields
            $exclude = ['updated_at', 'remember_token', 'password'];
            $old = [];
            $new = [];
            foreach ($dirty as $key => $value) {
                if (in_array($key, $exclude)) continue;
                $old[$key] = $model->getOriginal($key);
                $new[$key] = $value;
            }
            if (empty($new)) return;

            AuditLog::log(
                'updated',
                $model->getMorphClass(),
                $model->getKey(),
                $model->getAuditLabel(),
                $old,
                $new
            );
        });

        static::deleted(function ($model) {
            if (!auth()->check()) return;
            AuditLog::log(
                'deleted',
                $model->getMorphClass(),
                $model->getKey(),
                $model->getAuditLabel(),
            );
        });
    }

    public function getAuditLabel(): string
    {
        return $this->name ?? $this->title ?? $this->code ?? $this->getKey();
    }

    protected function getAuditAttributes(): array
    {
        $exclude = ['id', 'created_at', 'updated_at', 'deleted_at', 'password', 'remember_token'];
        return collect($this->getAttributes())
            ->except($exclude)
            ->toArray();
    }
}
