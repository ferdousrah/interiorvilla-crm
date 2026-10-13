import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import dayjs from 'dayjs';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import ReportActions from '@/Components/ReportActions';
import { formatBDT } from '@/utils/formatters';

const fmt = d => d.format('YYYY-MM-DD');
const PRESETS = [
    { key: 'this_month', label: 'This month', range: () => [fmt(dayjs().startOf('month')), fmt(dayjs().endOf('month'))] },
    { key: 'last_month', label: 'Last month', range: () => { const m = dayjs().subtract(1, 'month'); return [fmt(m.startOf('month')), fmt(m.endOf('month'))]; } },
    { key: 'this_year', label: 'This year', range: () => [fmt(dayjs().startOf('year')), fmt(dayjs().endOf('year'))] },
    { key: 'overall', label: 'Overall', range: () => ['', ''] },
];

function Section({ title, groups, total, totalLabel, emptyText }) {
    return (
        <div className="card overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{title}</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-24">Entries</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-48">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {groups.length === 0 && (
                        <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-sm">{emptyText}</td></tr>
                    )}
                    {groups.map(g => (
                        <tr key={g.name}>
                            <td className="px-4 py-2.5 text-sm">{g.name}</td>
                            <td className="px-4 py-2.5 text-sm text-right tabular-nums text-gray-600">{g.count}</td>
                            <td className="px-4 py-2.5 text-sm text-right tabular-nums">{formatBDT(g.amount)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                        <td colSpan={2} className="px-4 py-3 text-sm">{totalLabel}</td>
                        <td className="px-4 py-3 text-sm text-right tabular-nums">{formatBDT(total)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

export default function ProfitLoss({ filters = {}, periodLabel, incomeGroups = [], expenseGroups = [], totalIncome = 0, totalExpense = 0, netProfit = 0 }) {
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    function go(f, t) {
        setFrom(f); setTo(t);
        const params = {};
        if (f) params.from = f;
        if (t) params.to = t;
        router.get(route('accounts.reports.profit-loss'), params, { preserveState: true, replace: true });
    }

    const activePreset = PRESETS.find(p => { const [f, t] = p.range(); return f === (filters.from ?? '') && t === (filters.to ?? ''); })?.key;
    const isProfit = netProfit >= 0;
    const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : null;

    return (
        <AppLayout>
            <Head title="Profit & Loss" />
            <PageHeader title="Profit & Loss" subtitle={`${periodLabel} · cash basis`} back={route('accounts.reports.index')}>
                <ReportActions filters={filters} />
            </PageHeader>
            <div className="p-4 sm:p-6 space-y-4 max-w-4xl">
                <div className="flex flex-wrap items-end gap-3 print:hidden">
                    <div className="flex flex-wrap gap-2">
                        {PRESETS.map(p => (
                            <button key={p.key} type="button" onClick={() => go(...p.range())}
                                className={`px-3 py-2 rounded-lg border text-sm ${activePreset === p.key ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={e => { e.preventDefault(); go(from, to); }} className="flex items-end gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">From</label>
                            <input type="date" className="form-input text-sm" value={from} onChange={e => setFrom(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">To</label>
                            <input type="date" className="form-input text-sm" value={to} onChange={e => setTo(e.target.value)} />
                        </div>
                        <button type="submit" className="btn btn-secondary text-sm">Apply</button>
                    </form>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="card p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Total income</p>
                        <p className="text-2xl font-bold mt-1 tabular-nums text-gray-900">{formatBDT(totalIncome)}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Total expense</p>
                        <p className="text-2xl font-bold mt-1 tabular-nums text-gray-900">{formatBDT(totalExpense)}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">{isProfit ? 'Net profit' : 'Net loss'}</p>
                        <p className={`text-2xl font-bold mt-1 tabular-nums ${isProfit ? 'text-emerald-700' : 'text-red-600'}`}>{formatBDT(Math.abs(netProfit))}</p>
                        {margin !== null && <p className="text-xs text-gray-500 mt-1">{margin.toFixed(1)}% of income</p>}
                    </div>
                </div>

                <Section title="Income" groups={incomeGroups} total={totalIncome} totalLabel="Total income" emptyText="No income in this period." />
                <Section title="Expense" groups={expenseGroups} total={totalExpense} totalLabel="Total expense" emptyText="No expense in this period." />

                <div className="card p-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{isProfit ? 'Net profit' : 'Net loss'} <span className="font-normal text-gray-500">(income − expense)</span></span>
                    <span className={`text-xl font-bold tabular-nums ${isProfit ? 'text-emerald-700' : 'text-red-600'}`}>{formatBDT(Math.abs(netProfit))}</span>
                </div>
            </div>
        </AppLayout>
    );
}
