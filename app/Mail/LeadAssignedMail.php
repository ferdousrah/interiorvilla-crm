<?php

namespace App\Mail;

use App\Models\Lead;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeadAssignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Lead $lead,
        public User $assignee,
        public ?User $assignedBy = null,
        public string $leadUrl = ''
    ) {}

    public function envelope(): Envelope
    {
        $companyName = Setting::get('company_name', 'Interior Villa');
        return new Envelope(
            subject: "New lead assigned to you — {$this->lead->name}",
            from: config('mail.from.address'),
            replyTo: array_filter([Setting::get('company_email') ?: config('mail.from.address')]),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.lead-assigned',
            with: [
                'lead'        => $this->lead,
                'assignee'    => $this->assignee,
                'assignedBy'  => $this->assignedBy,
                'leadUrl'     => $this->leadUrl,
                'companyName' => Setting::get('company_name', 'Interior Villa'),
            ],
        );
    }
}
