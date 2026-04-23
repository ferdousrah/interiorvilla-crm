@php
    $title = 'PROJECT PROFIT &amp; LOSS';
    $subtitle = $project ? $project->name : 'No project selected';
@endphp

@extends('reports.pdf._layout')

@section('content')
    @if(!$project)
        <p class="empty">Select a project to generate P&amp;L.</p>
    @else
        @php
            $totalRev = collect($revenue)->sum('amount');
            $totalExp = collect($expenses)->sum('amount');
        @endphp

        <div class="section-info">
            <strong>{{ $project->name }}</strong>
            @if($project->code) · <span class="pill">{{ $project->code }}</span>@endif
            @if((float) ($project->contract_value ?? 0) > 0)
                · Contract Value: <strong>BDT {{ number_format($project->contract_value, 2) }}</strong>
            @endif
        </div>

        {{-- REVENUE --}}
        <h3 style="font-size:12px; margin:12px 0 6px; color:#065f46; text-transform:uppercase; letter-spacing:0.5px;">Revenue</h3>
        <table class="data">
            <thead>
                <tr>
                    <th style="width:90px;">Date</th>
                    <th>Description</th>
                    <th class="num" style="width:130px;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @forelse($revenue as $r)
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($r['date'])->format('d M Y') }}</td>
                        <td>{{ $r['description'] }}</td>
                        <td class="num" style="color:#059669;">{{ number_format($r['amount'], 2) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="3" class="empty">No revenue recorded.</td></tr>
                @endforelse
                <tr class="total-row">
                    <td colspan="2">TOTAL REVENUE</td>
                    <td class="num" style="color:#059669;">{{ number_format($totalRev, 2) }}</td>
                </tr>
            </tbody>
        </table>

        {{-- EXPENSES --}}
        <h3 style="font-size:12px; margin:14px 0 6px; color:#991b1b; text-transform:uppercase; letter-spacing:0.5px;">Expenses &amp; Purchases</h3>
        <table class="data">
            <thead>
                <tr>
                    <th style="width:90px;">Date</th>
                    <th>Description</th>
                    <th class="num" style="width:130px;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @forelse($expenses as $e)
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($e['date'])->format('d M Y') }}</td>
                        <td>{{ $e['description'] }}</td>
                        <td class="num" style="color:#dc2626;">{{ number_format($e['amount'], 2) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="3" class="empty">No expenses recorded.</td></tr>
                @endforelse
                <tr class="total-row">
                    <td colspan="2">TOTAL EXPENSES</td>
                    <td class="num" style="color:#dc2626;">{{ number_format($totalExp, 2) }}</td>
                </tr>
            </tbody>
        </table>

        {{-- NET --}}
        <div class="summary-box" style="margin-top:14px; background: {{ $profit >= 0 ? '#d1fae5' : '#fee2e2' }}; border-color: {{ $profit >= 0 ? '#059669' : '#dc2626' }};">
            <span class="kv" style="font-size:13px;">
                NET {{ $profit >= 0 ? 'PROFIT' : 'LOSS' }}:
                <strong style="color: {{ $profit >= 0 ? '#065f46' : '#991b1b' }}; font-size:14px;">
                    BDT {{ number_format(abs($profit), 2) }}
                </strong>
            </span>
        </div>
    @endif
@endsection
