import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FilterBar from '@/Components/FilterBar';
import Pagination from '@/Components/Pagination';
import { formatBDT, formatDate } from '@/utils/formatters';
import { PlusIcon, BanknotesIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { usePermissions } from '@/Hooks/usePermissions';

export default function VendorPayments({ payments, totalAmount = 0, filters = {}, vendors = [], projects = [] }) {
    const rows = payments.data ?? payments;
    const { can, hasRole } = usePermissions();
    const canEdit = can('create.invoices');
    const canDelete = hasRole('admin');

    function remove(p) {
        const purchase = p.purchase_order ?? p.purchaseOrder;
        const note = purchase ? `\n\n${purchase.code} will show ${formatBDT(p.amount)} as due again.` : '';
        if (confirm(`Delete payment ${p.code} (${formatBDT(p.amount)})?${note}`)) {
            router.delete(route('accounts.vendor-payments.destroy', p.id), { preserveScroll: true });
        }
    }
    const total = payments.total ?? rows.length;

    return (
        <AppLayout>
            <Head title="Vendor Payments" />
            <PageHeader title="Vendor Payments" subtitle={`${total} payment${total === 1 ? '' : 's'}`}>
                <Link href={route('accounts.vendor-payments.create')} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Record Payment
                </Link>
            </PageHeader>
            <div className="p-4 sm:p-6 space-y-4">
                <div className="card p-3 ring-1 ring-gray-100 sm:max-w-xs">
                    <div className="flex items-center gap-2">
                        <BanknotesIcon className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-gray-500 uppercase font-semibold">Total Amount</span>
                    </div>
                    <p className="text-xl font-bold text-red-600 mt-1 tabular-nums">{formatBDT(totalAmount)}</p>
                </div>
                <FilterBar routeName="accounts.vendor-payments.index" filters={filters} fields={[
                    { type: 'search', name: 'search', placeholder: 'Code, vendor, purchase, reference…' },
                    { type: 'select', name: 'vendor_id', placeholder: 'All vendors', options: vendors.map(v => ({ value: v.id, label: v.name })) },
                    { type: 'select', name: 'project_id', placeholder: 'All projects', options: [{ value: 'none', label: '— No project —' }, ...projects.map(pr => ({ value: pr.id, label: pr.name }))] },
                    { type: 'select', name: 'payment_method', placeholder: 'All methods', options: ['cash', 'bank_transfer', 'cheque', 'bkash', 'nagad', 'rocket', 'other'].map(m => ({ value: m, label: m.replace('_', ' ').replace(/^./, c => c.toUpperCase()) })) },
                    { type: 'date', name: 'from', label: 'From' },
                    { type: 'date', name: 'to', label: 'To' },
                ]} />
                <div className="card overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Date', 'Code', 'Vendor', 'For', 'Project', 'Amount', 'Method', 'Paid From', 'Reference', ''].map((h, i) => (
                                <th key={i} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map(p => {
                                const purchase = p.purchase_order ?? p.purchaseOrder;
                                const account = p.account_head ?? p.accountHead;
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(p.payment_date)}</td>
                                        <td className="px-4 py-3 text-xs font-mono text-primary-700">{p.code}</td>
                                        <td className="px-4 py-3 text-sm font-medium">{p.vendor?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {purchase
                                                ? <Link href={route('procurement.purchase-orders.show', purchase.id)} className="font-mono text-primary-600 hover:underline">{purchase.code}</Link>
                                                : (p.cost_head ?? p.costHead)
                                                    ? <span className="text-gray-700">{(p.cost_head ?? p.costHead).name}</span>
                                                    : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{p.project?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-red-600 tabular-nums">{formatBDT(p.amount)}</td>
                                        <td className="px-4 py-3 text-sm capitalize">{p.payment_method?.replace('_', ' ')}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{account?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{p.reference ?? '—'}</td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            {canEdit && (
                                                <Link href={route('accounts.vendor-payments.edit', p.id)} title="Edit payment"
                                                    className="inline-block p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded">
                                                    <PencilIcon className="w-4 h-4" />
                                                </Link>
                                            )}
                                            {canDelete && (
                                                <button type="button" onClick={() => remove(p)} title="Delete payment"
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {rows.length === 0 && (
                                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No vendor payments found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination data={payments} />
            </div>
        </AppLayout>
    );
}
