import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatDate } from '@/utils/formatters';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function GRNIndex({ grns }) {
    return (
        <AppLayout>
            <Head title="Goods Received Notes" />
            <PageHeader title="Goods Received Notes" subtitle={`${(grns.data ?? grns).length} GRNs`}>
                <Link href={route('procurement.grn.create')} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> New GRN
                </Link>
            </PageHeader>
            <div className="p-4 sm:p-6">
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['GRN Code','Date','PO Code','Vendor','Warehouse','Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(grns.data ?? grns).map(grn => (
                                <tr key={grn.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{grn.code}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(grn.received_date)}</td>
                                    <td className="px-4 py-3 text-sm font-mono">{grn.purchaseOrder?.code}</td>
                                    <td className="px-4 py-3 text-sm">{grn.purchaseOrder?.vendor?.name}</td>
                                    <td className="px-4 py-3 text-sm">{grn.warehouse?.name}</td>
                                    <td className="px-4 py-3">
                                        <Link href={route('procurement.grn.show', grn.id)} className="text-gray-400 hover:text-primary-600">
                                            <EyeIcon className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(grns.data ?? grns).length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No GRNs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
