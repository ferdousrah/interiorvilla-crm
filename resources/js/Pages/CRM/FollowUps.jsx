import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { formatDate } from '@/utils/formatters';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function FollowUps({ leads }) {
    const items = leads?.data ?? leads ?? [];

    function markDone(leadId) {
        router.patch(route('crm.leads.follow-up-done', leadId), {}, { preserveScroll: true });
    }

    return (
        <AppLayout>
            <Head title="Follow-ups" />
            <PageHeader title="Pending Follow-ups" back={route('crm.index')}>
                <Link href={route('crm.leads.create')} className="btn btn-primary">New Lead</Link>
            </PageHeader>
            <div className="p-4 sm:p-6">
                <div className="card divide-y divide-gray-100">
                    {items.length === 0 && (
                        <p className="p-8 text-center text-gray-400">No pending follow-ups.</p>
                    )}
                    {items.map(lead => (
                        <div key={lead.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                            <div>
                                <Link href={route('crm.leads.show', lead.id)} className="font-medium text-sm hover:text-primary-600">{lead.name}</Link>
                                <p className="text-xs text-gray-500">{lead.phone} · {lead.source}</p>
                                <p className="text-xs text-blue-600 mt-1">Follow-up: {formatDate(lead.follow_up_at)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge status={lead.status} />
                                <button onClick={() => markDone(lead.id)} className="btn flex items-center gap-1 text-xs">
                                    <CheckIcon className="w-4 h-4" /> Done
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
