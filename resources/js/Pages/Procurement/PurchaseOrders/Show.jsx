import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatDate, formatBDT } from '@/utils/formatters';

const STATUS_COLORS = { draft: 'gray', approved: 'success', sent: 'info', partial: 'warning', received: 'success', cancelled: 'danger' };

export default function PurchaseOrderShow({ po }) {
    return (
        <AppLayout>
            <Head title={po.code} />
            <PageHeader title={po.code} subtitle="Purchase Order" back={route('procurement.purchase-orders.index')}>
                <a href={route('procurement.purchase-orders.pdf', po.id)} target="_blank" className="btn text-sm">Download PDF</a>
            </PageHeader>
            <div className="p-4 sm:p-6 max-w-5xl">
                <div className="card p-4 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Vendor</p>
                            <p className="font-semibold">{po.vendor?.name}</p>
                            <p className="text-gray-600">{po.vendor?.phone}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Order Info</p>
                            <p>Date: {formatDate(po.order_date)}</p>
                            {po.expected_delivery && <p>Expected: {formatDate(po.expected_delivery)}</p>}
                            {po.payment_terms && <p>Terms: {po.payment_terms}</p>}
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Status</p>
                            <Badge variant={STATUS_COLORS[po.status]}>{po.status}</Badge>
                            {po.project && <p className="mt-2 text-gray-600">Project: {po.project.name}</p>}
                        </div>
                    </div>
                </div>

                <div className="card overflow-hidden mb-4">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['#','Description','Unit','Qty Ordered','Qty Received','Rate','Total'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(po.items ?? []).map((item, i) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 text-sm">{i + 1}</td>
                                    <td className="px-4 py-3 text-sm">{item.description}</td>
                                    <td className="px-4 py-3 text-sm">{item.unit}</td>
                                    <td className="px-4 py-3 text-sm">{item.quantity_ordered}</td>
                                    <td className="px-4 py-3 text-sm">{item.quantity_received}</td>
                                    <td className="px-4 py-3 text-sm">{Number(item.unit_rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}৳</td>
                                    <td className="px-4 py-3 text-sm font-medium">{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}৳</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-right text-sm space-y-1">
                    <div>Subtotal: {formatBDT(po.subtotal)}</div>
                    {po.vat_amount > 0 && <div>VAT: {formatBDT(po.vat_amount)}</div>}
                    {po.other_charges > 0 && <div>Other Charges: {formatBDT(po.other_charges)}</div>}
                    <div className="font-bold text-primary-700 text-base">Grand Total: {formatBDT(po.grand_total)}</div>
                </div>
            </div>
        </AppLayout>
    );
}
