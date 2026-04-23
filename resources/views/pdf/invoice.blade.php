<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $invoice->code }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1a1a1a; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding: 24px; border-bottom: 2px solid #4f46e5; margin-bottom: 20px; }
        .company-name { font-size: 20px; font-weight: bold; color: #4f46e5; }
        .company-info { font-size: 10px; color: #666; margin-top: 4px; }
        .invoice-title { font-size: 22px; font-weight: bold; color: #4f46e5; text-align: right; }
        .invoice-meta { text-align: right; margin-top: 4px; font-size: 10px; color: #666; }
        .section { padding: 0 24px; margin-bottom: 20px; }
        .bill-to-grid { display: flex; gap: 40px; }
        .bill-to h4 { font-size: 10px; text-transform: uppercase; color: #999; margin-bottom: 6px; }
        .bill-to p { font-size: 11px; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; margin: 0 24px; width: calc(100% - 48px); }
        th { background: #f5f3ff; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; color: #666; border-bottom: 1px solid #ddd; }
        td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; }
        .text-right { text-align: right; }
        .totals { padding: 0 24px; }
        .totals-table { margin-left: auto; width: 220px; }
        .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
        .totals-total { font-weight: bold; font-size: 13px; border-top: 2px solid #4f46e5; padding-top: 6px; margin-top: 4px; color: #4f46e5; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; padding: 12px; border-top: 1px solid #eee; font-size: 10px; color: #999; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="company-name">Interior Villa BD</div>
            <div class="company-info">
                Dhaka, Bangladesh<br>
                info@interiorvilla.com.bd
            </div>
        </div>
        <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-meta">
                <strong>{{ $invoice->code }}</strong><br>
                Date: {{ $invoice->invoice_date->format('d M Y') }}<br>
                Due: {{ $invoice->due_date->format('d M Y') }}
            </div>
        </div>
    </div>

    <div class="section">
        <div class="bill-to-grid">
            <div class="bill-to">
                <h4>Bill To</h4>
                <p><strong>{{ $invoice->client->name }}</strong></p>
                @if($invoice->client->company_name)
                    <p>{{ $invoice->client->company_name }}</p>
                @endif
                <p>{{ $invoice->client->phone }}</p>
                @if($invoice->client->address)
                    <p>{{ $invoice->client->address }}</p>
                @endif
            </div>
            @if($invoice->project)
            <div class="bill-to">
                <h4>Project</h4>
                <p><strong>{{ $invoice->project->name }}</strong></p>
                <p>{{ $invoice->project->code }}</p>
            </div>
            @endif
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Description</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->lineItems as $i => $item)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $item->description }}</td>
                <td class="text-right">{{ $item->quantity }}</td>
                <td class="text-right">৳{{ number_format($item->unit_rate, 2) }}</td>
                <td class="text-right">৳{{ number_format($item->total, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals" style="margin-top: 16px;">
        <div class="totals-table">
            <div class="totals-row"><span>Subtotal</span><span>৳{{ number_format($invoice->subtotal, 2) }}</span></div>
            @if($invoice->vat_amount > 0)
            <div class="totals-row"><span>VAT ({{ $invoice->vat_pct }}%)</span><span>৳{{ number_format($invoice->vat_amount, 2) }}</span></div>
            @endif
            @if($invoice->discount_amount > 0)
            <div class="totals-row"><span>Discount</span><span>-৳{{ number_format($invoice->discount_amount, 2) }}</span></div>
            @endif
            <div class="totals-row totals-total"><span>Grand Total</span><span>৳{{ number_format($invoice->grand_total, 2) }}</span></div>
            @if($invoice->paid_amount > 0)
            <div class="totals-row"><span>Paid</span><span>৳{{ number_format($invoice->paid_amount, 2) }}</span></div>
            <div class="totals-row" style="font-weight: bold;"><span>Balance Due</span><span>৳{{ number_format($invoice->grand_total - $invoice->paid_amount, 2) }}</span></div>
            @endif
        </div>
    </div>

    @if($invoice->notes)
    <div class="section" style="margin-top: 24px;">
        <h4 style="font-size: 10px; text-transform: uppercase; color: #999; margin-bottom: 4px;">Notes</h4>
        <p>{{ $invoice->notes }}</p>
    </div>
    @endif

    <div class="footer">
        Interior Villa BD | Thank you for your business | Page <span class="pagenum"></span>
    </div>
</body>
</html>
