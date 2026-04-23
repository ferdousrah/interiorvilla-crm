import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import { formatBDT, formatDate } from '@/utils/formatters';

export default function VendorPaymentShow({ payment }) {
    return (
        <AppLayout>
            <Head title={`Payment ${payment.code}`} />
            <PageHeader title={`Vendor Payment: ${payment.code}`} back={route('accounts.vendor-payments.index')} />
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <div className="card p-6">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Payment Code</dt>
                            <dd className="font-mono font-medium text-primary-600">{payment.code}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Vendor</dt>
                            <dd>
                                <Link href={route('procurement.vendors.show', payment.vendor?.id)} className="text-primary-600 hover:underline">
                                    {payment.vendor?.name}
                                </Link>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Purchase Order</dt>
                            <dd>
                                {payment.purchase_order
                                    ? <Link href={route('procurement.purchase-orders.show', payment.purchase_order.id)} className="text-primary-600 hover:underline">{payment.purchase_order.code}</Link>
                                    : <span className="text-gray-400">—</span>
                                }
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Amount</dt>
                            <dd className="font-semibold text-red-600 text-lg">{formatBDT(payment.amount)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Payment Date</dt>
                            <dd>{formatDate(payment.payment_date)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Method</dt>
                            <dd className="capitalize">{payment.payment_method?.replace(/_/g, ' ')}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Account</dt>
                            <dd>{payment.account_head?.name ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Reference</dt>
                            <dd>{payment.reference ?? '—'}</dd>
                        </div>
                        {payment.notes && (
                            <div className="col-span-2">
                                <dt className="text-xs text-gray-500 uppercase">Notes</dt>
                                <dd className="text-sm">{payment.notes}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            </div>
        </AppLayout>
    );
}
