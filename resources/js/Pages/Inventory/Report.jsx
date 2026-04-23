import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import { formatDate } from '@/utils/formatters';
import { useState } from 'react';
import { FolderOpenIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

const IN_TYPES  = ['opening', 'purchase', 'return_from_project', 'transfer_in'];
const OUT_TYPES = ['project_issue', 'transfer_out', 'damage', 'waste'];

const TYPE_LABEL = {
    opening: 'Opening',
    purchase: 'Purchase',
    project_issue: 'Issue to Project',
    return_from_project: 'Return from Project',
    transfer_in: 'Transfer In',
    transfer_out: 'Transfer Out',
    damage: 'Damage',
    waste: 'Waste',
};

const TYPE_BADGE = {
    opening: 'bg-gray-100 text-gray-700',
    purchase: 'bg-emerald-100 text-emerald-700',
    return_from_project: 'bg-emerald-100 text-emerald-700',
    transfer_in: 'bg-blue-100 text-blue-700',
    project_issue: 'bg-red-100 text-red-700',
    transfer_out: 'bg-orange-100 text-orange-700',
    damage: 'bg-rose-100 text-rose-700',
    waste: 'bg-rose-100 text-rose-700',
};

function fmt(n) {
    return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtQty(n) {
    return Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export default function InventoryReport({ groups = [], items = [], projects = [], filters = {} }) {
    const [form, setForm] = useState({
        inventory_item_id: filters.inventory_item_id ?? '',
        project_id:        filters.project_id ?? '',
        from:              filters.from ?? '',
        to:                filters.to ?? '',
    });

    function applyFilter(e) {
        e.preventDefault();
        router.get(route('inventory.report'), form, { preserveState: true, replace: true });
    }

    function resetFilter() {
        const blank = { inventory_item_id: '', project_id: '', from: '', to: '' };
        setForm(blank);
        router.get(route('inventory.report'), blank, { preserveState: true, replace: true });
    }

    // Overall totals
    const totals = groups.reduce((acc, g) => ({
        inQty:  acc.inQty  + Number(g.in_qty || 0),
        outQty: acc.outQty + Number(g.out_qty || 0),
        inVal:  acc.inVal  + Number(g.in_value || 0),
        outVal: acc.outVal + Number(g.out_value || 0),
        count:  acc.count  + Number(g.count || 0),
    }), { inQty: 0, outQty: 0, inVal: 0, outVal: 0, count: 0 });

    return (
        <AppLayout>
            <Head title="Stock Movement Report" />
            <PageHeader title="Stock Movement Report" subtitle="Project-wise stock in/out breakdown" />
            <div className="p-4 sm:p-6 space-y-5">

                {/* Filters */}
                <form onSubmit={applyFilter} className="card p-4 flex gap-3 flex-wrap items-end">
                    <div className="flex flex-col gap-1 min-w-[200px]">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Project</label>
                        <select className="form-input text-sm"
                            value={form.project_id}
                            onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
                            <option value="">All Projects</option>
                            <option value="none">— Warehouse only (no project) —</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.code ? `${p.code} — ` : ''}{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1 min-w-[200px]">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Item</label>
                        <select className="form-input text-sm"
                            value={form.inventory_item_id}
                            onChange={e => setForm(f => ({ ...f, inventory_item_id: e.target.value }))}>
                            <option value="">All Items</option>
                            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">From</label>
                        <input type="date" className="form-input text-sm"
                            value={form.from}
                            onChange={e => setForm(f => ({ ...f, from: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">To</label>
                        <input type="date" className="form-input text-sm"
                            value={form.to}
                            onChange={e => setForm(f => ({ ...f, to: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="btn btn-primary text-sm">Apply</button>
                        <button type="button" onClick={resetFilter} className="btn text-sm">Reset</button>
                    </div>
                </form>

                {/* Overall KPIs */}
                {groups.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="card p-4">
                            <p className="text-xs text-gray-500 uppercase">Projects Involved</p>
                            <p className="text-xl font-bold text-gray-800 mt-1">{groups.length}</p>
                        </div>
                        <div className="card p-4">
                            <p className="text-xs text-gray-500 uppercase">Total Transactions</p>
                            <p className="text-xl font-bold text-gray-800 mt-1">{totals.count}</p>
                        </div>
                        <div className="card p-4 border-l-4 border-emerald-500">
                            <p className="text-xs text-emerald-600 uppercase font-semibold">Stock In Value</p>
                            <p className="text-xl font-bold text-emerald-700 mt-1">BDT {fmt(totals.inVal)}</p>
                            <p className="text-xs text-gray-500">{fmtQty(totals.inQty)} units</p>
                        </div>
                        <div className="card p-4 border-l-4 border-red-500">
                            <p className="text-xs text-red-600 uppercase font-semibold">Stock Out Value</p>
                            <p className="text-xl font-bold text-red-700 mt-1">BDT {fmt(totals.outVal)}</p>
                            <p className="text-xs text-gray-500">{fmtQty(totals.outQty)} units</p>
                        </div>
                    </div>
                )}

                {/* Project-wise groups */}
                {groups.length === 0 ? (
                    <div className="card p-12 text-center text-gray-400">
                        <ArchiveBoxIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        No stock transactions found for the selected filters.
                    </div>
                ) : (
                    groups.map((g, gi) => (
                        <div key={g.project?.id ?? 'none'} className="card overflow-hidden">
                            {/* Project header */}
                            <div className="bg-gray-800 text-white px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-3 min-w-0">
                                    <FolderOpenIcon className="w-5 h-5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate">
                                            {g.project
                                                ? `${gi + 1}. ${g.project.code ? `${g.project.code} — ` : ''}${g.project.name}`
                                                : `${gi + 1}. Warehouse Only (no project)`}
                                        </p>
                                        <p className="text-xs text-gray-300">{g.count} transaction{g.count > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 text-xs flex-wrap">
                                    <div>
                                        <span className="text-gray-400">In:</span>{' '}
                                        <span className="text-emerald-300 font-semibold">+{fmtQty(g.in_qty)}</span>
                                        <span className="text-gray-400"> · BDT {fmt(g.in_value)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Out:</span>{' '}
                                        <span className="text-red-300 font-semibold">-{fmtQty(g.out_qty)}</span>
                                        <span className="text-gray-400"> · BDT {fmt(g.out_value)}</span>
                                    </div>
                                    <div className="border-l border-gray-600 pl-5">
                                        <span className="text-gray-400">Net:</span>{' '}
                                        <span className={`font-bold ${g.net_qty >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                            {g.net_qty >= 0 ? '+' : ''}{fmtQty(g.net_qty)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Transactions */}
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Date</th>
                                        <th className="px-4 py-2 text-left">Item</th>
                                        <th className="px-4 py-2 text-left">Type</th>
                                        <th className="px-4 py-2 text-right">Qty</th>
                                        <th className="px-4 py-2 text-right">Rate</th>
                                        <th className="px-4 py-2 text-right">Value</th>
                                        <th className="px-4 py-2 text-left">Warehouse</th>
                                        <th className="px-4 py-2 text-left">By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {g.transactions.map(tx => {
                                        const isIn = IN_TYPES.includes(tx.type) || Number(tx.quantity) > 0;
                                        const qty = Math.abs(Number(tx.quantity || 0));
                                        return (
                                            <tr key={tx.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2.5 text-gray-600">{formatDate(tx.transaction_date)}</td>
                                                <td className="px-4 py-2.5 font-medium text-gray-800">
                                                    {tx.inventory_item?.name}
                                                    {tx.inventory_item?.unit && <span className="text-xs text-gray-400 ml-1">({tx.inventory_item.unit})</span>}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[tx.type] ?? 'bg-gray-100 text-gray-700'}`}>
                                                        {TYPE_LABEL[tx.type] ?? tx.type}
                                                    </span>
                                                </td>
                                                <td className={`px-4 py-2.5 text-right font-semibold ${isIn ? 'text-emerald-700' : 'text-red-700'}`}>
                                                    {isIn ? '+' : '-'}{fmtQty(qty)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-gray-600">{tx.unit_rate ? fmt(tx.unit_rate) : '—'}</td>
                                                <td className="px-4 py-2.5 text-right text-gray-700 font-medium">{tx.total_value ? fmt(Math.abs(tx.total_value)) : '—'}</td>
                                                <td className="px-4 py-2.5 text-gray-500">{tx.warehouse?.name ?? '—'}</td>
                                                <td className="px-4 py-2.5 text-gray-500">{tx.created_by?.name ?? tx.createdBy?.name ?? '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}
