<?php

namespace App\Models;

use App\Mail\LeadUpdateMail;
use App\Traits\Auditable;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class Lead extends Model
{
    use HasFactory, HasUuids, SoftDeletes, Auditable;

    protected $fillable = [
        'code', 'client_id', 'type', 'name', 'company_name', 'email', 'phone', 'address', 'source',
        'project_type', 'service_group', 'service_type', 'estimated_value',
        'status', 'lost_reason', 'follow_up_at', 'assigned_to', 'converted_at',
        'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'follow_up_at' => 'datetime',
            'converted_at' => 'datetime',
            'estimated_value' => 'decimal:2',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(LeadActivity::class);
    }

    public function project(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class)->whereNull('deleted_at')->orderByDesc('invoice_date');
    }

    /**
     * Override toArray to prevent the `assignedTo` relation from overwriting
     * the `assigned_to` FK column (Laravel snake_cases relation keys by default).
     * Expose the loaded relation under the `assignedTo` camelCase key instead.
     */
    /**
     * Notify the lead's creator about an update — both in-app and via email.
     * Skipped silently if there's no creator, the creator is inactive, or
     * the creator is the actor performing the action (no self-notify).
     */
    public function notifyCreator(string $type, string $headline, string $body, string $icon = '🔔'): void
    {
        if (!$this->created_by) return;
        if ($this->created_by === auth()->id()) return;

        $creator = User::find($this->created_by);
        if (!$creator || !$creator->is_active) return;

        $actor   = auth()->user();
        $leadUrl = route('crm.leads.show', $this->id);

        // 1) In-app
        try {
            InAppNotification::send(
                userId:   $creator->id,
                type:     $type,
                title:    $headline,
                message:  $body,
                link:     $leadUrl,
                icon:     $icon,
                causedBy: $actor?->id,
            );
        } catch (\Throwable $e) {
            Log::warning('Lead notifyCreator (in-app) failed', [
                'lead_id' => $this->id, 'creator_id' => $creator->id, 'error' => $e->getMessage(),
            ]);
        }

        // 2) Email — only if creator has one
        if (empty($creator->email)) return;

        try {
            Mail::to($creator->email)->send(new LeadUpdateMail(
                lead:      $this,
                recipient: $creator,
                actor:     $actor,
                subject:   "{$headline} — {$this->code}",
                headline:  $headline,
                body:      $body,
                leadUrl:   $leadUrl,
            ));
        } catch (\Throwable $e) {
            Log::warning('Lead notifyCreator (email) failed', [
                'lead_id' => $this->id, 'creator_email' => $creator->email, 'error' => $e->getMessage(),
            ]);
        }
    }

    public function toArray(): array
    {
        $array = parent::toArray();

        // Restore FK id and move relation data to camelCase key
        if ($this->relationLoaded('assignedTo')) {
            $array['assigned_to'] = $this->getAttribute('assigned_to'); // restore FK UUID
            $array['assignedTo']  = $this->assignedTo?->toArray();
        }
        if ($this->relationLoaded('createdBy')) {
            $array['created_by'] = $this->getAttribute('created_by');
            $array['createdBy']  = $this->createdBy?->toArray();
        }

        return $array;
    }
}
