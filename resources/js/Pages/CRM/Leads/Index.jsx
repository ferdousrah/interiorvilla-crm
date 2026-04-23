import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatDate, isPastDue } from '@/utils/formatters';
import { PlusIcon, MagnifyingGlassIcon, CalendarIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

const STATUSES = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];
const SOURCES = ['referral', 'facebook', 'instagram', 'website', 'walk_in', 'cold_call', 'exhibition', 'other'];

export default function LeadsIndex({ leads, users, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');
    const [source, setSource] = useState(filters?.source ?? '');
    const [assignedTo, setAssignedTo] = useState(filters?.assigned_to ?? '');

    const items = leads?.data ?? [];
    const meta = leads?.meta ?? leads ?? {};

    function applyFilters(overrides = {}) {
        const params = { search, status, source, assigned_to: assignedTo, ...overrides };
        // Clean empty
        Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
        router.get(route('crm.leads.list'), params, { preserveState: true, replace: true });
    }

    function handleSearch(e) {
        e.preventDefault();
        applyFilters();
    }

    function clearFilters() {
        setSearch(''); setStatus(''); setSource(''); setAssignedTo('');
        router.get(route('crm.leads.list'), {}, { replace: true });
    }

    const hasFilters = search || status || source || assignedTo;

    return (
        <AppLayout>
            <Head title="All Leads" />
            <PageHeader title="All Leads" subtitle={`${meta.total ?? items.length} total`}>
                <Link href={route('crm.dashboard')} className="btn btn-secondary text-sm">Dashboard</Link>
                <Link href={route('crm.index')} className="btn btn-secondary text-sm">Pipeline</Link>
                <Link href={route('crm.leads.create')} className="btn btn-primary flex items-center gap-2 text-sm">
                    <PlusIcon className="w-4 h-4" /> New Lead
                </Link>
            </PageHeader>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                        <input
                            type="search"
                            placeholder="Name, phone, email…"
                            className="form-input pl-8 text-sm py-2 w-60"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="form-input text-sm py-2" value={status} onChange={e => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}>
                        <option value="">All Statuses</option>
                        {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>)}
                    </select>
                    <select className="form-input text-sm py-2" value={source} onChange={e => { setSource(e.target.value); applyFilters({ source: e.target.value }); }}>
                        <option value="">All Sources</option>
                        {SOURCES.map(s => <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>)}
                    </select>
                    <select className="form-input text-sm py-2" value={assignedTo} onChange={e => { setAssignedTo(e.target.value); applyFilters({ assigned_to: e.target.value }); }}>
                        <option value="">All Assignees</option>
                        {(users ?? []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <button type="submit" className="btn btn-secondary text-sm">Search</button>
                    {hasFilters && (
                        <button type="button" onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                    )}
                </form>
            </div>

            <div className="p-4 sm:p-6">
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Follow-up</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                                        {hasFilters ? 'No leads match your filters.' : 'No leads yet. Create the first one!'}
                                    </td>
                                </tr>
                            )}
                            {items.map(lead => (
                                <tr
                                    key={lead.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => router.get(route('crm.leads.show', lead.id))}
                                >
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{lead.name}</p>
                                        <p className="text-xs text-gray-400">{lead.code}</p>
                                        {lead.project_type && <p className="text-xs text-gray-400">{lead.project_type}</p>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-gray-700">{lead.phone}</p>
                                        {lead.email && <p className="text-xs text-gray-400 truncate max-w-[160px]">{lead.email}</p>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="capitalize text-gray-600">{lead.source?.replace(/_/g, ' ')}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge status={lead.status} />
                                    </td>
                                    <td className="px-4 py-3">
                                        {lead.estimated_value > 0
                                            ? <span className="font-medium text-primary-600">{Number(lead.estimated_value).toLocaleString('en-IN')}৳</span>
                                            : <span className="text-gray-300">—</span>
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {lead.assignedTo?.name ?? <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {lead.follow_up_at ? (
                                            <span className={`text-xs flex items-center gap-1 ${isPastDue(lead.follow_up_at) ? 'text-red-600 font-medium' : 'text-blue-600'}`}>
                                                <CalendarIcon className="w-3.5 h-3.5" />
                                                {formatDate(lead.follow_up_at)}
                                                {isPastDue(lead.follow_up_at) && ' ⚠'}
                                            </span>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-400">
                                        {formatDate(lead.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {leads?.links && (
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing {leads.from ?? 1}–{leads.to ?? items.length} of {leads.total} leads
                        </p>
                        <div className="flex gap-1">
                            {leads.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url || link.active}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    className={`px-3 py-1.5 text-sm rounded border ${link.active ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
