import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Badge from '@/Components/Badge';
import { formatDate, formatBDT } from '@/utils/formatters';
import {
    BriefcaseIcon, UsersIcon, FunnelIcon, ExclamationCircleIcon,
    ArrowRightIcon, PhoneIcon, CalendarIcon, BanknotesIcon,
    ClipboardDocumentCheckIcon, BellAlertIcon, ChevronRightIcon,
    ClockIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';

const ACTIVITY_ICONS = { call: '📞', email: '✉️', whatsapp: '💬', site_visit: '🏠', meeting: '🤝', note: '📝' };

const PIE_COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#64748b', '#ec4899'];

const STATUS_COLORS = {
    new: '#64748b', contacted: '#3b82f6', qualified: '#8b5cf6',
    proposal_sent: '#f59e0b', won: '#10b981', lost: '#ef4444',
    survey: '#64748b', planning: '#3b82f6', design: '#8b5cf6', execution: '#f59e0b',
    finishing: '#06b6d4', handover: '#10b981', completed: '#22c55e',
    on_hold: '#f97316', cancelled: '#ef4444',
};

function fmt(n) { return Number(n || 0).toLocaleString('en-IN'); }

function KpiCard({ label, value, icon: Icon, gradient, shadow, href }) {
    const inner = (
        <div className="card p-4 sm:p-5 relative overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-gray-600 font-semibold uppercase tracking-wider">{label}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1.5 tracking-tight">{value}</p>
                </div>
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${gradient} ${shadow} shadow-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.2} />
                </div>
            </div>
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-[0.06] group-hover:opacity-[0.12] transition-opacity`} />
        </div>
    );
    return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

function TodayCard({ title, icon: Icon, iconBg, count, children, href, emptyText }) {
    return (
        <div className="card overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-lg ${iconBg} shadow-md flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" strokeWidth={2.2} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">{title}</h3>
                        {count > 0 && <p className="text-xs text-gray-500 font-medium mt-0.5">{count} item{count !== 1 ? 's' : ''}</p>}
                    </div>
                </div>
                {href && (
                    <Link href={href} className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-0.5 px-2 py-1 rounded-md hover:bg-primary-50 transition-colors">
                        All <ArrowRightIcon className="w-3 h-3" />
                    </Link>
                )}
            </div>
            <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto">
                {(!children || (Array.isArray(children) && children.length === 0)) ? (
                    <p className="px-4 py-8 text-sm text-center text-gray-400 italic">{emptyText || 'Nothing here'}</p>
                ) : children}
            </div>
        </div>
    );
}

export default function Dashboard({
    stats, todaysFollowups, overdueFollowups, todaysTasks, myPendingTasks,
    recentProjects, leadsByStatus, monthlyRevenue, leadsBySource,
    projectsByStatus, recentActivities, pendingQuotations,
}) {
    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

    // Chart data
    const pipelineData = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost']
        .map(s => ({ name: s.replace('_', ' '), value: leadsByStatus?.[s] ?? 0, fill: STATUS_COLORS[s] }));

    const sourceData = Object.entries(leadsBySource ?? {}).map(([k, v], i) => ({
        name: k.replace(/_/g, ' '), value: v, fill: PIE_COLORS[i % PIE_COLORS.length],
    }));

    const projectStatusData = Object.entries(projectsByStatus ?? {}).map(([k, v], i) => ({
        name: k.replace(/_/g, ' '), value: v, fill: STATUS_COLORS[k] ?? PIE_COLORS[i % PIE_COLORS.length],
    }));

    const allFollowups = [...(todaysFollowups ?? []), ...(overdueFollowups ?? [])];
    const urgentCount = (overdueFollowups?.length ?? 0) + (todaysTasks?.filter(t => t.due_date && new Date(t.due_date) < now)?.length ?? 0);

    return (
        <AppLayout>
            <Head title="Dashboard" />

            {/* Header */}
            <div className="px-4 sm:px-6 pt-6 pb-2">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{greeting}!</h1>
                        <p className="text-sm text-gray-600 font-medium mt-1 flex items-center gap-2 flex-wrap">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            {formatDate(now)}
                            {urgentCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    {urgentCount} urgent
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 sm:px-6 pb-8 space-y-6">

                {/* ── KPI Cards ────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                    <KpiCard label="Active Projects" value={stats.active_projects ?? 0} icon={BriefcaseIcon}
                        gradient="from-primary-500 to-primary-600" shadow="shadow-primary-500/20" href="/projects" />
                    <KpiCard label="Pending Leads" value={stats.pending_leads ?? 0} icon={FunnelIcon}
                        gradient="from-blue-500 to-blue-600" shadow="shadow-blue-500/20" href="/crm" />
                    <KpiCard label="Total Clients" value={stats.total_clients ?? 0} icon={UsersIcon}
                        gradient="from-emerald-500 to-emerald-600" shadow="shadow-emerald-500/20" href="/clients" />
                    <KpiCard label="Overdue Invoices" value={stats.overdue_invoices ?? 0} icon={ExclamationCircleIcon}
                        gradient="from-rose-500 to-rose-600" shadow="shadow-rose-500/20" href="/accounts/invoices" />
                    <KpiCard label="Receivable" value={`${fmt(stats.total_receivable)}৳`} icon={BanknotesIcon}
                        gradient="from-amber-500 to-amber-600" shadow="shadow-amber-500/20" href="/accounts" />
                    <KpiCard label="This Month" value={`${fmt(stats.monthly_revenue)}৳`} icon={CheckCircleIcon}
                        gradient="from-teal-500 to-teal-600" shadow="shadow-teal-500/20" />
                </div>

                {/* ── Today's Action Cards ─────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Today's Follow-ups */}
                    <TodayCard title="Today's Follow-ups" icon={BellAlertIcon} iconBg="bg-gradient-to-br from-amber-500 to-orange-500"
                        count={allFollowups.length} href="/crm/follow-ups" emptyText="No follow-ups today">
                        {allFollowups.map(lead => {
                            const overdue = lead.follow_up_at && new Date(lead.follow_up_at) < now;
                            return (
                                <Link key={lead.id} href={`/crm/leads/${lead.id}`}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${overdue ? 'bg-red-500 animate-pulse ring-2 ring-red-100' : 'bg-amber-400 ring-2 ring-amber-100'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{lead.name}</p>
                                        <p className="text-xs text-gray-600 font-medium">{lead.phone}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 space-y-1">
                                        <p className={`text-xs font-semibold ${overdue ? 'text-red-600' : 'text-amber-700'}`}>
                                            {overdue ? 'Overdue' : formatDate(lead.follow_up_at)}
                                        </p>
                                        <Badge status={lead.status} />
                                    </div>
                                </Link>
                            );
                        })}
                    </TodayCard>

                    {/* Today's Tasks */}
                    <TodayCard title="Today's Tasks" icon={ClipboardDocumentCheckIcon} iconBg="bg-gradient-to-br from-primary-500 to-violet-500"
                        count={(todaysTasks ?? []).length} emptyText="No tasks due today">
                        {(todaysTasks ?? []).map(task => {
                            const overdue = task.due_date && new Date(task.due_date) < now;
                            return (
                                <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${overdue ? 'bg-red-500 animate-pulse ring-2 ring-red-100' : 'bg-primary-500 ring-2 ring-primary-100'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                                        <p className="text-xs text-gray-600 font-medium truncate">{task.project?.name}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <Badge status={task.priority} />
                                        {overdue && <span className="text-[11px] text-red-600 font-semibold">Overdue</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </TodayCard>

                    {/* Pending Quotations */}
                    <TodayCard title="Pending Quotations" icon={BanknotesIcon} iconBg="bg-gradient-to-br from-teal-500 to-emerald-500"
                        count={(pendingQuotations ?? []).length} href="/quotations" emptyText="No pending quotes">
                        {(pendingQuotations ?? []).map(q => (
                            <Link key={q.id} href={`/quotations/${q.id}`}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{q.code}</p>
                                    <p className="text-xs text-gray-600 font-medium truncate">{q.client?.name ?? q.lead?.name}</p>
                                </div>
                                <div className="text-right flex-shrink-0 space-y-1">
                                    <p className="text-sm font-bold text-primary-700 tabular-nums">{fmt(q.grand_total)}৳</p>
                                    <Badge status={q.status} />
                                </div>
                            </Link>
                        ))}
                    </TodayCard>
                </div>

                {/* ── Charts Row ───────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Revenue vs Expense Chart */}
                    <div className="card p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900">Revenue vs Expenses</h3>
                            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md">Last 6 months</span>
                        </div>
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyRevenue ?? []} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                                    <defs>
                                        <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                        formatter={(v) => [`${fmt(v)}৳`, '']}
                                    />
                                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#gRevenue)" dot={{ r: 3, fill: '#6366f1' }} />
                                    <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" strokeWidth={2} fill="url(#gExpense)" dot={{ r: 3, fill: '#f43f5e' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Lead Pipeline Chart */}
                    <div className="card p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900">Lead Pipeline</h3>
                            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md">By status</span>
                        </div>
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={pipelineData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }} barSize={28} radius={[6, 6, 0, 0]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                                    <Bar dataKey="value" name="Leads" radius={[6, 6, 0, 0]}>
                                        {pipelineData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* ── Mini charts + Lists ──────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Lead Sources Pie */}
                    <div className="card p-4 hover:shadow-md transition-shadow duration-200">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Lead Sources</h3>
                        {sourceData.length > 0 ? (
                            <>
                                <div className="h-32 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={sourceData} cx="50%" cy="50%" innerRadius={30} outerRadius={55}
                                                dataKey="value" stroke="none" paddingAngle={3}>
                                                {sourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-1.5 mt-3">
                                    {sourceData.slice(0, 4).map((s, i) => (
                                        <div key={s.name} className="flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-2 text-gray-700 capitalize font-medium">
                                                <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: s.fill }} />
                                                {s.name}
                                            </span>
                                            <span className="font-bold text-gray-900 tabular-nums">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : <p className="text-sm text-gray-400 italic text-center py-8">No data</p>}
                    </div>

                    {/* Project Status Pie */}
                    <div className="card p-4 hover:shadow-md transition-shadow duration-200">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Project Status</h3>
                        {projectStatusData.length > 0 ? (
                            <>
                                <div className="h-32 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={30} outerRadius={55}
                                                dataKey="value" stroke="none" paddingAngle={3}>
                                                {projectStatusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-1.5 mt-3">
                                    {projectStatusData.slice(0, 4).map(s => (
                                        <div key={s.name} className="flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-2 text-gray-700 capitalize font-medium">
                                                <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: s.fill }} /> {s.name}
                                            </span>
                                            <span className="font-bold text-gray-900 tabular-nums">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : <p className="text-sm text-gray-400 italic text-center py-8">No data</p>}
                    </div>

                    {/* Recent Activity */}
                    <div className="card p-4 hover:shadow-md transition-shadow duration-200">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Recent Activity</h3>
                        <div className="space-y-3">
                            {(recentActivities ?? []).length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">No activity</p>}
                            {(recentActivities ?? []).map(act => (
                                <div key={act.id} className="flex items-start gap-2.5">
                                    <span className="text-base flex-shrink-0 mt-0.5">{ACTIVITY_ICONS[act.type] ?? '📋'}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-gray-900 truncate">{act.lead?.name}</p>
                                        <p className="text-xs text-gray-600 truncate">{act.summary}</p>
                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">{formatDate(act.performed_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* All Pending Tasks */}
                    <div className="card p-4 hover:shadow-md transition-shadow duration-200">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">My Pending Tasks</h3>
                        <div className="space-y-2.5">
                            {(myPendingTasks ?? []).length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">All done! 🎉</p>}
                            {(myPendingTasks ?? []).map(task => {
                                const overdue = task.due_date && new Date(task.due_date) < new Date();
                                return (
                                    <div key={task.id} className="flex items-start gap-2">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                            overdue ? 'bg-red-500 animate-pulse' : 'bg-primary-500'
                                        }`} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-gray-900 truncate">{task.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[11px] text-gray-500 font-medium truncate">{task.project?.name}</p>
                                                {task.due_date && (
                                                    <p className={`text-[11px] flex-shrink-0 font-medium ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                                                        {formatDate(task.due_date)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Active Projects ──────────────── */}
                <div className="card overflow-hidden hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 shadow-md flex items-center justify-center">
                                <BriefcaseIcon className="w-4 h-4 text-white" strokeWidth={2.2} />
                            </div>
                            <h2 className="font-bold text-gray-900 text-sm sm:text-base">Active Projects</h2>
                        </div>
                        <Link href="/projects" className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 px-2 py-1 rounded-md hover:bg-primary-50 transition-colors">
                            View all <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {(recentProjects ?? []).length === 0 ? (
                            <p className="px-5 py-10 text-sm text-center text-gray-400 italic">No active projects</p>
                        ) : (
                            (recentProjects ?? []).map(project => (
                                <Link key={project.id} href={`/projects/${project.id}`}
                                    className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">{project.name}</p>
                                        <p className="text-xs text-gray-600 font-medium truncate mt-0.5">
                                            {project.client?.name}{project.projectManager?.name && ` · ${project.projectManager.name}`}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0 space-y-1">
                                        <Badge status={project.status} />
                                        {project.contract_value > 0 && <p className="text-xs text-gray-700 font-semibold tabular-nums">{formatBDT(project.contract_value)}</p>}
                                    </div>
                                    <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 hidden sm:block" />
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
