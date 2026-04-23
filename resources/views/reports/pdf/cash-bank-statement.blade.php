@php
    $title = 'CASH &amp; BANK STATEMENT';
    $subtitle = $accountHead ? "{$accountHead->code} — {$accountHead->name}" : 'No account selected';
@endphp

@extends('reports.pdf._layout')

@section('content')
    @if(!$accountHead)
        <p class="empty">Select an account to generate statement.</p>
    @else
        <div class="section-info">
            @if(!empty($filters['from']) || !empty($filters['to']))
                Period: {{ $filters['from'] ?? '—' }} to {{ $filters['to'] ?? now()->toDateString() }}
            @else
                All time
            @endif
        </div>

        <div class="summary-box">
            <span class="kv">Opening Balance: <strong>BDT {{ number_format($openingBalance ?? 0, 2) }}</strong></span>
            <span class="kv">Closing Balance: <strong style="color:#4338ca;">BDT {{ number_format($closingBalance ?? 0, 2) }}</strong></span>
        </div>

        <table class="data">
            <thead>
                <tr>
                    <th style="width:80px;">Date</th>
                    <th>Description</th>
                    <th style="width:90px;">Reference</th>
                    <th class="num" style="width:100px;">Debit (In)</th>
                    <th class="num" style="width:100px;">Credit (Out)</th>
                    <th class="num" style="width:110px;">Balance</th>
                </tr>
            </thead>
            <tbody>
                @forelse($transactions as $t)
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($t['date'])->format('d M Y') }}</td>
                        <td>{{ $t['description'] }}</td>
                        <td>{{ $t['reference'] }}</td>
                        <td class="num" style="color:#059669;">{{ $t['debit']  > 0 ? number_format($t['debit'],  2) : '—' }}</td>
                        <td class="num" style="color:#dc2626;">{{ $t['credit'] > 0 ? number_format($t['credit'], 2) : '—' }}</td>
                        <td class="num"><strong>{{ number_format($t['running_balance'], 2) }}</strong></td>
                    </tr>
                @empty
                    <tr><td colspan="6" class="empty">No transactions in the selected period.</td></tr>
                @endforelse
            </tbody>
        </table>
    @endif
@endsection
