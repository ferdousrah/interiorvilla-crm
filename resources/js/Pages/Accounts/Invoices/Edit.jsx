import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function InvoiceEdit({ invoice, clients, projects }) {
    const { data, setData, put, processing, errors } = useForm({
        client_id: invoice.client_id ?? '',
        project_id: invoice.project_id ?? '',
        invoice_date: invoice.invoice_date?.substring(0, 10) ?? '',
        due_date: invoice.due_date?.substring(0, 10) ?? '',
        notes: invoice.notes ?? '',
        vat_amount: invoice.vat_amount ?? '0',
        discount_amount: invoice.discount_amount ?? '0',
        items: invoice.items?.map(i => ({ id: i.id, description: i.description, quantity: i.quantity, unit_price: i.unit_price })) ?? [],
    });

    function addItem() {
        setData('items', [...data.items, { description: '', quantity: '1', unit_price: '' }]);
    }
    function removeItem(i) {
        setData('items', data.items.filter((_, idx) => idx !== i));
    }
    function updateItem(i, field, value) {
        const items = [...data.items];
        items[i] = { ...items[i], [field]: value };
        setData('items', items);
    }

    const subtotal = data.items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0), 0);
    const grandTotal = subtotal + parseFloat(data.vat_amount || 0) - parseFloat(data.discount_amount || 0);

    function submit(e) {
        e.preventDefault();
        put(route('accounts.invoices.update', invoice.id));
    }

    return (
        <AppLayout>
            <Head title={`Edit ${invoice.code}`} />
            <PageHeader title={`Edit: ${invoice.code}`} back={route('accounts.invoices.show', invoice.id)} />
            <div className="p-4 sm:p-6 max-w-4xl">
                <form onSubmit={submit} className="space-y-4">
                    <div className="card p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField label="Client" error={errors.client_id} required>
                                <select className="form-input" value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                                    <option value="">Select Client…</option>
                                    {(clients ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Project" error={errors.project_id}>
                                <select className="form-input" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                                    <option value="">-- No Project --</option>
                                    {(projects ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </FormField>
                            <div />
                            <FormField label="Invoice Date" error={errors.invoice_date} required>
                                <input type="date" className="form-input" value={data.invoice_date} onChange={e => setData('invoice_date', e.target.value)} />
                            </FormField>
                            <FormField label="Due Date" error={errors.due_date}>
                                <input type="date" className="form-input" value={data.due_date} onChange={e => setData('due_date', e.target.value)} />
                            </FormField>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-sm">Line Items</h3>
                            <button type="button" onClick={addItem} className="btn text-xs flex items-center gap-1"><PlusIcon className="w-3 h-3" /> Add</button>
                        </div>
                        <table className="min-w-full text-sm">
                            <thead><tr className="text-xs text-gray-500">
                                <th className="text-left pb-2">Description</th>
                                <th className="pb-2 w-24">Qty</th>
                                <th className="pb-2 w-28">Unit Price</th>
                                <th className="text-right pb-2 w-28">Total</th>
                                <th className="w-8"></th>
                            </tr></thead>
                            <tbody>
                                {data.items.map((item, i) => (
                                    <tr key={i}>
                                        <td className="pr-2 pb-2"><input className="form-input text-sm" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} /></td>
                                        <td className="pr-2 pb-2"><input type="number" className="form-input text-sm" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} /></td>
                                        <td className="pr-2 pb-2"><input type="number" className="form-input text-sm" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} /></td>
                                        <td className="pb-2 text-right">{((parseFloat(item.quantity)||0)*(parseFloat(item.unit_price)||0)).toLocaleString('en-IN',{minimumFractionDigits:2})}৳</td>
                                        <td className="pb-2">{data.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-4 text-right text-sm space-y-1 border-t pt-3">
                            <div className="flex justify-end gap-8"><span className="text-gray-500">Subtotal</span><span>{subtotal.toLocaleString('en-IN',{minimumFractionDigits:2})}৳</span></div>
                            <div className="flex justify-end gap-4 items-center">
                                <span className="text-gray-500">VAT (৳)</span>
                                <input type="number" className="form-input text-sm w-28" value={data.vat_amount} onChange={e => setData('vat_amount', e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-4 items-center">
                                <span className="text-gray-500">Discount (৳)</span>
                                <input type="number" className="form-input text-sm w-28" value={data.discount_amount} onChange={e => setData('discount_amount', e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-8 font-bold text-primary-700 pt-2 border-t">
                                <span>Grand Total</span><span>{grandTotal.toLocaleString('en-IN',{minimumFractionDigits:2})}৳</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Saving…' : 'Update Invoice'}</button>
                        <a href={route('accounts.invoices.show', invoice.id)} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
