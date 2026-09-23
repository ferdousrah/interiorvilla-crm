import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import { formatDate, formatBDT } from '@/utils/formatters';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function PurchasesIndex({ purchaseOrders }) {
    const rows = purchaseOrders.data ?? purchaseOrders;
    const total = purchaseOrders.total ?? rows.length;

    return (
        <AppLayout>
            <Head title="Purchases" />
            <PageHeader title="Purchases" subtitle={`${total} purchase${total === 1 ? '' : 's'}`}>
                <Link href={route('procurement.purchase-orders.create')} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> New Purchase
                </Link>
            </PageHeader>
            <div className="p-4 sm:p-6">
                <div className="card overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Code', 'Date', 'Vendor', 'Project', 'Delivered to', 'Total', 'Paid', 'Due', ''].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map(po => {
                                const paid = Number(po.payments_sum_amount || 0);
                                const due = Math.max(Number(po.grand_total) - paid, 0);
                                return (
                                    <tr key={po.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-mono text-primary-600">
                                            <Link href={route('procurement.purchase-orders.show', po.id)}>{po.code}</Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{formatDate(po.order_date)}</td>
                                        <td className="px-4 py-3 text-sm font-medium">{po.vendor?.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{po.project?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {po.delivery_type === 'stock' ? (po.warehouse?.name ?? 'Warehouse')
                                                : po.delivery_type === 'site' ? 'Site' : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold tabular-nums">{formatBDT(po.grand_total)}</td>
                                        <td className="px-4 py-3 text-sm tabular-nums text-gray-600">{formatBDT(paid)}</td>
                                        <td className={`px-4 py-3 text-sm tabular-nums font-medium ${due > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {due > 0 ? formatBDT(due) : 'Paid'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link href={route('procurement.purchase-orders.show', po.id)} className="text-gray-400 hover:text-primary-600">
                                                <EyeIcon className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {rows.length === 0 && (
                                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No purchases yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
