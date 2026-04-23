import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatDate } from '@/utils/formatters';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function fmt(n) {
    return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CostEstimationsIndex({ estimations, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');
    const items = estimations?.data ?? [];

    function applyFilters(overrides = {}) {
        const params = { search, status, ...overrides };
        Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
        router.get(route('cost-estimations.index'), params, { preserveState: true, replace: true });
    }

    return (
        <AppLayout>
            <Head title="Cost Estimations" />
            <PageHeader title="Cost Estimations" subtitle={`${estimations?.total ?? items.length} total`}>
                <Link href={route('cost-estimations.create')} className="btn btn-primary flex items-center gap-2 text-sm">
                    <PlusIcon className="w-4 h-4" /> New Estimation
                </Link>
            </PageHeader>

            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                <form onSubmit={e => { e.preventDefault(); applyFilters(); }} className="flex items-center gap-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                        <input type="search" placeholder="Search code, title…" className="form-input pl-8 text-sm py-2 w-60"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="form-input text-sm py-2" value={status}
                        onChange={e => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}>
                        <option value="">All</option>
                        <option value="draft">Draft</option>
                        <option value="final">Final</option>
                    </select>
                    <button type="submit" className="btn btn-secondary text-sm">Search</button>
                </form>
            </div>

            <div className="p-4 sm:p-6">
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead / Client</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Estimated Cost</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Markup</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Suggested Quote</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {items.length === 0 && (
                                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                                    No cost estimations yet.{' '}
                                    <Link href={route('cost-estimations.create')} className="text-primary-600 hover:underline">Create one</Link>
                                </td></tr>
                            )}
                            {items.map(ce => (
                                <tr key={ce.id} className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => router.get(route('cost-estimations.show', ce.id))}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{ce.code}</td>
                                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{ce.title}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {ce.client?.name ?? ce.lead?.name ?? <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3"><Badge status={ce.status} /></td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-700">{fmt(ce.total_estimated)}৳</td>
                                    <td className="px-4 py-3 text-right text-sm text-green-600">{ce.markup_pct}%</td>
                                    <td className="px-4 py-3 text-right font-bold text-primary-700">{fmt(ce.suggested_quote)}৳</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(ce.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
