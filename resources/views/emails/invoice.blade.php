<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice {{ $invoice->code }}</title>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                    {{-- Header --}}
                    <tr>
                        <td style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%); padding:32px 32px 24px; color:#fff;">
                            <h1 style="margin:0; font-size:24px; font-weight:700;">{{ $companyName }}</h1>
                            <p style="margin:4px 0 0; font-size:13px; opacity:0.9;">Invoice for your records</p>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 16px; font-size:15px; color:#1f2937;">
                                Dear {{ $invoice->client->name ?? $invoice->lead->name ?? 'Valued Client' }},
                            </p>

                            @if($customMessage)
                                <p style="margin:0 0 20px; font-size:14px; color:#4b5563; line-height:1.6; white-space:pre-line;">{{ $customMessage }}</p>
                            @else
                                <p style="margin:0 0 20px; font-size:14px; color:#4b5563; line-height:1.6;">
                                    Please find your invoice from {{ $companyName }} attached. The PDF copy is included with this email; you can also view it online via the button below.
                                </p>
                            @endif

                            {{-- Invoice summary card --}}
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; margin:24px 0;">
                                <tr>
                                    <td style="padding:20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding-bottom:8px;">
                                                    <span style="font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Invoice #</span><br>
                                                    <strong style="font-size:18px; color:#1f2937;">{{ $invoice->code }}</strong>
                                                </td>
                                                <td align="right" style="padding-bottom:8px;">
                                                    <span style="font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Grand Total</span><br>
                                                    <strong style="font-size:22px; color:#dc2626;">BDT {{ number_format($invoice->grand_total, 2) }}</strong>
                                                </td>
                                            </tr>
                                        </table>
                                        <div style="border-top:1px solid #e5e7eb; padding-top:12px; margin-top:12px;">
                                            <p style="margin:0 0 4px; font-size:13px; color:#6b7280;">
                                                <strong style="color:#374151;">Date:</strong>
                                                {{ \Carbon\Carbon::parse($invoice->invoice_date)->format('d M Y') }}
                                            </p>
                                            @if($invoice->due_date)
                                                <p style="margin:0 0 4px; font-size:13px; color:#6b7280;">
                                                    <strong style="color:#374151;">Due:</strong>
                                                    {{ \Carbon\Carbon::parse($invoice->due_date)->format('d M Y') }}
                                                </p>
                                            @endif
                                            @php $balance = (float) $invoice->grand_total - (float) $invoice->paid_amount; @endphp
                                            @if($balance > 0.01)
                                                <p style="margin:6px 0 0; font-size:13px; color:#991b1b;">
                                                    <strong>Balance Due:</strong> BDT {{ number_format($balance, 2) }}
                                                </p>
                                            @else
                                                <p style="margin:6px 0 0; font-size:13px; color:#065f46;">
                                                    <strong>Status:</strong> Paid in full — thank you!
                                                </p>
                                            @endif
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            {{-- View button --}}
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $publicUrl }}"
                                           style="display:inline-block; padding:14px 28px; background:#dc2626; color:#fff; text-decoration:none; border-radius:10px; font-weight:600; font-size:15px;">
                                            View Invoice Online
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0; font-size:12px; color:#9ca3af; line-height:1.5;">
                                The full invoice PDF is attached to this email. You can also reply to this message with any questions.
                            </p>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="background:#f9fafb; padding:20px 32px; border-top:1px solid #e5e7eb; text-align:center;">
                            <p style="margin:0 0 4px; font-size:13px; color:#374151; font-weight:600;">{{ $companyName }}</p>
                            @if($companyEmail)
                                <p style="margin:0; font-size:12px; color:#6b7280;">{{ $companyEmail }}@if($companyPhone) · {{ $companyPhone }}@endif</p>
                            @elseif($companyPhone)
                                <p style="margin:0; font-size:12px; color:#6b7280;">{{ $companyPhone }}</p>
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
