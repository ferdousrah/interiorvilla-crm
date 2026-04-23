import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatDate } from '@/utils/formatters';

export default function LeaveShow({ leave }) {
    return (
        <AppLayout>
            <Head title="Leave Request" />
            <PageHeader title="Leave Request" back={route('hr.leaves.index')} />
            <div className="p-4 sm:p-6 max-w-xl">
                <div className="card p-6">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Employee</dt>
                            <dd className="font-medium">
                                <Link href={route('hr.employees.show', leave.employee?.id)} className="text-primary-600 hover:underline">
                                    {leave.employee?.name}
                                </Link>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Leave Type</dt>
                            <dd>{leave.leave_type?.name ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">From</dt>
                            <dd>{formatDate(leave.from_date)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">To</dt>
                            <dd>{formatDate(leave.to_date)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Days</dt>
                            <dd className="font-semibold">{leave.days}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Status</dt>
                            <dd><Badge status={leave.status} /></dd>
                        </div>
                        {leave.reason && (
                            <div className="col-span-2">
                                <dt className="text-xs text-gray-500 uppercase">Reason</dt>
                                <dd>{leave.reason}</dd>
                            </div>
                        )}
                        {leave.reviewed_by && (
                            <>
                                <div>
                                    <dt className="text-xs text-gray-500 uppercase">Reviewed By</dt>
                                    <dd>{leave.reviewed_by?.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500 uppercase">Reviewed At</dt>
                                    <dd>{formatDate(leave.reviewed_at)}</dd>
                                </div>
                                {leave.review_note && (
                                    <div className="col-span-2">
                                        <dt className="text-xs text-gray-500 uppercase">Review Note</dt>
                                        <dd>{leave.review_note}</dd>
                                    </div>
                                )}
                            </>
                        )}
                    </dl>
                </div>
            </div>
        </AppLayout>
    );
}
