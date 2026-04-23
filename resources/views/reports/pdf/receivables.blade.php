@php
    $title = 'OUTSTANDING RECEIVABLES';
    $subtitle = 'As of ' . now()->format('d M Y');
@endphp

@extends('reports.pdf._layout')

@section('content')
    <div class="summary-box">
        <span class="kv" style="font-size:12px;">
            Total Outstanding: <strong style="color:#dc2626; font-size:13px;">BDT {{ number_format($totalReceivable, 2) }}</strong>
        </span>
        <span class="kv">
            {{ count($invoices) }} open invoice{{ count($invoices) === 1 ? '' : 's' }}
        </span>
    </div>

    <table class="data">
        <thead>
            <tr>
                <th style="width:80px;">Invoice</th>
                <th style="width:72px;">Date</th>
                <th style="width:72px;">Due Date</th>
                <th>Party</th>
                <th class="num" style="width:90px;">Total</th>
                <th class="num" style="width:90px;">Paid</th>
                <th class="num" style="width:90px;">Balance</th>
                <th class="ctr" style="width:50px;">Aging</th>
            </tr>
        </thead>
        <tbody>
            @forelse($invoices as $inv)
                <tr>
                    <td>{{ $inv->code }}</td>
                    <td>{{ \Carbon\Carbon::parse($inv->invoice_date)->format('d M Y') }}</td>
                    <td>{{ \Carbon\Carbon::parse($inv->due_date)->format('d M Y') }}</td>
                    <td>{{ $inv->client->name ?? $inv->lead->name ?? '—' }}</td>
                    <td class="num">{{ number_format($inv->grand_total, 2) }}</td>
                    <td class="num" style="color:#059669;">{{ number_format($inv->paid_amount, 2) }}</td>
                    <td class="num"><strong style="color:#dc2626;">{{ number_format($inv->balance_due, 2) }}</strong></td>
                    <td class="ctr">{{ $inv->aging_bucket }}</td>
                </tr>
            @empty
                <tr><td colspan="8" class="empty">No outstanding receivables.</td></tr>
            @endforelse
            @if(count($invoices) > 0)
                <tr class="total-row">
                    <td colspan="6">TOTAL</td>
                    <td class="num">{{ number_format($totalReceivable, 2) }}</td>
                    <td></td>
                </tr>
            @endif
        </tbody>
    </table>
@endsection
