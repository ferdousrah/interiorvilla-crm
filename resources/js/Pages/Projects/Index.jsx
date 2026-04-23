import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatBDT, formatDate } from '@/utils/formatters';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const STATUS_COLORS = {
    planning: 'gray', in_progress: 'info', on_hold: 'warning', completed: 'success', cancelled: 'danger',
};

export default function ProjectsIndex({ projects, filters }) {
    const [status, setStatus] = useState(filters?.status ?? '');

    function filterByStatus(s) {
        setStatus(s);
        router.get(route('projects.index'), { status: s }, { preserveState: true, replace: true });
    }

    const allStatuses = ['', 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled'];

    return (
        <AppLayout>
            <Head title="Projects" />
            <PageHeader title="Projects" subtitle={`${(projects.data ?? projects).length} projects`}>
                <Link href={route('projects.create')} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> New Project
                </Link>
            </PageHeader>

            <div className="p-4 sm:p-6">
                <div className="flex gap-2 mb-4 flex-wrap">
                    {allStatuses.map(s => (
                        <button key={s} onClick={() => filterByStatus(s)}
                            className={`px-3 py-1 text-sm rounded-full border ${status === s ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                            {s ? s.replace('_', ' ') : 'All'}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(projects.data ?? projects).map(project => (
                        <div key={project.id} className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => router.get(route('projects.show', project.id))}>
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="font-mono text-xs text-primary-500">{project.code}</p>
                                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                                </div>
                                <Badge variant={STATUS_COLORS[project.status]}>{project.status.replace('_', ' ')}</Badge>
                            </div>
                            {project.client && <p className="text-sm text-gray-500 mb-2">{project.client.name}</p>}
                            {project.siteEngineer && (
                                <div className="flex flex-wrap gap-2 mb-2 text-[11px]">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700" title="Site Engineer">
                                        Site Engineer: {project.siteEngineer.name}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                                <span>{formatBDT(project.contract_value)}</span>
                                {project.end_date && <span>{formatDate(project.end_date)}</span>}
                            </div>
                            {project.progress_pct > 0 && (
                                <div className="mt-2">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Progress</span><span>{project.progress_pct}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${project.progress_pct}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {(projects.data ?? projects).length === 0 && (
                        <div className="col-span-3 text-center py-12 text-gray-400">No projects found.</div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
