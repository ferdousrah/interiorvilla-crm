import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import {
    PlusIcon, EyeIcon, PencilIcon, MagnifyingGlassIcon,
    ExclamationTriangleIcon, CubeIcon, XCircleIcon,
} from '@heroicons/react/24/outline';

function fmtQty(n) {
    return Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export default function InventoryItemsIndex({ items, categories = [], filters = {}, alerts = {} }) {
    const [ui, setUi] = useState({
        search: filters.search ?? '',
        category_id: filters.category_id ?? '',
        stock_status: filters.stock_status ?? '',
    });
    const setUiField = (k, v) => setUi(s => ({ ...s, [k]: v }));

    function applyFilter(e) {
        e?.preventDefault();
        router.get(route('inventory.items.index'), ui, { preserveState: true, replace: true });
    }

    function setStockFilter(value) {
        const next = { ...ui, stock_status: ui.stock_status === value ? '' : value };
        setUi(next);
        router.get(route('inventory.items.index'), next, { preserveState: true, replace: true });
    }

    function resetFilters() {
        const blank = { search: '', category_id: '', stock_status: '' };
        setUi(blank);
        router.get(route('inventory.items.index'), blank, { preserveState: true, replace: true });
    }

    const rows = items.data ?? items;

    return (
        <AppLayout>
            <Head title="Inventory Items" />
            <PageHeader title="Inventory Items" subtitle={`${alerts.total_active ?? rows.length} active items`}>
                <Link href={route('inventory.categories.index')} className="btn text-sm">Categories</Link>
                <Link href={route('inventory.warehouses.index')} className="btn text-sm">Warehouses</Link>
                <Link href={route('inventory.items.create')} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> New Item
                </Link>
            </PageHeader>

            <div className="p-4 sm:p-6 space-y-4">

                {/* Alert KPI strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                        type="button"
                        onClick={() => setStockFilter('')}
                        className={`card p-4 text-left ring-1 transition-all ${ui.stock_status === '' ? 'ring-primary-400 bg-primary-50/40' : 'ring-gray-100 hover:ring-primary-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <CubeIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Items</p>
                                <p className="text-xl font-bold text-gray-900">{alerts.total_active ?? 0}</p>
                            </div>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setStockFilter('low')}
                        className={`card p-4 text-left ring-1 transition-all ${ui.stock_status === 'low' ? 'ring-amber-400 bg-amber-50/60' : 'ring-gray-100 hover:ring-amber-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                                <ExclamationTriangleIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Low Stock</p>
                                <p className="text-xl font-bold text-amber-800">{alerts.low ?? 0}</p>
                                <p className="text-[11px] text-amber-600">At or below reorder level</p>
                            </div>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setStockFilter('out')}
                        className={`card p-4 text-left ring-1 transition-all ${ui.stock_status === 'out' ? 'ring-red-400 bg-red-50/60' : 'ring-gray-100 hover:ring-red-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                                <XCircleIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Out of Stock</p>
                                <p className="text-xl font-bold text-red-700">{alerts.out ?? 0}</p>
                                <p className="text-[11px] text-red-600">Zero or negative balance</p>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Filter bar */}
                <form onSubmit={applyFilter} className="card p-3 flex gap-2 flex-wrap items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text"
                            className="form-input pl-9 text-sm"
                            placeholder="Search by name or code…"
                            value={ui.search}
                            onChange={e => setUiField('search', e.target.value)} />
                    </div>
                    <select className="form-input text-sm min-w-[160px]"
                        value={ui.category_id}
                        onChange={e => { setUiField('category_id', e.target.value); router.get(route('inventory.items.index'), { ...ui, category_id: e.target.value }, { preserveState: true, replace: true }); }}>
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="submit" className="btn text-sm">Search</button>
                    {(ui.search || ui.category_id || ui.stock_status) && (
                        <button type="button" onClick={resetFilters} className="btn text-sm">Reset</button>
                    )}
                </form>

                {/* Items table */}
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Min (Reorder)</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map(item => {
                                const status = item.stock_status ?? 'ok';
                                const stockColor = status === 'out' ? 'text-red-700' : (status === 'low' ? 'text-amber-700' : 'text-emerald-700');
                                return (
                                    <tr key={item.id} className={`hover:bg-gray-50 ${status === 'out' ? 'bg-red-50/30' : status === 'low' ? 'bg-amber-50/30' : ''}`}>
                                        <td className="px-4 py-3 text-sm font-mono text-primary-600">{item.code}</td>
                                        <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{item.category?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                                        <td className={`px-4 py-3 text-sm text-right font-bold ${stockColor}`}>
                                            {fmtQty(item.current_stock)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-500">{fmtQty(item.reorder_level)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {status === 'out' && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase">
                                                    <XCircleIcon className="w-3 h-3" /> Out
                                                </span>
                                            )}
                                            {status === 'low' && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase">
                                                    <ExclamationTriangleIcon className="w-3 h-3" /> Low
                                                </span>
                                            )}
                                            {status === 'ok' && (
                                                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase">
                                                    OK
                                                </span>
                                            )}
                                            {!item.is_active && (
                                                <span className="ml-1 inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Link href={route('inventory.items.show', item.id)} className="text-gray-400 hover:text-primary-600" title="View"><EyeIcon className="w-4 h-4" /></Link>
                                                <Link href={route('inventory.items.edit', item.id)} className="text-gray-400 hover:text-yellow-600" title="Edit"><PencilIcon className="w-4 h-4" /></Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {rows.length === 0 && (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                                    No items match the current filters.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {items.links && items.links.length > 3 && (
                    <div className="flex justify-center gap-1">
                        {items.links.map((l, i) => (
                            l.url
                                ? <Link key={i} href={l.url}
                                      className={`px-3 py-1.5 text-xs rounded-md border ${l.active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'}`}
                                      dangerouslySetInnerHTML={{ __html: l.label }} />
                                : <span key={i}
                                      className="px-3 py-1.5 text-xs rounded-md border bg-gray-50 text-gray-400 border-gray-200"
                                      dangerouslySetInnerHTML={{ __html: l.label }} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
