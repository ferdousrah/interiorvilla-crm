<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Purchase Order {{ $po->code }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1a1a1a; }
        .header { display: flex; justify-content: space-between; padding: 24px; border-bottom: 2px solid #4f46e5; margin-bottom: 20px; }
        .company-name { font-size: 18px; font-weight: bold; color: #4f46e5; }
        .po-title { font-size: 20px; font-weight: bold; color: #4f46e5; text-align: right; }
        .section { padding: 0 24px; margin-bottom: 16px; }
        table { width: calc(100% - 48px); margin: 0 24px; border-collapse: collapse; }
        th { background: #f5f3ff; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; color: #666; border-bottom: 1px solid #ddd; }
        td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; }
        .text-right { text-align: right; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; padding: 10px; border-top: 1px solid #eee; font-size: 10px; color: #999; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="company-name">Interior Villa BD</div>
            <div style="font-size: 10px; color: #666; margin-top: 4px;">Dhaka, Bangladesh</div>
        </div>
        <div>
            <div class="po-title">PURCHASE ORDER</div>
            <div style="font-size: 10px; color: #666; text-align: right; margin-top: 4px;">
                <strong>{{ $po->code }}</strong><br>
                Date: {{ $po->order_date->format('d M Y') }}
            </div>
        </div>
    </div>

    <div class="section">
        <div style="display: flex; gap: 40px;">
            <div>
                <h4 style="font-size: 10px; text-transform: uppercase; color: #999; margin-bottom: 6px;">Vendor</h4>
                <p><strong>{{ $po->vendor->name }}</strong></p>
                <p>{{ $po->vendor->phone }}</p>
                @if($po->vendor->address)<p>{{ $po->vendor->address }}</p>@endif
            </div>
            @if($po->project)
            <div>
                <h4 style="font-size: 10px; text-transform: uppercase; color: #999; margin-bottom: 6px;">Project</h4>
                <p><strong>{{ $po->project->name }}</strong></p>
                <p>{{ $po->project->code }}</p>
            </div>
            @endif
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Description</th>
                <th>Unit</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($po->items as $i => $item)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $item->description }}</td>
                <td>{{ $item->unit }}</td>
                <td class="text-right">{{ $item->quantity_ordered }}</td>
                <td class="text-right">৳{{ number_format($item->unit_rate, 2) }}</td>
                <td class="text-right">৳{{ number_format($item->total, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div style="padding: 12px 24px; text-align: right; margin-top: 12px;">
        <div>Subtotal: ৳{{ number_format($po->subtotal, 2) }}</div>
        @if($po->vat_amount > 0)<div>VAT: ৳{{ number_format($po->vat_amount, 2) }}</div>@endif
        @if($po->other_charges > 0)<div>Other Charges: ৳{{ number_format($po->other_charges, 2) }}</div>@endif
        <div style="font-weight: bold; font-size: 13px; color: #4f46e5; margin-top: 6px; border-top: 2px solid #4f46e5; padding-top: 6px;">
            Grand Total: ৳{{ number_format($po->grand_total, 2) }}
        </div>
    </div>

    <div class="footer">Interior Villa BD | Purchase Order {{ $po->code }}</div>
</body>
</html>
