import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatDate } from '@/utils/formatters';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const STATUSES = ['draft', 'sent', 'under_review', 'approved', 'rejected', 'expired', 'converted'];

const STATUS_LABELS = {
    draft: 'Draft', sent: 'Sent', under_review: 'Under Review',
    approved: 'Approved', rejected: 'Rejected', expired: 'Expired', converted: 'Converted',
};

export default function QuotationsIndex({ quotations, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');

    const items = quotations?.data ?? [];

    function applyFilters(overrides = {}) {
        const params = { search, status, ...overrides };
        Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
        router.get(route('quotations.index'), params, { preserveState: true, replace: true });
    }

    function handleSearch(e) {
        e.preventDefault();
        applyFilters();
    }

    return (
        <AppLayout>
            <Head title="Quotations" />
            <PageHeader title="Quotations" subtitle={`${quotations?.total ?? items.length} total`}>
                <Link href={route('quotations.create')} className="btn btn-primary flex items-center gap-2 text-sm">
                    <PlusIcon className="w-4 h-4" /> New Quotation
                </Link>
            </PageHeader>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                        <input
                            type="search"
                            placeholder="Code, subject, client…"
                            className="form-input pl-8 text-sm py-2 w-64"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="form-input text-sm py-2" value={status}
                        onChange={e => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}>
                        <option value="">All Statuses</option>
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                    <button type="submit" className="btn btn-secondary text-sm">Search</button>
                    {(search || status) && (
                        <button type="button" onClick={() => { setSearch(''); setStatus(''); router.get(route('quotations.index'), {}, { replace: true }); }}
                            className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                    )}
                </form>
            </div>

            <div className="p-4 sm:p-6">
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quotation</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                                        No quotations yet.{' '}
                                        <Link href={route('quotations.create')} className="text-primary-600 hover:underline">Create the first one</Link>
                                    </td>
                                </tr>
                            )}
                            {items.map(q => (
                                <tr key={q.id} className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => router.get(route('quotations.show', q.id))}>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{q.display_code || q.code}</p>
                                        {q.project && <p className="text-xs text-gray-400">{q.project.name}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{q.client?.name}</td>
                                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{q.subject}</td>
                                    <td className="px-4 py-3"><Badge status={q.status} /></td>
                                    <td className="px-4 py-3 text-right font-semibold text-primary-700">
                                        {Number(q.grand_total).toLocaleString('en-IN')}৳
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">
                                        {q.createdBy?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {q.valid_until ? formatDate(q.valid_until) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(q.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {quotations?.links && (
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing {quotations.from}–{quotations.to} of {quotations.total}
                        </p>
                        <div className="flex gap-1">
                            {quotations.links.map((link, i) => (
                                <button key={i} disabled={!link.url || link.active}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    className={`px-3 py-1.5 text-sm rounded border ${link.active ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
