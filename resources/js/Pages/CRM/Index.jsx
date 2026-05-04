import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import FormField from '@/Components/FormField';
import { PlusIcon, PhoneIcon, CalendarIcon, XMarkIcon, MagnifyingGlassIcon, FunnelIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { formatDate, isPastDue } from '@/utils/formatters';

const STATUSES = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];
const SOURCES = ['referral', 'facebook', 'instagram', 'website', 'walk_in', 'cold_call', 'exhibition', 'other'];

const COLUMN_CONFIG = {
    new:           { label: 'New',           color: 'bg-slate-500',   light: 'bg-slate-50',   border: 'border-slate-200',  dot: 'bg-slate-400',   tab: 'text-slate-700 border-slate-500' },
    contacted:     { label: 'Meeting',       color: 'bg-blue-500',    light: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-400',    tab: 'text-blue-700 border-blue-500' },
    qualified:     { label: 'Qualified',     color: 'bg-violet-500',  light: 'bg-violet-50',  border: 'border-violet-200', dot: 'bg-violet-400',  tab: 'text-violet-700 border-violet-500' },
    proposal_sent: { label: 'Proposal',      color: 'bg-amber-500',   light: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-400',   tab: 'text-amber-700 border-amber-500' },
    won:           { label: 'Won',           color: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200',dot: 'bg-emerald-400', tab: 'text-emerald-700 border-emerald-500' },
    lost:          { label: 'Lost',          color: 'bg-rose-500',    light: 'bg-rose-50',    border: 'border-rose-200',   dot: 'bg-rose-400',    tab: 'text-rose-700 border-rose-500' },
};

/* ── Desktop Kanban Card ──────────────────── */
function LeadCard({ lead }) {
    const isOverdue = lead.follow_up_at && isPastDue(lead.follow_up_at);
    return (
        <div
            className="bg-white rounded-xl border border-gray-100 p-3.5 mb-2.5 hover:shadow-md hover:border-gray-200 cursor-pointer select-none transition-all duration-150 group"
            onClick={() => router.get(route('crm.leads.show', lead.id))}
            draggable
            onDragStart={e => { e.dataTransfer.setData('leadId', lead.id); e.dataTransfer.effectAllowed = 'move'; }}
        >
            <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-primary-700 transition-colors">{lead.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{lead.source?.replace(/_/g, ' ')}</p>
            <div className="my-2 border-t border-gray-50" />
            {lead.phone && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <PhoneIcon className="w-3 h-3 text-gray-400" /> {lead.phone}
                </div>
            )}
            {lead.follow_up_at && (
                <div className={`flex items-center gap-1.5 mt-1.5 text-xs rounded-md px-2 py-1 ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <CalendarIcon className="w-3 h-3 flex-shrink-0" />
                    {formatDate(lead.follow_up_at)}{isOverdue && ' · overdue'}
                </div>
            )}
            {(lead.estimated_value > 0 || lead.assignedTo) && (
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-50">
                    {lead.estimated_value > 0 ? <span className="text-xs font-semibold text-emerald-600">{Number(lead.estimated_value).toLocaleString('en-IN')}৳</span> : <span />}
                    {lead.assignedTo && <span className="text-xs text-gray-400 truncate max-w-[80px] text-right">{lead.assignedTo.name}</span>}
                </div>
            )}
        </div>
    );
}

/* ── Mobile Lead Row ──────────────────────── */
function MobileLeadRow({ lead }) {
    const isOverdue = lead.follow_up_at && isPastDue(lead.follow_up_at);
    return (
        <Link
            href={route('crm.leads.show', lead.id)}
            className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 active:bg-gray-50 transition-colors"
        >
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{lead.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{lead.phone}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400 capitalize">{lead.source?.replace(/_/g, ' ')}</span>
                </div>
                {lead.follow_up_at && (
                    <p className={`text-xs mt-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-blue-500'}`}>
                        Follow-up: {formatDate(lead.follow_up_at)}{isOverdue && ' ⚠'}
                    </p>
                )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {lead.estimated_value > 0 && (
                    <span className="text-xs font-semibold text-emerald-600">{Number(lead.estimated_value).toLocaleString('en-IN')}৳</span>
                )}
                {lead.assignedTo && (
                    <span className="text-[10px] text-gray-400 truncate max-w-[70px]">{lead.assignedTo.name}</span>
                )}
            </div>
            <ChevronRightIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </Link>
    );
}

/* ── Desktop Kanban Column ────────────────── */
function KanbanColumn({ status, leads, dragOver, onDragOver, onDragLeave, onDrop }) {
    const cfg = COLUMN_CONFIG[status];
    const totalValue = leads.reduce((s, l) => s + (parseFloat(l.estimated_value) || 0), 0);
    return (
        <div className="flex-1 min-w-[220px] flex flex-col">
            <div className={`rounded-xl mb-3 overflow-hidden border ${cfg.border}`}>
                <div className={`${cfg.color} h-1.5 w-full`} />
                <div className={`${cfg.light} px-3 py-2.5 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span className="text-sm font-semibold text-gray-700">{cfg.label}</span>
                    </div>
                    <span className="text-xs font-bold text-white bg-gray-400 rounded-full px-2 py-0.5 min-w-[22px] text-center">{leads.length}</span>
                </div>
                {totalValue > 0 && (
                    <div className={`${cfg.light} border-t ${cfg.border} px-3 py-1.5`}>
                        <span className="text-xs font-medium text-emerald-600">{totalValue.toLocaleString('en-IN')}৳</span>
                    </div>
                )}
            </div>
            <div
                className={`flex-1 rounded-xl p-2 min-h-[200px] transition-all duration-150 ${dragOver ? `${cfg.light} border-2 border-dashed ${cfg.border} shadow-inner` : 'bg-gray-50/60 border-2 border-transparent'}`}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            >
                {leads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
                {leads.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-24 text-gray-300">
                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center mb-1.5">
                            <PlusIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xs">Drop here</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Main Page ────────────────────────────── */
export default function CRMIndex({ leads, users, serviceCategories = {}, canAssign = false }) {
    const [showNewLead, setShowNewLead] = useState(false);
    const [wonModal, setWonModal]   = useState(null);
    const [lostModal, setLostModal] = useState(null);
    const [lostReason, setLostReason]   = useState('');
    const [projectName, setProjectName] = useState('');
    const [siteEngineerId, setSiteEngineerId] = useState('');
    const [createProject, setCreateProject] = useState(true);
    const [dragOver, setDragOver] = useState(null);
    const [mobileTab, setMobileTab] = useState('new');
    const [showFilters, setShowFilters] = useState(false);

    const [search, setSearch]             = useState('');
    const [filterSource, setFilterSource] = useState('');
    const [filterAssigned, setFilterAssigned] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'individual', company_name: '',
        name: '', phone: '', email: '', address: '', source: 'referral',
        service_group: '', service_type: '', estimated_value: '', assigned_to: '',
        follow_up_at: '', notes: '',
    });

    const serviceTypes = data.service_group ? (serviceCategories[data.service_group] ?? []) : [];

    const grouped = useMemo(() => {
        const base = {};
        STATUSES.forEach(s => { base[s] = (leads && leads[s]) ? Object.values(leads[s]) : []; });
        if (!search && !filterSource && !filterAssigned) return base;
        const filtered = {};
        STATUSES.forEach(s => {
            filtered[s] = base[s].filter(lead => {
                if (search) { const q = search.toLowerCase(); if (!lead.name?.toLowerCase().includes(q) && !lead.phone?.includes(q)) return false; }
                if (filterSource && lead.source !== filterSource) return false;
                if (filterAssigned && lead.assigned_to !== filterAssigned) return false;
                return true;
            });
        });
        return filtered;
    }, [leads, search, filterSource, filterAssigned]);

    const totalLeads  = STATUSES.reduce((s, st) => s + grouped[st].length, 0);
    const totalWon    = grouped['won'].length;
    const pipelineVal = ['new','contacted','qualified','proposal_sent'].reduce((s, st) => s + grouped[st].reduce((a, l) => a + (parseFloat(l.estimated_value)||0), 0), 0);
    const hasFilters  = search || filterSource || filterAssigned;

    function handleDrop(e, newStatus) {
        const leadId = e.dataTransfer.getData('leadId');
        if (!leadId) return; e.preventDefault(); setDragOver(null);
        if (newStatus === 'won') setWonModal({ leadId });
        else if (newStatus === 'lost') setLostModal({ leadId });
        else router.patch(route('crm.leads.status', leadId), { status: newStatus });
    }

    function confirmWon() {
        router.patch(
            route('crm.leads.status', wonModal.leadId),
            {
                status: 'won',
                create_project: createProject,
                project_name: projectName,
                site_engineer_id: siteEngineerId || null,
            },
            { onFinish: () => { setWonModal(null); setProjectName(''); setSiteEngineerId(''); } }
        );
    }
    function confirmLost() {
        if (!lostReason.trim()) return;
        router.patch(route('crm.leads.status', lostModal.leadId), { status: 'lost', lost_reason: lostReason },
            { onFinish: () => { setLostModal(null); setLostReason(''); } });
    }
    function submitNewLead(e) {
        e.preventDefault();
        post(route('crm.leads.store'), { onSuccess: () => { reset(); setShowNewLead(false); } });
    }

    return (
        <AppLayout>
            <Head title="CRM Pipeline" />

            {/* ── Header ──────────────────────────── */}
            <PageHeader title="CRM Pipeline">
                <Link href={route('crm.dashboard')} className="btn btn-secondary text-sm hidden sm:inline-flex">Dashboard</Link>
                <Link href={route('crm.leads.list')} className="btn btn-secondary text-sm hidden sm:inline-flex">List View</Link>
                <Link href={route('crm.follow-ups')} className="btn btn-secondary text-sm hidden sm:inline-flex">Follow-ups</Link>
                <button onClick={() => setShowNewLead(true)} className="btn btn-primary flex items-center gap-2 text-sm">
                    <PlusIcon className="w-4 h-4" /> <span className="hidden sm:inline">New Lead</span><span className="sm:hidden">Add</span>
                </button>
            </PageHeader>

            {/* ── Stats + Filter bar (desktop) ────── */}
            <div className="hidden sm:flex px-4 sm:px-6 py-3 border-b border-gray-100 bg-white items-center gap-4 flex-wrap">
                <div className="flex items-center gap-4 text-sm mr-2">
                    <span className="text-gray-400"><span className="font-semibold text-gray-700">{totalLeads}</span> leads</span>
                    <span className="text-gray-400"><span className="font-semibold text-emerald-600">{totalWon}</span> won</span>
                    {pipelineVal > 0 && <span className="text-gray-400"><span className="font-semibold text-primary-600">{pipelineVal.toLocaleString('en-IN')}৳</span> pipeline</span>}
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
                    <input type="search" placeholder="Search…" className="form-input pl-8 text-sm py-1.5 w-44" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-input text-sm py-1.5 w-36" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
                    <option value="">All Sources</option>
                    {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <select className="form-input text-sm py-1.5 w-36" value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}>
                    <option value="">All Assignees</option>
                    {(users ?? []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                {hasFilters && (
                    <button onClick={() => { setSearch(''); setFilterSource(''); setFilterAssigned(''); }}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"><XMarkIcon className="w-3.5 h-3.5" /> Clear</button>
                )}
                <Link href={route('crm.reports')} className="ml-auto text-xs text-primary-600 hover:underline">Reports →</Link>
            </div>

            {/* ── Mobile: stats + search + filter toggle ── */}
            <div className="sm:hidden px-4 py-2 border-b border-gray-100 bg-white space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-500"><span className="font-bold text-gray-800">{totalLeads}</span> leads</span>
                        <span className="text-gray-500"><span className="font-bold text-emerald-600">{totalWon}</span> won</span>
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)}
                        className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-primary-50 text-primary-600' : 'text-gray-400'}`}>
                        <FunnelIcon className="w-4 h-4" />
                    </button>
                </div>
                {/* Mobile search always visible */}
                <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                    <input type="search" placeholder="Search name or phone…" className="form-input pl-8 text-sm py-2 w-full"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {/* Collapsible filter panel */}
                {showFilters && (
                    <div className="flex gap-2 animate-fade-in">
                        <select className="form-input text-xs py-2 flex-1" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
                            <option value="">All Sources</option>
                            {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                        <select className="form-input text-xs py-2 flex-1" value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}>
                            <option value="">All Assignees</option>
                            {(users ?? []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* ── Mobile: Status Tab Bar ──────────── */}
            <div className="sm:hidden overflow-x-auto border-b border-gray-100 bg-white">
                <div className="flex px-2 min-w-max">
                    {STATUSES.map(status => {
                        const cfg = COLUMN_CONFIG[status];
                        const count = grouped[status].length;
                        const active = mobileTab === status;
                        return (
                            <button
                                key={status}
                                onClick={() => setMobileTab(status)}
                                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                                    active ? cfg.tab : 'text-gray-400 border-transparent'
                                }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${active ? cfg.dot : 'bg-gray-300'}`} />
                                {cfg.label}
                                <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${active ? `${cfg.light} ${cfg.tab.split(' ')[0]}` : 'bg-gray-100 text-gray-400'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Mobile: Lead List for selected tab ── */}
            <div className="sm:hidden">
                {grouped[mobileTab].length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-gray-300">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center mb-2">
                            <PlusIcon className="w-5 h-5" />
                        </div>
                        <p className="text-sm">No {COLUMN_CONFIG[mobileTab].label.toLowerCase()} leads</p>
                    </div>
                ) : (
                    grouped[mobileTab].map(lead => <MobileLeadRow key={lead.id} lead={lead} />)
                )}
            </div>

            {/* ── Desktop: Kanban Board ────────────── */}
            <div className="hidden sm:block p-4 sm:p-6 overflow-x-auto">
                <div className="flex gap-4 items-start" style={{ minWidth: `${STATUSES.length * 240}px` }}>
                    {STATUSES.map(status => (
                        <KanbanColumn key={status} status={status} leads={grouped[status]} dragOver={dragOver === status}
                            onDragOver={e => { e.preventDefault(); setDragOver(status); }}
                            onDragLeave={() => setDragOver(null)}
                            onDrop={e => handleDrop(e, status)} />
                    ))}
                </div>
            </div>

            {/* ── Modals ──────────────────────────── */}
            <Modal open={showNewLead} onClose={() => setShowNewLead(false)} title="New Lead" size="lg">
                <form onSubmit={submitNewLead} className="p-4 sm:p-6 space-y-4">
                    {/* Type toggle */}
                    <div className="inline-flex p-1 rounded-lg bg-gray-100 text-sm">
                        {['individual', 'corporate'].map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setData('type', t)}
                                className={`px-4 py-1.5 rounded-md font-semibold capitalize transition-colors ${
                                    data.type === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {data.type === 'corporate' && (
                            <FormField label="Company Name" error={errors.company_name} required className="sm:col-span-2">
                                <input className="form-input" value={data.company_name}
                                    onChange={e => setData('company_name', e.target.value)}
                                    placeholder="e.g. Richmond Group Ltd." />
                            </FormField>
                        )}
                        <FormField label={data.type === 'corporate' ? 'Contact Person Name' : 'Name'} error={errors.name} required>
                            <input className="form-input" value={data.name} onChange={e => setData('name', e.target.value)} />
                        </FormField>
                        <FormField label="Phone" error={errors.phone} required>
                            <input className="form-input" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                        </FormField>
                        <FormField label="Email" error={errors.email}>
                            <input type="email" className="form-input" value={data.email} onChange={e => setData('email', e.target.value)} />
                        </FormField>
                        <FormField label="Source" error={errors.source} required>
                            <select className="form-input" value={data.source} onChange={e => setData('source', e.target.value)}>
                                {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Service Category" error={errors.service_group}>
                            <select className="form-input" value={data.service_group} onChange={e => { setData('service_group', e.target.value); setData('service_type', ''); }}>
                                <option value="">Select category…</option>
                                {Object.keys(serviceCategories).map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Service Type" error={errors.service_type}>
                            <select className="form-input" value={data.service_type} onChange={e => setData('service_type', e.target.value)} disabled={!data.service_group}>
                                <option value="">{data.service_group ? 'Select service…' : 'Select category first'}</option>
                                {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Estimated Value (৳)" error={errors.estimated_value}>
                            <input type="number" className="form-input" value={data.estimated_value} onChange={e => setData('estimated_value', e.target.value)} />
                        </FormField>
                        {canAssign && (<FormField label="Assigned To" error={errors.assigned_to}>
                            <select className="form-input" value={data.assigned_to} onChange={e => setData('assigned_to', e.target.value)}>
                                <option value="">Unassigned</option>
                                {(users ?? []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </FormField>)}
                        <FormField label="Follow-up Date" error={errors.follow_up_at}>
                            <input type="datetime-local" className="form-input" value={data.follow_up_at} onChange={e => setData('follow_up_at', e.target.value)} />
                        </FormField>
                    </div>
                    <FormField label="Address" error={errors.address}>
                        <textarea className="form-input" rows={2} value={data.address} onChange={e => setData('address', e.target.value)} placeholder="Site address…" />
                    </FormField>
                    <FormField label="Notes" error={errors.notes}>
                        <textarea className="form-input" rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)} />
                    </FormField>
                    <div className="flex gap-3">
                        <button type="submit" disabled={processing} className="btn btn-primary flex-1 sm:flex-none">{processing ? 'Creating…' : 'Create Lead'}</button>
                        <button type="button" onClick={() => setShowNewLead(false)} className="btn flex-1 sm:flex-none">Cancel</button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!wonModal} onClose={() => setWonModal(null)} title="Move to Won" size="sm">
                <div className="p-4 sm:p-6 space-y-4">
                    <p className="text-sm text-gray-600">Create a project for this lead?</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-primary-600" checked={createProject} onChange={e => setCreateProject(e.target.checked)} />
                        <span className="text-sm">Create project now</span>
                    </label>
                    {createProject && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Project Name <span className="text-red-500">*</span>
                                </label>
                                <input className="form-input w-full" value={projectName}
                                    onChange={e => setProjectName(e.target.value)}
                                    placeholder="e.g. Richmond Group Office Interior" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Site Engineer
                                </label>
                                <select className="form-input w-full" value={siteEngineerId}
                                    onChange={e => setSiteEngineerId(e.target.value)}>
                                    <option value="">— Unassigned —</option>
                                    {(users ?? []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <p className="text-[11px] text-gray-500 mt-1">Who will be responsible for execution on site.</p>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button onClick={confirmWon} className="btn btn-primary flex-1 sm:flex-none">Confirm Won</button>
                        <button onClick={() => setWonModal(null)} className="btn flex-1 sm:flex-none">Cancel</button>
                    </div>
                </div>
            </Modal>

            <Modal open={!!lostModal} onClose={() => setLostModal(null)} title="Move to Lost" size="sm">
                <div className="p-4 sm:p-6 space-y-4">
                    <textarea className="form-input" rows={3} value={lostReason} onChange={e => setLostReason(e.target.value)} placeholder="Reason for loss *" />
                    <div className="flex gap-3">
                        <button onClick={confirmLost} disabled={!lostReason.trim()} className="btn btn-danger flex-1 sm:flex-none">Mark Lost</button>
                        <button onClick={() => setLostModal(null)} className="btn flex-1 sm:flex-none">Cancel</button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
