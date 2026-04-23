@php
    $title = 'VENDOR LEDGER';
    $subtitle = $vendor ? $vendor->name : 'No vendor selected';
@endphp

@extends('reports.pdf._layout')

@section('content')
    @if(!$vendor)
        <p class="empty">Select a vendor to generate ledger.</p>
    @else
        @php
            $totalPO     = collect($transactions)->where('type', 'purchase_order')->sum('amount');
            $totalPaid   = collect($transactions)->where('type', 'payment')->sum('amount');
            $outstanding = $totalPO - $totalPaid;
        @endphp

        <div class="section-info">
            <strong>{{ $vendor->name }}</strong>
            @if($vendor->phone) · {{ $vendor->phone }}@endif
            @if($vendor->code) · <span class="pill">{{ $vendor->code }}</span>@endif
        </div>

        <div class="summary-box">
            <span class="kv">Total POs: <strong>BDT {{ number_format($totalPO, 2) }}</strong></span>
            <span class="kv">Total Paid: <strong style="color:#059669;">BDT {{ number_format($totalPaid, 2) }}</strong></span>
            <span class="kv">Outstanding: <strong style="color:#dc2626;">BDT {{ number_format($outstanding, 2) }}</strong></span>
        </div>

        <table class="data">
            <thead>
                <tr>
                    <th style="width:75px;">Date</th>
                    <th style="width:100px;">Type</th>
                    <th style="width:90px;">Reference</th>
                    <th>Description</th>
                    <th class="num" style="width:90px;">Amount</th>
                    <th class="num" style="width:90px;">Paid</th>
                    <th class="num" style="width:100px;">Balance</th>
                </tr>
            </thead>
            <tbody>
                @forelse($transactions as $t)
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($t['date'])->format('d M Y') }}</td>
                        <td>{{ ucwords(str_replace('_', ' ', $t['type'])) }}</td>
                        <td>{{ $t['reference'] }}</td>
                        <td>{{ $t['description'] }}</td>
                        <td class="num">{{ $t['type'] === 'purchase_order' ? number_format($t['amount'], 2) : '—' }}</td>
                        <td class="num" style="color:#059669;">{{ $t['type'] === 'payment' ? number_format($t['amount'], 2) : '—' }}</td>
                        <td class="num"><strong>{{ number_format($t['running_balance'], 2) }}</strong></td>
                    </tr>
                @empty
                    <tr><td colspan="7" class="empty">No transactions in the selected period.</td></tr>
                @endforelse
            </tbody>
        </table>
    @endif
@endsection
