import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatBDT, formatDate } from '@/utils/formatters';

export default function ReceiptShow({ receipt }) {
    return (
        <AppLayout>
            <Head title={`Receipt ${receipt.code}`} />
            <PageHeader title={`Receipt: ${receipt.code}`} back={route('accounts.receipts.index')} />
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <div className="card p-6">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Receipt Code</dt>
                            <dd className="font-mono font-medium text-primary-600">{receipt.code}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Client</dt>
                            <dd>{receipt.client?.name ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Invoice</dt>
                            <dd>
                                {receipt.invoice
                                    ? <Link href={route('accounts.invoices.show', receipt.invoice.id)} className="text-primary-600 hover:underline">{receipt.invoice.code}</Link>
                                    : <span className="text-gray-400">Advance (no invoice)</span>
                                }
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Amount</dt>
                            <dd className="font-semibold text-green-700 text-lg">{formatBDT(receipt.amount)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Receipt Date</dt>
                            <dd>{formatDate(receipt.receipt_date)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Payment Method</dt>
                            <dd className="capitalize">{receipt.payment_method?.replace(/_/g, ' ')}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Account</dt>
                            <dd>{receipt.account_head?.name ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Reference</dt>
                            <dd>{receipt.reference ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Recorded By</dt>
                            <dd>{receipt.created_by?.name ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Date Recorded</dt>
                            <dd>{formatDate(receipt.created_at)}</dd>
                        </div>
                        {receipt.notes && (
                            <div className="col-span-2">
                                <dt className="text-xs text-gray-500 uppercase">Notes</dt>
                                <dd className="text-sm">{receipt.notes}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            </div>
        </AppLayout>
    );
}
