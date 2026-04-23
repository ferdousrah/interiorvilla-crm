import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function PurchaseOrderCreate({ vendors, projects, requisitions }) {
    const { data, setData, post, processing, errors } = useForm({
        vendor_id: '', project_id: '', requisition_id: '',
        order_date: new Date().toISOString().substring(0, 10),
        expected_delivery: '', payment_terms: '', notes: '',
        vat_amount: '0', other_charges: '0',
        items: [{ description: '', unit: '', quantity_ordered: '', unit_rate: '' }],
    });

    function addItem() {
        setData('items', [...data.items, { description: '', unit: '', quantity_ordered: '', unit_rate: '' }]);
    }
    function removeItem(i) {
        setData('items', data.items.filter((_, idx) => idx !== i));
    }
    function updateItem(i, field, value) {
        const items = [...data.items];
        items[i] = { ...items[i], [field]: value };
        setData('items', items);
    }

    const subtotal = data.items.reduce((sum, it) => sum + (parseFloat(it.quantity_ordered) || 0) * (parseFloat(it.unit_rate) || 0), 0);
    const grandTotal = subtotal + parseFloat(data.vat_amount || 0) + parseFloat(data.other_charges || 0);

    function submit(e) {
        e.preventDefault();
        post(route('procurement.purchase-orders.store'));
    }

    return (
        <AppLayout>
            <Head title="New Purchase Order" />
            <PageHeader title="New Purchase Order" back={route('procurement.purchase-orders.index')} />
            <div className="p-4 sm:p-6 max-w-5xl">
                <form onSubmit={submit} className="space-y-4">
                    <div className="card p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField label="Vendor" error={errors.vendor_id} required>
                                <select className="form-input" value={data.vendor_id} onChange={e => setData('vendor_id', e.target.value)}>
                                    <option value="">Select Vendor…</option>
                                    {(vendors ?? []).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Project" error={errors.project_id}>
                                <select className="form-input" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                                    <option value="">-- No Project --</option>
                                    {(projects ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="From Requisition" error={errors.requisition_id}>
                                <select className="form-input" value={data.requisition_id} onChange={e => setData('requisition_id', e.target.value)}>
                                    <option value="">-- None --</option>
                                    {(requisitions ?? []).map(r => <option key={r.id} value={r.id}>{r.code}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Order Date" error={errors.order_date} required>
                                <input type="date" className="form-input" value={data.order_date} onChange={e => setData('order_date', e.target.value)} />
                            </FormField>
                            <FormField label="Expected Delivery" error={errors.expected_delivery}>
                                <input type="date" className="form-input" value={data.expected_delivery} onChange={e => setData('expected_delivery', e.target.value)} />
                            </FormField>
                            <FormField label="Payment Terms" error={errors.payment_terms}>
                                <input className="form-input" value={data.payment_terms} onChange={e => setData('payment_terms', e.target.value)} placeholder="e.g. 30 days" />
                            </FormField>
                        </div>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-sm">Items</h3>
                            <button type="button" onClick={addItem} className="btn text-xs flex items-center gap-1">
                                <PlusIcon className="w-3 h-3" /> Add Item
                            </button>
                        </div>
                        <table className="min-w-full text-sm">
                            <thead><tr className="text-xs text-gray-500">
                                <th className="text-left pb-2">Description</th>
                                <th className="text-left pb-2 w-20">Unit</th>
                                <th className="text-left pb-2 w-24">Qty</th>
                                <th className="text-left pb-2 w-28">Rate (৳)</th>
                                <th className="text-right pb-2 w-28">Total</th>
                                <th className="w-8"></th>
                            </tr></thead>
                            <tbody>
                                {data.items.map((item, i) => {
                                    const total = (parseFloat(item.quantity_ordered) || 0) * (parseFloat(item.unit_rate) || 0);
                                    return (
                                        <tr key={i}>
                                            <td className="pr-2 pb-2"><input className="form-input text-sm" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} /></td>
                                            <td className="pr-2 pb-2"><input className="form-input text-sm" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} /></td>
                                            <td className="pr-2 pb-2"><input type="number" className="form-input text-sm" value={item.quantity_ordered} onChange={e => updateItem(i, 'quantity_ordered', e.target.value)} /></td>
                                            <td className="pr-2 pb-2"><input type="number" className="form-input text-sm" value={item.unit_rate} onChange={e => updateItem(i, 'unit_rate', e.target.value)} /></td>
                                            <td className="pb-2 text-right text-gray-600">{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}৳</td>
                                            <td className="pb-2">{data.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="mt-4 text-right text-sm space-y-1 border-t pt-3">
                            <div className="flex justify-end gap-8">
                                <span className="text-gray-500">Subtotal</span>
                                <span>{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}৳</span>
                            </div>
                            <div className="flex justify-end gap-4 items-center">
                                <span className="text-gray-500">VAT (৳)</span>
                                <input type="number" className="form-input text-sm w-28 text-right" value={data.vat_amount} onChange={e => setData('vat_amount', e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-4 items-center">
                                <span className="text-gray-500">Other Charges (৳)</span>
                                <input type="number" className="form-input text-sm w-28 text-right" value={data.other_charges} onChange={e => setData('other_charges', e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-8 font-bold text-primary-700 pt-2 border-t">
                                <span>Grand Total</span>
                                <span>{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}৳</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Creating…' : 'Create Purchase Order'}</button>
                        <a href={route('procurement.purchase-orders.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
