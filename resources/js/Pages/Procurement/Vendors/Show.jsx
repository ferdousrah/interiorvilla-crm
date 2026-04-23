import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatBDT, formatDate } from '@/utils/formatters';
import { PencilIcon } from '@heroicons/react/24/outline';

export default function VendorShow({ vendor }) {
    const pos = vendor.purchaseOrders ?? [];
    return (
        <AppLayout>
            <Head title={vendor.name} />
            <PageHeader title={vendor.name} subtitle={vendor.code} back={route('procurement.vendors.index')}>
                <Link href={route('procurement.vendors.edit', vendor.id)} className="btn flex items-center gap-2">
                    <PencilIcon className="w-4 h-4" /> Edit
                </Link>
            </PageHeader>
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card p-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Contact Info</h3>
                    <dl className="space-y-2 text-sm">
                        <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{vendor.phone}</dd></div>
                        {vendor.email && <div><dt className="text-gray-500">Email</dt><dd>{vendor.email}</dd></div>}
                        {vendor.category && <div><dt className="text-gray-500">Category</dt><dd className="capitalize">{vendor.category}</dd></div>}
                        {vendor.address && <div><dt className="text-gray-500">Address</dt><dd>{vendor.address}</dd></div>}
                        {vendor.bank_name && <div><dt className="text-gray-500">Bank</dt><dd>{vendor.bank_name} · {vendor.bank_account}</dd></div>}
                        <div><dt className="text-gray-500">Status</dt><dd><Badge variant={vendor.is_active ? 'success' : 'gray'}>{vendor.is_active ? 'Active' : 'Inactive'}</Badge></dd></div>
                    </dl>
                </div>
                <div className="col-span-2">
                    <div className="card p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Purchase Orders ({pos.length})</h3>
                        {pos.length === 0 ? <p className="text-sm text-gray-400">No purchase orders yet.</p> : (
                            <table className="min-w-full text-sm divide-y divide-gray-100">
                                <thead><tr>{['Code','Date','Amount','Status'].map(h => <th key={h} className="pb-2 text-left text-xs text-gray-500 font-medium">{h}</th>)}</tr></thead>
                                <tbody className="divide-y divide-gray-50">
                                    {pos.map(po => (
                                        <tr key={po.id}>
                                            <td className="py-2 font-mono text-primary-600">
                                                <Link href={route('procurement.purchase-orders.show', po.id)} className="hover:underline">{po.code}</Link>
                                            </td>
                                            <td className="py-2">{formatDate(po.order_date)}</td>
                                            <td className="py-2">{formatBDT(po.grand_total)}</td>
                                            <td className="py-2"><Badge variant={po.status === 'approved' ? 'success' : 'warning'}>{po.status}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
