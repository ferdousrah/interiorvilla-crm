import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { formatBDT, formatDate } from '@/utils/formatters';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Receipts({ receipts, invoices = [], depositAccounts = [] }) {
    const [showForm, setShowForm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        invoice_id: '',
        client_id: '',
        amount: '',
        receipt_date: new Date().toISOString().substring(0, 10),
        payment_method: 'cash',
        account_head_id: depositAccounts[0]?.id ?? '',
        reference: '',
        notes: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('accounts.receipts.store'), { onSuccess: () => { reset(); setShowForm(false); } });
    }

    function pickInvoice(invoiceId) {
        const inv = invoices.find(i => i.id === invoiceId);
        setData(d => ({
            ...d,
            invoice_id: invoiceId,
            client_id: inv?.client_id ?? '',
            amount: inv?.balance_due ? String(inv.balance_due) : d.amount,
        }));
    }

    const selectedInv = invoices.find(i => i.id === data.invoice_id);

    return (
        <AppLayout>
            <Head title="Client Receipts" />
            <PageHeader title="Client Receipts" subtitle={`${(receipts.data ?? receipts).length} receipts`}>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Record Receipt
                </button>
            </PageHeader>
            <div className="p-4 sm:p-6">
                {showForm && (
                    <form onSubmit={submit} className="card p-4 mb-4 space-y-3">
                        {invoices.length === 0 && (
                            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                                No open invoices found. Create an invoice first, or check if all your invoices are already paid.
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <FormField label="Invoice" error={errors.invoice_id} required>
                                <select className="form-input text-sm" value={data.invoice_id} onChange={e => pickInvoice(e.target.value)}>
                                    <option value="">Select Invoice…</option>
                                    {invoices.map(i => (
                                        <option key={i.id} value={i.id}>
                                            {i.code} — {i.client?.name ?? '—'} (Due: {Number(i.balance_due).toLocaleString('en-IN')}৳)
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Amount (৳)" error={errors.amount} required>
                                <input type="number" step="0.01" className="form-input text-sm" value={data.amount}
                                    max={selectedInv?.balance_due}
                                    onChange={e => setData('amount', e.target.value)} />
                                {selectedInv && (
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        Balance due: {selectedInv.balance_due.toLocaleString('en-IN')}৳
                                    </p>
                                )}
                            </FormField>
                            <FormField label="Receipt Date" error={errors.receipt_date} required>
                                <input type="date" className="form-input text-sm" value={data.receipt_date} onChange={e => setData('receipt_date', e.target.value)} />
                            </FormField>
                            <FormField label="Payment Method" error={errors.payment_method} required>
                                <select className="form-input text-sm" value={data.payment_method} onChange={e => setData('payment_method', e.target.value)}>
                                    {['cash','bank_transfer','cheque','bkash','nagad','rocket','other'].map(m => (
                                        <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Deposit Account" error={errors.account_head_id} required>
                                <select className="form-input text-sm" value={data.account_head_id} onChange={e => setData('account_head_id', e.target.value)}>
                                    <option value="">Select account…</option>
                                    {depositAccounts.map(a => (
                                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-gray-500 mt-1">Where the money was received (Cash, Bank, bKash, etc.)</p>
                            </FormField>
                            <FormField label="Reference" error={errors.reference}>
                                <input className="form-input text-sm" value={data.reference} onChange={e => setData('reference', e.target.value)} placeholder="bKash Txn ID, cheque no., etc." />
                            </FormField>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" disabled={processing || invoices.length === 0} className="btn btn-primary text-sm">
                                {processing ? '…' : 'Record Receipt'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn text-sm">Cancel</button>
                        </div>
                    </form>
                )}
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Date','Code','Invoice','Client','Amount','Method','Deposit Account','Reference'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(receipts.data ?? receipts).map(r => {
                                const acct = r.account_head ?? r.accountHead;
                                return (
                                    <tr key={r.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(r.receipt_date)}</td>
                                        <td className="px-4 py-3 text-xs font-mono text-primary-700">{r.code}</td>
                                        <td className="px-4 py-3 text-sm font-mono text-primary-600">{r.invoice?.code ?? '—'}</td>
                                        <td className="px-4 py-3 text-sm">{r.invoice?.client?.name ?? r.client?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-green-700 tabular-nums">{formatBDT(r.amount)}</td>
                                        <td className="px-4 py-3 text-sm capitalize">{r.payment_method?.replace('_', ' ')}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {acct ? (
                                                <div>
                                                    <span className="font-mono text-xs text-gray-500">{acct.code}</span>
                                                    <span className="ml-1.5 font-medium text-gray-800">{acct.name}</span>
                                                </div>
                                            ) : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{r.reference ?? '—'}</td>
                                    </tr>
                                );
                            })}
                            {(receipts.data ?? receipts).length === 0 && (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No receipts found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
