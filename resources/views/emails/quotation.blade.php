<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quotation</title>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                    {{-- Header --}}
                    <tr>
                        <td style="background:linear-gradient(135deg,#6366f1 0%,#4338ca 100%); padding:32px 32px 24px; color:#fff;">
                            <h1 style="margin:0; font-size:24px; font-weight:700;">{{ $companyName }}</h1>
                            <p style="margin:4px 0 0; font-size:13px; opacity:0.9;">Quotation for your review</p>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 16px; font-size:15px; color:#1f2937;">
                                Dear {{ $quotation->client->name ?? $quotation->lead->name ?? 'Valued Client' }},
                            </p>

                            @if($customMessage)
                                <p style="margin:0 0 20px; font-size:14px; color:#4b5563; line-height:1.6; white-space:pre-line;">{{ $customMessage }}</p>
                            @else
                                <p style="margin:0 0 20px; font-size:14px; color:#4b5563; line-height:1.6;">
                                    Thank you for considering {{ $companyName }} for your project. Please find below our quotation for your review.
                                </p>
                            @endif

                            {{-- Quotation summary card --}}
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; margin:24px 0;">
                                <tr>
                                    <td style="padding:20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding-bottom:8px;">
                                                    <span style="font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Quotation #</span><br>
                                                    <strong style="font-size:18px; color:#1f2937;">{{ $quotation->code }}</strong>
                                                </td>
                                                <td align="right" style="padding-bottom:8px;">
                                                    <span style="font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Total Amount</span><br>
                                                    <strong style="font-size:22px; color:#4f46e5;">BDT {{ number_format($quotation->grand_total, 2) }}</strong>
                                                </td>
                                            </tr>
                                        </table>
                                        <div style="border-top:1px solid #e5e7eb; padding-top:12px; margin-top:12px;">
                                            <p style="margin:0 0 4px; font-size:13px; color:#6b7280;"><strong style="color:#374151;">Subject:</strong> {{ $quotation->subject }}</p>
                                            @if($quotation->valid_until)
                                                <p style="margin:0; font-size:13px; color:#6b7280;"><strong style="color:#374151;">Valid Until:</strong> {{ \Carbon\Carbon::parse($quotation->valid_until)->format('d M Y') }}</p>
                                            @endif
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            {{-- CTA button --}}
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:16px 0;">
                                        <a href="{{ $publicUrl }}"
                                           style="display:inline-block; background:#4f46e5; color:#fff; text-decoration:none; padding:12px 32px; border-radius:10px; font-weight:600; font-size:14px;">
                                            View Full Quotation →
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:20px 0 0; font-size:13px; color:#6b7280; line-height:1.6;">
                                If you have any questions or would like to discuss this quotation further, please don't hesitate to reach out.
                            </p>

                            <p style="margin:24px 0 0; font-size:14px; color:#1f2937;">
                                Best regards,<br>
                                <strong>{{ $companyName }}</strong>
                            </p>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="background:#f9fafb; padding:20px 32px; border-top:1px solid #e5e7eb;">
                            <p style="margin:0; font-size:12px; color:#6b7280; text-align:center;">
                                @if($companyEmail) {{ $companyEmail }} @endif
                                @if($companyEmail && $companyPhone) &nbsp;·&nbsp; @endif
                                @if($companyPhone) {{ $companyPhone }} @endif
                            </p>
                            <p style="margin:8px 0 0; font-size:11px; color:#9ca3af; text-align:center;">
                                © {{ date('Y') }} {{ $companyName }}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
