<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $invoice->code }} — {{ $companyName }}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: 'DejaVu Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f3f4f6;
            color: #1f2937;
            font-size: 13.5px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .wrap { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
        .sheet {
            background: #fff;
            box-shadow: 0 2px 12px rgba(0,0,0,0.06);
            border-radius: 8px;
            padding: 40px 44px 28px;
        }
        @if($isPdf ?? false)
        @page { margin: 12mm 10mm; }
        body { background: #fff; font-size: 12.5px; line-height: 1.45; }
        .wrap { max-width: 100%; padding: 0; margin: 0; }
        .sheet { box-shadow: none; border-radius: 0; padding: 0; }
        @endif

        .hdr { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .hdr td { vertical-align: top; padding: 0; }
        .hdr .date-block { font-size: 14px; }
        .hdr .date-block .date { font-weight: 600; color: #1f2937; }
        .hdr .logo-block { text-align: right; }
        .hdr .logo-block img { max-height: 80px; max-width: 260px; display: inline-block; }
        .hdr .lh-name { font-size: 17px; font-weight: 700; color: #111827; margin: 4px 0 0; }
        .hdr .lh-tagline { font-size: 10px; letter-spacing: 2px; color: #059669; margin: 2px 0 0; text-transform: uppercase; }

        .to-block { font-size: 14px; margin-bottom: 16px; line-height: 1.6; }
        .to-block .lbl { color: #6b7280; }
        .to-block .name { font-weight: 700; color: #111827; }

        /* Doc-title bar in red-ish for invoice (vs grey quotation subject) */
        .doc-bar {
            background: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 10px 14px;
            font-size: 14px;
            font-weight: 700;
            color: #991b1b;
            margin-bottom: 14px;
            letter-spacing: 0.3px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .doc-bar .meta { font-size: 12px; color: #6b7280; font-weight: 500; }

        table.items { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 6px; }
        table.items thead th {
            background: #f9fafb;
            color: #374151;
            font-weight: 700;
            font-size: 13px;
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            text-align: left;
        }
        table.items thead th.num { text-align: right; }
        table.items thead th.ctr { text-align: center; }
        table.items td { border: 1px solid #e5e7eb; padding: 7px 10px; vertical-align: top; }
        table.items td.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
        table.items td.ctr { text-align: center; }
        table.items td.idx { color: #6b7280; font-size: 12.5px; width: 42px; text-align: center; }
        table.items td.desc { line-height: 1.55; color: #374151; }

        .totals-row td { background: #f3f4f6; font-weight: 700; padding: 9px 10px; font-size: 13px; }
        .totals-row td.num { color: #1f2937; }

        .grand-row td {
            background: #111827;
            color: #fff;
            font-weight: 700;
            padding: 11px 10px;
            font-size: 15px;
            border-color: #111827;
        }
        .grand-row td.num { color: #fbbf24; }

        .paid-row td {
            background: #ecfdf5;
            color: #065f46;
            font-weight: 700;
            padding: 9px 10px;
            font-size: 13px;
        }
        .balance-row td {
            background: #fef2f2;
            color: #991b1b;
            font-weight: 700;
            padding: 11px 10px;
            font-size: 14px;
        }

        .in-words { margin: 10px 0 16px; font-size: 13.5px; font-weight: 700; color: #1f2937; }
        .in-words .label { color: #059669; margin-right: 4px; }
        .in-words .value { font-weight: 600; color: #374151; }

        .terms-block { margin: 12px 0 20px; font-size: 13px; color: #374151; }
        .terms-block h4 { font-size: 13.5px; font-weight: 700; margin: 0 0 5px; color: #1f2937; }
        .terms-block .item { margin: 3px 0; line-height: 1.6; }

        .sign-block { margin-top: 28px; font-size: 13px; color: #1f2937; }
        .sign-block .thanks { margin-bottom: 6px; }
        .sign-block .signature-img { display: block; max-height: 70px; max-width: 220px; margin: 4px 0 2px; }
        .sign-block .signature-spacer { height: 60px; }
        .sign-block .name { font-weight: 700; color: #111827; }
        .sign-block .company { font-weight: 700; color: #111827; font-size: 16px; margin-top: 6px; margin-bottom: 4px; }
        .sign-block .meta { color: #4b5563; margin-top: 2px; font-size: 12.5px; }

        .foot-addr {
            margin-top: 22px;
            padding-top: 12px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            font-weight: 700;
            font-size: 13px;
            color: #1f2937;
        }

        /* Status pill */
        .status-pill {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-paid    { background: #d1fae5; color: #065f46; }
        .status-partial { background: #dbeafe; color: #1e40af; }
        .status-due     { background: #fee2e2; color: #991b1b; }
        .status-overdue { background: #fecaca; color: #7f1d1d; }
        .status-draft   { background: #fef3c7; color: #92400e; }

        .actions { text-align: center; margin: 20px 0 0; }
        .btn { display: inline-block; padding: 10px 22px; border-radius: 10px; font-size: 13px; font-weight: 600; text-decoration: none; margin: 4px; border: 1px solid transparent; cursor: pointer; }
        .btn-primary { background: #4f46e5; color: #fff; }
        .btn-outline { border-color: #d1d5db; color: #374151; background: #fff; }

        @media print {
            body { background: #fff; font-size: 12.5px; }
            .wrap { padding: 0; max-width: 100%; }
            .sheet { box-shadow: none; border-radius: 0; padding: 0; }
            .actions, .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="sheet">

            {{-- HEADER: Date + Invoice No + Due (left), Logo (right) --}}
            <table class="hdr">
                <tr>
                    <td style="width:55%;">
                        <div class="date-block">
                            <div>Date: <span class="date">{{ \Carbon\Carbon::parse($invoice->invoice_date ?? $invoice->created_at)->format('d/m/Y') }}</span></div>
                            <div style="margin-top: 4px;">Invoice No: <span style="font-weight: 700; color: #111827;">{{ $invoice->code }}</span></div>
                            @if($invoice->due_date)
                                <div style="margin-top: 4px; font-size: 12.5px; color: #6b7280;">
                                    Due: <span style="font-weight: 600; color: #1f2937;">{{ \Carbon\Carbon::parse($invoice->due_date)->format('d/m/Y') }}</span>
                                </div>
                            @endif
                        </div>
                    </td>
                    <td class="logo-block" style="width:45%;">
                        @if(!empty($companyLogo))
                            <img src="{{ $companyLogo }}" alt="{{ $companyName }}">
                        @else
                            <div class="lh-name">{{ $companyName }}</div>
                            @if(!empty($companyTagline))
                                <div class="lh-tagline">{{ $companyTagline }}</div>
                            @endif
                        @endif
                    </td>
                </tr>
            </table>

            {{-- BILL TO + INVOICE title side-by-side --}}
            @php
                $person       = $invoice->client ?? $invoice->lead;
                $companyName2 = $invoice->client?->company_name ?? $invoice->lead?->company_name;
                $contactName  = $person?->name;
                $statusClass = match($invoice->status) {
                    'paid' => 'status-paid',
                    'partially_paid' => 'status-partial',
                    'overdue' => 'status-overdue',
                    'draft' => 'status-draft',
                    default => 'status-due',
                };
                $statusLabel = ucfirst(str_replace('_', ' ', $invoice->status));
            @endphp
            <table style="width:100%; border-collapse:collapse; margin-bottom:18px;">
                <tr>
                    <td style="width:33.33%; vertical-align:top;">
                        <div style="font-size:14px; line-height:1.6;">
                            <div style="color:#6b7280;">Bill To</div>
                            @if($person)
                                <div style="font-weight:700; color:#111827;">{{ $companyName2 ?: $contactName }}</div>
                                @if($person->address)
                                    <div>{{ $person->address }}</div>
                                @endif
                            @else
                                <div style="font-weight:700; color:#111827;">Valued Client</div>
                            @endif
                        </div>
                    </td>
                    <td style="width:33.33%; vertical-align:top; text-align:center;">
                        <div style="font-size:32px; font-weight:700; color:#111827; letter-spacing:0.18em; line-height:1;">INVOICE</div>
                        <div style="margin-top:8px;">
                            <span class="status-pill {{ $statusClass }}">{{ $statusLabel }}</span>
                        </div>
                    </td>
                    <td style="width:33.33%;"></td>
                </tr>
            </table>

            {{-- LINE ITEMS --}}
            <table class="items">
                <thead>
                    <tr>
                        <th style="width:42px;">SL</th>
                        <th>Description</th>
                        <th class="num" style="width:70px;">Qty</th>
                        <th class="num" style="width:90px;">Rate</th>
                        <th class="num" style="width:110px;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($invoice->lineItems as $i => $item)
                        <tr>
                            <td class="idx">{{ $i + 1 }}</td>
                            <td class="desc">{{ $item->description }}</td>
                            <td class="num">{{ number_format($item->quantity, 2) }}</td>
                            <td class="num">{{ number_format($item->unit_rate, 2) }}</td>
                            <td class="num">{{ number_format($item->total, 2) }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="5" class="ctr" style="color:#9ca3af; padding:14px;">No line items</td></tr>
                    @endforelse

                    {{-- Subtotal --}}
                    <tr class="totals-row">
                        <td colspan="4" style="text-align:right;">Subtotal</td>
                        <td class="num">{{ number_format($invoice->subtotal, 2) }}</td>
                    </tr>

                    {{-- Discount --}}
                    @if((float) $invoice->discount_amount > 0)
                        <tr class="totals-row">
                            <td colspan="4" style="text-align:right;">Discount</td>
                            <td class="num" style="color:#dc2626;">− {{ number_format($invoice->discount_amount, 2) }}</td>
                        </tr>
                    @endif

                    {{-- VAT --}}
                    @if((float) $invoice->vat_amount > 0)
                        <tr class="totals-row">
                            <td colspan="4" style="text-align:right;">VAT ({{ rtrim(rtrim(number_format($invoice->vat_pct, 2), '0'), '.') }}%)</td>
                            <td class="num">{{ number_format($invoice->vat_amount, 2) }}</td>
                        </tr>
                    @endif

                    {{-- Grand Total --}}
                    <tr class="grand-row">
                        <td colspan="4" style="text-align:right;">GRAND TOTAL</td>
                        <td class="num">BDT {{ number_format($invoice->grand_total, 2) }}</td>
                    </tr>

                    {{-- Paid + Balance (only show if there's a payment) --}}
                    @if((float) $invoice->paid_amount > 0)
                        <tr class="paid-row">
                            <td colspan="4" style="text-align:right;">Amount Paid</td>
                            <td class="num">{{ number_format($invoice->paid_amount, 2) }}</td>
                        </tr>
                    @endif

                    @php $balanceDue = (float) $invoice->grand_total - (float) $invoice->paid_amount; @endphp
                    @if($balanceDue > 0.01)
                        <tr class="balance-row">
                            <td colspan="4" style="text-align:right;">BALANCE DUE</td>
                            <td class="num">BDT {{ number_format($balanceDue, 2) }}</td>
                        </tr>
                    @endif
                </tbody>
            </table>

            {{-- IN WORDS --}}
            @if(!empty($grandTotalInWords))
                <div class="in-words">
                    <span class="label">In Words:</span>
                    <span class="value">{{ $grandTotalInWords }}</span>
                </div>
            @endif

            {{-- NOTES (if invoice has notes shown to client) --}}
            @if(!empty($invoice->notes))
                <div class="terms-block">
                    <h4>NOTES :</h4>
                    @foreach(preg_split('/\r\n|\r|\n/', trim($invoice->notes)) as $line)
                        @if(trim($line) !== '')
                            <div class="item">{{ $line }}</div>
                        @endif
                    @endforeach
                </div>
            @endif

            {{-- SIGNATURE --}}
            <div class="sign-block">
                <div class="thanks">THANKING YOU</div>
                @if(!empty($companySignature))
                    <img src="{{ $companySignature }}" alt="Signature" class="signature-img">
                @else
                    <div class="signature-spacer"></div>
                @endif
                @if(!empty($companyCeoName))
                    <div class="name">{{ $companyCeoName }}</div>
                    <div class="meta">{{ $companyCeoTitle ?: 'CEO' }}</div>
                @elseif($invoice->createdBy)
                    <div class="name">{{ $invoice->createdBy->name }}</div>
                    <div class="meta">{{ $companyCeoTitle ?: 'Prepared By' }}</div>
                @endif
                <div class="company">{{ $companyName ?: 'Interior Villa' }}</div>
                @if(!empty($companyPhone))
                    <div class="meta">Cell: {{ $companyPhone }}@if(!empty($companyPhone2)), {{ $companyPhone2 }}@endif</div>
                @endif
                @if(!empty($companyEmail))
                    <div class="meta">Email: {{ $companyEmail }}</div>
                @endif
            </div>

            @if(!empty($companyAddress))
                <div class="foot-addr">{{ $companyAddress }}</div>
            @endif
        </div>

        @if(!($isPdf ?? false))
            <div class="actions no-print">
                @if(!empty($pdfUrl))
                    <a href="{{ $pdfUrl }}" class="btn btn-primary">⬇ Download PDF</a>
                @endif
                <a href="javascript:window.print()" class="btn btn-outline">Print</a>
            </div>
        @endif
    </div>
</body>
</html>
