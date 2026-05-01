import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { useState } from 'react';

export default function GRNCreate({ purchaseOrders, warehouses }) {
    const [selectedPO, setSelectedPO] = useState(null);
    const { data, setData, post, processing, errors } = useForm({
        purchase_order_id: '', warehouse_id: '', received_date: new Date().toISOString().substring(0, 10),
        notes: '', items: [],
    });

    function selectPO(poId) {
        const po = (purchaseOrders ?? []).find(p => p.id === poId);
        setSelectedPO(po);
        setData(d => ({
            ...d,
            purchase_order_id: poId,
            items: po ? po.items.map(item => ({
                purchase_order_item_id: item.id,
                inventory_item_id: '',
                description: item.description,
                unit: item.unit,
                quantity_ordered: item.quantity_ordered,
                quantity_received: item.quantity_ordered - (item.quantity_received ?? 0),
            })) : [],
        }));
    }

    function updateItemQty(i, qty) {
        const items = [...data.items];
        items[i] = { ...items[i], quantity_received: qty };
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
                            <FormField label="Purchase Order" error={errors.purchase_order_id} required>
                                <select className="form-input" value={data.purchase_order_id} onChange={e => selectPO(e.target.value)}>
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
                            <h3 className="font-medium text-sm mb-3">Items to Receive</h3>
                            <table className="min-w-full text-sm">
                                <thead><tr className="text-xs text-gray-500">
                                    <th className="text-left pb-2">Description</th>
                                    <th className="text-left pb-2 w-20">Unit</th>
                                    <th className="text-left pb-2 w-24">Ordered</th>
                                    <th className="text-left pb-2 w-28">Receiving</th>
                                </tr></thead>
                                <tbody>
                                    {data.items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="pr-2 pb-2 text-gray-700">{item.description}</td>
                                            <td className="pr-2 pb-2 text-gray-500">{item.unit}</td>
                                            <td className="pr-2 pb-2 text-gray-500">{item.quantity_ordered}</td>
                                            <td className="pr-2 pb-2">
                                                <input type="number" className="form-input text-sm w-full" value={item.quantity_received}
                                                    max={item.quantity_ordered} min={0}
                                                    onChange={e => updateItemQty(i, e.target.value)} />
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
                        <button type="submit" disabled={processing || !data.purchase_order_id} className="btn btn-primary">
                            {processing ? 'Recording…' : 'Record GRN'}
                        </button>
                        <a href={route('procurement.grn.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
