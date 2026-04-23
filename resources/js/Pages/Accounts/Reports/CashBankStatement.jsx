import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import ReportActions from '@/Components/ReportActions';
import { formatBDT, formatDate } from '@/utils/formatters';
import { useState } from 'react';

export default function CashBankStatement({ transactions = [], accountHeads = [], filters = {}, openingBalance, closingBalance }) {
    const [accountId, setAccountId] = useState(filters?.account_head_id ?? '');
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');

    function applyFilter(e) {
        e.preventDefault();
        router.get(route('accounts.reports.cash-bank'), { account_head_id: accountId, from, to }, { preserveState: true, replace: true });
    }

    return (
        <AppLayout>
            <Head title="Cash & Bank Statement" />
            <PageHeader title="Cash & Bank Statement" back={route('accounts.reports.index')}>
                <ReportActions filters={{ account_head_id: accountId, from, to }} />
            </PageHeader>
            <div className="p-4 sm:p-6">
                <form onSubmit={applyFilter} className="flex gap-3 mb-4 items-end flex-wrap print:hidden">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Account</label>
                        <select className="form-input text-sm" value={accountId} onChange={e => setAccountId(e.target.value)}>
                            <option value="">All Cash/Bank</option>
                            {(accountHeads ?? []).map(h => <option key={h.id} value={h.id}>{h.code} - {h.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">From</label>
                        <input type="date" className="form-input text-sm" value={from} onChange={e => setFrom(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">To</label>
                        <input type="date" className="form-input text-sm" value={to} onChange={e => setTo(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary text-sm">Generate</button>
                </form>

                {(openingBalance !== undefined) && (
                    <div className="flex gap-6 mb-4 text-sm">
                        <div className="bg-gray-50 rounded p-3"><span className="text-gray-500">Opening Balance: </span><strong>{formatBDT(openingBalance)}</strong></div>
                        <div className="bg-primary-50 rounded p-3"><span className="text-gray-500">Closing Balance: </span><strong className="text-primary-700">{formatBDT(closingBalance)}</strong></div>
                    </div>
                )}

                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Date','Description','Reference','Debit (In)','Credit (Out)','Balance'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(transactions ?? []).map((t, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 text-sm">{formatDate(t.date)}</td>
                                    <td className="px-4 py-3 text-sm">{t.description}</td>
                                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{t.reference}</td>
                                    <td className="px-4 py-3 text-sm text-green-700">{t.debit > 0 ? formatBDT(t.debit) : '—'}</td>
                                    <td className="px-4 py-3 text-sm text-red-600">{t.credit > 0 ? formatBDT(t.credit) : '—'}</td>
                                    <td className="px-4 py-3 text-sm font-semibold">{formatBDT(t.running_balance)}</td>
                                </tr>
                            ))}
                            {(transactions ?? []).length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No transactions for the selected period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
