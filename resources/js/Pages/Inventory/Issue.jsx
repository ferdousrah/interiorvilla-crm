import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

export default function InventoryIssue({ items = [], projects = [], warehouses = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        project_id: '',
        warehouse_id: warehouses[0]?.id ?? '',
        issue_date: new Date().toISOString().substring(0, 10),
        items: [{ inventory_item_id: '', quantity: '', notes: '' }],
    });

    function updateItem(i, field, value) {
        const next = [...data.items];
        next[i] = { ...next[i], [field]: value };
        setData('items', next);
    }

    function addItem() {
        setData('items', [...data.items, { inventory_item_id: '', quantity: '', notes: '' }]);
    }

    function removeItem(i) {
        setData('items', data.items.filter((_, idx) => idx !== i));
    }

    function submit(e) {
        e.preventDefault();
        post(route('inventory.issue.store'), {
            onSuccess: () => reset(),
        });
    }

    return (
        <AppLayout>
            <Head title="Issue Stock" />
            <PageHeader title="Issue Stock to Project" back={route('inventory.items.index')} />
            <div className="p-4 sm:p-6 max-w-4xl">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField label="Project" error={errors.project_id} required>
                            <select className="form-input" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                                <option value="">— Select Project —</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Warehouse" error={errors.warehouse_id} required>
                            <select className="form-input" value={data.warehouse_id} onChange={e => setData('warehouse_id', e.target.value)}>
                                <option value="">— Select Warehouse —</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Issue Date" error={errors.issue_date} required>
                            <input type="date" className="form-input" value={data.issue_date}
                                onChange={e => setData('issue_date', e.target.value)} />
                        </FormField>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-900">Items to Issue</h3>
                            <button type="button" onClick={addItem} className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                                + Add another item
                            </button>
                        </div>
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                                    <th className="text-left pb-2 px-2">Item</th>
                                    <th className="text-right pb-2 px-2 w-32">Quantity</th>
                                    <th className="text-left pb-2 px-2">Notes</th>
                                    <th className="w-8"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((row, i) => (
                                    <tr key={i} className="align-top">
                                        <td className="px-2 py-1.5">
                                            <select className="form-input text-sm w-full" value={row.inventory_item_id}
                                                onChange={e => updateItem(i, 'inventory_item_id', e.target.value)} required>
                                                <option value="">Select Item…</option>
                                                {items.map(it => (
                                                    <option key={it.id} value={it.id}>
                                                        {it.code ? `${it.code} — ` : ''}{it.name} ({it.unit})
                                                    </option>
                                                ))}
                                            </select>
                                            {errors[`items.${i}.inventory_item_id`] && (
                                                <p className="text-[10px] text-red-600 mt-0.5">{errors[`items.${i}.inventory_item_id`]}</p>
                                            )}
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <input type="number" min="0.01" step="0.01" className="form-input text-sm w-full text-right tabular-nums"
                                                value={row.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} required />
                                            {errors[`items.${i}.quantity`] && (
                                                <p className="text-[10px] text-red-600 mt-0.5">{errors[`items.${i}.quantity`]}</p>
                                            )}
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <input className="form-input text-sm w-full" value={row.notes}
                                                onChange={e => updateItem(i, 'notes', e.target.value)}
                                                placeholder="Optional" />
                                        </td>
                                        <td className="px-2 py-1.5 text-center">
                                            {data.items.length > 1 && (
                                                <button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 text-xs">
                                                    ×
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Issuing…' : 'Issue Stock'}
                        </button>
                        <a href={route('inventory.items.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
