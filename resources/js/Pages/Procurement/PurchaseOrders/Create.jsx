import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

function blankItem() {
    return { inventory_item_id: '', description: '', unit: 'pcs', quantity_ordered: '', unit_rate: '', vat_pct: '' };
}

export default function PurchaseOrderCreate({ vendors = [], projects = [], requisitions = [], inventoryItems = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        vendor_id: '',
        project_id: '',
        requisition_id: '',
        order_date: new Date().toISOString().substring(0, 10),
        expected_delivery_date: '',
        delivery_address: '',
        status: 'draft',
        other_charges: '0',
        notes: '',
        items: [blankItem()],
    });

    function addItem() {
        setData('items', [...data.items, blankItem()]);
    }
    function removeItem(i) {
        setData('items', data.items.filter((_, idx) => idx !== i));
    }
    function updateItem(i, field, value) {
        const items = [...data.items];
        items[i] = { ...items[i], [field]: value };
        setData('items', items);
    }

    function pickInventoryItem(i, inventoryItemId) {
        const inv = inventoryItems.find(x => x.id === inventoryItemId);
        const items = [...data.items];
        if (inv) {
            items[i] = {
                ...items[i],
                inventory_item_id: inv.id,
                description: inv.name,
                unit: inv.unit || items[i].unit,
                unit_rate: inv.standard_rate ? String(inv.standard_rate) : items[i].unit_rate,
            };
        } else {
            items[i] = { ...items[i], inventory_item_id: '' };
        }
        setData('items', items);
    }

    /** When a requisition is picked, auto-fill items + project from it */
    function pickRequisition(reqId) {
        const r = requisitions.find(x => x.id === reqId);
        if (!r) {
            setData('requisition_id', '');
            return;
        }
        setData(d => ({
            ...d,
            requisition_id: reqId,
            project_id: r.project_id ?? d.project_id,
            items: (r.items ?? []).length > 0
                ? r.items.map(it => ({
                    inventory_item_id: it.inventory_item_id ?? '',
                    description: it.description,
                    unit: it.unit,
                    quantity_ordered: String(it.quantity ?? ''),
                    unit_rate: it.estimated_rate != null ? String(it.estimated_rate) : '',
                    vat_pct: '',
                }))
                : [blankItem()],
        }));
    }

    const subtotal = data.items.reduce(
        (sum, it) => sum + (parseFloat(it.quantity_ordered) || 0) * (parseFloat(it.unit_rate) || 0),
        0
    );
    const vatTotal = data.items.reduce(
        (sum, it) => sum + ((parseFloat(it.quantity_ordered) || 0) * (parseFloat(it.unit_rate) || 0) * (parseFloat(it.vat_pct) || 0) / 100),
        0
    );
    const grandTotal = subtotal + vatTotal + (parseFloat(data.other_charges) || 0);

    function submit(e) {
        e.preventDefault();
        post(route('procurement.purchase-orders.store'));
    }

    return (
        <AppLayout>
            <Head title="New Purchase Order" />
            <PageHeader title="New Purchase Order" back={route('procurement.purchase-orders.index')} />
            <div className="p-4 sm:p-6 max-w-6xl">
                <form onSubmit={submit} className="space-y-4">
                    <div className="card p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField label="Vendor" error={errors.vendor_id} required>
                                <select className="form-input" value={data.vendor_id} onChange={e => setData('vendor_id', e.target.value)}>
                                    <option value="">Select Vendor…</option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="From Requisition" error={errors.requisition_id}
                                hint={requisitions.length === 0 ? 'No approved requisitions yet — approve one first or create custom items below.' : 'Picking a requisition auto-fills the items below.'}>
                                <select className="form-input" value={data.requisition_id} onChange={e => pickRequisition(e.target.value)}>
                                    <option value="">— None —</option>
                                    {requisitions.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.code}{r.project ? ` · ${r.project.name}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Project" error={errors.project_id}>
                                <select className="form-input" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                                    <option value="">— No Project —</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Order Date" error={errors.order_date} required>
                                <input type="date" className="form-input" value={data.order_date} onChange={e => setData('order_date', e.target.value)} />
                            </FormField>
                            <FormField label="Expected Delivery" error={errors.expected_delivery_date}>
                                <input type="date" className="form-input" value={data.expected_delivery_date}
                                    onChange={e => setData('expected_delivery_date', e.target.value)} />
                            </FormField>
                            <FormField label="Status" error={errors.status} required>
                                <select className="form-input" value={data.status} onChange={e => setData('status', e.target.value)}>
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent to Vendor</option>
                                </select>
                            </FormField>
                        </div>
                        <FormField label="Delivery Address" error={errors.delivery_address} className="mt-4">
                            <textarea className="form-input" rows={2} value={data.delivery_address}
                                onChange={e => setData('delivery_address', e.target.value)}
                                placeholder="Where the goods should be delivered" />
                        </FormField>
                        <FormField label="Notes" error={errors.notes} className="mt-4">
                            <textarea className="form-input" rows={2} value={data.notes}
                                onChange={e => setData('notes', e.target.value)} />
                        </FormField>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-sm text-gray-900">Items</h3>
                            <button type="button" onClick={addItem} className="btn text-xs flex items-center gap-1">
                                <PlusIcon className="w-3.5 h-3.5" /> Add Item
                            </button>
                        </div>
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                                    <th className="text-left pb-2 px-2 w-52">Item</th>
                                    <th className="text-left pb-2 px-2">Description</th>
                                    <th className="text-left pb-2 px-2 w-20">Unit</th>
                                    <th className="text-right pb-2 px-2 w-20">Qty</th>
                                    <th className="text-right pb-2 px-2 w-24">Rate</th>
                                    <th className="text-right pb-2 px-2 w-16">VAT %</th>
                                    <th className="text-right pb-2 px-2 w-28">Total</th>
                                    <th className="w-8"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((item, i) => {
                                    const lineTotal = (parseFloat(item.quantity_ordered) || 0) * (parseFloat(item.unit_rate) || 0);
                                    return (
                                        <tr key={i} className="align-top">
                                            <td className="px-2 py-1.5">
                                                <select className="form-input text-sm w-full"
                                                    value={item.inventory_item_id}
                                                    onChange={e => pickInventoryItem(i, e.target.value)}>
                                                    <option value="">— Select / Custom —</option>
                                                    {inventoryItems.map(inv => (
                                                        <option key={inv.id} value={inv.id}>
                                                            {inv.code ? `${inv.code} — ` : ''}{inv.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <input className="form-input text-sm w-full"
                                                    value={item.description}
                                                    onChange={e => updateItem(i, 'description', e.target.value)} required />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <input className="form-input text-sm w-full" value={item.unit}
                                                    onChange={e => updateItem(i, 'unit', e.target.value)} required />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <input type="number" min="0.01" step="0.01" className="form-input text-sm w-full text-right tabular-nums"
                                                    value={item.quantity_ordered}
                                                    onChange={e => updateItem(i, 'quantity_ordered', e.target.value)} required />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <input type="number" min="0" step="0.01" className="form-input text-sm w-full text-right tabular-nums"
                                                    value={item.unit_rate}
                                                    onChange={e => updateItem(i, 'unit_rate', e.target.value)} required />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <input type="number" min="0" max="100" step="0.5" className="form-input text-sm w-full text-right tabular-nums"
                                                    value={item.vat_pct}
                                                    onChange={e => updateItem(i, 'vat_pct', e.target.value)}
                                                    placeholder="0" />
                                            </td>
                                            <td className="px-2 py-1.5 text-right text-gray-700 tabular-nums">
                                                {lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}৳
                                            </td>
                                            <td className="px-2 py-1.5 text-center">
                                                {data.items.length > 1 && (
                                                    <button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="mt-4 text-right text-sm space-y-1.5 border-t pt-3">
                            <div className="flex justify-end gap-8">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="tabular-nums">{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}৳</span>
                            </div>
                            <div className="flex justify-end gap-8">
                                <span className="text-gray-500">VAT</span>
                                <span className="tabular-nums">{vatTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}৳</span>
                            </div>
                            <div className="flex justify-end gap-4 items-center">
                                <span className="text-gray-500">Other Charges (৳)</span>
                                <input type="number" min="0" step="0.01" className="form-input text-sm w-28 text-right tabular-nums"
                                    value={data.other_charges}
                                    onChange={e => setData('other_charges', e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-8 font-bold text-primary-700 pt-2 border-t text-base">
                                <span>Grand Total</span>
                                <span className="tabular-nums">{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}৳</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Creating…' : 'Create Purchase Order'}
                        </button>
                        <a href={route('procurement.purchase-orders.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
