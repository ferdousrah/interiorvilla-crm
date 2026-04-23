<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title ?? 'Report' }} — {{ $companyName }}</title>
    <style>
        @page { margin: 14mm 12mm; }
        * { box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #1f2937; margin: 0; line-height: 1.45; }

        .letterhead { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .letterhead td { vertical-align: top; padding: 0; }
        .lh-left { width: 62%; }
        .lh-right { width: 38%; text-align: right; font-size: 10px; color: #374151; line-height: 1.6; }
        .lh-logo { height: 46px; max-width: 160px; }
        .lh-name { font-size: 15px; font-weight: 700; color: #1f2937; }
        .lh-address { font-size: 10px; color: #4b5563; margin-top: 2px; }
        .icon { font-weight: 700; color: #6b7280; font-size: 9px; margin-right: 2px; }

        hr.rule { border: 0; border-top: 2px solid #4f46e5; margin: 0 0 4px; }
        hr.rule-thin { border: 0; border-top: 1px solid #e5e7eb; margin: 4px 0 14px; }

        .title-row { text-align: center; margin-bottom: 14px; }
        .title-row h1 { margin: 0; font-size: 18px; font-weight: 700; color: #111827; letter-spacing: 1.5px; }
        .title-row .meta { font-size: 10px; color: #6b7280; margin-top: 3px; }

        .section-info { margin-bottom: 10px; font-size: 11px; }
        .section-info strong { color: #111827; }
        .section-info .pills { display: inline-block; }
        .pill { display: inline-block; padding: 2px 8px; background: #eef2ff; color: #4338ca; border-radius: 999px; font-size: 10px; margin-right: 4px; }

        table.data {
            width: 100%; border-collapse: collapse; font-size: 10.5px;
        }
        table.data th {
            background: #f3f4f6; color: #374151; padding: 6px 8px; text-align: left;
            font-weight: 700; text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.4px;
            border-bottom: 1px solid #d1d5db;
        }
        table.data th.num { text-align: right; }
        table.data th.ctr { text-align: center; }
        table.data td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
        table.data td.num { text-align: right; white-space: nowrap; }
        table.data td.ctr { text-align: center; }
        table.data tr.total-row td { background: #eef2ff; font-weight: 700; border-top: 2px solid #4f46e5; }
        table.data tr.total-row td.num { color: #4338ca; }
        table.data tr:nth-child(even) td { background: #fafafa; }

        .summary-box {
            background: #eef2ff; border-left: 4px solid #4f46e5;
            padding: 8px 12px; border-radius: 4px; font-size: 11px; margin: 8px 0 14px;
        }
        .summary-box .kv { display: inline-block; margin-right: 14px; }
        .summary-box .kv strong { color: #111827; }

        .foot {
            margin-top: 18px; padding-top: 8px; border-top: 1px solid #e5e7eb;
            font-size: 9px; color: #9ca3af; text-align: center;
        }

        .empty { text-align: center; padding: 28px; color: #9ca3af; font-style: italic; font-size: 11px; }
    </style>
</head>
<body>
    {{-- LETTERHEAD --}}
    <table class="letterhead">
        <tr>
            <td class="lh-left">
                @if(!empty($companyLogo))
                    <img src="{{ $companyLogo }}" alt="{{ $companyName }}" class="lh-logo"><br>
                @endif
                <div class="lh-name">{{ $companyName }}</div>
                @if(!empty($companyAddress))
                    <div class="lh-address">{{ $companyAddress }}</div>
                @endif
            </td>
            <td class="lh-right">
                @if(!empty($companyPhone))<span class="icon">Tel:</span> {{ $companyPhone }}<br>@endif
                @if(!empty($companyEmail))<span class="icon">Email:</span> {{ $companyEmail }}@endif
            </td>
        </tr>
    </table>
    <hr class="rule">
    <hr class="rule-thin">

    {{-- TITLE --}}
    <div class="title-row">
        <h1>{{ $title ?? 'REPORT' }}</h1>
        @if(!empty($subtitle))
            <div class="meta">{{ $subtitle }}</div>
        @endif
        <div class="meta">Generated on {{ $generatedAt }}</div>
    </div>

    {{-- BODY --}}
    @yield('content')

    <div class="foot">
        {{ $companyName }} · Generated {{ $generatedAt }}
    </div>
</body>
</html>
