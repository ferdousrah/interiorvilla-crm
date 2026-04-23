import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { PencilIcon } from '@heroicons/react/24/outline';

export default function WarehouseShow({ warehouse }) {
    return (
        <AppLayout>
            <Head title={warehouse.name} />
            <PageHeader title={warehouse.name} subtitle="Warehouse" back={route('inventory.warehouses.index')}>
                <Link href={route('inventory.warehouses.edit', warehouse.id)} className="btn btn-secondary flex items-center gap-2">
                    <PencilIcon className="w-4 h-4" /> Edit
                </Link>
            </PageHeader>
            <div className="p-4 sm:p-6 max-w-lg">
                <div className="card p-6">
                    <dl className="space-y-4">
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Name</dt>
                            <dd className="font-medium">{warehouse.name}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Location</dt>
                            <dd>{warehouse.location ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Status</dt>
                            <dd><Badge status={warehouse.is_active ? 'active' : 'cancelled'} label={warehouse.is_active ? 'Active' : 'Inactive'} /></dd>
                        </div>
                    </dl>
                </div>
            </div>
        </AppLayout>
    );
}
