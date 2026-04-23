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
            font-size: 11.5px;
            line-height: 1.45;
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

        /* PDF overrides — flatten the card, tighten margins */
        @if($isPdf ?? false)
        @page { margin: 12mm 10mm; }
        body { background: #fff; font-size: 10.5px; line-height: 1.4; }
        .wrap { max-width: 100%; padding: 0; margin: 0; }
        .sheet { box-shadow: none; border-radius: 0; padding: 0; }
        @endif

        /* ========== HEADER ========== */
        .hdr { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .hdr td { vertical-align: top; padding: 0; }
        .hdr .date-block { font-size: 12px; }
        .hdr .date-block .date { font-weight: 600; color: #1f2937; }
        .hdr .logo-block { text-align: right; }
        .hdr .logo-block img { max-height: 62px; max-width: 190px; display: inline-block; }
        .hdr .lh-name { font-size: 15px; font-weight: 700; color: #111827; margin: 4px 0 0; }
        .hdr .lh-tagline { font-size: 9px; letter-spacing: 2px; color: #059669; margin: 2px 0 0; text-transform: uppercase; }

        /* ========== TO BLOCK ========== */
        .to-block { font-size: 12px; margin-bottom: 14px; line-height: 1.55; }
        .to-block .lbl { color: #6b7280; }
        .to-block .name { font-weight: 700; color: #111827; }

        /* ========== SUBJECT BAR ========== */
        .subject-bar {
            background: #f3f4f6;
            padding: 8px 12px;
            font-size: 11.5px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 12px;
            letter-spacing: 0.3px;
        }
        .subject-bar .lbl { margin-right: 8px; }

        /* ========== MAIN BOQ TABLE ========== */
        .boq { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
        .boq thead th {
            background: #f9fafb;
            color: #374151;
            text-transform: none;
            font-weight: 700;
            font-size: 11px;
            border: 1px solid #d1d5db;
            padding: 6px 8px;
            text-align: left;
        }
        .boq thead th.num { text-align: right; }
        .boq thead th.ctr { text-align: center; }
        .boq td {
            border: 1px solid #e5e7eb;
            padding: 5px 8px;
            vertical-align: top;
        }
        .boq td.num { text-align: right; white-space: nowrap; }
        .boq td.ctr { text-align: center; }
        .boq td.idx { color: #6b7280; font-size: 10.5px; width: 38px; text-align: center; }

        .boq tr.section-header td {
            background: #eef5eb;
            font-weight: 700;
            color: #1f2937;
            padding: 7px 8px;
            font-size: 11.5px;
            border-color: #d1d5db;
        }
        .boq tr.item-row td.desc {
            line-height: 1.45;
            color: #374151;
            white-space: pre-line;
        }
        .boq tr.item-row td.desc .title {
            font-weight: 700;
            color: #111827;
            display: block;
            margin-bottom: 2px;
        }

        .boq tr.subtotal-row td {
            background: #fafafa;
            font-weight: 700;
            padding: 6px 8px;
            border-color: #d1d5db;
        }
        .boq tr.subtotal-row td.label { text-align: center; }
        .boq tr.grandline-row td {
            background: #f3f4f6;
            font-weight: 700;
            padding: 7px 8px;
        }
        .boq tr.grandline-row td.num { color: #1f2937; }

        .boq tr.final-row td {
            background: #111827;
            color: #fff;
            font-weight: 700;
            padding: 9px 8px;
            font-size: 12.5px;
            border-color: #111827;
        }
        .boq tr.final-row td.num { color: #fbbf24; }

        /* ========== IN WORDS ========== */
        .in-words {
            margin: 8px 0 14px;
            font-size: 11px;
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
            margin: 10px 0 18px;
            font-size: 11px;
            color: #374151;
        }
        .terms-block h4 {
            font-size: 11.5px;
            font-weight: 700;
            margin: 0 0 4px;
            color: #1f2937;
            letter-spacing: 0.3px;
        }
        .terms-block .item { margin: 2px 0; line-height: 1.55; }

        /* ========== SIGNATURE ========== */
        .sign-block {
            margin-top: 24px;
            font-size: 11px;
            color: #1f2937;
        }
        .sign-block .thanks {
            margin-bottom: 32px;
            font-weight: 400;
        }
        .sign-block .name { font-weight: 700; color: #111827; }
        .sign-block .company { font-weight: 700; color: #111827; font-size: 12px; margin-top: 2px; }
        .sign-block .meta { color: #4b5563; margin-top: 1px; font-size: 10.5px; }

        .foot-addr {
            margin-top: 18px;
            padding-top: 10px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            font-weight: 700;
            font-size: 11px;
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
            body { background: #fff; font-size: 10.5px; }
            .wrap { padding: 0; max-width: 100%; }
            .sheet { box-shadow: none; border-radius: 0; padding: 0; }
            .actions, .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="sheet">

            {{-- HEADER: Date (left) + Logo (right) --}}
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
                        @endif
                        <div class="lh-name">{{ $companyName }}</div>
                        @if(!empty($companyTagline))
                            <div class="lh-tagline">{{ $companyTagline }}</div>
                        @endif
                    </td>
                </tr>
            </table>

            {{-- TO BLOCK --}}
            @php $person = $quotation->client ?? $quotation->lead; @endphp
            <div class="to-block">
                <div class="lbl">To</div>
                @if($person)
                    <div class="name">{{ $quotation->client->company_name ?? $person->name }}</div>
                    @if($quotation->client && $quotation->client->company_name && $quotation->client->name)
                        <div>Attn: {{ $quotation->client->name }}</div>
                    @endif
                    @if($person->address)
                        <div>{{ $person->address }}</div>
                    @endif
                    @if($person->phone)
                        <div>{{ $person->phone }}</div>
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
                        <th style="width:38px;">SL</th>
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
                                <td class="desc">{{ $item->description }}</td>
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
                        <td colspan="5" style="text-align:right;">GRAND TOTAL</td>
                        <td class="num">BDT {{ number_format($quotation->grand_total, 2) }}</td>
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
                @if(!empty($companyCeoName))
                    <div class="name">{{ $companyCeoName }}</div>
                    <div class="meta">{{ $companyCeoTitle ?? 'CEO' }}</div>
                @elseif($quotation->createdBy)
                    <div class="name">{{ $quotation->createdBy->name }}</div>
                    <div class="meta">{{ $companyCeoTitle ?? 'Prepared By' }}</div>
                @endif
                <div class="company">{{ $companyName }}</div>
                @if(!empty($companyPhone))
                    <div class="meta">Cell: {{ $companyPhone }}@if(!empty($companyPhone2)), {{ $companyPhone2 }}@endif</div>
                @endif
                @if(!empty($companyEmail))
                    <div class="meta">Email: {{ $companyEmail }}</div>
                @endif
            </div>

            {{-- FOOTER ADDRESS --}}
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
