@php
    $title = 'TRIAL BALANCE';
    $subtitle = 'As of ' . \Carbon\Carbon::parse($asOf)->format('d M Y');
@endphp

@extends('reports.pdf._layout')

@section('content')
    @php
        $totalDebit  = collect($balances)->sum('debit');
        $totalCredit = collect($balances)->sum('credit');
    @endphp

    <table class="data">
        <thead>
            <tr>
                <th style="width:60px;">Code</th>
                <th>Account Name</th>
                <th style="width:120px;">Group</th>
                <th class="num" style="width:110px;">Debit</th>
                <th class="num" style="width:110px;">Credit</th>
            </tr>
        </thead>
        <tbody>
            @forelse($balances as $b)
                <tr>
                    <td>{{ $b['code'] }}</td>
                    <td>{{ $b['name'] }}</td>
                    <td>{{ $b['group'] ?? '—' }}</td>
                    <td class="num">{{ $b['debit']  > 0 ? number_format($b['debit'],  2) : '—' }}</td>
                    <td class="num">{{ $b['credit'] > 0 ? number_format($b['credit'], 2) : '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="5" class="empty">No account balances to show.</td></tr>
            @endforelse
            <tr class="total-row">
                <td colspan="3">TOTAL</td>
                <td class="num">{{ number_format($totalDebit, 2) }}</td>
                <td class="num">{{ number_format($totalCredit, 2) }}</td>
            </tr>
        </tbody>
    </table>
@endsection
