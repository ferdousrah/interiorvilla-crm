<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation {{ $quotation->code }} — {{ $companyName }}</title>
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

        /* PDF overrides — flatten the card, repeat letterhead header/footer per page */
        @if($isPdf ?? false)
        @page { margin: 34mm 10mm 24mm 10mm; }       /* top right bottom left — leave room for fixed header/footer */
        body { background: #fff; font-size: 12.5px; line-height: 1.45; }
        .wrap { max-width: 100%; padding: 0; margin: 0; }
        .sheet { box-shadow: none; border-radius: 0; padding: 0; }

        /* Repeating page header (every page) */
        .page-header {
            position: fixed;
            top: -28mm;
            left: 0; right: 0;
            height: 24mm;
            padding-bottom: 3mm;
            border-bottom: 1px solid #d1d5db;
        }
        .page-header .hdr-date { font-size: 12px; color: #1f2937; padding-top: 6mm; }
        .page-header .hdr-date strong { font-weight: 700; }
        .page-header .hdr-logo { text-align: right; }
        .page-header .hdr-logo img { max-height: 18mm; max-width: 60mm; display: inline-block; }
        .page-header .hdr-name { font-size: 14px; font-weight: 700; color: #111827; }
        .page-header .hdr-tagline { font-size: 9px; letter-spacing: 2px; color: #059669; text-transform: uppercase; }

        /* Repeating page footer (every page) */
        .page-footer {
            position: fixed;
            bottom: -18mm;
            left: 0; right: 0;
            height: 12mm;
            padding-top: 3mm;
            border-top: 1px solid #d1d5db;
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            color: #1f2937;
        }
        @endif

        /* ========== HEADER ========== */
        .hdr { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .hdr td { vertical-align: top; padding: 0; }
        .hdr .date-block { font-size: 14px; }
        .hdr .date-block .date { font-weight: 600; color: #1f2937; }
        .hdr .logo-block { text-align: right; }
        .hdr .logo-block img { max-height: 80px; max-width: 260px; display: inline-block; }
        .hdr .lh-name { font-size: 17px; font-weight: 700; color: #111827; margin: 4px 0 0; }
        .hdr .lh-tagline { font-size: 10px; letter-spacing: 2px; color: #059669; margin: 2px 0 0; text-transform: uppercase; }

        /* ========== TO BLOCK ========== */
        .to-block { font-size: 14px; margin-bottom: 16px; line-height: 1.6; }
        .to-block .lbl { color: #6b7280; }
        .to-block .name { font-weight: 700; color: #111827; }

        /* ========== SUBJECT BAR ========== */
        .subject-bar {
            background: #f3f4f6;
            padding: 10px 14px;
            font-size: 14px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 14px;
            letter-spacing: 0.3px;
        }
        .subject-bar .lbl { margin-right: 8px; }

        /* ========== MAIN BOQ TABLE ========== */
        .boq { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 6px; }
        .boq thead th {
            background: #f9fafb;
            color: #374151;
            text-transform: none;
            font-weight: 700;
            font-size: 13px;
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            text-align: left;
        }
        .boq thead th.num { text-align: right; }
        .boq thead th.ctr { text-align: center; }
        .boq td {
            border: 1px solid #e5e7eb;
            padding: 7px 10px;
            vertical-align: top;
        }
        .boq td.num { text-align: right; white-space: nowrap; }
        .boq td.ctr { text-align: center; }
        .boq td.idx { color: #6b7280; font-size: 12.5px; width: 42px; text-align: center; }

        .boq tr.section-header td {
            background: #eef5eb;
            font-weight: 700;
            color: #1f2937;
            padding: 9px 10px;
            font-size: 13.5px;
            border-color: #d1d5db;
        }
        .boq tr.item-row td.desc {
            line-height: 1.55;
            color: #374151;
            font-size: 13px;
        }
        .boq tr.item-row td.desc .title {
            font-weight: 700;
            color: #111827;
            display: block;
            margin-bottom: 3px;
            font-size: 13.5px;
        }
        .boq tr.item-row td.desc .body {
            white-space: pre-line;
        }

        .boq tr.subtotal-row td {
            background: #fafafa;
            font-weight: 700;
            padding: 8px 10px;
            font-size: 13px;
            border-color: #d1d5db;
        }
        .boq tr.subtotal-row td.label { text-align: center; }
        .boq tr.grandline-row td {
            background: #f3f4f6;
            font-weight: 700;
            padding: 9px 10px;
            font-size: 13px;
        }
        .boq tr.grandline-row td.num { color: #1f2937; }

        .boq tr.final-row td {
            background: #111827;
            color: #fff;
            font-weight: 700;
            padding: 11px 10px;
            font-size: 15px;
            border-color: #111827;
        }
        .boq tr.final-row td.num { color: #fbbf24; }

        /* ========== IN WORDS ========== */
        .in-words {
            margin: 10px 0 16px;
            font-size: 13.5px;
            font-weight: 700;
            color: #1f2937;
        }
        .in-words .label {
            color: #059669;
            margin-right: 4px;
        }
        .in-words .value { font-weight: 600; color: #374151; }

        /* ========== TERMS ========== */
        .terms-block {
            margin: 12px 0 20px;
            font-size: 13px;
            color: #374151;
        }
        .terms-block h4 {
            font-size: 13.5px;
            font-weight: 700;
            margin: 0 0 5px;
            color: #1f2937;
            letter-spacing: 0.3px;
        }
        .terms-block .item { margin: 3px 0; line-height: 1.6; }

        /* ========== SIGNATURE ========== */
        .sign-block {
            margin-top: 28px;
            font-size: 13px;
            color: #1f2937;
        }
        .sign-block .thanks {
            margin-bottom: 6px;
            font-weight: 400;
        }
        .sign-block .signature-img {
            display: block;
            max-height: 70px;
            max-width: 220px;
            object-fit: contain;
            margin: 4px 0 2px;
        }
        .sign-block .signature-spacer {
            height: 60px;
        }
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

        /* ACTION BUTTONS (web only) */
        .actions { text-align: center; margin: 20px 0 0; }
        .btn {
            display: inline-block; padding: 10px 22px; border-radius: 10px;
            font-size: 13px; font-weight: 600; text-decoration: none; margin: 4px;
            border: 1px solid transparent; cursor: pointer;
        }
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
    @if($isPdf ?? false)
        {{-- PDF only: repeating page header (Date + Logo on every page) --}}
        <div class="page-header">
            <table style="width:100%; border-collapse:collapse;">
                <tr>
                    <td style="width:55%; vertical-align:middle;" class="hdr-date">
                        Date: <strong>{{ \Carbon\Carbon::parse($quotation->document_date ?? $quotation->created_at)->format('d/m/Y') }}</strong>
                    </td>
                    <td style="width:45%; vertical-align:middle;" class="hdr-logo">
                        @if(!empty($companyLogo))
                            <img src="{{ $companyLogo }}" alt="{{ $companyName }}">
                        @else
                            <div class="hdr-name">{{ $companyName }}</div>
                            @if(!empty($companyTagline))
                                <div class="hdr-tagline">{{ $companyTagline }}</div>
                            @endif
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        {{-- PDF only: repeating page footer (Address on every page bottom) --}}
        <div class="page-footer">
            @if(!empty($companyAddress))
                {{ $companyAddress }}
            @endif
        </div>
    @endif

    <div class="wrap">
        <div class="sheet">

            @unless($isPdf ?? false)
            {{-- Web only: inline HEADER (Date + Logo). PDF uses the fixed .page-header above instead. --}}
            <table class="hdr">
                <tr>
                    <td style="width:55%;">
                        <div class="date-block">
                            Date: <span class="date">{{ \Carbon\Carbon::parse($quotation->document_date ?? $quotation->created_at)->format('d/m/Y') }}</span>
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
            @endunless

            {{-- TO BLOCK --}}
            @php
                $person       = $quotation->client ?? $quotation->lead;
                $companyName2 = $quotation->client?->company_name ?? $quotation->lead?->company_name;
                $contactName  = $person?->name;
                $billToLines  = !empty($quotation->bill_to)
                    ? array_values(array_filter(preg_split('/\r\n|\r|\n/', $quotation->bill_to), fn($l) => trim($l) !== ''))
                    : null;
            @endphp
            <div class="to-block">
                <div class="lbl">To</div>
                @if($billToLines)
                    {{-- Custom override: first line = bold name, rest = address lines --}}
                    <div class="name">{{ $billToLines[0] }}</div>
                    @foreach(array_slice($billToLines, 1) as $line)
                        <div>{{ $line }}</div>
                    @endforeach
                @elseif($person)
                    <div class="name">{{ $companyName2 ?: $contactName }}</div>
                    @if($companyName2 && $contactName)
                        <div>Attn: {{ $contactName }}</div>
                    @endif
                    @if($person->address)
                        <div>{{ $person->address }}</div>
                    @endif
                @else
                    <div class="name">Valued Client</div>
                @endif
            </div>

            {{-- SUBJECT BAR --}}
            <div class="subject-bar">
                <span class="lbl">SUBJECT :</span>{{ strtoupper($quotation->subject) }}
            </div>

            {{-- MAIN BOQ TABLE --}}
            @php
                $grouped = [];
                foreach ($quotation->items as $item) {
                    $cat = $item->category ?: 'General';
                    $grouped[$cat][] = $item;
                }
            @endphp

            <table class="boq">
                <thead>
                    <tr>
                        <th style="width:24px;">SL</th>
                        <th>Description</th>
                        <th class="num" style="width:60px;">Quantity</th>
                        <th class="ctr" style="width:50px;">Unit</th>
                        <th class="num" style="width:70px;">Rate</th>
                        <th class="num" style="width:90px;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($grouped as $cat => $items)
                        @php $catTotal = collect($items)->sum(fn($i) => (float) $i->total); @endphp

                        {{-- Section header row --}}
                        <tr class="section-header">
                            <td class="ctr">{{ $loop->iteration }}</td>
                            <td colspan="5">{{ $cat }}</td>
                        </tr>

                        {{-- Items in this section --}}
                        @foreach($items as $ii => $item)
                            <tr class="item-row">
                                <td class="idx">{{ $loop->parent->iteration }}.{{ $ii + 1 }}</td>
                                <td class="desc">@if(!empty($item->item_name))<span class="title">{{ $item->item_name }}</span>@endif<span class="body">{{ $item->description }}</span></td>
                                <td class="num">{{ number_format($item->quantity, 2) }}</td>
                                <td class="ctr">{{ $item->unit }}</td>
                                <td class="num">{{ number_format($item->unit_rate, 2) }}</td>
                                <td class="num">{{ number_format($item->total, 2) }}</td>
                            </tr>
                        @endforeach

                        {{-- Sub-total row for this section --}}
                        <tr class="subtotal-row">
                            <td colspan="5" class="label">SUB-TOTAL</td>
                            <td class="num">{{ number_format($catTotal, 2) }}</td>
                        </tr>
                    @endforeach

                    {{-- Transportation --}}
                    @if((float) $quotation->transportation_amount > 0)
                        <tr class="grandline-row">
                            <td colspan="5"><strong>Transportation</strong></td>
                            <td class="num">{{ number_format($quotation->transportation_amount, 2) }}</td>
                        </tr>
                    @endif

                    {{-- TOTAL (pre-supervision / pre-VAT) --}}
                    @php
                        $totalBeforeSupervision = (float) $quotation->subtotal - (float) $quotation->discount_amount + (float) $quotation->transportation_amount;
                    @endphp

                    {{-- Discount line if any --}}
                    @if((float) $quotation->discount_amount > 0)
                        <tr class="grandline-row">
                            <td colspan="5">
                                <strong>Discount
                                    {{ $quotation->discount_type === 'percentage' ? "({$quotation->discount_value}%)" : '(Fixed)' }}</strong>
                            </td>
                            <td class="num" style="color:#dc2626;">- {{ number_format($quotation->discount_amount, 2) }}</td>
                        </tr>
                    @endif

                    <tr class="grandline-row">
                        <td colspan="5" style="text-align:right;"><strong>TOTAL</strong></td>
                        <td class="num">{{ number_format($totalBeforeSupervision, 2) }}</td>
                    </tr>

                    {{-- Supervision & Implementation --}}
                    @if((float) $quotation->supervision_amount > 0)
                        <tr class="grandline-row">
                            <td colspan="5"><strong>Supervision &amp; Implementation {{ rtrim(rtrim(number_format($quotation->supervision_pct, 2), '0'), '.') }}%</strong></td>
                            <td class="num">{{ number_format($quotation->supervision_amount, 2) }}</td>
                        </tr>
                    @endif

                    {{-- VAT if any --}}
                    @if((float) $quotation->vat_amount > 0)
                        <tr class="grandline-row">
                            <td colspan="5"><strong>VAT ({{ $quotation->vat_pct }}%)</strong></td>
                            <td class="num">{{ number_format($quotation->vat_amount, 2) }}</td>
                        </tr>
                    @endif

                    {{-- GRAND TOTAL --}}
                    <tr class="final-row">
                        <td colspan="5" style="text-align:right;">GRAND TOTAL (BDT)</td>
                        <td class="num">{{ number_format($quotation->grand_total, 2) }}</td>
                    </tr>
                </tbody>
            </table>

            {{-- IN WORDS --}}
            @if(!empty($grandTotalInWords))
                <div class="in-words">
                    <span class="label">In Words:</span>
                    <span class="value">{{ $grandTotalInWords }}</span>
                </div>
            @endif

            {{-- TERMS --}}
            @if($quotation->terms)
                <div class="terms-block">
                    <h4>TERMS &amp; CONDITION :</h4>
                    @foreach(preg_split('/\r\n|\r|\n/', trim($quotation->terms)) as $line)
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
                @elseif($quotation->createdBy)
                    <div class="name">{{ $quotation->createdBy->name }}</div>
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

            @unless($isPdf ?? false)
                {{-- Web only: inline FOOTER ADDRESS. PDF uses the fixed .page-footer at the top. --}}
                @if(!empty($companyAddress))
                    <div class="foot-addr">{{ $companyAddress }}</div>
                @endif
            @endunless
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
