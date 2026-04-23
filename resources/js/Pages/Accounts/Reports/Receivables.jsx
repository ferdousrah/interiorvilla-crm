import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import ReportActions from '@/Components/ReportActions';
import Badge from '@/Components/Badge';
import { formatBDT, formatDate } from '@/utils/formatters';

export default function Receivables({ invoices = [], totalReceivable = 0 }) {
    return (
        <AppLayout>
            <Head title="Receivables Report" />
            <PageHeader title="Outstanding Receivables" back={route('accounts.reports.index')}>
                <ReportActions />
            </PageHeader>
            <div className="p-4 sm:p-6">
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
                    Total Outstanding: <strong className="text-primary-700 text-base">{formatBDT(totalReceivable ?? 0)}</strong>
                </div>
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Invoice','Date','Due Date','Client','Total','Paid','Balance','Status'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(invoices ?? []).map(inv => (
                                <tr key={inv.id} className={inv.status === 'overdue' ? 'bg-red-50' : ''}>
                                    <td className="px-4 py-3 text-sm font-mono text-primary-600">
                                        <Link href={route('accounts.invoices.show', inv.id)}>{inv.code}</Link>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{formatDate(inv.invoice_date)}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(inv.due_date)}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{inv.client?.name ?? inv.lead?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm">{formatBDT(inv.grand_total)}</td>
                                    <td className="px-4 py-3 text-sm text-green-700">{formatBDT(inv.paid_amount)}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-red-600">{formatBDT(inv.balance_due)}</td>
                                    <td className="px-4 py-3"><Badge variant={inv.status === 'overdue' ? 'danger' : 'warning'}>{inv.status}</Badge></td>
                                </tr>
                            ))}
                            {(invoices ?? []).length === 0 && (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No outstanding receivables.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
