import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

function blankItem() {
    return { inventory_item_id: '', description: '', unit: 'pcs', quantity: '', estimated_rate: '' };
}

const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

export default function RequisitionCreate({ projects = [], inventoryItems = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        project_id: '',
        priority: 'normal',
        required_by: '',
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
            };
        } else {
            items[i] = { ...items[i], inventory_item_id: '' };
        }
        setData('items', items);
    }

    function submit(e) {
        e.preventDefault();
        post(route('procurement.requisitions.store'));
    }

    return (
        <AppLayout>
            <Head title="New Requisition" />
            <PageHeader title="New Purchase Requisition" back={route('procurement.requisitions.index')} />
            <div className="p-4 sm:p-6 max-w-5xl">
                <form onSubmit={submit} className="space-y-4">
                    <div className="card p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormField label="Project" error={errors.project_id}>
                                <select className="form-input" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                                    <option value="">— No Project —</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Priority" error={errors.priority} required>
                                <select className="form-input" value={data.priority} onChange={e => setData('priority', e.target.value)}>
                                    {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Required By" error={errors.required_by}>
                                <input type="date" className="form-input" value={data.required_by} onChange={e => setData('required_by', e.target.value)} />
                            </FormField>
                        </div>
                        <FormField label="Notes" error={errors.notes} className="mt-4">
                            <textarea className="form-input" rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)} />
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
                                    <th className="text-left pb-2 px-2 w-56">Item</th>
                                    <th className="text-left pb-2 px-2">Description</th>
                                    <th className="text-left pb-2 px-2 w-24">Unit</th>
                                    <th className="text-right pb-2 px-2 w-24">Qty</th>
                                    <th className="text-right pb-2 px-2 w-28">Est. Rate</th>
                                    <th className="w-8"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((item, i) => (
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
                                            {errors[`items.${i}.inventory_item_id`] && (
                                                <p className="text-[10px] text-red-600 mt-0.5">{errors[`items.${i}.inventory_item_id`]}</p>
                                            )}
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <input className="form-input text-sm w-full"
                                                value={item.description}
                                                onChange={e => updateItem(i, 'description', e.target.value)}
                                                placeholder="Auto-filled when item picked, or type custom" required />
                                            {errors[`items.${i}.description`] && (
                                                <p className="text-[10px] text-red-600 mt-0.5">{errors[`items.${i}.description`]}</p>
                                            )}
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <input className="form-input text-sm w-full" value={item.unit}
                                                onChange={e => updateItem(i, 'unit', e.target.value)} placeholder="pcs" required />
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <input type="number" min="0.01" step="0.01" className="form-input text-sm w-full text-right tabular-nums"
                                                value={item.quantity}
                                                onChange={e => updateItem(i, 'quantity', e.target.value)} required />
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <input type="number" min="0" step="0.01" className="form-input text-sm w-full text-right tabular-nums"
                                                value={item.estimated_rate}
                                                onChange={e => updateItem(i, 'estimated_rate', e.target.value)} />
                                        </td>
                                        <td className="px-2 py-1.5 text-center">
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
                        {inventoryItems.length === 0 && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 mt-3">
                                No inventory items found. Add items under Inventory → Items, or type a custom description above.
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Submitting…' : 'Submit Requisition'}
                        </button>
                        <a href={route('procurement.requisitions.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
