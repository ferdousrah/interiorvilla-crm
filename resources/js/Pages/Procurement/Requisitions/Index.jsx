import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatDate, formatBDT } from '@/utils/formatters';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function RequisitionsIndex({ requisitions }) {
    return (
        <AppLayout>
            <Head title="Purchase Requisitions" />
            <PageHeader title="Purchase Requisitions" subtitle={`${(requisitions.data ?? requisitions).length} requisitions`}>
                <Link href={route('procurement.requisitions.create')} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> New Requisition
                </Link>
            </PageHeader>
            <div className="p-4 sm:p-6">
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Code','Date','Project','Required By','Status','Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(requisitions.data ?? requisitions).map(r => (
                                <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{r.code}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(r.created_at)}</td>
                                    <td className="px-4 py-3 text-sm">{r.project?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm">{r.required_by ? formatDate(r.required_by) : '—'}</td>
                                    <td className="px-4 py-3"><Badge status={r.status} /></td>
                                    <td className="px-4 py-3">
                                        <Link href={route('procurement.requisitions.show', r.id)} className="text-gray-400 hover:text-primary-600">
                                            <EyeIcon className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(requisitions.data ?? requisitions).length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No requisitions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
