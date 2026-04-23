<?php

namespace App\Mail;

use App\Models\Quotation;
use App\Models\Setting;
use App\Support\NumberToWords;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuotationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Quotation $quotation,
        public string $publicUrl,
        public string $customMessage = ''
    ) {}

    public function envelope(): Envelope
    {
        $companyName = Setting::get('company_name', 'Interior Villa');
        return new Envelope(
            subject: "Quotation {$this->quotation->code} — {$companyName}",
            from: config('mail.from.address'),
            replyTo: [Setting::get('company_email') ?: config('mail.from.address')],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.quotation',
            with: [
                'quotation'    => $this->quotation,
                'publicUrl'    => $this->publicUrl,
                'customMessage'=> $this->customMessage,
                'companyName'  => Setting::get('company_name', 'Interior Villa'),
                'companyEmail' => Setting::get('company_email'),
                'companyPhone' => Setting::get('company_phone'),
            ],
        );
    }

    public function attachments(): array
    {
        $this->quotation->loadMissing(['client', 'lead', 'items', 'createdBy']);

        $logoPath = Setting::get('company_logo');
        $logoSrc = null;
        if ($logoPath) {
            $abs = storage_path('app/public/' . $logoPath);
            if (is_file($abs)) {
                $logoSrc = 'data:image/' . pathinfo($abs, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($abs));
            }
        }

        $pdf = Pdf::loadView('quotations.public.show', [
            'quotation'         => $this->quotation,
            'companyName'       => Setting::get('company_name', 'Interior Villa'),
            'companyTagline'    => Setting::get('company_tagline', 'Build Your Dream'),
            'companyEmail'      => Setting::get('company_email'),
            'companyPhone'      => Setting::get('company_phone'),
            'companyPhone2'     => Setting::get('company_phone2'),
            'companyAddress'    => Setting::get('company_address'),
            'companyCeoName'    => Setting::get('company_ceo_name'),
            'companyCeoTitle'   => Setting::get('company_ceo_title', 'CEO'),
            'companyLogo'       => $logoSrc,
            'grandTotalInWords' => NumberToWords::toBdt((float) $this->quotation->grand_total),
            'isPdf'             => true,
        ])->setPaper('a4');

        return [
            Attachment::fromData(fn() => $pdf->output(), "Quotation-{$this->quotation->code}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
