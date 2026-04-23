import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { formatBDT } from '@/utils/formatters';

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'cheque', 'bkash', 'nagad', 'rocket', 'other'];

export default function ReceiptCreate({ clients, accountHeads, incomeSources = [] }) {
    const [clientInvoices, setClientInvoices] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        client_id: '',
        invoice_id: '',
        project_id: '',
        amount: '',
        income_source: '',
        receipt_date: new Date().toISOString().substring(0, 10),
        payment_method: 'bank_transfer',
        reference: '',
        account_head_id: '',
        notes: '',
    });

    async function onClientChange(clientId) {
        setData('client_id', clientId);
        if (clientId) {
            // Fetch unpaid invoices for this client via a quick GET
            const res = await fetch(`/accounts/invoices?client_id=${clientId}&status=partially_paid,sent&per_page=100`);
        }
    }

    function submit(e) {
        e.preventDefault();
        post(route('accounts.receipts.store'));
    }

    return (
        <AppLayout>
            <Head title="Record Receipt" />
            <PageHeader title="Record Client Receipt" back={route('accounts.receipts.index')} />
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Client" error={errors.client_id} required>
                            <select className="form-input" value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                                <option value="">Select client…</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                            </select>
                        </FormField>

                        <FormField label="Amount (৳)" error={errors.amount} required>
                            <input type="number" step="0.01" min="0.01" className="form-input" value={data.amount} onChange={e => setData('amount', e.target.value)} />
                        </FormField>

                        <FormField label="Income Source" error={errors.income_source}>
                            <select className="form-input" value={data.income_source} onChange={e => setData('income_source', e.target.value)}>
                                <option value="">— Select —</option>
                                {incomeSources.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </FormField>

                        <FormField label="Receipt Date" error={errors.receipt_date} required>
                            <input type="date" className="form-input" value={data.receipt_date} onChange={e => setData('receipt_date', e.target.value)} />
                        </FormField>

                        <FormField label="Payment Method" error={errors.payment_method} required>
                            <select className="form-input" value={data.payment_method} onChange={e => setData('payment_method', e.target.value)}>
                                {PAYMENT_METHODS.map(m => <option key={m} value={m} className="capitalize">{m.replace(/_/g, ' ')}</option>)}
                            </select>
                        </FormField>

                        <FormField label="Received Into (Account)" error={errors.account_head_id} required>
                            <select className="form-input" value={data.account_head_id} onChange={e => setData('account_head_id', e.target.value)}>
                                <option value="">Select account…</option>
                                {accountHeads.map(h => <option key={h.id} value={h.id}>{h.code} — {h.name}</option>)}
                            </select>
                        </FormField>

                        <FormField label="Reference (Cheque/TxID)" error={errors.reference}>
                            <input className="form-input" value={data.reference} onChange={e => setData('reference', e.target.value)} placeholder="Optional" />
                        </FormField>
                    </div>

                    <FormField label="Notes" error={errors.notes}>
                        <textarea className="form-input" rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)} />
                    </FormField>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Recording…' : 'Record Receipt'}
                        </button>
                        <a href={route('accounts.receipts.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
