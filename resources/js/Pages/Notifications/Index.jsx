import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import { TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

const ICONS = { lead_assigned: '🎯', task_assigned: '📋', invoice_paid: '💰', quotation_approved: '✅', follow_up: '🔔', leave_request: '🏖️', general: '📢', status_change: '🔄', created: '✨', deleted: '🗑️' };

function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
    if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NotificationsIndex({ notifications, unread_count }) {
    const items = notifications?.data ?? [];

    function markRead(id) { router.patch(route('notifications.read', id), {}, { preserveScroll: true }); }
    function deleteOne(id) { router.delete(route('notifications.destroy', id), { preserveScroll: true }); }
    function markAll() { router.post(route('notifications.read-all')); }

    return (
        <AppLayout>
            <Head title="Notifications" />
            <PageHeader title="Notifications" subtitle={`${unread_count} unread`}>
                {unread_count > 0 && (
                    <button onClick={markAll} className="btn btn-secondary text-sm flex items-center gap-2">
                        <CheckIcon className="w-4 h-4" /> Mark all read
                    </button>
                )}
            </PageHeader>

            <div className="p-4 sm:p-6 max-w-3xl">
                <div className="card overflow-hidden divide-y divide-gray-50">
                    {items.length === 0 && (
                        <p className="px-5 py-12 text-center text-gray-400">No notifications yet.</p>
                    )}
                    {items.map(n => (
                        <div key={n.id}
                            className={`flex items-start gap-3 px-4 sm:px-5 py-4 group transition-colors ${!n.read_at ? 'bg-primary-50/20' : 'hover:bg-gray-50'}`}>
                            <span className="text-xl flex-shrink-0 mt-0.5">{ICONS[n.type] ?? ICONS.general}</span>
                            <div className="flex-1 min-w-0">
                                {n.link ? (
                                    <Link href={n.link} className={`text-sm hover:text-primary-600 ${!n.read_at ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                        {n.title}
                                    </Link>
                                ) : (
                                    <p className={`text-sm ${!n.read_at ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                                )}
                                {n.message && <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>}
                                <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!n.read_at && (
                                    <button onClick={() => markRead(n.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600" title="Mark read">
                                        <CheckIcon className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={() => deleteOne(n.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="Delete">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                            {!n.read_at && <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />}
                        </div>
                    ))}
                </div>

                {notifications?.links && (
                    <div className="mt-4 flex justify-center gap-1">
                        {notifications.links.map((link, i) => (
                            <button key={i} disabled={!link.url || link.active}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                className={`px-3 py-1.5 text-sm rounded border ${link.active ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
