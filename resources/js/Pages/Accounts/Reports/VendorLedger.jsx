import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import ReportActions from '@/Components/ReportActions';
import { formatBDT, formatDate } from '@/utils/formatters';
import Badge from '@/Components/Badge';
import { useState } from 'react';

export default function VendorLedger({ vendor, transactions = [], vendors = [], filters = {} }) {
    const [vendorId, setVendorId] = useState(filters?.vendor_id ?? '');
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');

    function applyFilter(e) {
        e.preventDefault();
        router.get(route('accounts.reports.vendor-ledger'), { vendor_id: vendorId, from, to }, { preserveState: true, replace: true });
    }

    const totalPO   = transactions.filter(t => t.type === 'purchase_order').reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalPaid = transactions.filter(t => t.type === 'payment').reduce((s, t) => s + parseFloat(t.amount), 0);

    return (
        <AppLayout>
            <Head title="Vendor Ledger" />
            <PageHeader title="Vendor Ledger" back={route('accounts.reports.index')}>
                <ReportActions filters={{ vendor_id: vendorId, from, to }} />
            </PageHeader>
            <div className="p-4 sm:p-6">
                <form onSubmit={applyFilter} className="flex gap-3 mb-4 items-end flex-wrap print:hidden">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Vendor</label>
                        <select className="form-input text-sm" value={vendorId} onChange={e => setVendorId(e.target.value)}>
                            <option value="">Select Vendor…</option>
                            {(vendors ?? []).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
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

                {vendor && (
                    <div className="mb-4 p-3 bg-orange-50 rounded-lg text-sm">
                        <strong>{vendor.name}</strong> · {vendor.phone}
                        <span className="ml-4">Total POs: <strong>{formatBDT(totalPO)}</strong></span>
                        <span className="ml-4">Total Paid: <strong className="text-green-700">{formatBDT(totalPaid)}</strong></span>
                        <span className="ml-4">Outstanding: <strong className="text-red-600">{formatBDT(totalPO - totalPaid)}</strong></span>
                    </div>
                )}

                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Date','Type','Reference','Description','Amount','Paid','Balance'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(transactions ?? []).map((t, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 text-sm">{formatDate(t.date)}</td>
                                    <td className="px-4 py-3"><Badge variant={t.type === 'purchase_order' ? 'warning' : 'success'}>{t.type?.replace('_', ' ')}</Badge></td>
                                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{t.reference}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{t.description}</td>
                                    <td className="px-4 py-3 text-sm">{t.type === 'purchase_order' ? formatBDT(t.amount) : '—'}</td>
                                    <td className="px-4 py-3 text-sm text-green-700">{t.type === 'payment' ? formatBDT(t.amount) : '—'}</td>
                                    <td className="px-4 py-3 text-sm font-semibold">{formatBDT(t.running_balance)}</td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">{vendor ? 'No transactions in the selected period.' : 'Select a vendor to view ledger.'}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
