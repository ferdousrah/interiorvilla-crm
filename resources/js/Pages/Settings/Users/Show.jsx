import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { PencilIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/utils/formatters';

export default function UserShow({ user }) {
    return (
        <AppLayout>
            <Head title={user.name} />
            <PageHeader title={user.name} back={route('settings.users.index')}>
                <Link href={route('settings.users.edit', user.id)} className="btn btn-secondary flex items-center gap-2">
                    <PencilIcon className="w-4 h-4" /> Edit
                </Link>
            </PageHeader>
            <div className="p-4 sm:p-6 max-w-xl">
                <div className="card p-6">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Name</dt>
                            <dd className="font-medium">{user.name}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Email</dt>
                            <dd>{user.email}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Phone</dt>
                            <dd>{user.phone ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Status</dt>
                            <dd><Badge status={user.is_active ? 'active' : 'cancelled'} label={user.is_active ? 'Active' : 'Inactive'} /></dd>
                        </div>
                        <div className="col-span-2">
                            <dt className="text-xs text-gray-500 uppercase mb-1">Roles</dt>
                            <dd className="flex flex-wrap gap-1">
                                {(user.roles ?? []).map(r => (
                                    <span key={r.id ?? r.name} className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700 font-medium capitalize">
                                        {r.name?.replace(/_/g, ' ')}
                                    </span>
                                ))}
                                {(user.roles ?? []).length === 0 && <span className="text-gray-400 text-sm">No roles assigned</span>}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Last Login</dt>
                            <dd>{user.last_login_at ? formatDate(user.last_login_at) : 'Never'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Created</dt>
                            <dd>{formatDate(user.created_at)}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </AppLayout>
    );
}
