@php
    $title = 'CLIENT LEDGER';
    $subtitle = $client ? $client->name : 'No client selected';
@endphp

@extends('reports.pdf._layout')

@section('content')
    @if(!$client)
        <p class="empty">Select a client to generate ledger.</p>
    @else
        @php
            $totalInvoiced = collect($transactions)->where('type', 'invoice')->sum('amount');
            $totalPaid     = collect($transactions)->where('type', 'receipt')->sum('amount');
            $balance       = $totalInvoiced - $totalPaid;
        @endphp

        <div class="section-info">
            <strong>{{ $client->name }}</strong>
            @if($client->phone) · {{ $client->phone }}@endif
            @if($client->code) · <span class="pill">{{ $client->code }}</span>@endif
            @if(!empty($filters['from']) || !empty($filters['to']))
                · Period: {{ $filters['from'] ?? '—' }} to {{ $filters['to'] ?? now()->toDateString() }}
            @endif
        </div>

        <div class="summary-box">
            <span class="kv">Total Invoiced: <strong>BDT {{ number_format($totalInvoiced, 2) }}</strong></span>
            <span class="kv">Total Paid: <strong style="color:#059669;">BDT {{ number_format($totalPaid, 2) }}</strong></span>
            <span class="kv">Balance: <strong style="color:#dc2626;">BDT {{ number_format($balance, 2) }}</strong></span>
        </div>

        <table class="data">
            <thead>
                <tr>
                    <th style="width:75px;">Date</th>
                    <th style="width:75px;">Type</th>
                    <th style="width:90px;">Reference</th>
                    <th>Description</th>
                    <th class="num" style="width:90px;">Debit</th>
                    <th class="num" style="width:90px;">Credit</th>
                    <th class="num" style="width:100px;">Balance</th>
                </tr>
            </thead>
            <tbody>
                @forelse($transactions as $t)
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($t['date'])->format('d M Y') }}</td>
                        <td>{{ ucfirst($t['type']) }}</td>
                        <td>{{ $t['reference'] }}</td>
                        <td>{{ $t['description'] }}</td>
                        <td class="num">{{ $t['type'] === 'invoice' ? number_format($t['amount'], 2) : '—' }}</td>
                        <td class="num" style="color:#059669;">{{ $t['type'] === 'receipt' ? number_format($t['amount'], 2) : '—' }}</td>
                        <td class="num"><strong>{{ number_format($t['running_balance'], 2) }}</strong></td>
                    </tr>
                @empty
                    <tr><td colspan="7" class="empty">No transactions in the selected period.</td></tr>
                @endforelse
            </tbody>
        </table>
    @endif
@endsection
