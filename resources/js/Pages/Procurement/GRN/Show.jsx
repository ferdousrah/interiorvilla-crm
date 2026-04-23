import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import { formatDate } from '@/utils/formatters';

export default function GRNShow({ grn }) {
    return (
        <AppLayout>
            <Head title={grn.code} />
            <PageHeader title={grn.code} subtitle="Goods Received Note" back={route('procurement.grn.index')} />
            <div className="p-4 sm:p-6 max-w-4xl">
                <div className="card p-4 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">PO Reference</p>
                            <p className="font-mono font-semibold text-primary-600">{grn.purchaseOrder?.code}</p>
                            <p className="text-gray-600">{grn.purchaseOrder?.vendor?.name}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Received</p>
                            <p>{formatDate(grn.received_date)}</p>
                            <p className="text-gray-600">By: {grn.receivedBy?.name}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Warehouse</p>
                            <p className="font-medium">{grn.warehouse?.name}</p>
                        </div>
                    </div>
                    {grn.notes && <p className="mt-3 text-sm text-gray-600">{grn.notes}</p>}
                </div>
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['#','Description','Unit','Qty Ordered','Qty Received'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(grn.items ?? []).map((item, i) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 text-sm">{i + 1}</td>
                                    <td className="px-4 py-3 text-sm">{item.poItem?.description ?? item.description}</td>
                                    <td className="px-4 py-3 text-sm">{item.poItem?.unit ?? item.unit}</td>
                                    <td className="px-4 py-3 text-sm">{item.poItem?.quantity_ordered}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-green-700">{item.quantity_received}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
