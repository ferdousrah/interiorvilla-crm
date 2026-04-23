import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import ReportActions from '@/Components/ReportActions';
import { formatBDT } from '@/utils/formatters';
import { useState } from 'react';

export default function ProjectPL({ project, revenue = [], expenses = [], profit = 0, projects = [], filters = {} }) {
    const [projectId, setProjectId] = useState(filters?.project_id ?? '');

    function applyFilter(e) {
        e.preventDefault();
        router.get(route('accounts.reports.project-pl'), { project_id: projectId }, { preserveState: true, replace: true });
    }

    return (
        <AppLayout>
            <Head title="Project P&L" />
            <PageHeader title="Project Profit & Loss" back={route('accounts.reports.index')}>
                <ReportActions filters={{ project_id: projectId }} />
            </PageHeader>
            <div className="p-4 sm:p-6">
                <form onSubmit={applyFilter} className="flex gap-3 mb-4 items-end print:hidden">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Project</label>
                        <select className="form-input text-sm" value={projectId} onChange={e => setProjectId(e.target.value)}>
                            <option value="">Select Project…</option>
                            {(projects ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary text-sm">Generate</button>
                </form>

                {project && (
                    <div className="max-w-lg">
                        <div className="card p-6 space-y-3">
                            <h3 className="font-semibold">{project.name}</h3>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Contract Value</span><span>{formatBDT(project.contract_value)}</span></div>
                            <div className="border-t pt-3">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Revenue</h4>
                                {(revenue ?? []).map((r, i) => (
                                    <div key={i} className="flex justify-between text-sm text-green-700 mb-1">
                                        <span>{r.description}</span><span>{formatBDT(r.amount)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                                    <span>Total Revenue</span>
                                    <span className="text-green-700">{formatBDT((revenue ?? []).reduce((s, r) => s + parseFloat(r.amount), 0))}</span>
                                </div>
                            </div>
                            <div className="border-t pt-3">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Expenses</h4>
                                {(expenses ?? []).map((e, i) => (
                                    <div key={i} className="flex justify-between text-sm text-red-600 mb-1">
                                        <span>{e.description}</span><span>{formatBDT(e.amount)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                                    <span>Total Expenses</span>
                                    <span className="text-red-600">{formatBDT((expenses ?? []).reduce((s, e) => s + parseFloat(e.amount), 0))}</span>
                                </div>
                            </div>
                            <div className={`flex justify-between text-base font-bold border-t-2 pt-3 ${(profit ?? 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                <span>Net {(profit ?? 0) >= 0 ? 'Profit' : 'Loss'}</span>
                                <span>{formatBDT(Math.abs(profit ?? 0))}</span>
                            </div>
                        </div>
                    </div>
                )}
                {!project && <p className="text-gray-400 text-sm">Select a project to view P&L.</p>}
            </div>
        </AppLayout>
    );
}
