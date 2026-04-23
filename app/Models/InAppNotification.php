<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InAppNotification extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'type', 'title', 'message', 'link',
        'icon', 'read_at', 'caused_by',
    ];

    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function causer(): BelongsTo { return $this->belongsTo(User::class, 'caused_by'); }

    public function scopeUnread($q) { return $q->whereNull('read_at'); }

    /**
     * Send a notification to a user.
     */
    public static function send(string $userId, string $type, string $title, ?string $message = null, ?string $link = null, ?string $icon = null, ?string $causedBy = null): self
    {
        return static::create([
            'user_id'   => $userId,
            'type'      => $type,
            'title'     => $title,
            'message'   => $message,
            'link'      => $link,
            'icon'      => $icon,
            'caused_by' => $causedBy,
        ]);
    }

    /**
     * Send to multiple users.
     */
    public static function sendToMany(array $userIds, string $type, string $title, ?string $message = null, ?string $link = null, ?string $icon = null, ?string $causedBy = null): void
    {
        foreach ($userIds as $uid) {
            static::send($uid, $type, $title, $message, $link, $icon, $causedBy);
        }
    }
}
