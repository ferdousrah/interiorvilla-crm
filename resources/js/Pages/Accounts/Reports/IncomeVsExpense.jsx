import { Head, Link, router } from '@inertiajs/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import ReportActions from '@/Components/ReportActions';
import { formatBDT } from '@/utils/formatters';

// Validated as a colourblind-safe pair on a white surface.
const INCOME = '#059669';
const EXPENSE = '#e2571b';

/** 12,50,000 → "12.5L", 45,000 → "45K" — keeps the axis readable. */
function compact(n) {
    const abs = Math.abs(n);
    if (abs >= 1e7) return `${(n / 1e7).toFixed(1).replace(/\.0$/, '')}Cr`;
    if (abs >= 1e5) return `${(n / 1e5).toFixed(1).replace(/\.0$/, '')}L`;
    if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return String(n);
}

function ChartTooltip({ active, payload, label, year }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
            <p className="font-semibold text-gray-900 mb-1">{label} {year}</p>
            {payload.map(p => (
                <p key={p.dataKey} className="flex items-center gap-2 text-gray-700">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
                    {p.name}: <span className="font-semibold tabular-nums text-gray-900">{formatBDT(p.value)}</span>
                </p>
            ))}
            <p className="mt-1 pt-1 border-t border-gray-100 text-gray-700">
                Net: <span className="font-semibold tabular-nums text-gray-900">{formatBDT(row.net)}</span>
            </p>
        </div>
    );
}

export default function IncomeVsExpense({ year, years = [], months = [], totals = {} }) {
    const hasData = months.some(m => m.income > 0 || m.expense > 0);

    return (
        <AppLayout>
            <Head title={`Income vs Expense — ${year}`} />
            <PageHeader title="Income vs Expense" subtitle={`${year} · cash basis`} back={route('accounts.reports.index')}>
                <ReportActions filters={{ year }} />
            </PageHeader>
            <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-end gap-3 print:hidden">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Year</label>
                        <select className="form-input text-sm" value={year}
                            onChange={e => router.get(route('accounts.reports.income-vs-expense'), { year: e.target.value }, { preserveState: true, replace: true })}>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="card p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Income {year}</p>
                        <p className="text-2xl font-bold mt-1 tabular-nums text-gray-900">{formatBDT(totals.income)}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Expense {year}</p>
                        <p className="text-2xl font-bold mt-1 tabular-nums text-gray-900">{formatBDT(totals.expense)}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">{totals.net >= 0 ? 'Net profit' : 'Net loss'} {year}</p>
                        <p className={`text-2xl font-bold mt-1 tabular-nums ${totals.net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatBDT(Math.abs(totals.net))}</p>
                    </div>
                </div>

                <div className="card p-4 print:hidden">
                    {hasData ? (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={months} barGap={2} barCategoryGap="22%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="#f1f1ef" />
                                    <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#e5e7eb' }} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={48} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip content={<ChartTooltip year={year} />} cursor={{ fill: '#f9fafb' }} />
                                    <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, color: '#374151' }}
                                        formatter={value => <span style={{ color: '#374151' }}>{value}</span>} />
                                    <Bar dataKey="income" name="Income" fill={INCOME} radius={[4, 4, 0, 0]} maxBarSize={22} />
                                    <Bar dataKey="expense" name="Expense" fill={EXPENSE} radius={[4, 4, 0, 0]} maxBarSize={22} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="py-16 text-center text-sm text-gray-400">No income or expense recorded in {year}.</p>
                    )}
                </div>

                <div className="card overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expense</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                                <th className="px-4 py-3 print:hidden"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {months.map(m => (
                                <tr key={m.key} className="hover:bg-gray-50">
                                    <td className="px-4 py-2.5 text-sm font-medium">{m.label} {year}</td>
                                    <td className="px-4 py-2.5 text-sm text-right tabular-nums">{m.income ? formatBDT(m.income) : '—'}</td>
                                    <td className="px-4 py-2.5 text-sm text-right tabular-nums">{m.expense ? formatBDT(m.expense) : '—'}</td>
                                    <td className={`px-4 py-2.5 text-sm text-right tabular-nums font-semibold ${m.net < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                        {m.income || m.expense ? formatBDT(m.net) : '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap print:hidden">
                                        <Link href={route('accounts.reports.monthly-income', { month: m.key })} className="text-primary-600 hover:underline">Income</Link>
                                        <span className="text-gray-300 mx-1.5">·</span>
                                        <Link href={route('accounts.reports.monthly-expense', { month: m.key })} className="text-primary-600 hover:underline">Expense</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-semibold">
                            <tr>
                                <td className="px-4 py-3 text-sm">Total</td>
                                <td className="px-4 py-3 text-sm text-right tabular-nums">{formatBDT(totals.income)}</td>
                                <td className="px-4 py-3 text-sm text-right tabular-nums">{formatBDT(totals.expense)}</td>
                                <td className={`px-4 py-3 text-sm text-right tabular-nums ${totals.net < 0 ? 'text-red-600' : ''}`}>{formatBDT(totals.net)}</td>
                                <td className="print:hidden"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
