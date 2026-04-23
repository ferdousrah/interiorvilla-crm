import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { formatBDT, formatDate } from '@/utils/formatters';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function VendorPayments({ payments, purchaseOrders }) {
    const [showForm, setShowForm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        purchase_order_id: '', amount: '', payment_date: new Date().toISOString().substring(0, 10),
        payment_method: 'bank_transfer', reference: '', notes: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('accounts.vendor-payments.store'), { onSuccess: () => { reset(); setShowForm(false); } });
    }

    return (
        <AppLayout>
            <Head title="Vendor Payments" />
            <PageHeader title="Vendor Payments" subtitle={`${(payments.data ?? payments).length} payments`}>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Record Payment
                </button>
            </PageHeader>
            <div className="p-4 sm:p-6">
                {showForm && (
                    <form onSubmit={submit} className="card p-4 mb-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <FormField label="Purchase Order" error={errors.purchase_order_id} required>
                                <select className="form-input text-sm" value={data.purchase_order_id} onChange={e => setData('purchase_order_id', e.target.value)}>
                                    <option value="">Select PO…</option>
                                    {(purchaseOrders ?? []).map(po => (
                                        <option key={po.id} value={po.id}>{po.code} — {po.vendor?.name} ({formatBDT(po.grand_total)})</option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Amount (৳)" error={errors.amount} required>
                                <input type="number" className="form-input text-sm" value={data.amount} onChange={e => setData('amount', e.target.value)} />
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
                            <button type="submit" disabled={processing} className="btn btn-primary text-sm">{processing ? '…' : 'Record Payment'}</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn text-sm">Cancel</button>
                        </div>
                    </form>
                )}
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Date','PO Code','Vendor','Amount','Method','Reference'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(payments.data ?? payments).map(p => (
                                <tr key={p.id}>
                                    <td className="px-4 py-3 text-sm">{formatDate(p.payment_date)}</td>
                                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{p.purchaseOrder?.code}</td>
                                    <td className="px-4 py-3 text-sm">{p.purchaseOrder?.vendor?.name}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-red-600">{formatBDT(p.amount)}</td>
                                    <td className="px-4 py-3 text-sm capitalize">{p.payment_method?.replace('_', ' ')}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{p.reference ?? '—'}</td>
                                </tr>
                            ))}
                            {(payments.data ?? payments).length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No vendor payments found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
