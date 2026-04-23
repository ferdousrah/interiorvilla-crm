import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatDate, formatBDT } from '@/utils/formatters';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';

const STATUS_COLORS = { draft: 'gray', approved: 'success', sent: 'info', partial: 'warning', received: 'success', cancelled: 'danger' };

export default function PurchaseOrdersIndex({ purchaseOrders }) {
    return (
        <AppLayout>
            <Head title="Purchase Orders" />
            <PageHeader title="Purchase Orders" subtitle={`${(purchaseOrders.data ?? purchaseOrders).length} orders`}>
                <Link href={route('procurement.purchase-orders.create')} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> New PO
                </Link>
            </PageHeader>
            <div className="p-4 sm:p-6">
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['PO Code','Date','Vendor','Project','Grand Total','Status','Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(purchaseOrders.data ?? purchaseOrders).map(po => (
                                <tr key={po.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{po.code}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(po.order_date)}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{po.vendor?.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{po.project?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm font-semibold">{formatBDT(po.grand_total)}</td>
                                    <td className="px-4 py-3"><Badge variant={STATUS_COLORS[po.status]}>{po.status}</Badge></td>
                                    <td className="px-4 py-3">
                                        <Link href={route('procurement.purchase-orders.show', po.id)} className="text-gray-400 hover:text-primary-600">
                                            <EyeIcon className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(purchaseOrders.data ?? purchaseOrders).length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No purchase orders found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
