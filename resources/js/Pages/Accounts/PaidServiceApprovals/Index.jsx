import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import { formatDate } from '@/utils/formatters';
import {
    CheckCircleIcon, XCircleIcon, ClockIcon, EyeIcon, BanknotesIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

function fmt(n) {
    return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TABS = [
    { key: 'pending',  label: 'Pending',  color: 'text-amber-700 border-amber-500' },
    { key: 'approved', label: 'Approved', color: 'text-emerald-700 border-emerald-500' },
    { key: 'rejected', label: 'Rejected', color: 'text-red-700 border-red-500' },
];

export default function PaidServiceApprovalsIndex({ submissions, counts, filters }) {
    const items   = submissions?.data ?? [];
    const status  = filters?.status ?? 'pending';
    const [reviewModal, setReviewModal] = useState(null); // { submission, mode: 'reject' }

    const rejectForm = useForm({ review_notes: '' });

    function setTab(s) {
        router.get(route('accounts.paid-service-approvals.index'), { status: s }, { preserveScroll: true, preserveState: true });
    }

    function approve(sub) {
        if (!confirm(`Approve "${sub.description}" for BDT ${fmt(sub.amount)}? This will create an Invoice + Receipt and post to the ledger.`)) return;
        router.patch(route('accounts.paid-service-approvals.approve', sub.id), {}, { preserveScroll: true });
    }

    function openReject(sub) {
        rejectForm.reset();
        setReviewModal({ submission: sub, mode: 'reject' });
    }

    function submitReject(e) {
        e.preventDefault();
        rejectForm.patch(route('accounts.paid-service-approvals.reject', reviewModal.submission.id), {
            preserveScroll: true,
            onSuccess: () => setReviewModal(null),
        });
    }

    return (
        <AppLayout>
            <Head title="Paid Service Approvals" />
            <PageHeader title="Paid Service Approvals" subtitle="Review and approve paid services submitted from the CRM" />

            <div className="p-4 sm:p-6 space-y-4">

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    {TABS.map(t => {
                        const active = status === t.key;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                                    active ? t.color : 'text-gray-400 border-transparent hover:text-gray-700'
                                }`}
                            >
                                {t.label}
                                <span className={`ml-2 text-xs font-bold rounded-full px-2 py-0.5 ${
                                    active ? 'bg-white shadow-sm' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {counts?.[t.key] ?? 0}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Table */}
                <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs font-semibold uppercase bg-gray-50 text-gray-600 border-b border-gray-200">
                                <th className="px-4 py-3 text-left">Code</th>
                                <th className="px-4 py-3 text-left">Lead</th>
                                <th className="px-4 py-3 text-left">Service</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-left">Source</th>
                                <th className="px-4 py-3 text-left">Deposit</th>
                                <th className="px-4 py-3 text-left">Submitted By</th>
                                <th className="px-4 py-3 text-left">Date</th>
                                <th className="px-4 py-3 text-right w-40">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        <BanknotesIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 font-medium">No {status} submissions</p>
                                    </td>
                                </tr>
                            ) : items.map(sub => (
                                <tr key={sub.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary-700">{sub.code}</td>
                                    <td className="px-4 py-3">
                                        <Link href={route('crm.leads.show', sub.lead.id)} className="font-semibold text-gray-900 hover:text-primary-700">
                                            {sub.lead?.company_name || sub.lead?.name}
                                        </Link>
                                        {sub.lead?.company_name && sub.lead?.name && (
                                            <p className="text-[11px] text-gray-500">Attn: {sub.lead.name}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={sub.description}>{sub.description}</td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">৳ {fmt(sub.amount)}</td>
                                    <td className="px-4 py-3"><Badge status={sub.income_source} /></td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                        {sub.account_head?.code} — {sub.account_head?.name}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">{sub.submitted_by?.name ?? sub.submittedBy?.name}</td>
                                    <td className="px-4 py-3 text-xs text-gray-600">{formatDate(sub.service_date)}</td>
                                    <td className="px-4 py-3 text-right">
                                        {sub.status === 'pending' ? (
                                            <div className="flex justify-end gap-1.5">
                                                <button onClick={() => approve(sub)}
                                                    className="btn btn-primary text-xs px-3 py-1 flex items-center gap-1" title="Approve">
                                                    <CheckCircleIcon className="w-3.5 h-3.5" /> Approve
                                                </button>
                                                <button onClick={() => openReject(sub)}
                                                    className="btn btn-danger text-xs px-3 py-1 flex items-center gap-1" title="Reject">
                                                    <XCircleIcon className="w-3.5 h-3.5" /> Reject
                                                </button>
                                            </div>
                                        ) : sub.status === 'approved' ? (
                                            <div className="text-right">
                                                <Badge status="approved" />
                                                {sub.invoice_id && (
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        Invoice + Receipt posted
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-right">
                                                <Badge status="rejected" />
                                                {sub.review_notes && (
                                                    <p className="text-[10px] text-red-600 mt-1 max-w-[12rem] truncate" title={sub.review_notes}>
                                                        {sub.review_notes}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {submissions?.links?.length > 3 && (
                    <div className="flex justify-center gap-1">
                        {submissions.links.map((link, i) => (
                            <Link key={i} href={link.url ?? '#'} preserveScroll
                                className={`px-3 py-1 text-xs rounded ${
                                    link.active ? 'bg-primary-600 text-white' :
                                    link.url ? 'bg-white border border-gray-200 text-gray-700 hover:border-primary-400' :
                                    'text-gray-300'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>

            {/* Reject modal */}
            <Modal open={!!reviewModal} onClose={() => setReviewModal(null)} title="Reject Submission" size="sm">
                {reviewModal && (
                    <form onSubmit={submitReject} className="p-5 space-y-4">
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-800 leading-relaxed">
                                Rejecting <strong>{reviewModal.submission.code}</strong> ({reviewModal.submission.description}, BDT {fmt(reviewModal.submission.amount)}). Nothing will be posted to the ledger.
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                Reason for rejection <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                autoFocus
                                rows={3}
                                className="form-input w-full text-sm"
                                placeholder="Explain why this is being rejected (e.g. amount mismatch, wrong category)…"
                                value={rejectForm.data.review_notes}
                                onChange={e => rejectForm.setData('review_notes', e.target.value)}
                            />
                            {rejectForm.errors.review_notes && (
                                <p className="text-xs text-red-600 mt-1">{rejectForm.errors.review_notes}</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setReviewModal(null)} className="btn">Cancel</button>
                            <button type="submit" disabled={!rejectForm.data.review_notes.trim() || rejectForm.processing}
                                className="btn btn-danger">
                                {rejectForm.processing ? 'Rejecting…' : 'Reject Submission'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </AppLayout>
    );
}
