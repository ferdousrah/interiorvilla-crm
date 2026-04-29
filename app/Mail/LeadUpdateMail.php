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

class LeadUpdateMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Lead $lead,
        public User $recipient,
        public ?User $actor,
        public string $subject,
        public string $headline,
        public string $body,
        public string $leadUrl = ''
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subject,
            from: config('mail.from.address'),
            replyTo: array_filter([Setting::get('company_email') ?: config('mail.from.address')]),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.lead-update',
            with: [
                'lead'        => $this->lead,
                'recipient'   => $this->recipient,
                'actor'       => $this->actor,
                'headline'    => $this->headline,
                'body'        => $this->body,
                'leadUrl'     => $this->leadUrl,
                'companyName' => Setting::get('company_name', 'Interior Villa'),
            ],
        );
    }
}
