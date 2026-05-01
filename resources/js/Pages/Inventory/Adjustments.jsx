import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

export default function InventoryAdjustments({ items = [], warehouses = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        inventory_item_id: '',
        warehouse_id: warehouses[0]?.id ?? '',
        physical_count: '',
        adjustment_date: new Date().toISOString().substring(0, 10),
        reason: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('inventory.adjustments.store'), {
            onSuccess: () => reset(),
        });
    }

    return (
        <AppLayout>
            <Head title="Stock Adjustment" />
            <PageHeader title="Stock Adjustment" back={route('inventory.items.index')} />
            <div className="p-4 sm:p-6 max-w-2xl">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <p className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3 leading-relaxed">
                        Enter the <strong>actual physical count</strong> you observed in the warehouse during stocktake.
                        The system will compare it to its recorded count and create an adjustment for the variance.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Item" error={errors.inventory_item_id} required>
                            <select className="form-input" value={data.inventory_item_id}
                                onChange={e => setData('inventory_item_id', e.target.value)}>
                                <option value="">Select Item…</option>
                                {items.map(i => (
                                    <option key={i.id} value={i.id}>
                                        {i.code ? `${i.code} — ` : ''}{i.name} ({i.unit})
                                    </option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Warehouse" error={errors.warehouse_id} required>
                            <select className="form-input" value={data.warehouse_id}
                                onChange={e => setData('warehouse_id', e.target.value)}>
                                <option value="">Select Warehouse…</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Physical Count" error={errors.physical_count} required>
                            <input type="number" min="0" step="0.01" className="form-input" value={data.physical_count}
                                onChange={e => setData('physical_count', e.target.value)}
                                placeholder="Actual count in warehouse" />
                        </FormField>
                        <FormField label="Date" error={errors.adjustment_date} required>
                            <input type="date" className="form-input" value={data.adjustment_date}
                                onChange={e => setData('adjustment_date', e.target.value)} />
                        </FormField>
                    </div>

                    <FormField label="Reason / Notes" error={errors.reason}>
                        <textarea className="form-input" rows={3} value={data.reason}
                            onChange={e => setData('reason', e.target.value)}
                            placeholder="e.g. Quarterly stock count, found damaged units, etc." />
                    </FormField>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Saving…' : 'Record Adjustment'}
                        </button>
                        <a href={route('inventory.items.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
