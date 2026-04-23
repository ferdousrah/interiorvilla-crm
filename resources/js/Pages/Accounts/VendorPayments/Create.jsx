import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'cheque', 'bkash', 'nagad', 'rocket', 'other'];

export default function VendorPaymentCreate({ vendors, accountHeads }) {
    const { data, setData, post, processing, errors } = useForm({
        vendor_id: '',
        po_id: '',
        amount: '',
        payment_date: new Date().toISOString().substring(0, 10),
        payment_method: 'bank_transfer',
        reference: '',
        account_head_id: '',
        notes: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('accounts.vendor-payments.store'));
    }

    return (
        <AppLayout>
            <Head title="Record Vendor Payment" />
            <PageHeader title="Record Vendor Payment" back={route('accounts.vendor-payments.index')} />
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Vendor" error={errors.vendor_id} required>
                            <select className="form-input" value={data.vendor_id} onChange={e => setData('vendor_id', e.target.value)}>
                                <option value="">Select vendor…</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.code})</option>)}
                            </select>
                        </FormField>

                        <FormField label="Amount (৳)" error={errors.amount} required>
                            <input type="number" step="0.01" min="0.01" className="form-input" value={data.amount} onChange={e => setData('amount', e.target.value)} />
                        </FormField>

                        <FormField label="Payment Date" error={errors.payment_date} required>
                            <input type="date" className="form-input" value={data.payment_date} onChange={e => setData('payment_date', e.target.value)} />
                        </FormField>

                        <FormField label="Payment Method" error={errors.payment_method} required>
                            <select className="form-input" value={data.payment_method} onChange={e => setData('payment_method', e.target.value)}>
                                {PAYMENT_METHODS.map(m => <option key={m} value={m} className="capitalize">{m.replace(/_/g, ' ')}</option>)}
                            </select>
                        </FormField>

                        <FormField label="Paid From (Account)" error={errors.account_head_id} required>
                            <select className="form-input" value={data.account_head_id} onChange={e => setData('account_head_id', e.target.value)}>
                                <option value="">Select account…</option>
                                {accountHeads.map(h => <option key={h.id} value={h.id}>{h.code} — {h.name}</option>)}
                            </select>
                        </FormField>

                        <FormField label="Reference" error={errors.reference}>
                            <input className="form-input" value={data.reference} onChange={e => setData('reference', e.target.value)} placeholder="Cheque no / TxID" />
                        </FormField>
                    </div>

                    <FormField label="Notes" error={errors.notes}>
                        <textarea className="form-input" rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)} />
                    </FormField>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Recording…' : 'Record Payment'}
                        </button>
                        <a href={route('accounts.vendor-payments.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
