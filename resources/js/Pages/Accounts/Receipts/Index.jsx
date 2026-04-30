import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { formatBDT, formatDate } from '@/utils/formatters';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Receipts({ receipts, invoices }) {
    const [showForm, setShowForm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        invoice_id: '', amount: '', payment_date: new Date().toISOString().substring(0, 10),
        payment_method: 'bank_transfer', reference: '', notes: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('accounts.receipts.store'), { onSuccess: () => { reset(); setShowForm(false); } });
    }

    const selectedInv = (invoices ?? []).find(i => i.id === data.invoice_id);

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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <FormField label="Invoice" error={errors.invoice_id} required>
                                <select className="form-input text-sm" value={data.invoice_id} onChange={e => setData('invoice_id', e.target.value)}>
                                    <option value="">Select Invoice…</option>
                                    {(invoices ?? []).filter(i => i.balance_due > 0).map(i => (
                                        <option key={i.id} value={i.id}>{i.code} — {i.client?.name} (Due: {Number(i.balance_due).toLocaleString('en-IN')}৳</option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Amount (৳)" error={errors.amount} required>
                                <input type="number" className="form-input text-sm" value={data.amount}
                                    max={selectedInv?.balance_due}
                                    onChange={e => setData('amount', e.target.value)} />
                            </FormField>
                            <FormField label="Date" error={errors.payment_date}>
                                <input type="date" className="form-input text-sm" value={data.payment_date} onChange={e => setData('payment_date', e.target.value)} />
                            </FormField>
                            <FormField label="Method" error={errors.payment_method}>
                                <select className="form-input text-sm" value={data.payment_method} onChange={e => setData('payment_method', e.target.value)}>
                                    {['cash','bank_transfer','cheque','mobile_banking'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Reference" error={errors.reference}>
                                <input className="form-input text-sm" value={data.reference} onChange={e => setData('reference', e.target.value)} />
                            </FormField>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" disabled={processing} className="btn btn-primary text-sm">{processing ? '…' : 'Record Receipt'}</button>
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
