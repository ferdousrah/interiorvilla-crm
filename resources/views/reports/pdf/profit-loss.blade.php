@php
    $title = 'PROFIT & LOSS';
    $subtitle = $periodLabel . ' · Cash basis';
@endphp

@extends('reports.pdf._layout')

@section('content')
    <table class="data" style="margin-bottom: 16px;">
        <thead>
            <tr><th>Income</th><th class="num" style="width:80px;">Entries</th><th class="num" style="width:140px;">Amount</th></tr>
        </thead>
        <tbody>
            @forelse($incomeGroups as $g)
                <tr><td>{{ $g['name'] }}</td><td class="num">{{ $g['count'] }}</td><td class="num">{{ number_format($g['amount'], 2) }}</td></tr>
            @empty
                <tr><td colspan="3" class="empty">No income in this period.</td></tr>
            @endforelse
            <tr class="total-row"><td colspan="2">TOTAL INCOME</td><td class="num">{{ number_format($totalIncome, 2) }}</td></tr>
        </tbody>
    </table>

    <table class="data" style="margin-bottom: 16px;">
        <thead>
            <tr><th>Expense</th><th class="num" style="width:80px;">Entries</th><th class="num" style="width:140px;">Amount</th></tr>
        </thead>
        <tbody>
            @forelse($expenseGroups as $g)
                <tr><td>{{ $g['name'] }}</td><td class="num">{{ $g['count'] }}</td><td class="num">{{ number_format($g['amount'], 2) }}</td></tr>
            @empty
                <tr><td colspan="3" class="empty">No expense in this period.</td></tr>
            @endforelse
            <tr class="total-row"><td colspan="2">TOTAL EXPENSE</td><td class="num">{{ number_format($totalExpense, 2) }}</td></tr>
        </tbody>
    </table>

    <div class="summary-box">
        <span class="kv">{{ $netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS' }}: <strong>{{ number_format(abs($netProfit), 2) }}</strong></span>
        @if($totalIncome > 0)
            <span class="kv">Margin: <strong>{{ number_format($netProfit / $totalIncome * 100, 1) }}%</strong></span>
        @endif
    </div>
@endsection
