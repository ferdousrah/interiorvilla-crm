import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

export default function InventoryItemCreate({ warehouses = [], categories = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '', category_id: '', unit: '', sku: '',
        reorder_level: '0', initial_stock: '0', standard_rate: '',
        warehouse_id: warehouses[0]?.id ?? '', description: '',
    });
    function submit(e) {
        e.preventDefault();
        post(route('inventory.items.store'));
    }
    return (
        <AppLayout>
            <Head title="New Inventory Item" />
            <PageHeader title="New Inventory Item" back={route('inventory.items.index')} />
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
                            <input className="form-input" value={data.unit} placeholder="pcs, kg, m…" onChange={e => setData('unit', e.target.value)} />
                        </FormField>
                        <FormField label="Unit Cost (৳)" error={errors.standard_rate}>
                            <input type="number" min="0" step="0.01" className="form-input"
                                value={data.standard_rate} onChange={e => setData('standard_rate', e.target.value)} />
                        </FormField>
                        <FormField label="Reorder Level" error={errors.reorder_level}>
                            <input type="number" className="form-input" value={data.reorder_level} onChange={e => setData('reorder_level', e.target.value)} />
                        </FormField>
                        <FormField label="Initial Stock" error={errors.initial_stock}>
                            <input type="number" className="form-input" value={data.initial_stock} onChange={e => setData('initial_stock', e.target.value)} />
                        </FormField>
                        <FormField label="Warehouse" error={errors.warehouse_id}>
                            <select className="form-input" value={data.warehouse_id} onChange={e => setData('warehouse_id', e.target.value)}>
                                <option value="">-- Select --</option>
                                {(warehouses ?? []).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </FormField>
                    </div>
                    <FormField label="Description" error={errors.description}>
                        <textarea className="form-input" rows={2} value={data.description} onChange={e => setData('description', e.target.value)} />
                    </FormField>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Saving…' : 'Save Item'}</button>
                        <a href={route('inventory.items.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
