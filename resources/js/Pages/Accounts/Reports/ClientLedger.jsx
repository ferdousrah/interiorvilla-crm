import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import ReportActions from '@/Components/ReportActions';
import { formatBDT, formatDate } from '@/utils/formatters';
import Badge from '@/Components/Badge';
import { useState } from 'react';

export default function ClientLedger({ client, transactions = [], clients = [], filters = {} }) {
    const [clientId, setClientId] = useState(filters?.client_id ?? '');
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');

    function applyFilter(e) {
        e.preventDefault();
        router.get(route('accounts.reports.client-ledger'), { client_id: clientId, from, to }, { preserveState: true, replace: true });
    }

    const totalInvoiced = transactions.filter(t => t.type === 'invoice').reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalPaid     = transactions.filter(t => t.type === 'receipt').reduce((s, t) => s + parseFloat(t.amount), 0);

    return (
        <AppLayout>
            <Head title="Client Ledger" />
            <PageHeader title="Client Ledger" back={route('accounts.reports.index')}>
                <ReportActions filters={{ client_id: clientId, from, to }} />
            </PageHeader>
            <div className="p-4 sm:p-6">
                <form onSubmit={applyFilter} className="flex gap-3 mb-4 items-end flex-wrap print:hidden">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Client</label>
                        <select className="form-input text-sm" value={clientId} onChange={e => setClientId(e.target.value)}>
                            <option value="">Select Client…</option>
                            {(clients ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

                {client && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
                        <strong>{client.name}</strong> · {client.phone}
                        <span className="ml-4">Total Invoiced: <strong>{formatBDT(totalInvoiced)}</strong></span>
                        <span className="ml-4">Total Paid: <strong className="text-green-700">{formatBDT(totalPaid)}</strong></span>
                        <span className="ml-4">Balance: <strong className="text-red-600">{formatBDT(totalInvoiced - totalPaid)}</strong></span>
                    </div>
                )}

                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Date','Type','Reference','Description','Debit','Credit','Balance'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map((t, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 text-sm">{formatDate(t.date)}</td>
                                    <td className="px-4 py-3"><Badge variant={t.type === 'invoice' ? 'warning' : 'success'}>{t.type}</Badge></td>
                                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{t.reference}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{t.description}</td>
                                    <td className="px-4 py-3 text-sm">{t.type === 'invoice' ? formatBDT(t.amount) : '—'}</td>
                                    <td className="px-4 py-3 text-sm text-green-700">{t.type === 'receipt' ? formatBDT(t.amount) : '—'}</td>
                                    <td className="px-4 py-3 text-sm font-semibold">{formatBDT(t.running_balance)}</td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">{client ? 'No transactions in the selected period.' : 'Select a client to view ledger.'}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
