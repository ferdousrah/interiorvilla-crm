import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import { formatBDT, formatDate } from '@/utils/formatters';
import {
    BanknotesIcon, CreditCardIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
    WalletIcon, BuildingLibraryIcon, DocumentTextIcon, ExclamationTriangleIcon,
    ArrowUpRightIcon, ArrowDownRightIcon,
} from '@heroicons/react/24/outline';

const SOURCE_COLORS = {
    'Visit Charge': 'bg-amber-500',
    '3D Design':    'bg-violet-500',
    'Project':      'bg-emerald-500',
    'Unclassified': 'bg-gray-400',
};

const WINDOW_LABEL = {
    this_month: 'This Month',
    this_year:  'This Year',
    all_time:   'All Time',
};

const INVOICE_STATUS_STYLE = {
    draft:          'bg-gray-100 text-gray-700',
    sent:           'bg-blue-100 text-blue-700',
    partially_paid: 'bg-amber-100 text-amber-800',
    paid:           'bg-emerald-100 text-emerald-700',
    overdue:        'bg-red-100 text-red-700',
    cancelled:      'bg-gray-100 text-gray-500',
};

function KpiCard({ label, value, subtitle, icon: Icon, color, href, delta }) {
    const tones = {
        blue:    { bg: 'bg-blue-50',    ring: 'ring-blue-100',    icon: 'bg-blue-100 text-blue-600',       accent: 'text-blue-700' },
        red:     { bg: 'bg-red-50',     ring: 'ring-red-100',     icon: 'bg-red-100 text-red-600',         accent: 'text-red-700' },
        emerald: { bg: 'bg-emerald-50', ring: 'ring-emerald-100', icon: 'bg-emerald-100 text-emerald-600', accent: 'text-emerald-700' },
        amber:   { bg: 'bg-amber-50',   ring: 'ring-amber-100',   icon: 'bg-amber-100 text-amber-700',     accent: 'text-amber-800' },
        violet:  { bg: 'bg-violet-50',  ring: 'ring-violet-100',  icon: 'bg-violet-100 text-violet-600',   accent: 'text-violet-700' },
        slate:   { bg: 'bg-slate-50',   ring: 'ring-slate-100',   icon: 'bg-slate-100 text-slate-600',     accent: 'text-slate-700' },
    };
    const t = tones[color] ?? tones.slate;
    const Wrap = href ? Link : 'div';
    const extra = href ? { href } : {};

    return (
        <Wrap {...extra}
            className={`block card p-5 ring-1 ${t.ring} hover:shadow-md transition-all ${href ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                    <p className={`text-2xl font-bold mt-1 ${t.accent} truncate`}>{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                    {delta !== null && delta !== undefined && (
                        <div className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-2 px-2 py-0.5 rounded-full ${delta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {delta >= 0 ? <ArrowUpRightIcon className="w-3 h-3" /> : <ArrowDownRightIcon className="w-3 h-3" />}
                            {delta >= 0 ? '+' : ''}{delta}% vs last month
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${t.icon}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
        </Wrap>
    );
}

export default function AccountsDashboard({ stats = {}, recentInvoices = [], overdueInvoices = [], revenueBySource = {} }) {
    const [window, setWindow] = useState('this_month');
    const windowData = revenueBySource[window] ?? { total: 0, buckets: [] };

    const netProfit = Number(stats.net_profit_month ?? 0);
    const netProfitPositive = netProfit >= 0;

    return (
        <AppLayout>
            <Head title="Accounts Dashboard" />
            <PageHeader title="Accounts" subtitle="Financial overview" />

            <div className="p-4 sm:p-6 space-y-6">

                {/* Primary KPIs — clickable */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label="Total Receivables"
                        value={formatBDT(stats.total_receivables)}
                        subtitle={`${stats.open_invoice_count ?? 0} open invoice${stats.open_invoice_count === 1 ? '' : 's'}`}
                        icon={DocumentTextIcon}
                        color="blue"
                        href={route('accounts.invoices.index')} />
                    <KpiCard
                        label="Total Payables"
                        value={formatBDT(stats.total_payables)}
                        subtitle="Vendor bills outstanding"
                        icon={CreditCardIcon}
                        color="red"
                        href={route('accounts.vendor-payments.index')} />
                    <KpiCard
                        label="Revenue · This Month"
                        value={formatBDT(stats.revenue_month)}
                        subtitle="Client receipts"
                        icon={ArrowTrendingUpIcon}
                        color="emerald"
                        href={route('accounts.receipts.index')}
                        delta={stats.revenue_delta_pct} />
                    <KpiCard
                        label="Expenses · This Month"
                        value={formatBDT(stats.expenses_month)}
                        subtitle="Operating costs"
                        icon={ArrowTrendingDownIcon}
                        color="amber"
                        href={route('accounts.expenses.index')}
                        delta={stats.expenses_delta_pct} />
                </div>

                {/* Secondary — balances & profit */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <KpiCard
                        label="Cash & Wallets"
                        value={formatBDT(stats.cash_balance)}
                        icon={WalletIcon}
                        color="slate"
                        subtitle="Cash + Petty Cash + Wallets" />
                    <KpiCard
                        label="Bank Balance"
                        value={formatBDT(stats.bank_balance)}
                        icon={BuildingLibraryIcon}
                        color="violet" />
                    <KpiCard
                        label="Net Profit · This Month"
                        value={`${netProfitPositive ? '' : '-'}${formatBDT(Math.abs(netProfit))}`}
                        subtitle={netProfitPositive ? 'Revenue > Expenses' : 'Expenses > Revenue'}
                        icon={BanknotesIcon}
                        color={netProfitPositive ? 'emerald' : 'red'} />
                </div>

                {/* Overdue warning banner */}
                {stats.overdue_count > 0 && (
                    <Link href={route('accounts.invoices.index', { status: 'overdue' })}
                        className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800">
                                {stats.overdue_count} invoice{stats.overdue_count === 1 ? '' : 's'} overdue
                            </p>
                            <p className="text-xs text-red-600">Click to review and follow up</p>
                        </div>
                        <ArrowUpRightIcon className="w-4 h-4 text-red-600" />
                    </Link>
                )}

                {/* Revenue by Source */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                        <div>
                            <h3 className="font-semibold text-sm text-gray-800">Revenue by Source</h3>
                            <p className="text-xs text-gray-500">Received amount broken down by service type</p>
                        </div>
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                            {Object.entries(WINDOW_LABEL).map(([k, label]) => (
                                <button key={k} onClick={() => setWindow(k)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${window === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {windowData.total === 0 ? (
                        <p className="text-xs text-gray-400 italic py-6 text-center">No receipts in this period.</p>
                    ) : (
                        <>
                            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 mb-4">
                                {windowData.buckets.filter(b => b.total > 0).map(b => {
                                    const pct = (b.total / windowData.total) * 100;
                                    return <div key={b.source} className={SOURCE_COLORS[b.source] ?? 'bg-gray-400'}
                                        style={{ width: `${pct}%` }}
                                        title={`${b.source}: ${formatBDT(b.total)} (${pct.toFixed(1)}%)`} />;
                                })}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {windowData.buckets.map(b => {
                                    const pct = windowData.total > 0 ? (b.total / windowData.total) * 100 : 0;
                                    return (
                                        <div key={b.source} className="border border-gray-100 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`w-2.5 h-2.5 rounded-full ${SOURCE_COLORS[b.source] ?? 'bg-gray-400'}`} />
                                                <span className="text-xs font-medium text-gray-700">{b.source}</span>
                                            </div>
                                            <p className="text-lg font-bold text-gray-900">{formatBDT(b.total)}</p>
                                            <p className="text-[11px] text-gray-500">
                                                {pct.toFixed(1)}% · {b.receipts} receipt{b.receipts !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
                                <span className="font-semibold text-gray-700">Total received ({WINDOW_LABEL[window]})</span>
                                <span className="font-bold text-primary-700">{formatBDT(windowData.total)}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Recent + Overdue invoices */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-sm">Recent Invoices</h3>
                            <Link href={route('accounts.invoices.index')} className="text-xs text-primary-600 hover:underline">View all →</Link>
                        </div>
                        <table className="min-w-full text-sm">
                            <tbody className="divide-y divide-gray-100">
                                {recentInvoices.length === 0 && (
                                    <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-xs">No invoices yet.</td></tr>
                                )}
                                {recentInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-gray-50">
                                        <td className="py-2.5">
                                            <Link href={route('accounts.invoices.show', inv.id)} className="font-mono text-xs text-primary-600 hover:underline">
                                                {inv.code}
                                            </Link>
                                        </td>
                                        <td className="py-2.5 text-gray-700 text-xs">
                                            {inv.client?.name ?? inv.lead?.name ?? '—'}
                                        </td>
                                        <td className="py-2.5">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${INVOICE_STATUS_STYLE[inv.status] ?? 'bg-gray-100'}`}>
                                                {inv.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-2.5 text-right font-semibold text-gray-800 text-xs">
                                            {formatBDT(inv.grand_total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-sm text-red-600 flex items-center gap-1.5">
                                <ExclamationTriangleIcon className="w-4 h-4" /> Overdue Invoices
                            </h3>
                            <Link href={route('accounts.invoices.index', { status: 'overdue' })} className="text-xs text-primary-600 hover:underline">View all →</Link>
                        </div>
                        <table className="min-w-full text-sm">
                            <tbody className="divide-y divide-gray-100">
                                {overdueInvoices.length === 0 && (
                                    <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-xs">No overdue invoices.</td></tr>
                                )}
                                {overdueInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-gray-50">
                                        <td className="py-2.5">
                                            <Link href={route('accounts.invoices.show', inv.id)} className="font-mono text-xs text-primary-600 hover:underline">
                                                {inv.code}
                                            </Link>
                                        </td>
                                        <td className="py-2.5 text-gray-700 text-xs">
                                            {inv.client?.name ?? inv.lead?.name ?? '—'}
                                        </td>
                                        <td className="py-2.5 text-[11px] text-red-500">
                                            Due {formatDate(inv.due_date)}
                                        </td>
                                        <td className="py-2.5 text-right font-semibold text-red-600 text-xs">
                                            {formatBDT(inv.balance_due ?? inv.grand_total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
