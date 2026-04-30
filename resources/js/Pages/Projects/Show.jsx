import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import FormField from '@/Components/FormField';
import { formatBDT, formatDate } from '@/utils/formatters';
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const STATUS_COLORS = { planning: 'gray', in_progress: 'info', on_hold: 'warning', completed: 'success', cancelled: 'danger' };
const TASK_COLORS = { todo: 'gray', in_progress: 'info', review: 'warning', done: 'success' };

function TaskForm({ project, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '', description: '', status: 'todo', priority: 'medium',
        assigned_to: '', due_date: '',
    });
    function submit(e) {
        e.preventDefault();
        post(route('projects.tasks.store', project.id), { onSuccess: () => { reset(); onClose(); } });
    }
    return (
        <form onSubmit={submit} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <FormField label="Title" error={errors.title} required>
                <input className="form-input text-sm" value={data.title} onChange={e => setData('title', e.target.value)} />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <FormField label="Priority" error={errors.priority}>
                    <select className="form-input text-sm" value={data.priority} onChange={e => setData('priority', e.target.value)}>
                        {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </FormField>
                <FormField label="Due Date" error={errors.due_date}>
                    <input type="date" className="form-input text-sm" value={data.due_date} onChange={e => setData('due_date', e.target.value)} />
                </FormField>
            </div>
            <div className="flex gap-2">
                <button type="submit" disabled={processing} className="btn btn-primary text-xs">{processing ? '…' : 'Add Task'}</button>
                <button type="button" onClick={onClose} className="btn text-xs">Cancel</button>
            </div>
        </form>
    );
}

function NoteForm({ project, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({ title: '', content: '', is_pinned: false });
    function submit(e) {
        e.preventDefault();
        post(route('projects.notes.store', project.id), { onSuccess: () => { reset(); onClose(); } });
    }
    return (
        <form onSubmit={submit} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <FormField label="Title" error={errors.title} required>
                <input className="form-input text-sm" value={data.title} onChange={e => setData('title', e.target.value)} />
            </FormField>
            <FormField label="Content" error={errors.content} required>
                <textarea className="form-input text-sm" rows={3} value={data.content} onChange={e => setData('content', e.target.value)} />
            </FormField>
            <div className="flex gap-2">
                <button type="submit" disabled={processing} className="btn btn-primary text-xs">{processing ? '…' : 'Save Note'}</button>
                <button type="button" onClick={onClose} className="btn text-xs">Cancel</button>
            </div>
        </form>
    );
}

export default function ProjectShow({ project, users }) {
    const [tab, setTab] = useState('overview');
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [showNoteForm, setShowNoteForm] = useState(false);

    const tasks = project.tasks ?? [];
    const phases = project.phases ?? [];
    const notes = project.notes ?? [];
    const members = project.members ?? [];

    function updateTaskStatus(taskId, status) {
        router.patch(route('projects.tasks.status', [project.id, taskId]), { status }, { preserveScroll: true });
    }

    function deleteTask(taskId) {
        if (confirm('Delete task?')) router.delete(route('projects.tasks.destroy', [project.id, taskId]), { preserveScroll: true });
    }

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'tasks', label: `Tasks (${tasks.length})` },
        { id: 'phases', label: `Phases (${phases.length})` },
        { id: 'notes', label: `Notes (${notes.length})` },
        { id: 'team', label: `Team (${members.length})` },
    ];

    return (
        <AppLayout>
            <Head title={project.name} />
            <PageHeader title={project.name} subtitle={project.code} back={route('projects.index')}>
                <Link href={route('projects.edit', project.id)} className="btn flex items-center gap-2">
                    <PencilIcon className="w-4 h-4" /> Edit
                </Link>
            </PageHeader>

            <div className="px-6 border-b border-gray-200">
                <nav className="flex gap-4">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`py-3 text-sm font-medium border-b-2 ${tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            {t.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-4 sm:p-6">
                {tab === 'overview' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="col-span-1 space-y-4">
                            <div className="card p-4">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Details</h3>
                                <dl className="space-y-2 text-sm">
                                    <div><dt className="text-gray-500">Status</dt><dd><Badge variant={STATUS_COLORS[project.status]}>{project.status.replace('_', ' ')}</Badge></dd></div>
                                    {project.client && <div><dt className="text-gray-500">Client</dt><dd className="font-medium">{project.client.name}</dd></div>}
                                    <div><dt className="text-gray-500">Contract Value</dt><dd className="font-semibold text-primary-600">{formatBDT(project.contract_value)}</dd></div>
                                    {project.start_date && <div><dt className="text-gray-500">Start</dt><dd>{formatDate(project.start_date)}</dd></div>}
                                    {project.end_date && <div><dt className="text-gray-500">End</dt><dd>{formatDate(project.end_date)}</dd></div>}
                                    {project.siteEngineer && <div><dt className="text-gray-500">Site Engineer</dt><dd className="font-medium">{project.siteEngineer.name}</dd></div>}
                                </dl>
                            </div>
                        </div>
                        <div className="col-span-2">
                            {project.description && (
                                <div className="card p-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</h3>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{project.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'tasks' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <button onClick={() => setShowTaskForm(!showTaskForm)} className="btn btn-primary flex items-center gap-2 text-sm">
                                <PlusIcon className="w-4 h-4" /> Add Task
                            </button>
                        </div>
                        {showTaskForm && <TaskForm project={project} onClose={() => setShowTaskForm(false)} />}
                        <div className="grid grid-cols-4 gap-4">
                            {TASK_STATUSES.map(status => (
                                <div key={status}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant={TASK_COLORS[status]}>{status.replace('_', ' ')}</Badge>
                                        <span className="text-xs text-gray-400">{tasks.filter(t => t.status === status).length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {tasks.filter(t => t.status === status).map(task => (
                                            <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-3 text-sm hover:shadow-sm">
                                                <p className="font-medium text-gray-900">{task.title}</p>
                                                {task.due_date && <p className="text-xs text-gray-400 mt-1">{formatDate(task.due_date)}</p>}
                                                <div className="flex gap-2 mt-2">
                                                    <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value)}
                                                        className="text-xs border-gray-200 rounded px-1 py-0.5 flex-1">
                                                        {TASK_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                                                    </select>
                                                    <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500">
                                                        <TrashIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'phases' && (
                    <div>
                        <div className="space-y-3">
                            {phases.length === 0 && <p className="text-gray-400 text-sm">No phases yet.</p>}
                            {phases.map(phase => (
                                <div key={phase.id} className="card p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{phase.name}</p>
                                        {phase.description && <p className="text-sm text-gray-500">{phase.description}</p>}
                                    </div>
                                    <Badge variant={phase.status === 'completed' ? 'success' : 'info'}>{phase.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'notes' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <button onClick={() => setShowNoteForm(!showNoteForm)} className="btn btn-primary flex items-center gap-2 text-sm">
                                <PlusIcon className="w-4 h-4" /> Add Note
                            </button>
                        </div>
                        {showNoteForm && <NoteForm project={project} onClose={() => setShowNoteForm(false)} />}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {notes.map(note => (
                                <div key={note.id} className={`card p-4 ${note.is_pinned ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                                    <div className="flex items-start justify-between">
                                        <h4 className="font-medium text-sm">{note.title}</h4>
                                        <div className="flex gap-2">
                                            {note.is_pinned && <span className="text-yellow-500 text-xs">📌</span>}
                                            <button onClick={() => router.delete(route('projects.notes.destroy', [project.id, note.id]), { preserveScroll: true })}
                                                className="text-gray-300 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{note.content}</p>
                                </div>
                            ))}
                            {notes.length === 0 && <p className="text-gray-400 text-sm">No notes yet.</p>}
                        </div>
                    </div>
                )}

                {tab === 'team' && (
                    <div>
                        <div className="space-y-2">
                            {members.map(member => (
                                <div key={member.id} className="card p-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm">{member.user?.name}</p>
                                        <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                    </div>
                                    <button onClick={() => router.delete(route('projects.members.destroy', [project.id, member.id]), { preserveScroll: true })}
                                        className="text-gray-300 hover:text-red-500 text-xs">Remove</button>
                                </div>
                            ))}
                            {members.length === 0 && <p className="text-gray-400 text-sm">No team members assigned.</p>}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
