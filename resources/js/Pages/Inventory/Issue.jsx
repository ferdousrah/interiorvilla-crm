import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

export default function InventoryIssue({ items, projects }) {
    const { data, setData, post, processing, errors } = useForm({
        inventory_item_id: '', project_id: '', quantity: '',
        notes: '', transaction_date: new Date().toISOString().substring(0, 10),
    });
    function submit(e) {
        e.preventDefault();
        post(route('inventory.issue.store'));
    }
    const selectedItem = (items ?? []).find(i => i.id === data.inventory_item_id);
    return (
        <AppLayout>
            <Head title="Issue Stock" />
            <PageHeader title="Issue Stock to Project" back={route('inventory.items.index')} />
            <div className="p-4 sm:p-6 max-w-xl">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <FormField label="Item" error={errors.inventory_item_id} required>
                        <select className="form-input" value={data.inventory_item_id} onChange={e => setData('inventory_item_id', e.target.value)}>
                            <option value="">Select Item…</option>
                            {(items ?? []).filter(i => i.is_active).map(i => (
                                <option key={i.id} value={i.id}>{i.name} (Stock: {i.current_stock} {i.unit})</option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label="Project" error={errors.project_id}>
                        <select className="form-input" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                            <option value="">-- No Project --</option>
                            {(projects ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </FormField>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label={`Quantity${selectedItem ? ` (max: ${selectedItem.current_stock})` : ''}`} error={errors.quantity} required>
                            <input type="number" className="form-input" value={data.quantity}
                                max={selectedItem?.current_stock}
                                onChange={e => setData('quantity', e.target.value)} />
                        </FormField>
                        <FormField label="Date" error={errors.transaction_date}>
                            <input type="date" className="form-input" value={data.transaction_date} onChange={e => setData('transaction_date', e.target.value)} />
                        </FormField>
                    </div>
                    <FormField label="Notes" error={errors.notes}>
                        <textarea className="form-input" rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)} />
                    </FormField>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Issuing…' : 'Issue Stock'}</button>
                        <a href={route('inventory.items.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
