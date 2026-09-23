import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatDate, formatBDT } from '@/utils/formatters';
import { TrashIcon, BanknotesIcon } from '@heroicons/react/24/outline';

const STATUS_COLORS = { draft: 'gray', sent: 'info', partially_received: 'warning', received: 'success', cancelled: 'danger' };
const METHOD_LABELS = { cash: 'Cash', bank_transfer: 'Bank Transfer', cheque: 'Cheque', bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', other: 'Other' };

export default function PurchaseShow({ po }) {
    const paid = (po.payments ?? []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const due = Math.max(Number(po.grand_total) - paid, 0);
    const isDirect = !!po.delivery_type;

    function doDelete() {
        const msg = `Delete ${po.code}?\n\nThis also reverses its stock entries, payments recorded with it, and journal entries.`;
        if (confirm(msg)) router.delete(route('procurement.purchase-orders.destroy', po.id));
    }

    return (
        <AppLayout>
            <Head title={po.code} />
            <PageHeader title={po.code} subtitle="Purchase" back={route('procurement.purchase-orders.index')}>
                {due > 0 && (
                    <Link href={route('accounts.vendor-payments.create', { vendor_id: po.vendor_id, po_id: po.id })}
                        className="btn btn-secondary flex items-center gap-2 text-sm">
                        <BanknotesIcon className="w-4 h-4" /> Pay Due
                    </Link>
                )}
                <a href={route('procurement.purchase-orders.pdf', po.id)} target="_blank" className="btn text-sm">PDF</a>
                <button onClick={doDelete} className="btn btn-danger flex items-center gap-2 text-sm">
                    <TrashIcon className="w-4 h-4" /> Delete
                </button>
            </PageHeader>
            <div className="p-4 sm:p-6 max-w-5xl">
                <div className="card p-4 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Vendor</p>
                            <p className="font-semibold">{po.vendor?.name}</p>
                            <p className="text-gray-600">{po.vendor?.phone}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Date</p>
                            <p>{formatDate(po.order_date)}</p>
                            {po.created_by && <p className="text-gray-500 text-xs mt-1">by {po.created_by.name}</p>}
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Delivered to</p>
                            {isDirect ? (
                                po.delivery_type === 'stock'
                                    ? <p>Warehouse: <span className="font-medium">{po.warehouse?.name ?? '—'}</span></p>
                                    : <p>Project site</p>
                            ) : <Badge variant={STATUS_COLORS[po.status]}>{po.status}</Badge>}
                            {po.project && <p className="mt-1 text-gray-600">Project: <span className="font-medium">{po.project.name}</span></p>}
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Payment</p>
                            <p>Paid: <span className="font-semibold tabular-nums">{formatBDT(paid)}</span></p>
                            <p>Due: <span className={`font-semibold tabular-nums ${due > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{formatBDT(due)}</span></p>
                        </div>
                    </div>
                    {po.notes && <p className="text-sm text-gray-600 mt-4 pt-3 border-t border-gray-100">{po.notes}</p>}
                </div>

                <div className="card overflow-hidden mb-4">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['#', 'Description', 'Unit', 'Qty', 'Rate', 'Total'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(po.items ?? []).map((item, i) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 text-sm">{i + 1}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {item.description}
                                        {item.inventory_item?.code && <span className="block text-xs text-gray-400">{item.inventory_item.code}</span>}
                                    </td>
                                    <td className="px-4 py-3 text-sm">{item.unit}</td>
                                    <td className="px-4 py-3 text-sm tabular-nums">{Number(item.quantity_ordered)}</td>
                                    <td className="px-4 py-3 text-sm tabular-nums">{formatBDT(item.unit_rate)}</td>
                                    <td className="px-4 py-3 text-sm font-medium tabular-nums">{formatBDT(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="text-right text-sm space-y-1 p-4 border-t border-gray-100">
                        <div>Subtotal: {formatBDT(po.subtotal)}</div>
                        {Number(po.vat_amount) > 0 && <div>VAT: {formatBDT(po.vat_amount)}</div>}
                        {Number(po.other_charges) > 0 && <div>Transport / Other: {formatBDT(po.other_charges)}</div>}
                        <div className="font-bold text-primary-700 text-base">Total: {formatBDT(po.grand_total)}</div>
                    </div>
                </div>

                <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-900">Payments</div>
                    {(po.payments ?? []).length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-gray-400">No payments recorded yet.</p>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <tbody className="divide-y divide-gray-100">
                                {po.payments.map(p => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-2.5 font-mono text-primary-600">{p.code}</td>
                                        <td className="px-4 py-2.5">{formatDate(p.payment_date)}</td>
                                        <td className="px-4 py-2.5">{METHOD_LABELS[p.payment_method] ?? p.payment_method}{p.account_head ? ` · ${p.account_head.name}` : ''}</td>
                                        <td className="px-4 py-2.5 text-gray-500">{p.reference ?? ''}</td>
                                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">{formatBDT(p.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
