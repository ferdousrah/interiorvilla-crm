import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { useState } from 'react';

export default function GRNCreate({ purchaseOrders, warehouses }) {
    const [selectedPO, setSelectedPO] = useState(null);
    const { data, setData, post, processing, errors } = useForm({
        po_id: '', warehouse_id: '', received_date: new Date().toISOString().substring(0, 10),
        notes: '', items: [],
    });

    function selectPO(poId) {
        const po = (purchaseOrders ?? []).find(p => p.id === poId);
        setSelectedPO(po);
        setData(d => ({
            ...d,
            po_id: poId,
            items: po ? po.items.map(item => ({
                po_item_id: item.id,
                description: item.description,
                unit: item.unit,
                quantity_ordered: item.quantity_ordered,
                quantity_received: item.quantity_ordered - (item.quantity_received ?? 0),
                condition: 'good',
                notes: '',
            })) : [],
        }));
    }

    function updateItem(i, field, value) {
        const items = [...data.items];
        items[i] = { ...items[i], [field]: value };
        setData('items', items);
    }

    function submit(e) {
        e.preventDefault();
        post(route('procurement.grn.store'));
    }

    return (
        <AppLayout>
            <Head title="New GRN" />
            <PageHeader title="New Goods Received Note" back={route('procurement.grn.index')} />
            <div className="p-4 sm:p-6 max-w-4xl">
                <form onSubmit={submit} className="space-y-4">
                    <div className="card p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField label="Purchase Order" error={errors.po_id} required>
                                <select className="form-input" value={data.po_id} onChange={e => selectPO(e.target.value)}>
                                    <option value="">Select PO…</option>
                                    {(purchaseOrders ?? []).map(po => (
                                        <option key={po.id} value={po.id}>
                                            {po.code} — {po.vendor?.name ?? 'No vendor'}{po.status ? ` (${po.status.replace('_', ' ')})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Warehouse" error={errors.warehouse_id} required>
                                <select className="form-input" value={data.warehouse_id} onChange={e => setData('warehouse_id', e.target.value)}>
                                    <option value="">Select Warehouse…</option>
                                    {(warehouses ?? []).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Received Date" error={errors.received_date} required>
                                <input type="date" className="form-input" value={data.received_date} onChange={e => setData('received_date', e.target.value)} />
                            </FormField>
                        </div>
                    </div>

                    {data.items.length > 0 && (
                        <div className="card p-4">
                            <h3 className="font-semibold text-sm text-gray-900 mb-3">Items to Receive</h3>
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                                        <th className="text-left pb-2 px-2">Description</th>
                                        <th className="text-left pb-2 px-2 w-20">Unit</th>
                                        <th className="text-right pb-2 px-2 w-20">Ordered</th>
                                        <th className="text-right pb-2 px-2 w-24">Receiving</th>
                                        <th className="text-left pb-2 px-2 w-32">Condition</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map((item, i) => (
                                        <tr key={i} className="align-top">
                                            <td className="px-2 py-1.5 text-gray-700">{item.description}</td>
                                            <td className="px-2 py-1.5 text-gray-500">{item.unit}</td>
                                            <td className="px-2 py-1.5 text-right text-gray-500 tabular-nums">{item.quantity_ordered}</td>
                                            <td className="px-2 py-1.5">
                                                <input type="number" className="form-input text-sm w-full text-right tabular-nums"
                                                    value={item.quantity_received}
                                                    max={item.quantity_ordered} min={0} step="0.01"
                                                    onChange={e => updateItem(i, 'quantity_received', e.target.value)} />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <select className="form-input text-sm w-full" value={item.condition}
                                                    onChange={e => updateItem(i, 'condition', e.target.value)}>
                                                    <option value="good">Good</option>
                                                    <option value="partial">Partial</option>
                                                    <option value="damaged">Damaged</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <FormField label="Notes" error={errors.notes}>
                        <textarea className="form-input" rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)} />
                    </FormField>

                    <div className="flex gap-3">
                        <button type="submit" disabled={processing || !data.po_id} className="btn btn-primary">
                            {processing ? 'Recording…' : 'Record GRN'}
                        </button>
                        <a href={route('procurement.grn.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
