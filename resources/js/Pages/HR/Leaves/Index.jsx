import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import ConfirmDialog from '@/Components/ConfirmDialog';
import { PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function LeavesIndex({ leaves, isManager, leaveTypes, employees, filters }) {
    const [status, setStatus] = useState(filters?.status ?? '');
    const [employeeId, setEmployeeId] = useState(filters?.employee_id ?? '');
    const [confirm, setConfirm] = useState(null); // { type: 'approve'|'reject', leave }
    const [rejectNote, setRejectNote] = useState('');

    function applyFilters() {
        router.get(route('hr.leaves.index'), { status, employee_id: employeeId }, { preserveState: true, replace: true });
    }

    function approve(leave) {
        router.patch(route('hr.leaves.approve', leave.id));
    }

    function reject(leave) {
        router.patch(route('hr.leaves.reject', leave.id), { review_note: rejectNote });
        setRejectNote('');
    }

    const data = leaves.data ?? leaves;

    return (
        <AppLayout>
            <Head title="Leave Management" />
            <PageHeader title="Leave Management" subtitle={isManager ? 'All employee leave requests' : 'My leave requests'}>
                <Link href={route('hr.leaves.create')} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> New Request
                </Link>
            </PageHeader>

            <div className="p-4 sm:p-6">
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-4">
                    <select
                        className="form-input w-40"
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        {['pending', 'approved', 'rejected', 'cancelled'].map(s => (
                            <option key={s} value={s} className="capitalize">{s}</option>
                        ))}
                    </select>
                    {isManager && (
                        <select
                            className="form-input w-52"
                            value={employeeId}
                            onChange={e => setEmployeeId(e.target.value)}
                        >
                            <option value="">All Employees</option>
                            {employees.map(e => (
                                <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                            ))}
                        </select>
                    )}
                    <button onClick={applyFilters} className="btn btn-secondary">Filter</button>
                    {(status || employeeId) && (
                        <button onClick={() => { setStatus(''); setEmployeeId(''); router.get(route('hr.leaves.index')); }} className="btn">Clear</button>
                    )}
                </div>

                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {[
                                    isManager && 'Employee',
                                    'Leave Type',
                                    'From',
                                    'To',
                                    'Days',
                                    'Reason',
                                    'Status',
                                    'Requested',
                                    isManager && 'Actions',
                                ].filter(Boolean).map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {data.map(leave => (
                                <tr key={leave.id} className="hover:bg-gray-50">
                                    {isManager && (
                                        <td className="px-4 py-3 text-sm font-medium">{leave.employee?.name ?? '—'}</td>
                                    )}
                                    <td className="px-4 py-3 text-sm">{leave.leave_type?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(leave.from_date)}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(leave.to_date)}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{leave.days}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{leave.reason ?? '—'}</td>
                                    <td className="px-4 py-3"><Badge status={leave.status} /></td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(leave.created_at)}</td>
                                    {isManager && (
                                        <td className="px-4 py-3">
                                            {leave.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => approve(leave)}
                                                        title="Approve"
                                                        className="text-gray-400 hover:text-green-600"
                                                    >
                                                        <CheckIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirm({ type: 'reject', leave })}
                                                        title="Reject"
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr><td colSpan={isManager ? 9 : 7} className="px-4 py-8 text-center text-gray-400">No leave requests found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {leaves.links && (
                    <div className="mt-4 flex gap-1">
                        {leaves.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                className={`px-3 py-1.5 text-sm rounded border ${link.active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'} ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Reject modal */}
            {confirm?.type === 'reject' && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Reject Leave Request</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Rejecting leave for <strong>{confirm.leave.employee?.name}</strong> ({confirm.leave.days} days).
                        </p>
                        <textarea
                            className="form-input w-full mb-4"
                            rows={3}
                            placeholder="Reason for rejection (optional)…"
                            value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { reject(confirm.leave); setConfirm(null); }}
                                className="btn btn-danger"
                            >
                                Reject
                            </button>
                            <button onClick={() => setConfirm(null)} className="btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
