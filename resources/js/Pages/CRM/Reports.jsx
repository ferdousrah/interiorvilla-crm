import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';

const STATUS_ORDER = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];

function StatCard({ label, value, sub, color = '' }) {
    return (
        <div className="card p-4 text-center">
            <p className="text-xs text-gray-500 uppercase font-medium">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    );
}

function ProgressBar({ value, max, color = 'bg-primary-500' }) {
    const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
    return (
        <div className="w-full bg-gray-100 rounded-full h-2">
            <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

export default function CrmReports({ summary, funnel, sources, lost_reasons, team, monthly }) {
    const maxSourceCount = Math.max(...(sources ?? []).map(s => s.count), 1);
    const maxTeamCount = Math.max(...(team ?? []).map(t => t.assigned), 1);

    return (
        <AppLayout>
            <Head title="CRM Reports" />
            <PageHeader title="CRM Reports" subtitle="Analytics & performance insights">
                <Link href={route('crm.dashboard')} className="btn btn-secondary text-sm">Dashboard</Link>
                <Link href={route('crm.index')} className="btn btn-secondary text-sm">Pipeline</Link>
            </PageHeader>

            <div className="p-4 sm:p-6 space-y-6">
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Leads (All Time)" value={summary?.total ?? 0} />
                    <StatCard label="Won" value={summary?.won ?? 0} color="text-green-600" sub="all time" />
                    <StatCard label="Lost" value={summary?.lost ?? 0} color="text-red-500" sub="all time" />
                    <StatCard
                        label="Win Rate"
                        value={`${summary?.win_rate ?? 0}%`}
                        color={(summary?.win_rate ?? 0) >= 30 ? 'text-green-600' : 'text-amber-600'}
                        sub="won / (won + lost)"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Conversion Funnel */}
                    <div className="card p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Conversion Funnel (All Time)</h3>
                        <div className="space-y-3">
                            {STATUS_ORDER.map(status => {
                                const row = (funnel ?? []).find(f => f.status === status) ?? { count: 0, value: 0 };
                                const maxCount = Math.max(...(funnel ?? []).map(f => f.count), 1);
                                return (
                                    <div key={status}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <div className="flex items-center gap-2">
                                                <Badge status={status} />
                                                <span className="text-gray-500 text-xs">{row.count}</span>
                                            </div>
                                            {row.value > 0 && (
                                                <span className="text-xs text-primary-600">{Number(row.value).toLocaleString('en-IN')}৳</span>
                                            )}
                                        </div>
                                        <ProgressBar value={row.count} max={maxCount}
                                            color={status === 'won' ? 'bg-green-500' : status === 'lost' ? 'bg-red-400' : 'bg-primary-400'} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Monthly trend */}
                    <div className="card p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Trend (Last 12 Months)</h3>
                        <div className="overflow-auto max-h-72">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-white">
                                    <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                                        <th className="text-left pb-2 pr-4">Month</th>
                                        <th className="text-right pb-2 pr-4">Created</th>
                                        <th className="text-right pb-2 pr-4">Won</th>
                                        <th className="text-right pb-2 pr-4">Lost</th>
                                        <th className="text-right pb-2">Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(monthly ?? []).map(row => (
                                        <tr key={row.month}>
                                            <td className="py-1.5 pr-4 text-gray-700">{row.month}</td>
                                            <td className="py-1.5 pr-4 text-right text-gray-600">{row.created}</td>
                                            <td className="py-1.5 pr-4 text-right text-green-600 font-medium">{row.won}</td>
                                            <td className="py-1.5 pr-4 text-right text-red-400">{row.lost}</td>
                                            <td className="py-1.5 text-right text-xs text-gray-400">
                                                {(row.won + row.lost) > 0
                                                    ? `${Math.round((row.won / (row.won + row.lost)) * 100)}%`
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {(monthly ?? []).length === 0 && (
                                        <tr><td colSpan={5} className="py-6 text-center text-gray-400">No data</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Source Analysis */}
                    <div className="card p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead Sources</h3>
                        <div className="space-y-3">
                            {(sources ?? []).map(s => (
                                <div key={s.source}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="capitalize text-gray-700">{s.source?.replace(/_/g, ' ')}</span>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-gray-400">{s.count} leads</span>
                                            {s.won > 0 && <span className="text-green-600 font-medium">{s.won} won</span>}
                                            {s.count > 0 && <span className="text-gray-400">{Math.round((s.won / s.count) * 100)}%</span>}
                                        </div>
                                    </div>
                                    <ProgressBar value={s.count} max={maxSourceCount} />
                                </div>
                            ))}
                            {(sources ?? []).length === 0 && <p className="text-sm text-gray-400">No data</p>}
                        </div>
                    </div>

                    {/* Lost Reasons */}
                    <div className="card p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Loss Reasons</h3>
                        <div className="space-y-2">
                            {(lost_reasons ?? []).length === 0 && <p className="text-sm text-gray-400">No lost leads yet.</p>}
                            {(lost_reasons ?? []).map((r, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                                        {r.count}
                                    </span>
                                    <span className="text-gray-600 text-xs leading-relaxed">{r.reason || 'No reason given'}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Team Performance */}
                    <div className="card p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Team Performance</h3>
                        <div className="space-y-3">
                            {(team ?? []).length === 0 && <p className="text-sm text-gray-400">No assigned leads.</p>}
                            {(team ?? []).map(member => (
                                <div key={member.user_id ?? member.name}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-700 font-medium truncate pr-2">{member.name ?? 'Unknown'}</span>
                                        <div className="flex items-center gap-2 text-xs flex-shrink-0">
                                            <span className="text-gray-400">{member.assigned}</span>
                                            <span className="text-green-600 font-medium">{member.won} won</span>
                                            {member.assigned > 0 && (
                                                <span className="text-gray-400">{Math.round((member.won / member.assigned) * 100)}%</span>
                                            )}
                                        </div>
                                    </div>
                                    <ProgressBar value={member.won} max={maxTeamCount} color="bg-green-400" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
