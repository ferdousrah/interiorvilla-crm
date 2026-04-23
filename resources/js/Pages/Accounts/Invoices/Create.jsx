import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function InvoiceCreate({ clients, leads = [], projects, incomeSources = [], prefill = {} }) {
    const initialSource = prefill.project_id
        ? 'Project'
        : (prefill.lead_id ? 'Visit Charge' : (incomeSources[0] ?? 'Project'));

    const { data, setData, post, processing, errors } = useForm({
        client_id:  prefill.client_id  ?? '',
        lead_id:    prefill.lead_id    ?? '',
        project_id: prefill.project_id ?? '',
        income_source: initialSource,
        invoice_date: new Date().toISOString().substring(0, 10),
        due_date: '', notes: '', terms: '', status: 'draft',
        vat_pct: '0', discount_amount: '0',
        items: [{ description: '', quantity: '1', unit_rate: '' }],
    });

    function onProjectChange(v) {
        setData('project_id', v);
        if (v) setData('income_source', 'Project');
    }
    function onLeadChange(v) {
        setData('lead_id', v);
        if (v && !data.project_id) setData('income_source', 'Visit Charge');
    }

    function addItem() {
        setData('items', [...data.items, { description: '', quantity: '1', unit_rate: '' }]);
    }
    function removeItem(i) {
        setData('items', data.items.filter((_, idx) => idx !== i));
    }
    function updateItem(i, field, value) {
        const items = [...data.items];
        items[i] = { ...items[i], [field]: value };
        setData('items', items);
    }

    const subtotal = data.items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_rate) || 0), 0);
    const vatAmount = subtotal * (parseFloat(data.vat_pct || 0) / 100);
    const grandTotal = subtotal + vatAmount - parseFloat(data.discount_amount || 0);

    function submit(e) {
        e.preventDefault();
        post(route('accounts.invoices.store'));
    }

    return (
        <AppLayout>
            <Head title="New Invoice" />
            <PageHeader title="New Invoice" back={route('accounts.invoices.index')} />
            <div className="p-4 sm:p-6 max-w-4xl">
                <form onSubmit={submit} className="space-y-4">
                    <div className="card p-6">
                        <p className="text-xs text-gray-500 mb-4">
                            Attach the invoice to a <strong>Client</strong> (normal case) <em>or</em> a <strong>Lead</strong>
                            (for visit charges, 3D-only fees, or other small paid services before the lead becomes a client).
                            At least one is required.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField label="Client" error={errors.client_id}>
                                <select className="form-input" value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                                    <option value="">— none —</option>
                                    {(clients ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Lead (prospect)" error={errors.lead_id} hint={data.client_id ? 'Optional extra context' : 'Required if no client selected'}>
                                <select className="form-input" value={data.lead_id} onChange={e => onLeadChange(e.target.value)}>
                                    <option value="">— none —</option>
                                    {leads.map(l => <option key={l.id} value={l.id}>{l.name}{l.phone ? ` — ${l.phone}` : ''}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Project" error={errors.project_id}>
                                <select className="form-input" value={data.project_id} onChange={e => onProjectChange(e.target.value)}>
                                    <option value="">— none —</option>
                                    {(projects ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Invoice Date" error={errors.invoice_date} required>
                                <input type="date" className="form-input" value={data.invoice_date} onChange={e => setData('invoice_date', e.target.value)} />
                            </FormField>
                            <FormField label="Due Date" error={errors.due_date} required>
                                <input type="date" className="form-input" value={data.due_date} onChange={e => setData('due_date', e.target.value)} />
                            </FormField>
                        </div>

                        {/* Income source — drives revenue-by-source reports */}
                        <div className="mt-5 pt-4 border-t border-gray-100">
                            <FormField label="Income Source" required error={errors.income_source} hint="Revenue bucket this invoice should appear in">
                                <div className="flex gap-2 flex-wrap">
                                    {incomeSources.map(src => {
                                        const active = data.income_source === src;
                                        return (
                                            <button key={src} type="button"
                                                onClick={() => setData('income_source', src)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'}`}>
                                                {src}
                                            </button>
                                        );
                                    })}
                                </div>
                            </FormField>
                        </div>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-sm">Line Items</h3>
                            <button type="button" onClick={addItem} className="btn text-xs flex items-center gap-1">
                                <PlusIcon className="w-3 h-3" /> Add Line
                            </button>
                        </div>
                        <table className="min-w-full text-sm">
                            <thead><tr className="text-xs text-gray-500">
                                <th className="text-left pb-2">Description</th>
                                <th className="text-left pb-2 w-24">Qty</th>
                                <th className="text-left pb-2 w-28">Unit Rate</th>
                                <th className="text-right pb-2 w-28">Total</th>
                                <th className="w-8"></th>
                            </tr></thead>
                            <tbody>
                                {data.items.map((item, i) => {
                                    const total = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_rate) || 0);
                                    return (
                                        <tr key={i}>
                                            <td className="pr-2 pb-2"><input className="form-input text-sm" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} /></td>
                                            <td className="pr-2 pb-2"><input type="number" className="form-input text-sm" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} /></td>
                                            <td className="pr-2 pb-2"><input type="number" className="form-input text-sm" value={item.unit_rate} onChange={e => updateItem(i, 'unit_rate', e.target.value)} /></td>
                                            <td className="pb-2 text-right text-gray-600">{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            <td className="pb-2">{data.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="mt-4 text-right text-sm space-y-1 border-t pt-3">
                            <div className="flex justify-end gap-8">
                                <span className="text-gray-500">Subtotal</span>
                                <span>{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-end gap-4 items-center">
                                <span className="text-gray-500">VAT %</span>
                                <input type="number" className="form-input text-sm w-28 text-right" value={data.vat_pct} onChange={e => setData('vat_pct', e.target.value)} />
                                <span className="w-28 text-right text-gray-700">+ {vatAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-end gap-4 items-center">
                                <span className="text-gray-500">Discount</span>
                                <input type="number" className="form-input text-sm w-28 text-right" value={data.discount_amount} onChange={e => setData('discount_amount', e.target.value)} />
                                <span className="w-28" />
                            </div>
                            <div className="flex justify-end gap-8 font-bold text-primary-700 pt-2 border-t">
                                <span>Grand Total</span>
                                <span>BDT {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    <FormField label="Notes" error={errors.notes}>
                        <textarea className="form-input" rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)} />
                    </FormField>
                    <div className="flex gap-3">
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Creating…' : 'Create Invoice'}</button>
                        <a href={route('accounts.invoices.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
