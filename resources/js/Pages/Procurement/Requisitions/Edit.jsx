import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function RequisitionEdit({ requisition, projects, inventoryItems }) {
    const { data, setData, put, processing, errors } = useForm({
        project_id: requisition.project_id ?? '',
        priority: requisition.priority,
        required_by: requisition.required_by ?? '',
        notes: requisition.notes ?? '',
        items: (requisition.items ?? []).map(i => ({
            id: i.id,
            inventory_item_id: i.inventory_item_id ?? '',
            description: i.description,
            unit: i.unit,
            quantity: i.quantity,
            estimated_rate: i.estimated_rate ?? '',
            notes: i.notes ?? '',
        })),
    });

    function addItem() {
        setData('items', [...data.items, { inventory_item_id: '', description: '', unit: 'pcs', quantity: 1, estimated_rate: '', notes: '' }]);
    }

    function removeItem(idx) {
        setData('items', data.items.filter((_, i) => i !== idx));
    }

    function updateItem(idx, field, value) {
        const items = [...data.items];
        items[idx] = { ...items[idx], [field]: value };
        if (field === 'inventory_item_id' && value) {
            const item = inventoryItems.find(i => i.id === value);
            if (item) items[idx].unit = item.unit;
        }
        setData('items', items);
    }

    function submit(e) {
        e.preventDefault();
        put(route('procurement.requisitions.update', requisition.id));
    }

    return (
        <AppLayout>
            <Head title={`Edit ${requisition.code}`} />
            <PageHeader title={`Edit Requisition: ${requisition.code}`} back={route('procurement.requisitions.show', requisition.id)} />
            <div className="p-4 sm:p-6 max-w-5xl">
                <form onSubmit={submit} className="space-y-6">
                    <div className="card p-6">
                        <h3 className="font-semibold text-gray-700 mb-4">Request Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Project (optional)" error={errors.project_id}>
                                <select className="form-input" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                                    <option value="">No project</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                                </select>
                            </FormField>
                            <FormField label="Priority" error={errors.priority} required>
                                <select className="form-input" value={data.priority} onChange={e => setData('priority', e.target.value)}>
                                    {['low', 'normal', 'high', 'urgent'].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Required By" error={errors.required_by}>
                                <input type="date" className="form-input" value={data.required_by} onChange={e => setData('required_by', e.target.value)} />
                            </FormField>
                            <FormField label="Notes" error={errors.notes}>
                                <input className="form-input" value={data.notes} onChange={e => setData('notes', e.target.value)} />
                            </FormField>
                        </div>
                    </div>

                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-700">Items</h3>
                            <button type="button" onClick={addItem} className="btn btn-secondary text-sm flex items-center gap-1">
                                <PlusIcon className="w-4 h-4" /> Add Item
                            </button>
                        </div>
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-gray-500 uppercase">
                                    <th className="pb-2 pr-3">Item</th>
                                    <th className="pb-2 pr-3">Description</th>
                                    <th className="pb-2 pr-3 w-20">Unit</th>
                                    <th className="pb-2 pr-3 w-24">Qty</th>
                                    <th className="pb-2 pr-3 w-28">Est. Rate</th>
                                    <th className="pb-2 w-8"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-2 pr-3">
                                            <select className="form-input text-xs" value={item.inventory_item_id} onChange={e => updateItem(idx, 'inventory_item_id', e.target.value)}>
                                                <option value="">Manual</option>
                                                {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="py-2 pr-3">
                                            <input className="form-input text-xs" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Description" required />
                                        </td>
                                        <td className="py-2 pr-3">
                                            <input className="form-input text-xs" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} />
                                        </td>
                                        <td className="py-2 pr-3">
                                            <input type="number" className="form-input text-xs" value={item.quantity} min="0.01" step="0.01" onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                                        </td>
                                        <td className="py-2 pr-3">
                                            <input type="number" className="form-input text-xs" value={item.estimated_rate} min="0" step="0.01" onChange={e => updateItem(idx, 'estimated_rate', e.target.value)} />
                                        </td>
                                        <td className="py-2">
                                            <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>
                        <a href={route('procurement.requisitions.show', requisition.id)} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
