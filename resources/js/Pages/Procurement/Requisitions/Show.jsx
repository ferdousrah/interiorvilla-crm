import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatDate } from '@/utils/formatters';
import { usePermissions } from '@/Hooks/usePermissions';

const STATUS_COLORS = { draft: 'gray', pending: 'warning', approved: 'success', rejected: 'danger', converted: 'info' };

export default function RequisitionShow({ requisition }) {
    const { hasAnyRole } = usePermissions();
    const canApprove = hasAnyRole('admin', 'accounts');

    function approve() {
        if (!confirm(`Approve requisition ${requisition.code}?`)) return;
        router.patch(route('procurement.requisitions.approve', requisition.id));
    }
    function reject() {
        const note = prompt('Reason for rejection?');
        if (note && note.trim()) {
            router.patch(route('procurement.requisitions.reject', requisition.id), { rejection_note: note.trim() });
        }
    }

    return (
        <AppLayout>
            <Head title={requisition.code} />
            <PageHeader title={requisition.code} subtitle="Purchase Requisition" back={route('procurement.requisitions.index')}>
                {canApprove && requisition.status === 'pending' && (
                    <>
                        <button onClick={approve} className="btn btn-primary text-sm">Approve</button>
                        <button onClick={reject} className="btn text-sm text-red-600">Reject</button>
                    </>
                )}
            </PageHeader>
            <div className="p-4 sm:p-6">
                <div className="card p-4 mb-4">
                    <div className="flex gap-8 text-sm">
                        <div><span className="text-gray-500">Status: </span><Badge variant={STATUS_COLORS[requisition.status]}>{requisition.status}</Badge></div>
                        <div><span className="text-gray-500">Date: </span>{formatDate(requisition.request_date)}</div>
                        {requisition.required_by && <div><span className="text-gray-500">Required By: </span>{formatDate(requisition.required_by)}</div>}
                        {requisition.project && <div><span className="text-gray-500">Project: </span>{requisition.project.name}</div>}
                        {requisition.requestedBy && <div><span className="text-gray-500">Requested By: </span>{requisition.requestedBy.name}</div>}
                    </div>
                    {requisition.notes && <p className="mt-3 text-sm text-gray-600">{requisition.notes}</p>}
                </div>
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['#','Description','Unit','Qty Required','Est. Rate','Est. Total'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(requisition.items ?? []).map((item, i) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 text-sm">{i + 1}</td>
                                    <td className="px-4 py-3 text-sm">{item.description}</td>
                                    <td className="px-4 py-3 text-sm">{item.unit}</td>
                                    <td className="px-4 py-3 text-sm">{Number(item.quantity).toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-sm">{item.estimated_rate ? `${Number(item.estimated_rate).toLocaleString('en-IN')}৳` : '—'}</td>
                                    <td className="px-4 py-3 text-sm">{item.estimated_rate ? `${(Number(item.quantity) * Number(item.estimated_rate)).toLocaleString('en-IN')}৳` : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
