import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import MapPicker from '@/Components/MapPicker';
import { formatBDT, formatDate } from '@/utils/formatters';
import { PencilIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function ClientShow({ client }) {
    const invoices = client.invoices ?? [];
    const projects = client.projects ?? [];

    return (
        <AppLayout>
            <Head title={client.name} />
            <PageHeader title={client.name} subtitle={client.code} back={route('clients.index')}>
                <Link href={route('clients.edit', client.id)} className="btn flex items-center gap-2">
                    <PencilIcon className="w-4 h-4" /> Edit
                </Link>
            </PageHeader>

            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="col-span-1 space-y-4">
                    <div className="card p-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Contact Info</h3>
                        <dl className="space-y-2 text-sm">
                            <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{client.phone}</dd></div>
                            {client.email && <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{client.email}</dd></div>}
                            {client.city && <div><dt className="text-gray-500">City</dt><dd>{client.city}</dd></div>}
                            {client.address && <div><dt className="text-gray-500">Address</dt><dd>{client.address}</dd></div>}
                            <div><dt className="text-gray-500">Status</dt><dd><Badge variant={client.is_active ? 'success' : 'gray'}>{client.is_active ? 'Active' : 'Inactive'}</Badge></dd></div>
                        </dl>
                    </div>
                    {(client.latitude && client.longitude) && (
                        <div className="card p-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1.5">
                                <MapPinIcon className="w-4 h-4" /> Location
                            </h3>
                            <MapPicker
                                value={{ lat: client.latitude, lng: client.longitude }}
                                readOnly
                                height={220}
                            />
                            <a href={`https://www.google.com/maps?q=${client.latitude},${client.longitude}`}
                                target="_blank" rel="noopener"
                                className="mt-2 inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                                <MapPinIcon className="w-3 h-3" /> Open in Google Maps
                            </a>
                        </div>
                    )}

                    {client.notes && (
                        <div className="card p-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{client.notes}</p>
                        </div>
                    )}
                </div>

                <div className="col-span-2 space-y-4">
                    <div className="card p-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Projects ({projects.length})</h3>
                        {projects.length === 0 ? (
                            <p className="text-sm text-gray-400">No projects yet.</p>
                        ) : (
                            <table className="min-w-full text-sm divide-y divide-gray-100">
                                <thead><tr>{['Code','Name','Status','Value'].map(h => <th key={h} className="pb-2 text-left text-xs text-gray-500 font-medium">{h}</th>)}</tr></thead>
                                <tbody className="divide-y divide-gray-50">
                                    {projects.map(p => (
                                        <tr key={p.id}>
                                            <td className="py-2 font-mono text-primary-600">{p.code}</td>
                                            <td className="py-2"><Link href={route('projects.show', p.id)} className="hover:text-primary-600">{p.name}</Link></td>
                                            <td className="py-2"><Badge variant="info">{p.status}</Badge></td>
                                            <td className="py-2">{formatBDT(p.contract_value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="card p-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Invoices ({invoices.length})</h3>
                        {invoices.length === 0 ? (
                            <p className="text-sm text-gray-400">No invoices yet.</p>
                        ) : (
                            <table className="min-w-full text-sm divide-y divide-gray-100">
                                <thead><tr>{['Code','Date','Amount','Status'].map(h => <th key={h} className="pb-2 text-left text-xs text-gray-500 font-medium">{h}</th>)}</tr></thead>
                                <tbody className="divide-y divide-gray-50">
                                    {invoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td className="py-2 font-mono text-primary-600">{inv.code}</td>
                                            <td className="py-2">{formatDate(inv.invoice_date)}</td>
                                            <td className="py-2">{formatBDT(inv.grand_total)}</td>
                                            <td className="py-2"><Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}>{inv.status}</Badge></td>
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
