import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import ReportActions from '@/Components/ReportActions';
import { formatBDT, formatDate } from '@/utils/formatters';

/** Monthly Income and Monthly Expense share this page; `kind` picks the wording. */
export default function MonthlyBreakdown({ kind, month, monthLabel, groups = [], rows = [], total = 0, prevTotal = 0, prevLabel }) {
    const isIncome = kind === 'income';
    const title = isIncome ? 'Monthly Income' : 'Monthly Expense';
    const routeName = isIncome ? 'accounts.reports.monthly-income' : 'accounts.reports.monthly-expense';
    const amountClass = isIncome ? 'text-emerald-700' : 'text-red-600';

    function pickMonth(value) {
        if (value) router.get(route(routeName), { month: value }, { preserveState: true, replace: true });
    }

    const change = total - prevTotal;
    const changePct = prevTotal > 0 ? (change / prevTotal) * 100 : null;

    return (
        <AppLayout>
            <Head title={`${title} — ${monthLabel}`} />
            <PageHeader title={title} subtitle={`${monthLabel} · cash basis`} back={route('accounts.reports.index')}>
                <ReportActions filters={{ month }} />
            </PageHeader>
            <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-end gap-3 print:hidden">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Month</label>
                        <input type="month" className="form-input text-sm" value={month} onChange={e => pickMonth(e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="card p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Total {isIncome ? 'income' : 'expense'}</p>
                        <p className={`text-2xl font-bold mt-1 tabular-nums ${amountClass}`}>{formatBDT(total)}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">{prevLabel}</p>
                        <p className="text-2xl font-bold mt-1 tabular-nums text-gray-900">{formatBDT(prevTotal)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {change === 0 ? `${monthLabel} is the same` : `${monthLabel} is ${change > 0 ? 'up' : 'down'} ${formatBDT(Math.abs(change))}`}
                            {changePct !== null && change !== 0 ? ` (${Math.abs(changePct).toFixed(1)}%)` : ''}
                        </p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Entries</p>
                        <p className="text-2xl font-bold mt-1 tabular-nums text-gray-900">{rows.length}</p>
                    </div>
                </div>

                <div className="card overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{isIncome ? 'Income source' : 'Category'}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Entries</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/3">Share</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {groups.length === 0 && (
                                <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-sm">Nothing recorded in {monthLabel}.</td></tr>
                            )}
                            {groups.map(g => {
                                const share = total > 0 ? (g.amount / total) * 100 : 0;
                                return (
                                    <tr key={g.name}>
                                        <td className="px-4 py-3 text-sm font-medium">{g.name}</td>
                                        <td className="px-4 py-3 text-sm text-right tabular-nums text-gray-600">{g.count}</td>
                                        <td className="px-4 py-3 text-sm text-right tabular-nums font-semibold">{formatBDT(g.amount)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${isIncome ? 'bg-emerald-600' : 'bg-red-500'}`} style={{ width: `${share}%` }} />
                                                </div>
                                                <span className="text-xs text-gray-600 tabular-nums w-12 text-right">{share.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {groups.length > 0 && (
                            <tfoot className="bg-gray-50 font-semibold">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 text-sm">Total</td>
                                    <td className="px-4 py-3 text-sm text-right tabular-nums">{formatBDT(total)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {rows.length > 0 && (
                    <div className="card overflow-x-auto">
                        <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-900">All entries</div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>{['Date', 'Code', isIncome ? 'Client' : 'Project', 'Details', isIncome ? 'Source' : 'Category'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                ))}
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map(r => (
                                    <tr key={r.code}>
                                        <td className="px-4 py-2.5 text-sm whitespace-nowrap">{formatDate(r.date)}</td>
                                        <td className="px-4 py-2.5 text-xs font-mono text-primary-700">{r.code}</td>
                                        <td className="px-4 py-2.5 text-sm">{r.party}</td>
                                        <td className="px-4 py-2.5 text-sm text-gray-600">{r.description}</td>
                                        <td className="px-4 py-2.5 text-sm text-gray-600">{r.group}</td>
                                        <td className="px-4 py-2.5 text-sm text-right tabular-nums font-medium">{formatBDT(r.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
