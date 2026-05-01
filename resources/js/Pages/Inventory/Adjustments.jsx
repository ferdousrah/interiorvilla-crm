import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { formatDate } from '@/utils/formatters';

export default function InventoryAdjustments({ items = [], warehouses = [], history = [] }) {
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
            <div className="p-4 sm:p-6 max-w-6xl">
                <form onSubmit={submit} className="card p-6 space-y-4 max-w-2xl">
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

                {/* Recent adjustments history */}
                <div className="card mt-6 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">Recent Adjustments</h3>
                        <span className="text-xs text-gray-500">Last {history.length} entries</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs font-semibold text-gray-500 uppercase">
                                    <th className="px-4 py-2 text-left">Date</th>
                                    <th className="px-4 py-2 text-left">Item</th>
                                    <th className="px-4 py-2 text-left">Warehouse</th>
                                    <th className="px-4 py-2 text-right">System</th>
                                    <th className="px-4 py-2 text-right">Physical</th>
                                    <th className="px-4 py-2 text-right">Variance</th>
                                    <th className="px-4 py-2 text-left">Reason</th>
                                    <th className="px-4 py-2 text-left">By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-gray-400 italic">
                                            No adjustments recorded yet.
                                        </td>
                                    </tr>
                                ) : history.map(h => {
                                    const positive = h.variance > 0;
                                    const negative = h.variance < 0;
                                    return (
                                        <tr key={h.id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-2.5 text-xs whitespace-nowrap">{formatDate(h.adjustment_date)}</td>
                                            <td className="px-4 py-2.5">
                                                <div className="text-sm font-medium text-gray-900">{h.item?.name ?? '—'}</div>
                                                <div className="text-[11px] text-gray-500">{h.item?.code}</div>
                                            </td>
                                            <td className="px-4 py-2.5 text-xs">{h.warehouse?.name ?? '—'}</td>
                                            <td className="px-4 py-2.5 text-right text-xs text-gray-600 tabular-nums">{h.system_count}</td>
                                            <td className="px-4 py-2.5 text-right text-sm font-semibold tabular-nums">{h.physical_count}</td>
                                            <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${
                                                positive ? 'text-emerald-600' : negative ? 'text-rose-600' : 'text-gray-500'
                                            }`}>
                                                {positive ? '+' : ''}{h.variance} {h.item?.unit ?? ''}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-gray-600 max-w-[16rem] truncate" title={h.reason}>{h.reason ?? '—'}</td>
                                            <td className="px-4 py-2.5 text-xs text-gray-600">{h.adjusted_by ?? '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
