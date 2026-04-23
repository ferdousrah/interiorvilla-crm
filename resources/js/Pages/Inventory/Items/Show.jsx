import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { PencilIcon, ExclamationTriangleIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const TX_COLORS = { receipt: 'success', issue: 'danger', adjustment: 'warning', transfer: 'info' };

const STOCK_STATUS = {
    out: { label: 'Out of Stock', cls: 'bg-red-100 text-red-700 border-red-200',     icon: XCircleIcon,             valueCls: 'text-red-700' },
    low: { label: 'Low Stock',    cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: ExclamationTriangleIcon, valueCls: 'text-amber-700' },
    ok:  { label: 'In Stock',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircleIcon, valueCls: 'text-emerald-700' },
};

export default function InventoryItemShow({ item }) {
    const transactions = item.stockTransactions ?? [];
    const statusKey = item.stock_status ?? 'ok';
    const status = STOCK_STATUS[statusKey];
    const StatusIcon = status.icon;
    return (
        <AppLayout>
            <Head title={item.name} />
            <PageHeader title={item.name} subtitle={item.code} back={route('inventory.items.index')}>
                <Link href={route('inventory.items.edit', item.id)} className="btn flex items-center gap-2">
                    <PencilIcon className="w-4 h-4" /> Edit
                </Link>
            </PageHeader>
            <div className="p-4 sm:p-6 space-y-4">
                {/* Stock alert banner */}
                {statusKey !== 'ok' && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl border ${status.cls}`}>
                        <StatusIcon className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{statusKey === 'out' ? 'Stock depleted' : 'Stock is running low'}</p>
                            <p className="text-xs opacity-80">
                                Current: <strong>{Number(item.current_stock || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} {item.unit}</strong>
                                {item.reorder_level > 0 && <> · Minimum: <strong>{item.reorder_level} {item.unit}</strong></>}
                                {' — consider creating a purchase requisition.'}
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="card p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Item Details</h3>
                        <dl className="space-y-2 text-sm">
                            <div><dt className="text-gray-500">Category</dt><dd className="capitalize">{item.category?.name ?? '—'}</dd></div>
                            <div><dt className="text-gray-500">Unit</dt><dd>{item.unit}</dd></div>
                            {item.sku && <div><dt className="text-gray-500">SKU</dt><dd className="font-mono">{item.sku}</dd></div>}
                            <div>
                                <dt className="text-gray-500">Current Stock</dt>
                                <dd className={`text-2xl font-bold ${status.valueCls}`}>
                                    {Number(item.current_stock || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} {item.unit}
                                </dd>
                                <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${status.cls}`}>
                                    <StatusIcon className="w-3 h-3" /> {status.label}
                                </span>
                            </div>
                            <div><dt className="text-gray-500">Minimum (Reorder) Level</dt><dd>{item.reorder_level || 0} {item.unit}</dd></div>
                            {item.standard_rate && <div><dt className="text-gray-500">Standard Rate</dt><dd>{Number(item.standard_rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</dd></div>}
                            <div><dt className="text-gray-500">Status</dt><dd><Badge variant={item.is_active ? 'success' : 'gray'}>{item.is_active ? 'Active' : 'Inactive'}</Badge></dd></div>
                        </dl>
                    </div>
                <div className="col-span-2">
                    <div className="card p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Stock Transactions</h3>
                        {transactions.length === 0 ? <p className="text-sm text-gray-400">No transactions yet.</p> : (
                            <table className="min-w-full text-sm divide-y divide-gray-100">
                                <thead><tr className="text-xs text-gray-500">
                                    <th className="text-left pb-2">Date</th>
                                    <th className="text-left pb-2">Type</th>
                                    <th className="text-left pb-2">Qty</th>
                                    <th className="text-left pb-2">Reference</th>
                                </tr></thead>
                                <tbody className="divide-y divide-gray-50">
                                    {transactions.map(tx => (
                                        <tr key={tx.id}>
                                            <td className="py-2">{formatDateTime(tx.transaction_date)}</td>
                                            <td className="py-2"><Badge variant={TX_COLORS[tx.type] ?? 'gray'}>{tx.type}</Badge></td>
                                            <td className={`py-2 font-semibold ${tx.type === 'receipt' ? 'text-green-700' : 'text-red-700'}`}>
                                                {tx.type === 'receipt' ? '+' : '-'}{tx.quantity}
                                            </td>
                                            <td className="py-2 text-gray-500">{tx.reference ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
                </div>
            </div>
        </AppLayout>
    );
}
