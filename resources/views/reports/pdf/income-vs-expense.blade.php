@php
    $title = 'INCOME VS EXPENSE';
    $subtitle = 'Year ' . $year . ' · Cash basis';
@endphp

@extends('reports.pdf._layout')

@section('content')
    <table class="data">
        <thead>
            <tr>
                <th>Month</th>
                <th class="num" style="width:130px;">Income</th>
                <th class="num" style="width:130px;">Expense</th>
                <th class="num" style="width:130px;">Net</th>
            </tr>
        </thead>
        <tbody>
            @foreach($months as $m)
                <tr>
                    <td>{{ $m['label'] }} {{ $year }}</td>
                    <td class="num">{{ number_format($m['income'], 2) }}</td>
                    <td class="num">{{ number_format($m['expense'], 2) }}</td>
                    <td class="num">{{ number_format($m['net'], 2) }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td>TOTAL</td>
                <td class="num">{{ number_format($totals['income'], 2) }}</td>
                <td class="num">{{ number_format($totals['expense'], 2) }}</td>
                <td class="num">{{ number_format($totals['net'], 2) }}</td>
            </tr>
        </tbody>
    </table>
@endsection
