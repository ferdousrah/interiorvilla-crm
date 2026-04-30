<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Models\Setting;
use App\Support\NumberToWords;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invoice $invoice,
        public string $publicUrl,
        public string $customMessage = ''
    ) {}

    public function envelope(): Envelope
    {
        $companyName = Setting::get('company_name', 'Interior Villa');
        return new Envelope(
            subject: "Invoice {$this->invoice->code} — {$companyName}",
            from: config('mail.from.address'),
            replyTo: array_filter([Setting::get('company_email') ?: config('mail.from.address')]),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.invoice',
            with: [
                'invoice'      => $this->invoice,
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
        $this->invoice->loadMissing(['client', 'lead', 'lineItems', 'createdBy']);

        $resolveImage = function (?string $path) {
            if (!$path) return null;
            $abs = storage_path('app/public/' . $path);
            if (is_file($abs)) {
                return 'data:image/' . pathinfo($abs, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($abs));
            }
            return null;
        };

        $pdf = Pdf::loadView('invoices.public.show', [
            'invoice'           => $this->invoice,
            'companyName'       => Setting::get('company_name', 'Interior Villa'),
            'companyTagline'    => Setting::get('company_tagline', 'Build Your Dream'),
            'companyEmail'      => Setting::get('company_email'),
            'companyPhone'      => Setting::get('company_phone'),
            'companyPhone2'     => Setting::get('company_phone2'),
            'companyAddress'    => Setting::get('company_address'),
            'companyCeoName'    => Setting::get('company_ceo_name'),
            'companyCeoTitle'   => Setting::get('company_ceo_title', 'CEO'),
            'companyLogo'       => $resolveImage(Setting::get('quotation_logo') ?: Setting::get('company_logo')),
            'companySignature'  => $resolveImage(Setting::get('company_signature')),
            'grandTotalInWords' => NumberToWords::toBdt((float) $this->invoice->grand_total),
            'isPdf'             => true,
        ])->setPaper('a4');

        return [
            Attachment::fromData(fn() => $pdf->output(), "Invoice-{$this->invoice->code}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
