@php
    $isIncome = $kind === 'income';
    $title = $isIncome ? 'MONTHLY INCOME' : 'MONTHLY EXPENSE';
    $subtitle = $monthLabel . ' · Cash basis';
@endphp

@extends('reports.pdf._layout')

@section('content')
    <div class="summary-box">
        <span class="kv">Total {{ $isIncome ? 'income' : 'expense' }}: <strong>{{ number_format($total, 2) }}</strong></span>
        <span class="kv">{{ $prevLabel }}: <strong>{{ number_format($prevTotal, 2) }}</strong></span>
        <span class="kv">Entries: <strong>{{ count($rows) }}</strong></span>
    </div>

    <table class="data" style="margin-bottom: 16px;">
        <thead>
            <tr>
                <th>{{ $isIncome ? 'Income source' : 'Category' }}</th>
                <th class="num" style="width:70px;">Entries</th>
                <th class="num" style="width:120px;">Amount</th>
                <th class="num" style="width:70px;">Share</th>
            </tr>
        </thead>
        <tbody>
            @forelse($groups as $g)
                <tr>
                    <td>{{ $g['name'] }}</td>
                    <td class="num">{{ $g['count'] }}</td>
                    <td class="num">{{ number_format($g['amount'], 2) }}</td>
                    <td class="num">{{ $total > 0 ? number_format($g['amount'] / $total * 100, 1) : '0.0' }}%</td>
                </tr>
            @empty
                <tr><td colspan="4" class="empty">Nothing recorded in {{ $monthLabel }}.</td></tr>
            @endforelse
            <tr class="total-row">
                <td colspan="2">TOTAL</td>
                <td class="num">{{ number_format($total, 2) }}</td>
                <td class="num"></td>
            </tr>
        </tbody>
    </table>

    @if(count($rows))
        <table class="data">
            <thead>
                <tr>
                    <th style="width:62px;">Date</th>
                    <th style="width:84px;">Code</th>
                    <th>{{ $isIncome ? 'Client' : 'Project' }}</th>
                    <th>Details</th>
                    <th style="width:110px;">{{ $isIncome ? 'Source' : 'Category' }}</th>
                    <th class="num" style="width:90px;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($rows as $r)
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($r['date'])->format('d M') }}</td>
                        <td>{{ $r['code'] }}</td>
                        <td>{{ $r['party'] }}</td>
                        <td>{{ $r['description'] }}</td>
                        <td>{{ $r['group'] }}</td>
                        <td class="num">{{ number_format($r['amount'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif
@endsection
