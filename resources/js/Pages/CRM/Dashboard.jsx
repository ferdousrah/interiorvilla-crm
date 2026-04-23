import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatDate, isPastDue } from '@/utils/formatters';
import { CalendarIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';

const ACTIVITY_ICONS = { call: '📞', email: '✉️', whatsapp: '💬', site_visit: '🏠', meeting: '🤝', note: '📝' };

const STATUS_ORDER = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];
const STATUS_LABELS = {
    new: 'New', contacted: 'Contacted', qualified: 'Qualified',
    proposal_sent: 'Proposal Sent', won: 'Won', lost: 'Lost',
};

function KpiCard({ label, value, sub, color = 'text-gray-900' }) {
    return (
        <div className="card p-5">
            <p className="text-xs text-gray-500 uppercase font-medium">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    );
}

export default function CrmDashboard({ stats, by_status, by_source, monthly_trend, recent_activities, upcoming_followups }) {
    const maxStatusCount = Math.max(...(by_status ?? []).map(s => s.count), 1);

    return (
        <AppLayout>
            <Head title="CRM Dashboard" />
            <PageHeader title="CRM Dashboard">
                <Link href={route('crm.leads.list')} className="btn btn-secondary text-sm">All Leads</Link>
                <Link href={route('crm.index')} className="btn btn-secondary text-sm">Pipeline</Link>
                <Link href={route('crm.reports')} className="btn btn-secondary text-sm">Reports</Link>
            </PageHeader>

            <div className="p-4 sm:p-6 space-y-6">
                {/* KPI Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <KpiCard label="Active Leads" value={stats.total_active} />
                    <KpiCard label="New This Month" value={stats.new_this_month} color="text-blue-600" />
                    <KpiCard label="Won This Month" value={stats.won_this_month} color="text-green-600" />
                    <KpiCard
                        label="Conversion Rate"
                        value={`${stats.conversion_rate}%`}
                        sub="won / (won+lost)"
                        color={stats.conversion_rate >= 30 ? 'text-green-600' : 'text-amber-600'}
                    />
                    <KpiCard
                        label="Pipeline Value"
                        value={`${Number(stats.pipeline_value ?? 0).toLocaleString('en-IN')}৳`}
                        sub="active leads only"
                        color="text-primary-600"
                    />
                    <KpiCard
                        label="Overdue Follow-ups"
                        value={stats.overdue_followups}
                        color={stats.overdue_followups > 0 ? 'text-red-600' : 'text-gray-900'}
                        sub={stats.overdue_followups > 0 ? 'needs attention' : 'all clear'}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Pipeline Funnel */}
                    <div className="sm:col-span-2 card p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Pipeline Funnel</h3>
                        <div className="space-y-3">
                            {STATUS_ORDER.map(status => {
                                const row = (by_status ?? []).find(s => s.status === status) ?? { count: 0, value: 0 };
                                const pct = maxStatusCount > 0 ? Math.round((row.count / maxStatusCount) * 100) : 0;
                                return (
                                    <div key={status}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <div className="flex items-center gap-2">
                                                <Badge status={status} />
                                                <span className="text-gray-500 text-xs">{row.count} leads</span>
                                            </div>
                                            {row.value > 0 && (
                                                <span className="text-xs text-primary-600 font-medium">
                                                    {Number(row.value).toLocaleString('en-IN')}৳
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${status === 'won' ? 'bg-green-500' : status === 'lost' ? 'bg-red-400' : 'bg-primary-500'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Source breakdown */}
                    <div className="card p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads by Source</h3>
                        <div className="space-y-2">
                            {(by_source ?? []).map(s => (
                                <div key={s.source} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 capitalize">{s.source?.replace(/_/g, ' ')}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">{s.count}</span>
                                        {s.won > 0 && (
                                            <span className="text-xs bg-green-100 text-green-700 rounded px-1.5 py-0.5">{s.won} won</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(by_source ?? []).length === 0 && <p className="text-sm text-gray-400">No data</p>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Monthly Trend */}
                    <div className="card p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Trend (Last 6 Months)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-gray-500 uppercase">
                                        <th className="text-left pb-2">Month</th>
                                        <th className="text-right pb-2">Created</th>
                                        <th className="text-right pb-2">Won</th>
                                        <th className="text-right pb-2">Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(monthly_trend ?? []).map(row => (
                                        <tr key={row.month}>
                                            <td className="py-1.5 text-gray-700">{row.month}</td>
                                            <td className="py-1.5 text-right text-gray-600">{row.created}</td>
                                            <td className="py-1.5 text-right text-green-600 font-medium">{row.won}</td>
                                            <td className="py-1.5 text-right text-xs text-gray-400">
                                                {row.created > 0 ? `${Math.round((row.won / row.created) * 100)}%` : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {(monthly_trend ?? []).length === 0 && (
                                        <tr><td colSpan={4} className="py-4 text-center text-gray-400">No data</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Upcoming follow-ups */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-700">Upcoming Follow-ups</h3>
                            <Link href={route('crm.follow-ups')} className="text-xs text-primary-600 hover:underline">View all</Link>
                        </div>
                        <div className="space-y-2">
                            {(upcoming_followups ?? []).length === 0 && (
                                <p className="text-sm text-gray-400">No upcoming follow-ups.</p>
                            )}
                            {(upcoming_followups ?? []).map(lead => (
                                <div key={lead.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-2">
                                    <div className="min-w-0">
                                        <Link href={route('crm.leads.show', lead.id)} className="text-sm font-medium hover:text-primary-600 truncate block">
                                            {lead.name}
                                        </Link>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                            <span>{lead.phone}</span>
                                            {lead.assignedTo && (
                                                <>
                                                    <span>·</span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                                                        {lead.assignedTo.name}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className={`text-xs font-medium ${isPastDue(lead.follow_up_at) ? 'text-red-600' : 'text-blue-600'}`}>
                                            {formatDate(lead.follow_up_at)}
                                        </p>
                                        <Badge status={lead.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="card p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Activities</h3>
                    <div className="divide-y divide-gray-50">
                        {(recent_activities ?? []).length === 0 && (
                            <p className="text-sm text-gray-400 py-2">No activities recorded yet.</p>
                        )}
                        {(recent_activities ?? []).map(act => (
                            <div key={act.id} className="flex items-start gap-3 py-2.5">
                                <span className="text-lg flex-shrink-0">{ACTIVITY_ICONS[act.type] ?? '📋'}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Link href={route('crm.leads.show', act.lead_id)} className="text-sm font-medium hover:text-primary-600 truncate">
                                            {act.lead?.name ?? 'Unknown Lead'}
                                        </Link>
                                        <span className="text-xs text-gray-400 capitalize">{act.type?.replace(/_/g, ' ')}</span>
                                        {act.performedBy && (
                                            <span className="text-xs text-gray-400">· by <span className="font-medium text-gray-600">{act.performedBy.name}</span></span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{act.summary}</p>
                                </div>
                                <p className="text-xs text-gray-400 flex-shrink-0">{formatDate(act.performed_at ?? act.created_at)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
