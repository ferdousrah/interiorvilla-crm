import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import FormField from '@/Components/FormField';
import { formatBDT, formatDate } from '@/utils/formatters';
import {
    PlusIcon, Cog6ToothIcon, ClockIcon, CheckCircleIcon, XCircleIcon,
    BanknotesIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const STATUS_STYLE = {
    pending:  { cls: 'bg-amber-100 text-amber-700',     icon: ClockIcon,       label: 'Pending' },
    approved: { cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircleIcon, label: 'Approved' },
    rejected: { cls: 'bg-red-100 text-red-700',         icon: XCircleIcon,     label: 'Rejected' },
};

export default function Expenses({
    expenses,
    filters = {},
    counts = {},
    expenseCategories = [],
    accountHeads = [],
    cashBankHeads = [],
    projects = [],
}) {
    const [showForm, setShowForm] = useState(false);
    const [reviewing, setReviewing] = useState(null); // expense object

    const form = useForm({
        description: '',
        expense_category_id: expenseCategories[0]?.id ?? '',
        account_head_id: accountHeads[0]?.id ?? '',
        amount: '',
        expense_date: new Date().toISOString().substring(0, 10),
        paid_from: cashBankHeads[0]?.id ?? '',
        project_id: '',
        reference: '',
    });

    const rejectForm = useForm({ rejection_reason: '' });

    function submit(e) {
        e.preventDefault();
        form.post(route('accounts.expenses.store'), {
            preserveScroll: true,
            onSuccess: () => { form.reset(); setShowForm(false); },
        });
    }

    function setStatusFilter(value) {
        const next = filters.status === value ? '' : value;
        router.get(route('accounts.expenses.index'), { ...filters, status: next }, { preserveState: true, replace: true });
    }

    function approve(expense) {
        if (!confirm(`Approve expense ${expense.code} for BDT ${formatBDT(expense.amount)}?\n\nThis will post the journal entry.`)) return;
        router.patch(route('accounts.expenses.approve', expense.id), {}, { preserveScroll: true, onSuccess: () => setReviewing(null) });
    }

    function submitReject(e) {
        e.preventDefault();
        rejectForm.patch(route('accounts.expenses.reject', reviewing.id), {
            preserveScroll: true,
            onSuccess: () => { rejectForm.reset(); setReviewing(null); },
        });
    }

    const rows = expenses.data ?? expenses;

    return (
        <AppLayout>
            <Head title="Expenses" />
            <PageHeader title="Expenses" subtitle={`${counts.total ?? rows.length} total · ${counts.pending ?? 0} awaiting approval`}>
                <Link href={route('settings.expense-categories.index')} className="btn flex items-center gap-2 text-sm">
                    <Cog6ToothIcon className="w-4 h-4" /> Categories
                </Link>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Add Expense
                </button>
            </PageHeader>

            <div className="p-4 sm:p-6 space-y-4">

                {/* Pending approval banner */}
                {counts.pending > 0 && filters.status !== 'pending' && (
                    <button type="button" onClick={() => setStatusFilter('pending')}
                        className="w-full card p-4 flex items-center gap-3 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors text-left">
                        <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-800">
                                {counts.pending} expense{counts.pending === 1 ? '' : 's'} awaiting your approval
                            </p>
                            <p className="text-xs text-amber-700">Click to review submissions from site engineers</p>
                        </div>
                    </button>
                )}

                {/* Status strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button onClick={() => setStatusFilter('')}
                        className={`card p-3 text-left ring-1 transition-all ${!filters.status ? 'ring-primary-400 bg-primary-50/40' : 'ring-gray-100'}`}>
                        <div className="flex items-center gap-2">
                            <BanknotesIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-500 uppercase font-semibold">All</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900 mt-1">{counts.total ?? 0}</p>
                    </button>
                    <button onClick={() => setStatusFilter('pending')}
                        className={`card p-3 text-left ring-1 transition-all ${filters.status === 'pending' ? 'ring-amber-400 bg-amber-50/60' : 'ring-gray-100'}`}>
                        <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-amber-600" />
                            <span className="text-xs text-amber-700 uppercase font-semibold">Pending</span>
                        </div>
                        <p className="text-xl font-bold text-amber-800 mt-1">{counts.pending ?? 0}</p>
                    </button>
                    <button onClick={() => setStatusFilter('approved')}
                        className={`card p-3 text-left ring-1 transition-all ${filters.status === 'approved' ? 'ring-emerald-400 bg-emerald-50/60' : 'ring-gray-100'}`}>
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs text-emerald-700 uppercase font-semibold">Approved</span>
                        </div>
                        <p className="text-xl font-bold text-emerald-700 mt-1">{counts.approved ?? 0}</p>
                    </button>
                    <button onClick={() => setStatusFilter('rejected')}
                        className={`card p-3 text-left ring-1 transition-all ${filters.status === 'rejected' ? 'ring-red-400 bg-red-50/60' : 'ring-gray-100'}`}>
                        <div className="flex items-center gap-2">
                            <XCircleIcon className="w-4 h-4 text-red-600" />
                            <span className="text-xs text-red-700 uppercase font-semibold">Rejected</span>
                        </div>
                        <p className="text-xl font-bold text-red-700 mt-1">{counts.rejected ?? 0}</p>
                    </button>
                </div>

                {/* Quick-add form (accountant direct entry — auto-approved) */}
                {showForm && (
                    <form onSubmit={submit} className="card p-4 mb-4 space-y-3">
                        <div className="text-xs text-gray-500 bg-emerald-50 border border-emerald-200 rounded-md p-2">
                            Direct entries by accountants are <strong>auto-approved</strong> and posted immediately.
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <FormField label="Description" error={form.errors.description} required>
                                <input className="form-input text-sm" value={form.data.description} onChange={e => form.setData('description', e.target.value)} />
                            </FormField>
                            <FormField label="Category" error={form.errors.expense_category_id}>
                                <select className="form-input text-sm" value={form.data.expense_category_id} onChange={e => form.setData('expense_category_id', e.target.value)}>
                                    <option value="">— none —</option>
                                    {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Amount (BDT)" error={form.errors.amount} required>
                                <input type="number" step="0.01" className="form-input text-sm" value={form.data.amount} onChange={e => form.setData('amount', e.target.value)} />
                            </FormField>
                            <FormField label="Date" error={form.errors.expense_date} required>
                                <input type="date" className="form-input text-sm" value={form.data.expense_date} onChange={e => form.setData('expense_date', e.target.value)} />
                            </FormField>
                            <FormField label="Account Head" error={form.errors.account_head_id} required>
                                <select className="form-input text-sm" value={form.data.account_head_id} onChange={e => form.setData('account_head_id', e.target.value)}>
                                    <option value="">Select…</option>
                                    {accountHeads.map(h => <option key={h.id} value={h.id}>{h.code} — {h.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Paid From" error={form.errors.paid_from} required>
                                <select className="form-input text-sm" value={form.data.paid_from} onChange={e => form.setData('paid_from', e.target.value)}>
                                    <option value="">Select…</option>
                                    {cashBankHeads.map(h => <option key={h.id} value={h.id}>{h.code} — {h.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Project (optional)" error={form.errors.project_id}>
                                <select className="form-input text-sm" value={form.data.project_id} onChange={e => form.setData('project_id', e.target.value)}>
                                    <option value="">— none —</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Reference" error={form.errors.reference}>
                                <input className="form-input text-sm" value={form.data.reference} onChange={e => form.setData('reference', e.target.value)} />
                            </FormField>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" disabled={form.processing} className="btn btn-primary text-sm">
                                {form.processing ? 'Saving…' : 'Record Expense'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn text-sm">Cancel</button>
                        </div>
                    </form>
                )}

                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Date', 'Code', 'Project', 'Description', 'Amount', 'Account Head', 'Paid From', 'Submitted By', 'Status', ''].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map(exp => {
                                const s = STATUS_STYLE[exp.status] ?? STATUS_STYLE.pending;
                                const Icon = s.icon;
                                const head = exp.accountHead ?? exp.account_head;
                                const paidFrom = exp.paidFrom ?? exp.paid_from_account;
                                return (
                                    <tr key={exp.id} className={`hover:bg-gray-50 ${exp.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                                        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(exp.expense_date)}</td>
                                        <td className="px-4 py-3 text-xs font-mono text-primary-600">{exp.code}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{exp.project?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-sm font-medium max-w-xs truncate">
                                            {exp.description}
                                            {exp.category && <p className="text-[10px] text-gray-400">{exp.category.name}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-red-600 whitespace-nowrap tabular-nums">{formatBDT(exp.amount)}</td>
                                        <td className="px-4 py-3 text-xs">
                                            {head ? (
                                                <div>
                                                    <span className="font-mono text-gray-500">{head.code}</span>
                                                    <span className="ml-1 text-gray-700">{head.name}</span>
                                                </div>
                                            ) : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {paidFrom ? (
                                                <div>
                                                    <span className="font-mono text-gray-500">{paidFrom.code}</span>
                                                    <span className="ml-1 text-gray-700">{paidFrom.name}</span>
                                                </div>
                                            ) : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">{exp.submittedBy?.name ?? exp.submitted_by?.name ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${s.cls}`}>
                                                <Icon className="w-3 h-3" /> {s.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {exp.status === 'pending' && (
                                                <button onClick={() => setReviewing(exp)}
                                                    className="btn btn-primary text-xs">Review</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {rows.length === 0 && (
                                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No expenses found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review modal */}
            <Modal open={!!reviewing} onClose={() => { setReviewing(null); rejectForm.reset(); }}
                title={reviewing ? `Review: ${reviewing.code}` : ''} size="md">
                {reviewing && (
                    <div className="p-4 sm:p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Date</p>
                                <p className="font-medium">{formatDate(reviewing.expense_date)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Amount</p>
                                <p className="font-bold text-lg text-red-600">BDT {formatBDT(reviewing.amount)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Project</p>
                                <p className="font-medium">{reviewing.project?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Submitted By</p>
                                <p className="font-medium">{reviewing.submittedBy?.name ?? '—'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-gray-500 uppercase">Description</p>
                                <p className="text-sm text-gray-800">{reviewing.description}</p>
                            </div>
                            {reviewing.reference && (
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500 uppercase">Reference</p>
                                    <p className="text-sm text-gray-700">{reviewing.reference}</p>
                                </div>
                            )}
                            {reviewing.category && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Category</p>
                                    <p className="text-sm">{reviewing.category.name}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Account Head</p>
                                <p className="text-sm">{reviewing.account_head?.name ?? reviewing.accountHead?.name ?? '—'}</p>
                            </div>
                        </div>

                        <form onSubmit={submitReject} className="border-t border-gray-100 pt-4 space-y-3">
                            <FormField label="Rejection Reason (only if rejecting)" error={rejectForm.errors.rejection_reason}>
                                <textarea className="form-input" rows={2}
                                    value={rejectForm.data.rejection_reason}
                                    onChange={e => rejectForm.setData('rejection_reason', e.target.value)}
                                    placeholder="Leave blank if approving. Required to reject." />
                            </FormField>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => approve(reviewing)}
                                    className="btn btn-primary flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4" /> Approve & Post
                                </button>
                                <button type="submit" disabled={rejectForm.processing || !rejectForm.data.rejection_reason}
                                    className="btn btn-danger flex items-center gap-2 disabled:opacity-50">
                                    <XCircleIcon className="w-4 h-4" /> Reject
                                </button>
                                <button type="button" onClick={() => { setReviewing(null); rejectForm.reset(); }} className="btn">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>
        </AppLayout>
    );
}
