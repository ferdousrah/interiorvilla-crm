import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatBDT, formatDate } from '@/utils/formatters';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const STATUS_COLORS = { draft: 'gray', sent: 'info', partial: 'warning', paid: 'success', overdue: 'danger', cancelled: 'danger' };

export default function InvoicesIndex({ invoices, filters }) {
    const [status, setStatus] = useState(filters?.status ?? '');
    function filterStatus(s) {
        setStatus(s);
        router.get(route('accounts.invoices.index'), { status: s }, { preserveState: true, replace: true });
    }
    return (
        <AppLayout>
            <Head title="Invoices" />
            <PageHeader title="Invoices" subtitle={`${(invoices.data ?? invoices).length} invoices`}>
                <Link href={route('accounts.invoices.create')} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> New Invoice
                </Link>
            </PageHeader>
            <div className="p-4 sm:p-6">
                <div className="flex gap-2 mb-4">
                    {['', 'draft', 'sent', 'partial', 'paid', 'overdue'].map(s => (
                        <button key={s} onClick={() => filterStatus(s)}
                            className={`px-3 py-1 text-sm rounded-full border ${status === s ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                            {s || 'All'}
                        </button>
                    ))}
                </div>
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Code','Date','Due Date','Client','Amount','Paid','Balance','Status','Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(invoices.data ?? invoices).map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{inv.code}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(inv.invoice_date)}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(inv.due_date)}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{inv.client?.name}</td>
                                    <td className="px-4 py-3 text-sm">{formatBDT(inv.grand_total)}</td>
                                    <td className="px-4 py-3 text-sm text-green-700">{formatBDT(inv.paid_amount)}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-red-600">{formatBDT(inv.balance_due)}</td>
                                    <td className="px-4 py-3"><Badge variant={STATUS_COLORS[inv.status]}>{inv.status}</Badge></td>
                                    <td className="px-4 py-3">
                                        <Link href={route('accounts.invoices.show', inv.id)} className="text-gray-400 hover:text-primary-600">
                                            <EyeIcon className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(invoices.data ?? invoices).length === 0 && (
                                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No invoices found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
