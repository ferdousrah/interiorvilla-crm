import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import { PrinterIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function fmt(n) {
    return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtQty(n) {
    return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function StockReport({ warehouses = [], rows = [], generatedAt, company = {} }) {
    const [search, setSearch] = useState('');
    const [showLowOnly, setShowLowOnly] = useState(false);
    const [hideZero, setHideZero] = useState(false);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter(r => {
            if (showLowOnly && !r.low_stock) return false;
            if (hideZero && r.total_qty === 0) return false;
            if (!q) return true;
            return r.name?.toLowerCase().includes(q)
                || r.code?.toLowerCase().includes(q)
                || r.sku?.toLowerCase().includes(q)
                || r.category?.toLowerCase().includes(q);
        });
    }, [rows, search, showLowOnly, hideZero]);

    const totals = useMemo(() => ({
        items: filtered.length,
        qty:   filtered.reduce((s, r) => s + r.total_qty, 0),
        value: filtered.reduce((s, r) => s + r.total_value, 0),
        low:   filtered.filter(r => r.low_stock).length,
    }), [filtered]);

    const generated = generatedAt ? new Date(generatedAt) : new Date();

    return (
        <AppLayout>
            <Head title="Current Stock Report" />

            <div className="print:hidden">
                <PageHeader title="Current Stock Report" subtitle="Live balance per item per warehouse">
                    <button onClick={() => window.print()} className="btn btn-primary flex items-center gap-2">
                        <PrinterIcon className="w-4 h-4" /> Print
                    </button>
                </PageHeader>

                {/* Filters */}
                <div className="px-4 sm:px-6 pt-4">
                    <div className="card p-4 flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px] max-w-md">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search item / code / SKU / category…"
                                className="form-input pl-9 text-sm w-full"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={showLowOnly} onChange={e => setShowLowOnly(e.target.checked)} className="rounded" />
                            Low stock only
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={hideZero} onChange={e => setHideZero(e.target.checked)} className="rounded" />
                            Hide zero balances
                        </label>
                        <div className="ml-auto text-xs text-gray-600">
                            <span className="font-bold text-gray-900">{totals.items}</span> items
                            {totals.low > 0 && (
                                <span className="ml-3 inline-flex items-center gap-1 text-rose-600 font-semibold">
                                    <ExclamationTriangleIcon className="w-3.5 h-3.5" /> {totals.low} low
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Printable area */}
            <div className="p-4 sm:p-6 print:p-0">
                <div className="bg-white p-6 sm:p-8 print:p-0 max-w-[1400px] mx-auto">

                    {/* Print header — only visible when printing */}
                    <div className="hidden print:block mb-5">
                        <div className="flex items-start justify-between border-b border-gray-300 pb-3">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{company.name || 'Interior Villa'}</h1>
                                {company.address && <p className="text-xs text-gray-600 mt-0.5">{company.address}</p>}
                            </div>
                            {company.logo && (
                                <img src={company.logo} alt="" className="max-h-14 object-contain" />
                            )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <h2 className="text-base font-bold text-gray-900">Current Stock Report</h2>
                            <p className="text-xs text-gray-600">
                                Generated: {generated.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                        </div>
                    </div>

                    {/* On-screen header */}
                    <div className="hidden sm:flex items-center justify-between mb-3 text-xs text-gray-500 print:hidden">
                        <span>As of {generated.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        <span>
                            Total qty: <strong className="text-gray-900 tabular-nums">{fmtQty(totals.qty)}</strong>
                            {' · '}
                            Total value: <strong className="text-gray-900 tabular-nums">৳ {fmt(totals.value)}</strong>
                        </span>
                    </div>

                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="min-w-full text-sm border border-gray-300 border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-xs font-bold text-gray-700 uppercase">
                                    <th className="border border-gray-300 px-2 py-2 text-left w-10">#</th>
                                    <th className="border border-gray-300 px-3 py-2 text-left">Item</th>
                                    <th className="border border-gray-300 px-3 py-2 text-left w-28">Code / SKU</th>
                                    <th className="border border-gray-300 px-3 py-2 text-left w-32">Category</th>
                                    <th className="border border-gray-300 px-2 py-2 text-center w-14">Unit</th>
                                    {warehouses.map(w => (
                                        <th key={w.id} className="border border-gray-300 px-3 py-2 text-right w-24" title={w.name}>
                                            {w.name}
                                        </th>
                                    ))}
                                    <th className="border border-gray-300 px-3 py-2 text-right w-24 bg-gray-200">Total</th>
                                    <th className="border border-gray-300 px-3 py-2 text-right w-24">Reorder</th>
                                    <th className="border border-gray-300 px-3 py-2 text-right w-28">Value (৳)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={8 + warehouses.length} className="border border-gray-300 px-4 py-10 text-center text-gray-400 italic">
                                            No items match the current filters.
                                        </td>
                                    </tr>
                                ) : filtered.map((r, i) => (
                                    <tr key={r.id} className={r.low_stock ? 'bg-rose-50' : ''}>
                                        <td className="border border-gray-300 px-2 py-1.5 text-center text-gray-500 text-xs">{i + 1}</td>
                                        <td className="border border-gray-300 px-3 py-1.5">
                                            <div className="font-semibold text-gray-900 leading-tight">{r.name}</div>
                                            {r.low_stock && (
                                                <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mt-0.5">
                                                    Low stock — below reorder
                                                </div>
                                            )}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-1.5 text-xs text-gray-700">
                                            <div className="font-mono">{r.code}</div>
                                            {r.sku && <div className="text-gray-500">{r.sku}</div>}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-1.5 text-xs text-gray-600">{r.category ?? '—'}</td>
                                        <td className="border border-gray-300 px-2 py-1.5 text-center text-xs">{r.unit}</td>
                                        {warehouses.map(w => {
                                            const v = r.per_warehouse[w.id] ?? 0;
                                            return (
                                                <td key={w.id} className={`border border-gray-300 px-3 py-1.5 text-right tabular-nums text-xs ${v === 0 ? 'text-gray-300' : 'text-gray-800'}`}>
                                                    {v === 0 ? '—' : fmtQty(v)}
                                                </td>
                                            );
                                        })}
                                        <td className={`border border-gray-300 px-3 py-1.5 text-right tabular-nums font-bold ${r.low_stock ? 'text-rose-700' : 'text-gray-900'}`}>
                                            {fmtQty(r.total_qty)}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-1.5 text-right tabular-nums text-xs text-gray-600">
                                            {r.reorder_level > 0 ? fmtQty(r.reorder_level) : '—'}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-1.5 text-right tabular-nums text-xs">
                                            {r.total_value > 0 ? fmt(r.total_value) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {filtered.length > 0 && (
                                <tfoot>
                                    <tr className="bg-gray-100 font-bold text-sm">
                                        <td colSpan={5 + warehouses.length} className="border border-gray-300 px-3 py-2 text-right">TOTAL</td>
                                        <td className="border border-gray-300 px-3 py-2 text-right tabular-nums">{fmtQty(totals.qty)}</td>
                                        <td className="border border-gray-300 px-3 py-2"></td>
                                        <td className="border border-gray-300 px-3 py-2 text-right tabular-nums">৳ {fmt(totals.value)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* Print footer */}
                    <div className="hidden print:block mt-6 pt-2 border-t border-gray-300 text-[10px] text-gray-500 flex justify-between">
                        <span>{company.name || 'Interior Villa'} — Stock Report</span>
                        <span>Printed {new Date().toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            {/* Print-specific styles */}
            <style>{`
                @media print {
                    @page { size: A4 landscape; margin: 10mm; }
                    body { background: white !important; }
                    .sidebar, .topbar, nav, header, .btn, button { display: none !important; }
                    main { padding: 0 !important; overflow: visible !important; }
                    .card { box-shadow: none !important; border: none !important; }
                    table { font-size: 10px !important; }
                    table th, table td { padding: 4px 6px !important; }
                }
            `}</style>
        </AppLayout>
    );
}
