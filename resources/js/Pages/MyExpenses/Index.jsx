import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import FormField from '@/Components/FormField';
import { formatBDT, formatDate } from '@/utils/formatters';
import {
    PlusIcon, ClockIcon, CheckCircleIcon, XCircleIcon,
    ExclamationCircleIcon, BanknotesIcon,
} from '@heroicons/react/24/outline';

const STATUS_STYLE = {
    pending:  { cls: 'bg-amber-100 text-amber-700',     icon: ClockIcon,           label: 'Pending Review' },
    approved: { cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircleIcon,     label: 'Approved' },
    rejected: { cls: 'bg-red-100 text-red-700',         icon: XCircleIcon,         label: 'Rejected' },
};

export default function MyExpensesIndex({
    expenses,
    filters = {},
    counts = {},
    myProjects = [],
    expenseCategories = [],
    expenseHeads = [],
}) {
    const [ui, setUi] = useState({
        modalOpen: false,
        status: filters.status ?? '',
        project_id: filters.project_id ?? '',
    });

    const form = useForm({
        project_id:          '',
        account_head_id:     '',
        expense_category_id: '',
        amount:              '',
        expense_date:        new Date().toISOString().substring(0, 10),
        description:         '',
        reference:           '',
    });

    function openModal() {
        form.reset();
        form.clearErrors();
        form.setData('expense_date', new Date().toISOString().substring(0, 10));
        form.setData('project_id', myProjects[0]?.id ?? '');
        form.setData('account_head_id', expenseHeads[0]?.id ?? '');
        setUi(s => ({ ...s, modalOpen: true }));
    }

    function submit(e) {
        e.preventDefault();
        form.post(route('my-expenses.store'), {
            preserveScroll: true,
            onSuccess: () => setUi(s => ({ ...s, modalOpen: false })),
        });
    }

    function setStatusFilter(value) {
        const next = ui.status === value ? '' : value;
        setUi(s => ({ ...s, status: next }));
        router.get(route('my-expenses.index'), { ...filters, status: next }, { preserveState: true, replace: true });
    }

    const rows = expenses.data ?? [];

    return (
        <AppLayout>
            <Head title="My Expenses" />
            <PageHeader title="My Expenses" subtitle="Submit and track your project expenses">
                <button onClick={openModal} disabled={myProjects.length === 0}
                    className="btn btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
                    <PlusIcon className="w-4 h-4" /> Submit Expense
                </button>
            </PageHeader>

            <div className="p-4 sm:p-6 space-y-4">

                {myProjects.length === 0 && (
                    <div className="card p-4 flex items-center gap-3 bg-amber-50 border border-amber-200">
                        <ExclamationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div className="text-sm text-amber-800">
                            You're not assigned as Site Engineer on any active project yet. Ask an admin to assign you to a project before submitting expenses.
                        </div>
                    </div>
                )}

                {/* Status strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button onClick={() => setStatusFilter('')}
                        className={`card p-3 text-left ring-1 transition-all ${ui.status === '' ? 'ring-primary-400 bg-primary-50/40' : 'ring-gray-100'}`}>
                        <div className="flex items-center gap-2">
                            <BanknotesIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-500 uppercase font-semibold">All</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900 mt-1">{counts.total ?? 0}</p>
                    </button>
                    <button onClick={() => setStatusFilter('pending')}
                        className={`card p-3 text-left ring-1 transition-all ${ui.status === 'pending' ? 'ring-amber-400 bg-amber-50/60' : 'ring-gray-100'}`}>
                        <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-amber-600" />
                            <span className="text-xs text-amber-700 uppercase font-semibold">Pending</span>
                        </div>
                        <p className="text-xl font-bold text-amber-800 mt-1">{counts.pending ?? 0}</p>
                    </button>
                    <button onClick={() => setStatusFilter('approved')}
                        className={`card p-3 text-left ring-1 transition-all ${ui.status === 'approved' ? 'ring-emerald-400 bg-emerald-50/60' : 'ring-gray-100'}`}>
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs text-emerald-700 uppercase font-semibold">Approved</span>
                        </div>
                        <p className="text-xl font-bold text-emerald-700 mt-1">{counts.approved ?? 0}</p>
                    </button>
                    <button onClick={() => setStatusFilter('rejected')}
                        className={`card p-3 text-left ring-1 transition-all ${ui.status === 'rejected' ? 'ring-red-400 bg-red-50/60' : 'ring-gray-100'}`}>
                        <div className="flex items-center gap-2">
                            <XCircleIcon className="w-4 h-4 text-red-600" />
                            <span className="text-xs text-red-700 uppercase font-semibold">Rejected</span>
                        </div>
                        <p className="text-xl font-bold text-red-700 mt-1">{counts.rejected ?? 0}</p>
                    </button>
                </div>

                {/* Expenses list */}
                <div className="card overflow-hidden">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Code</th>
                                <th className="px-4 py-3 text-left">Date</th>
                                <th className="px-4 py-3 text-left">Project</th>
                                <th className="px-4 py-3 text-left">Description</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                                    No expenses yet. Click <strong>Submit Expense</strong> to add your first one.
                                </td></tr>
                            )}
                            {rows.map(exp => {
                                const s = STATUS_STYLE[exp.status] ?? STATUS_STYLE.pending;
                                const Icon = s.icon;
                                return (
                                    <tr key={exp.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono text-xs text-primary-600">{exp.code}</td>
                                        <td className="px-4 py-3 text-gray-600">{formatDate(exp.expense_date)}</td>
                                        <td className="px-4 py-3 text-gray-700">{exp.project?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                                            {exp.description}
                                            {exp.category && <p className="text-[10px] text-gray-400">{exp.category.name}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatBDT(exp.amount)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${s.cls}`}>
                                                <Icon className="w-3 h-3" /> {s.label}
                                            </span>
                                            {exp.status === 'rejected' && exp.rejection_reason && (
                                                <p className="text-[11px] text-red-600 mt-1 italic">"{exp.rejection_reason}"</p>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {expenses.links && expenses.links.length > 3 && (
                    <div className="flex justify-center gap-1">
                        {expenses.links.map((l, i) => (
                            l.url
                                ? <Link key={i} href={l.url}
                                      className={`px-3 py-1.5 text-xs rounded-md border ${l.active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'}`}
                                      dangerouslySetInnerHTML={{ __html: l.label }} />
                                : <span key={i}
                                      className="px-3 py-1.5 text-xs rounded-md border bg-gray-50 text-gray-400 border-gray-200"
                                      dangerouslySetInnerHTML={{ __html: l.label }} />
                        ))}
                    </div>
                )}
            </div>

            {/* Submit expense modal */}
            <Modal open={ui.modalOpen} onClose={() => setUi(s => ({ ...s, modalOpen: false }))}
                title="Submit Project Expense" size="md">
                <form onSubmit={submit} className="p-4 sm:p-6 space-y-4">
                    <p className="text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        This will be submitted for accountant approval. Once approved, it gets posted to the ledger. Pending entries can be reviewed, approved, or rejected.
                    </p>

                    <FormField label="Project" required error={form.errors.project_id} hint="Only projects you're assigned to">
                        <select className="form-input" value={form.data.project_id} onChange={e => form.setData('project_id', e.target.value)}>
                            <option value="">Select project…</option>
                            {myProjects.map(p => <option key={p.id} value={p.id}>{p.code ? `${p.code} — ` : ''}{p.name}</option>)}
                        </select>
                    </FormField>

                    <FormField label="Description" required error={form.errors.description}>
                        <input className="form-input" value={form.data.description}
                            onChange={e => form.setData('description', e.target.value)}
                            placeholder="e.g. Cement 10 bags, labor 2 days, sand delivery" />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Amount (BDT)" required error={form.errors.amount}>
                            <input type="number" step="0.01" className="form-input" value={form.data.amount}
                                onChange={e => form.setData('amount', e.target.value)} placeholder="0.00" />
                        </FormField>
                        <FormField label="Date" required error={form.errors.expense_date}>
                            <input type="date" className="form-input" value={form.data.expense_date}
                                onChange={e => form.setData('expense_date', e.target.value)} />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Category" error={form.errors.expense_category_id}>
                            <select className="form-input" value={form.data.expense_category_id}
                                onChange={e => form.setData('expense_category_id', e.target.value)}>
                                <option value="">— none —</option>
                                {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Expense Head" required error={form.errors.account_head_id} hint="Chart-of-accounts classification">
                            <select className="form-input" value={form.data.account_head_id}
                                onChange={e => form.setData('account_head_id', e.target.value)}>
                                <option value="">Select…</option>
                                {expenseHeads.map(h => <option key={h.id} value={h.id}>{h.code} — {h.name}</option>)}
                            </select>
                        </FormField>
                    </div>

                    <FormField label="Reference (optional)" error={form.errors.reference}>
                        <input className="form-input" value={form.data.reference}
                            onChange={e => form.setData('reference', e.target.value)}
                            placeholder="Bill number, vendor name, txn id…" />
                    </FormField>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={form.processing} className="btn btn-primary">
                            {form.processing ? 'Submitting…' : 'Submit for Approval'}
                        </button>
                        <button type="button" onClick={() => setUi(s => ({ ...s, modalOpen: false }))} className="btn">Cancel</button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
