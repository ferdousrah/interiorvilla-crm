import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function RequisitionCreate({ projects }) {
    const { data, setData, post, processing, errors } = useForm({
        project_id: '', required_by: '', notes: '',
        items: [{ description: '', unit: '', quantity_required: '', estimated_rate: '' }],
    });

    function addItem() {
        setData('items', [...data.items, { description: '', unit: '', quantity_required: '', estimated_rate: '' }]);
    }

    function removeItem(i) {
        setData('items', data.items.filter((_, idx) => idx !== i));
    }

    function updateItem(i, field, value) {
        const items = [...data.items];
        items[i] = { ...items[i], [field]: value };
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
            <div className="p-4 sm:p-6 max-w-4xl">
                <form onSubmit={submit} className="space-y-4">
                    <div className="card p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField label="Project" error={errors.project_id}>
                                <select className="form-input" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                                    <option value="">-- No Project --</option>
                                    {(projects ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                            <h3 className="font-medium text-sm">Items</h3>
                            <button type="button" onClick={addItem} className="btn text-xs flex items-center gap-1">
                                <PlusIcon className="w-3 h-3" /> Add Item
                            </button>
                        </div>
                        <table className="min-w-full text-sm">
                            <thead><tr className="text-xs text-gray-500">
                                <th className="text-left pb-2">Description</th>
                                <th className="text-left pb-2 w-24">Unit</th>
                                <th className="text-left pb-2 w-24">Qty</th>
                                <th className="text-left pb-2 w-28">Est. Rate</th>
                                <th className="w-8"></th>
                            </tr></thead>
                            <tbody className="space-y-2">
                                {data.items.map((item, i) => (
                                    <tr key={i}>
                                        <td className="pr-2 pb-2"><input className="form-input text-sm" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description" /></td>
                                        <td className="pr-2 pb-2"><input className="form-input text-sm" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} placeholder="pcs" /></td>
                                        <td className="pr-2 pb-2"><input type="number" className="form-input text-sm" value={item.quantity_required} onChange={e => updateItem(i, 'quantity_required', e.target.value)} /></td>
                                        <td className="pr-2 pb-2"><input type="number" className="form-input text-sm" value={item.estimated_rate} onChange={e => updateItem(i, 'estimated_rate', e.target.value)} /></td>
                                        <td className="pb-2">
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

                    <div className="flex gap-3">
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Submitting…' : 'Submit Requisition'}</button>
                        <a href={route('procurement.requisitions.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
