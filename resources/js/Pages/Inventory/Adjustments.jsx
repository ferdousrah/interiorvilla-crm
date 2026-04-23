import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

export default function InventoryAdjustments({ items }) {
    const { data, setData, post, processing, errors } = useForm({
        inventory_item_id: '', quantity: '', type: 'adjustment',
        notes: '', transaction_date: new Date().toISOString().substring(0, 10),
    });
    function submit(e) {
        e.preventDefault();
        post(route('inventory.adjustments.store'));
    }
    return (
        <AppLayout>
            <Head title="Stock Adjustment" />
            <PageHeader title="Stock Adjustment" back={route('inventory.items.index')} />
            <div className="p-4 sm:p-6 max-w-xl">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <FormField label="Item" error={errors.inventory_item_id} required>
                        <select className="form-input" value={data.inventory_item_id} onChange={e => setData('inventory_item_id', e.target.value)}>
                            <option value="">Select Item…</option>
                            {(items ?? []).map(i => (
                                <option key={i.id} value={i.id}>{i.name} (Current: {i.current_stock} {i.unit})</option>
                            ))}
                        </select>
                    </FormField>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Adjustment Qty (+ or -)" error={errors.quantity} required>
                            <input type="number" className="form-input" value={data.quantity} onChange={e => setData('quantity', e.target.value)} />
                        </FormField>
                        <FormField label="Date" error={errors.transaction_date}>
                            <input type="date" className="form-input" value={data.transaction_date} onChange={e => setData('transaction_date', e.target.value)} />
                        </FormField>
                    </div>
                    <FormField label="Reason / Notes" error={errors.notes} required>
                        <textarea className="form-input" rows={3} value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Reason for adjustment…" />
                    </FormField>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Saving…' : 'Record Adjustment'}</button>
                        <a href={route('inventory.items.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
