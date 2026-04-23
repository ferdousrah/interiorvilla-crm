import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import ReportActions from '@/Components/ReportActions';
import Badge from '@/Components/Badge';
import { formatBDT, formatDate } from '@/utils/formatters';

export default function Payables({ purchaseOrders = [], totalPayable = 0 }) {
    return (
        <AppLayout>
            <Head title="Payables Report" />
            <PageHeader title="Outstanding Payables" back={route('accounts.reports.index')}>
                <ReportActions />
            </PageHeader>
            <div className="p-4 sm:p-6">
                <div className="mb-4 p-3 bg-orange-50 rounded-lg text-sm">
                    Total Outstanding: <strong className="text-orange-700 text-base">{formatBDT(totalPayable ?? 0)}</strong>
                </div>
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['PO Code','Date','Vendor','Total','Amount Paid','Balance','Status'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(purchaseOrders ?? []).map(po => (
                                <tr key={po.id}>
                                    <td className="px-4 py-3 text-sm font-mono text-primary-600">
                                        <Link href={route('procurement.purchase-orders.show', po.id)}>{po.code}</Link>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{formatDate(po.order_date)}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{po.vendor?.name}</td>
                                    <td className="px-4 py-3 text-sm">{formatBDT(po.grand_total)}</td>
                                    <td className="px-4 py-3 text-sm text-green-700">{formatBDT(po.amount_paid ?? 0)}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-red-600">{formatBDT((po.grand_total ?? 0) - (po.amount_paid ?? 0))}</td>
                                    <td className="px-4 py-3"><Badge variant={po.status === 'approved' ? 'success' : 'warning'}>{po.status}</Badge></td>
                                </tr>
                            ))}
                            {(purchaseOrders ?? []).length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No outstanding payables.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
