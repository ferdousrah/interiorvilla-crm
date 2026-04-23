import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const ACTION_COLORS = {
    created:  'bg-emerald-100 text-emerald-700',
    updated:  'bg-blue-100 text-blue-700',
    deleted:  'bg-red-100 text-red-700',
    restored: 'bg-violet-100 text-violet-700',
    login:    'bg-amber-100 text-amber-700',
    logout:   'bg-gray-100 text-gray-600',
};

const ACTION_ICONS = {
    created: '✨', updated: '✏️', deleted: '🗑️', restored: '♻️', login: '🔑', logout: '🚪',
};

function modelShortName(type) {
    if (!type) return '';
    return type.split('\\').pop().replace(/([A-Z])/g, ' $1').trim();
}

function DiffView({ oldValues, newValues }) {
    if (!oldValues && !newValues) return null;
    const keys = [...new Set([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})])];
    if (keys.length === 0) return null;

    return (
        <div className="mt-2 text-xs bg-gray-50 rounded-lg p-3 space-y-1 border border-gray-100">
            {keys.map(key => {
                const oldVal = oldValues?.[key];
                const newVal = newValues?.[key];
                const changed = oldVal !== undefined && newVal !== undefined;
                return (
                    <div key={key} className="flex items-start gap-2">
                        <span className="text-gray-400 font-mono w-28 flex-shrink-0 truncate">{key}</span>
                        {changed ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-red-500 line-through truncate max-w-[120px]">{String(oldVal ?? '—')}</span>
                                <span className="text-gray-400">→</span>
                                <span className="text-emerald-600 font-medium truncate max-w-[120px]">{String(newVal ?? '—')}</span>
                            </div>
                        ) : oldVal === undefined ? (
                            <span className="text-emerald-600">{String(newVal)}</span>
                        ) : (
                            <span className="text-red-500 line-through">{String(oldVal)}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function LogRow({ log }) {
    const [expanded, setExpanded] = useState(false);
    const hasDiff = log.old_values || log.new_values;
    const actionColor = ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600';

    return (
        <div className="px-4 sm:px-5 py-3 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">{ACTION_ICONS[log.action] ?? '📋'}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{log.user_name}</span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${actionColor}`}>{log.action}</span>
                        {log.model_type && (
                            <span className="text-xs text-gray-500">{modelShortName(log.model_type)}</span>
                        )}
                    </div>
                    {log.model_label && (
                        <p className="text-sm text-gray-600 mt-0.5 truncate">{log.model_label}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                        <span>{new Date(log.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {log.ip_address && <span>IP: {log.ip_address}</span>}
                    </div>
                    {expanded && hasDiff && <DiffView oldValues={log.old_values} newValues={log.new_values} />}
                </div>
                {hasDiff && (
                    <button onClick={() => setExpanded(!expanded)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 flex-shrink-0">
                        {expanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );
}

export default function AuditLogPage({ logs, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [action, setAction] = useState(filters?.action ?? '');
    const items = logs?.data ?? [];

    function applyFilters(overrides = {}) {
        const params = { search, action, ...overrides };
        Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
        router.get(route('settings.audit-log'), params, { preserveState: true, replace: true });
    }

    return (
        <AppLayout>
            <Head title="Audit Log" />
            <PageHeader title="Audit Log" subtitle="Track all system changes" />

            <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50">
                <form onSubmit={e => { e.preventDefault(); applyFilters(); }} className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                        <input type="search" placeholder="Search user, action, record…" className="form-input pl-8 text-sm py-2 w-64"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="form-input text-sm py-2" value={action}
                        onChange={e => { setAction(e.target.value); applyFilters({ action: e.target.value }); }}>
                        <option value="">All Actions</option>
                        <option value="created">Created</option>
                        <option value="updated">Updated</option>
                        <option value="deleted">Deleted</option>
                        <option value="login">Login</option>
                        <option value="logout">Logout</option>
                    </select>
                    <button type="submit" className="btn btn-secondary text-sm">Search</button>
                    {(search || action) && (
                        <button type="button" onClick={() => { setSearch(''); setAction(''); router.get(route('settings.audit-log'), {}, { replace: true }); }}
                            className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                    )}
                    <span className="ml-auto text-xs text-gray-400">{logs?.total ?? 0} entries</span>
                </form>
            </div>

            <div className="p-4 sm:p-6 max-w-5xl">
                <div className="card overflow-hidden divide-y divide-gray-50">
                    {items.length === 0 && (
                        <p className="px-5 py-12 text-center text-gray-400">No audit log entries found.</p>
                    )}
                    {items.map(log => <LogRow key={log.id} log={log} />)}
                </div>

                {logs?.links && (
                    <div className="mt-4 flex justify-center gap-1">
                        {logs.links.map((link, i) => (
                            <button key={i} disabled={!link.url || link.active}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                className={`px-3 py-1.5 text-sm rounded border ${link.active ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
