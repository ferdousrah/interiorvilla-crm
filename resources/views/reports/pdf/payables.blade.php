@php
    $title = 'OUTSTANDING PAYABLES';
    $subtitle = 'As of ' . now()->format('d M Y');
@endphp

@extends('reports.pdf._layout')

@section('content')
    <div class="summary-box" style="background:#fff7ed; border-color:#f59e0b;">
        <span class="kv" style="font-size:12px;">
            Total Outstanding: <strong style="color:#b45309; font-size:13px;">BDT {{ number_format($totalPayable, 2) }}</strong>
        </span>
        <span class="kv">
            {{ count($purchaseOrders) }} open PO{{ count($purchaseOrders) === 1 ? '' : 's' }}
        </span>
    </div>

    <table class="data">
        <thead>
            <tr>
                <th style="width:80px;">PO Code</th>
                <th style="width:72px;">Date</th>
                <th>Vendor</th>
                <th class="num" style="width:100px;">Total</th>
                <th class="num" style="width:100px;">Paid</th>
                <th class="num" style="width:100px;">Balance</th>
                <th style="width:70px;">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($purchaseOrders as $po)
                <tr>
                    <td>{{ $po->code }}</td>
                    <td>{{ \Carbon\Carbon::parse($po->order_date)->format('d M Y') }}</td>
                    <td>{{ $po->vendor?->name ?? '—' }}</td>
                    <td class="num">{{ number_format($po->grand_total, 2) }}</td>
                    <td class="num" style="color:#059669;">{{ number_format($po->amount_paid, 2) }}</td>
                    <td class="num"><strong style="color:#b45309;">{{ number_format($po->balance_due, 2) }}</strong></td>
                    <td>{{ ucfirst($po->status) }}</td>
                </tr>
            @empty
                <tr><td colspan="7" class="empty">No outstanding payables.</td></tr>
            @endforelse
            @if(count($purchaseOrders) > 0)
                <tr class="total-row">
                    <td colspan="5">TOTAL</td>
                    <td class="num">{{ number_format($totalPayable, 2) }}</td>
                    <td></td>
                </tr>
            @endif
        </tbody>
    </table>
@endsection
