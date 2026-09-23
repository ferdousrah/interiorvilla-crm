import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { PlusIcon, TrashIcon, BuildingStorefrontIcon, MapPinIcon } from '@heroicons/react/24/outline';

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'bkash', label: 'bKash' },
    { value: 'nagad', label: 'Nagad' },
    { value: 'rocket', label: 'Rocket' },
    { value: 'other', label: 'Other' },
];

function blankItem() {
    return { inventory_item_id: '', description: '', unit: 'pcs', quantity_ordered: '', unit_rate: '', vat_pct: '' };
}

function fmt(n) {
    return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PurchaseCreate({ vendors = [], projects = [], warehouses = [], inventoryItems = [], accountHeads = [] }) {
    const { data, setData, post, processing, errors, transform } = useForm({
        vendor_id: '',
        delivery_type: 'site',
        project_id: '',
        warehouse_id: warehouses.length === 1 ? warehouses[0].id : '',
        order_date: new Date().toISOString().substring(0, 10),
        other_charges: '0',
        notes: '',
        items: [blankItem()],
        payment_status: 'due',
        paid_amount: '',
        payment_method: 'cash',
        account_head_id: '',
        payment_reference: '',
    });

    const isStock = data.delivery_type === 'stock';

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
        items[i] = inv
            ? {
                ...items[i],
                inventory_item_id: inv.id,
                description: inv.name,
                unit: inv.unit || items[i].unit,
                unit_rate: items[i].unit_rate || (inv.standard_rate ? String(inv.standard_rate) : ''),
            }
            : { ...items[i], inventory_item_id: '' };
        setData('items', items);
    }

    const subtotal = data.items.reduce((s, it) => s + (parseFloat(it.quantity_ordered) || 0) * (parseFloat(it.unit_rate) || 0), 0);
    const vatTotal = data.items.reduce((s, it) => s + (parseFloat(it.quantity_ordered) || 0) * (parseFloat(it.unit_rate) || 0) * (parseFloat(it.vat_pct) || 0) / 100, 0);
    const grandTotal = subtotal + vatTotal + (parseFloat(data.other_charges) || 0);

    const paidNow = data.payment_status === 'full' ? grandTotal
        : data.payment_status === 'partial' ? (parseFloat(data.paid_amount) || 0) : 0;
    const due = Math.max(grandTotal - paidNow, 0);

    function submit(e) {
        e.preventDefault();
        transform(d => ({ ...d, paid_amount: paidNow ? Math.round(paidNow * 100) / 100 : 0 }));
        post(route('procurement.purchase-orders.store'));
    }

    const itemError = i => errors[`items.${i}.inventory_item_id`] || errors[`items.${i}.description`];

    return (
        <AppLayout>
            <Head title="New Purchase" />
            <PageHeader title="New Purchase" subtitle="Record what was bought, from whom, and where it went" back={route('procurement.purchase-orders.index')} />
            <div className="p-4 sm:p-6 max-w-6xl">
                <form onSubmit={submit} className="space-y-4">
                    <div className="card p-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField label="Vendor" error={errors.vendor_id} required>
                                <select className="form-input" value={data.vendor_id} onChange={e => setData('vendor_id', e.target.value)}>
                                    <option value="">Select vendor…</option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Purchase Date" error={errors.order_date} required>
                                <input type="date" className="form-input" value={data.order_date} onChange={e => setData('order_date', e.target.value)} />
                            </FormField>
                        </div>

                        <div>
                            <p className="form-label">Delivered to <span className="text-red-500">*</span></p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {[
                                    { value: 'site', icon: MapPinIcon, title: 'Project site', desc: 'Goods went straight to the site — cost goes to the project' },
                                    { value: 'stock', icon: BuildingStorefrontIcon, title: 'Warehouse stock', desc: 'Goods added to inventory — issue to projects later' },
                                ].map(opt => {
                                    const active = data.delivery_type === opt.value;
                                    return (
                                        <button type="button" key={opt.value} onClick={() => setData('delivery_type', opt.value)}
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField label="Project" error={errors.project_id} required={!isStock}
                                hint={isStock ? 'Optional — tag if bought for a specific project' : undefined}>
                                <select className="form-input" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                                    <option value="">{isStock ? '— No project —' : 'Select project…'}</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </FormField>
                            {isStock && (
                                <FormField label="Warehouse" error={errors.warehouse_id} required>
                                    <select className="form-input" value={data.warehouse_id} onChange={e => setData('warehouse_id', e.target.value)}>
                                        <option value="">Select warehouse…</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </FormField>
                            )}
                        </div>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="font-semibold text-sm text-gray-900">Items</h3>
                                {isStock && <p className="text-xs text-gray-500">Stock deliveries need an inventory item on every line.</p>}
                            </div>
                            <button type="button" onClick={addItem} className="btn text-xs flex items-center gap-1">
                                <PlusIcon className="w-3.5 h-3.5" /> Add Item
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                                        <th className="text-left pb-2 px-2 w-52">Inventory Item</th>
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
                                    {data.items.map((item, i) => (
                                        <tr key={i} className="align-top">
                                            <td className="px-2 py-1.5">
                                                <select className="form-input text-sm w-full" value={item.inventory_item_id}
                                                    onChange={e => pickInventoryItem(i, e.target.value)}>
                                                    <option value="">{isStock ? 'Select item…' : '— Custom —'}</option>
                                                    {inventoryItems.map(inv => (
                                                        <option key={inv.id} value={inv.id}>{inv.code ? `${inv.code} — ` : ''}{inv.name}</option>
                                                    ))}
                                                </select>
                                                {itemError(i) && <p className="form-error">{itemError(i)}</p>}
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <input className="form-input text-sm w-full" value={item.description} placeholder="e.g. 18mm Garjan ply"
                                                    onChange={e => updateItem(i, 'description', e.target.value)} required />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <input className="form-input text-sm w-full" value={item.unit}
                                                    onChange={e => updateItem(i, 'unit', e.target.value)} required />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <input type="number" min="0.01" step="0.01" className="form-input text-sm w-full text-right tabular-nums"
                                                    value={item.quantity_ordered} onChange={e => updateItem(i, 'quantity_ordered', e.target.value)} required />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <input type="number" min="0" step="0.01" className="form-input text-sm w-full text-right tabular-nums"
                                                    value={item.unit_rate} onChange={e => updateItem(i, 'unit_rate', e.target.value)} required />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <input type="number" min="0" max="100" step="0.5" className="form-input text-sm w-full text-right tabular-nums"
                                                    value={item.vat_pct} placeholder="0" onChange={e => updateItem(i, 'vat_pct', e.target.value)} />
                                            </td>
                                            <td className="px-2 py-1.5 text-right text-gray-700 tabular-nums pt-3">
                                                {fmt((parseFloat(item.quantity_ordered) || 0) * (parseFloat(item.unit_rate) || 0))}৳
                                            </td>
                                            <td className="px-2 py-1.5 text-center pt-3">
                                                {data.items.length > 1 && (
                                                    <button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 text-right text-sm space-y-1.5 border-t pt-3">
                            <div className="flex justify-end gap-8">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="tabular-nums w-32">{fmt(subtotal)}৳</span>
                            </div>
                            {vatTotal > 0 && (
                                <div className="flex justify-end gap-8">
                                    <span className="text-gray-500">VAT</span>
                                    <span className="tabular-nums w-32">{fmt(vatTotal)}৳</span>
                                </div>
                            )}
                            <div className="flex justify-end gap-4 items-center">
                                <span className="text-gray-500">Transport / Other (৳)</span>
                                <input type="number" min="0" step="0.01" className="form-input text-sm w-32 text-right tabular-nums"
                                    value={data.other_charges} onChange={e => setData('other_charges', e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-8 font-bold text-primary-700 pt-2 border-t text-base">
                                <span>Total</span>
                                <span className="tabular-nums w-32">{fmt(grandTotal)}৳</span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 space-y-4">
                        <h3 className="font-semibold text-sm text-gray-900">Payment</h3>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'due', label: 'Not paid (due)' },
                                { value: 'full', label: 'Paid in full' },
                                { value: 'partial', label: 'Partially paid' },
                            ].map(opt => (
                                <button type="button" key={opt.value} onClick={() => setData('payment_status', opt.value)}
                                    className={`px-3 py-1.5 rounded-lg border text-sm ${data.payment_status === opt.value ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {data.payment_status !== 'due' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {data.payment_status === 'partial' && (
                                    <FormField label="Amount paid (৳)" error={errors.paid_amount} required>
                                        <input type="number" min="0" step="0.01" className="form-input text-right tabular-nums"
                                            value={data.paid_amount} onChange={e => setData('paid_amount', e.target.value)} />
                                    </FormField>
                                )}
                                <FormField label="Method" error={errors.payment_method} required>
                                    <select className="form-input" value={data.payment_method} onChange={e => setData('payment_method', e.target.value)}>
                                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Paid from account" error={errors.account_head_id} required>
                                    <select className="form-input" value={data.account_head_id} onChange={e => setData('account_head_id', e.target.value)}>
                                        <option value="">Select account…</option>
                                        {accountHeads.map(a => <option key={a.id} value={a.id}>{a.code ? `${a.code} — ` : ''}{a.name}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Reference" error={errors.payment_reference}>
                                    <input className="form-input" placeholder="Cheque / TrxID" value={data.payment_reference}
                                        onChange={e => setData('payment_reference', e.target.value)} />
                                </FormField>
                            </div>
                        )}

                        <div className="flex gap-6 text-sm">
                            <span className="text-gray-500">Paid now: <span className="font-semibold text-gray-900 tabular-nums">{fmt(paidNow)}৳</span></span>
                            <span className="text-gray-500">Due to vendor: <span className={`font-semibold tabular-nums ${due > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{fmt(due)}৳</span></span>
                        </div>
                        <FormField label="Notes" error={errors.notes}>
                            <textarea className="form-input" rows={2} value={data.notes} placeholder="Bill no., remarks…"
                                onChange={e => setData('notes', e.target.value)} />
                        </FormField>
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Saving…' : 'Save Purchase'}
                        </button>
                        <a href={route('procurement.purchase-orders.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
