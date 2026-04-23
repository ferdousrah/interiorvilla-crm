import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

export default function InventoryItemEdit({ item, categories = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        name: item.name,
        category_id: item.category_id ?? '',
        unit: item.unit, sku: item.sku ?? '',
        reorder_level: item.reorder_level ?? '0',
        unit_cost: item.unit_cost ?? '',
        description: item.description ?? '',
        is_active: item.is_active,
    });
    function submit(e) {
        e.preventDefault();
        put(route('inventory.items.update', item.id));
    }
    return (
        <AppLayout>
            <Head title={`Edit ${item.name}`} />
            <PageHeader title={`Edit: ${item.name}`} back={route('inventory.items.show', item.id)} />
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Item Name" error={errors.name} required>
                            <input className="form-input" value={data.name} onChange={e => setData('name', e.target.value)} />
                        </FormField>
                        <FormField label="SKU" error={errors.sku}>
                            <input className="form-input" value={data.sku} onChange={e => setData('sku', e.target.value)} />
                        </FormField>
                        <FormField label="Category" error={errors.category_id} hint={categories.length === 0 ? null : 'Manage list under Inventory → Categories'}>
                            {categories.length === 0 ? (
                                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                                    No categories. <Link href={route('inventory.categories.index')} className="underline font-medium">Add one</Link>.
                                </div>
                            ) : (
                                <select className="form-input" value={data.category_id} onChange={e => setData('category_id', e.target.value)}>
                                    <option value="">— none —</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            )}
                        </FormField>
                        <FormField label="Unit" error={errors.unit} required>
                            <input className="form-input" value={data.unit} onChange={e => setData('unit', e.target.value)} />
                        </FormField>
                        <FormField label="Unit Cost (৳)" error={errors.unit_cost}>
                            <input type="number" className="form-input" value={data.unit_cost} onChange={e => setData('unit_cost', e.target.value)} />
                        </FormField>
                        <FormField label="Reorder Level" error={errors.reorder_level}>
                            <input type="number" className="form-input" value={data.reorder_level} onChange={e => setData('reorder_level', e.target.value)} />
                        </FormField>
                    </div>
                    <FormField label="Description" error={errors.description}>
                        <textarea className="form-input" rows={2} value={data.description} onChange={e => setData('description', e.target.value)} />
                    </FormField>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded" />
                        Active
                    </label>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Saving…' : 'Update Item'}</button>
                        <a href={route('inventory.items.show', item.id)} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
