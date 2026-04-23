import { Head, router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import FormField from '@/Components/FormField';
import { formatDate, isPastDue } from '@/utils/formatters';
import { PlusIcon, TrashIcon, CalendarIcon, FolderIcon } from '@heroicons/react/24/outline';

const STATUSES = ['pending', 'in_progress', 'review', 'done', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const STATUS_CFG = {
    pending:     { label: 'To Do',       color: 'bg-slate-500',   light: 'bg-slate-50',   border: 'border-slate-200',  dot: 'bg-slate-400' },
    in_progress: { label: 'In Progress', color: 'bg-blue-500',    light: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-400' },
    review:      { label: 'Review',      color: 'bg-amber-500',   light: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-400' },
    done:        { label: 'Done',        color: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200',dot: 'bg-emerald-400' },
    cancelled:   { label: 'Cancelled',   color: 'bg-rose-500',    light: 'bg-rose-50',    border: 'border-rose-200',   dot: 'bg-rose-400' },
};

const PRIORITY_COLORS = {
    low:    'text-gray-500 bg-gray-100',
    medium: 'text-blue-600 bg-blue-50',
    high:   'text-amber-700 bg-amber-50',
    urgent: 'text-red-700 bg-red-50',
};

export default function TasksIndex(props) {
    const tasks     = props.tasks || {};
    const projects  = props.projects || [];
    const users     = props.users || [];
    const filters   = props.filters || {};
    const canAssign = !!props.canAssign;

    // Combined UI state (keeps hook count stable)
    const [ui, setUi] = useState({
        modalOpen: false,
        editTask: null,
        dragOver: null,
        filter: filters.filter || 'all',
    });
    const setUiField = (k, v) => setUi(s => ({ ...s, [k]: v }));

    const form = useForm({
        title: '', description: '', project_id: '', assigned_to: '',
        priority: 'medium', status: 'pending', start_date: '', due_date: '',
    });

    const grouped = useMemo(() => {
        const base = {};
        STATUSES.forEach(s => {
            let v = null;
            if (tasks && typeof tasks === 'object' && !Array.isArray(tasks)) v = tasks[s];
            base[s] = Array.isArray(v) ? v : [];
        });
        return base;
    }, [tasks]);

    const totalTasks = STATUSES.reduce((n, s) => n + grouped[s].length, 0);
    let overdueTasks = 0;
    ['pending', 'in_progress', 'review'].forEach(s => {
        (grouped[s] || []).forEach(t => {
            if (t && t.due_date && isPastDue(t.due_date)) overdueTasks++;
        });
    });

    function openNew(status) {
        form.clearErrors();
        form.setData({
            title: '', description: '', project_id: '', assigned_to: '',
            priority: 'medium', status: status || 'pending', start_date: '', due_date: '',
        });
        setUi(s => ({ ...s, modalOpen: true, editTask: null }));
    }

    function openEdit(task) {
        form.clearErrors();
        form.setData({
            title: task.title || '',
            description: task.description || '',
            project_id: task.project_id || '',
            assigned_to: task.assigned_to || '',
            priority: task.priority || 'medium',
            status: task.status || 'pending',
            start_date: task.start_date ? String(task.start_date).substring(0, 10) : '',
            due_date: task.due_date ? String(task.due_date).substring(0, 10) : '',
        });
        setUi(s => ({ ...s, modalOpen: true, editTask: task }));
    }

    function closeModal() {
        setUi(s => ({ ...s, modalOpen: false, editTask: null }));
    }

    function submitForm(e) {
        e.preventDefault();
        if (ui.editTask) form.put(route('tasks.update', ui.editTask.id), { onSuccess: closeModal });
        else form.post(route('tasks.store'), { onSuccess: closeModal });
    }

    function deleteTask(task) {
        if (confirm('Delete "' + task.title + '"?')) {
            router.delete(route('tasks.destroy', task.id), { preserveScroll: true });
        }
    }

    function handleDrop(e, newStatus) {
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;
        e.preventDefault();
        setUiField('dragOver', null);
        router.patch(route('tasks.status', taskId), { status: newStatus }, { preserveScroll: true });
    }

    function applyFilter(f) {
        setUiField('filter', f);
        router.get(route('tasks.index'), f === 'all' ? {} : { filter: f }, { preserveState: true, replace: true });
    }

    return (
        <AppLayout>
            <Head title="My Tasks" />
            <PageHeader title="Tasks" subtitle={`${totalTasks} tasks${overdueTasks > 0 ? ` · ${overdueTasks} overdue` : ''}`}>
                <button onClick={() => openNew('pending')} className="btn btn-primary flex items-center gap-2 text-sm">
                    <PlusIcon className="w-4 h-4" /> New Task
                </button>
            </PageHeader>

            <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-2 overflow-x-auto">
                {[{ key: 'all', label: 'All Tasks' }, { key: 'mine', label: 'Assigned to Me' }].map(f => (
                    <button
                        key={f.key}
                        onClick={() => applyFilter(f.key)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                            ui.filter === f.key ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
                <div className="ml-auto text-xs text-gray-400 hidden sm:block">Drag cards between columns to change status</div>
            </div>

            <div className="p-4 sm:p-6 overflow-x-auto">
                <div className="flex gap-4 items-start" style={{ minWidth: `${STATUSES.length * 260}px` }}>
                    {STATUSES.map(status => {
                        const cfg = STATUS_CFG[status];
                        const statusTasks = grouped[status];
                        return (
                            <div key={status} className="flex-1 min-w-[240px] flex flex-col">
                                <div className={`rounded-xl mb-3 overflow-hidden border ${cfg.border}`}>
                                    <div className={`${cfg.color} h-1.5 w-full`} />
                                    <div className={`${cfg.light} px-3 py-2.5 flex items-center justify-between`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                            <span className="text-sm font-semibold text-gray-700">{cfg.label}</span>
                                            <span className="text-xs font-bold text-white bg-gray-400 rounded-full px-2 py-0.5 min-w-[22px] text-center">{statusTasks.length}</span>
                                        </div>
                                        <button onClick={() => openNew(status)} className="text-gray-400 hover:text-primary-600 p-0.5 rounded">
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div
                                    className={`flex-1 rounded-xl p-2 min-h-[200px] transition-all ${ui.dragOver === status ? `${cfg.light} border-2 border-dashed ${cfg.border}` : 'bg-gray-50/60 border-2 border-transparent'}`}
                                    onDragOver={e => { e.preventDefault(); setUiField('dragOver', status); }}
                                    onDragLeave={() => setUiField('dragOver', null)}
                                    onDrop={e => handleDrop(e, status)}
                                >
                                    {statusTasks.map(t => {
                                        const overdue = t.due_date && t.status !== 'done' && isPastDue(t.due_date);
                                        const assignee = t.assignedTo;
                                        return (
                                            <div
                                                key={t.id}
                                                className="bg-white rounded-xl border border-gray-100 p-3 mb-2.5 hover:shadow-md cursor-pointer select-none transition-all group"
                                                onClick={() => openEdit(t)}
                                                draggable
                                                onDragStart={e => { e.dataTransfer.setData('taskId', t.id); e.dataTransfer.effectAllowed = 'move'; }}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-semibold text-gray-900 flex-1">{t.title}</p>
                                                    <button onClick={e => { e.stopPropagation(); deleteTask(t); }}
                                                        className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                                        <TrashIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                {t.project && (
                                                    <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                                                        <FolderIcon className="w-3 h-3" />
                                                        <span className="truncate">{t.project.name}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between mt-2 gap-2">
                                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium}`}>
                                                        {t.priority}
                                                    </span>
                                                    {t.due_date && (
                                                        <span className={`flex items-center gap-1 text-[10px] ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                                                            <CalendarIcon className="w-3 h-3" />
                                                            {formatDate(t.due_date)}
                                                        </span>
                                                    )}
                                                </div>
                                                {assignee && assignee.name && (
                                                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-50">
                                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[9px] font-bold">
                                                            {assignee.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 truncate">{assignee.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {statusTasks.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-24 text-gray-300 text-xs">Empty</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Modal open={ui.modalOpen} onClose={closeModal} title={ui.editTask ? 'Edit Task' : 'New Task'} size="lg">
                <form onSubmit={submitForm} className="p-5 space-y-4">
                    <FormField label="Title" error={form.errors.title} required>
                        <input className="form-input" value={form.data.title} onChange={e => form.setData('title', e.target.value)} placeholder="What needs to be done?" />
                    </FormField>
                    <FormField label="Description" error={form.errors.description}>
                        <textarea className="form-input" rows={2} value={form.data.description} onChange={e => form.setData('description', e.target.value)} />
                    </FormField>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Status" error={form.errors.status} required>
                            <select className="form-input" value={form.data.status} onChange={e => form.setData('status', e.target.value)}>
                                {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Priority" error={form.errors.priority} required>
                            <select className="form-input" value={form.data.priority} onChange={e => form.setData('priority', e.target.value)}>
                                {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Project" error={form.errors.project_id}>
                            <select className="form-input" value={form.data.project_id} onChange={e => form.setData('project_id', e.target.value)}>
                                <option value="">— Personal task —</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                            </select>
                        </FormField>
                        {canAssign && (
                            <FormField label="Assign To" error={form.errors.assigned_to}>
                                <select className="form-input" value={form.data.assigned_to} onChange={e => form.setData('assigned_to', e.target.value)}>
                                    <option value="">Unassigned</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </FormField>
                        )}
                        <FormField label="Start Date" error={form.errors.start_date}>
                            <input type="date" className="form-input" value={form.data.start_date} onChange={e => form.setData('start_date', e.target.value)} />
                        </FormField>
                        <FormField label="Due Date" error={form.errors.due_date}>
                            <input type="date" className="form-input" value={form.data.due_date} onChange={e => form.setData('due_date', e.target.value)} />
                        </FormField>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={form.processing} className="btn btn-primary">
                            {form.processing ? 'Saving…' : (ui.editTask ? 'Save Changes' : 'Create Task')}
                        </button>
                        <button type="button" onClick={closeModal} className="btn">Cancel</button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
