import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import ConfirmDialog from '@/Components/ConfirmDialog';
import { PlusIcon, PencilIcon, KeyIcon, PowerIcon } from '@heroicons/react/24/outline';

export default function UsersIndex({ users, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [confirm, setConfirm] = useState(null); // { type, user }

    function handleSearch(e) {
        e.preventDefault();
        router.get(route('settings.users.index'), { search }, { preserveState: true, replace: true });
    }

    function toggleActive(user) {
        router.patch(route('settings.users.activate', user.id));
    }

    const data = users.data ?? users;

    return (
        <AppLayout>
            <Head title="Users" />
            <PageHeader title="User Management" subtitle="Manage system users and their roles">
                <Link href={route('settings.users.create')} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> New User
                </Link>
            </PageHeader>

            <div className="p-4 sm:p-6">
                <form onSubmit={handleSearch} className="mb-4 flex gap-3">
                    <input
                        className="form-input w-64"
                        placeholder="Search name or email…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <button type="submit" className="btn btn-secondary">Search</button>
                    {search && (
                        <button type="button" className="btn" onClick={() => { setSearch(''); router.get(route('settings.users.index')); }}>
                            Clear
                        </button>
                    )}
                </form>

                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Name', 'Email', 'Phone', 'Roles', 'Last Login', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {data.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{user.phone ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(user.roles ?? []).map(r => (
                                                <span key={r.id ?? r.name} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700 font-medium">
                                                    {r.name?.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                            {(user.roles ?? []).length === 0 && <span className="text-gray-400 text-xs">No roles</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge status={user.is_active ? 'active' : 'cancelled'} label={user.is_active ? 'Active' : 'Inactive'} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Link href={route('settings.users.edit', user.id)} title="Edit" className="text-gray-400 hover:text-yellow-600">
                                                <PencilIcon className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => setConfirm({ type: 'toggle', user })}
                                                title={user.is_active ? 'Deactivate' : 'Activate'}
                                                className={`${user.is_active ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'}`}
                                            >
                                                <PowerIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {users.links && (
                    <div className="mt-4 flex gap-1">
                        {users.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                className={`px-3 py-1.5 text-sm rounded border ${link.active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'} ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={confirm?.type === 'toggle'}
                onClose={() => setConfirm(null)}
                onConfirm={() => toggleActive(confirm.user)}
                title={confirm?.user?.is_active ? 'Deactivate User' : 'Activate User'}
                message={`Are you sure you want to ${confirm?.user?.is_active ? 'deactivate' : 'activate'} ${confirm?.user?.name}?`}
                confirmLabel={confirm?.user?.is_active ? 'Deactivate' : 'Activate'}
                variant={confirm?.user?.is_active ? 'danger' : 'warning'}
            />
        </AppLayout>
    );
}
