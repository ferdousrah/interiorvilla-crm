import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import { PlusIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import Badge from '@/Components/Badge';

export default function VendorsIndex({ vendors }) {
    return (
        <AppLayout>
            <Head title="Vendors" />
            <PageHeader title="Vendors" subtitle={`${(vendors.data ?? vendors).length} vendors`}>
                <Link href={route('procurement.vendors.create')} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> New Vendor
                </Link>
            </PageHeader>
            <div className="p-4 sm:p-6">
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Code','Name','Phone','Email','Category','Status','Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(vendors.data ?? vendors).map(v => (
                                <tr key={v.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{v.code}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{v.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{v.phone}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{v.email}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{v.category}</td>
                                    <td className="px-4 py-3"><Badge variant={v.is_active ? 'success' : 'gray'}>{v.is_active ? 'Active' : 'Inactive'}</Badge></td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link href={route('procurement.vendors.show', v.id)} className="text-gray-400 hover:text-primary-600"><EyeIcon className="w-4 h-4" /></Link>
                                            <Link href={route('procurement.vendors.edit', v.id)} className="text-gray-400 hover:text-yellow-600"><PencilIcon className="w-4 h-4" /></Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(vendors.data ?? vendors).length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No vendors found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
