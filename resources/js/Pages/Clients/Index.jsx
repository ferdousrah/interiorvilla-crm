import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import { MagnifyingGlassIcon, PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Badge from '@/Components/Badge';

export default function ClientsIndex({ clients, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState(null);

    function handleSearch(e) {
        e.preventDefault();
        router.get(route('clients.index'), { search }, { preserveState: true, replace: true });
    }

    function handleDelete() {
        router.delete(route('clients.destroy', deleteTarget), { onFinish: () => setDeleteTarget(null) });
    }

    return (
        <AppLayout>
            <Head title="Clients" />
            <PageHeader title="Clients" subtitle={`${clients.total ?? clients.length} total clients`}>
                <Link href={route('clients.create')} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> New Client
                </Link>
            </PageHeader>

            <div className="p-4 sm:p-6">
                <form onSubmit={handleSearch} className="mb-4 flex gap-2 max-w-sm">
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search clients..."
                        className="form-input flex-1"
                    />
                    <button type="submit" className="btn btn-primary px-3">
                        <MagnifyingGlassIcon className="w-4 h-4" />
                    </button>
                </form>

                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Code','Name','Phone','Email','City','Status','Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(clients.data ?? clients).map(client => (
                                <tr key={client.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{client.code}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{client.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{client.phone}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{client.email}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{client.city}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={client.is_active ? 'success' : 'gray'}>{client.is_active ? 'Active' : 'Inactive'}</Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link href={route('clients.show', client.id)} className="text-gray-400 hover:text-primary-600">
                                                <EyeIcon className="w-4 h-4" />
                                            </Link>
                                            <Link href={route('clients.edit', client.id)} className="text-gray-400 hover:text-yellow-600">
                                                <PencilIcon className="w-4 h-4" />
                                            </Link>
                                            <button onClick={() => setDeleteTarget(client.id)} className="text-gray-400 hover:text-red-600">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(clients.data ?? clients).length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No clients found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {clients.last_page > 1 && (
                    <div className="mt-4 flex gap-2 justify-end">
                        {clients.links?.map((link, i) => (
                            <button key={i} onClick={() => link.url && router.get(link.url)}
                                disabled={!link.url}
                                className={`px-3 py-1 text-sm rounded border ${link.active ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'} disabled:opacity-40`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Client"
                message="Are you sure? This cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}
