import { Head, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { formatBDT, formatDate } from '@/utils/formatters';
import { ShoppingCartIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'cheque', 'bkash', 'nagad', 'rocket', 'other'];

export default function VendorPaymentCreate({
    vendors = [], accountHeads = [], openPurchases = [], projects = [], costHeads = [],
    defaultCostHeadId = null, prefill = null,
}) {
    const prefillPurchase = prefill?.po_id ? openPurchases.find(p => p.id === prefill.po_id) : null;

    const { data, setData, post, processing, errors } = useForm({
        payment_for: prefillPurchase ? 'purchase' : 'direct',
        vendor_id: prefillPurchase?.vendor_id ?? '',
        po_id: prefillPurchase?.id ?? '',
        project_id: '',
        cost_head_id: defaultCostHeadId ?? '',
        amount: prefillPurchase ? String(prefillPurchase.due) : '',
        payment_date: dayjs().format('YYYY-MM-DD'),
        payment_method: 'bank_transfer',
        reference: '',
        account_head_id: '',
        notes: '',
    });

    const vendorPurchases = openPurchases.filter(p => p.vendor_id === data.vendor_id);
    const selectedPurchase = openPurchases.find(p => p.id === data.po_id);

    // A vendor with dues opens on "purchase"; one without (a carpenter) opens on "work".
    useEffect(() => {
        if (!data.vendor_id || prefillPurchase?.vendor_id === data.vendor_id) return;
        setData(d => ({ ...d, payment_for: vendorPurchases.length ? 'purchase' : 'direct', po_id: '' }));
    }, [data.vendor_id]);

    function pickPurchase(id) {
        const po = openPurchases.find(p => p.id === id);
        setData(d => ({ ...d, po_id: id, amount: po ? String(po.due) : d.amount }));
    }

    function submit(e) {
        e.preventDefault();
        post(route('accounts.vendor-payments.store'));
    }

    const isPurchase = data.payment_for === 'purchase';

    return (
        <AppLayout>
            <Head title="Record Vendor Payment" />
            <PageHeader title="Record Vendor Payment" back={route('accounts.vendor-payments.index')} />
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <form onSubmit={submit} className="card p-6 space-y-5">
                    <FormField label="Vendor" error={errors.vendor_id} required>
                        <select className="form-input" value={data.vendor_id} onChange={e => setData('vendor_id', e.target.value)}>
                            <option value="">Select vendor…</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.code})</option>)}
                        </select>
                    </FormField>

                    <div>
                        <p className="form-label">This payment is for <span className="text-red-500">*</span></p>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {[
                                { value: 'direct', icon: WrenchScrewdriverIcon, title: 'Work or service', desc: 'Carpenter, painter, mistri… paid for work on a project' },
                                { value: 'purchase', icon: ShoppingCartIcon, title: 'A purchase', desc: 'Paying what is due on goods already recorded as a purchase' },
                            ].map(opt => {
                                const active = data.payment_for === opt.value;
                                return (
                                    <button type="button" key={opt.value} onClick={() => setData('payment_for', opt.value)}
                                        className={`flex items-start gap-3 text-left rounded-lg border p-3 transition ${active ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <opt.icon className={`w-5 h-5 mt-0.5 shrink-0 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                                        <span>
                                            <span className="block text-sm font-medium text-gray-900">{opt.title}</span>
                                            <span className="block text-xs text-gray-500 mt-0.5">{opt.desc}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {isPurchase ? (
                        <FormField label="Purchase" error={errors.po_id} required
                            hint={selectedPurchase?.project ? `Project: ${selectedPurchase.project} — the purchase already counts in its cost` : undefined}>
                            <select className="form-input" value={data.po_id} onChange={e => pickPurchase(e.target.value)} disabled={!data.vendor_id}>
                                <option value="">{!data.vendor_id ? 'Select a vendor first' : vendorPurchases.length ? 'Select purchase…' : 'This vendor has no unpaid purchases'}</option>
                                {vendorPurchases.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.code} · {formatDate(p.date)}{p.project ? ` · ${p.project}` : ''} · due {formatBDT(p.due)}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Project" error={errors.project_id}
                                hint="The payment is added to this project's cost">
                                <select className="form-input" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                                    <option value="">— No project (office / general) —</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Work type (cost head)" error={errors.cost_head_id} required>
                                <select className="form-input" value={data.cost_head_id} onChange={e => setData('cost_head_id', e.target.value)}>
                                    <option value="">Select…</option>
                                    {costHeads.map(h => <option key={h.id} value={h.id}>{h.code} — {h.name}</option>)}
                                </select>
                            </FormField>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Amount (৳)" error={errors.amount} required>
                            <input type="number" step="0.01" min="0.01" className="form-input" value={data.amount}
                                max={isPurchase && selectedPurchase ? selectedPurchase.due : undefined}
                                onChange={e => setData('amount', e.target.value)} />
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
                        <textarea className="form-input" rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)}
                            placeholder={isPurchase ? '' : 'e.g. Kitchen cabinet work, 2nd installment'} />
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
