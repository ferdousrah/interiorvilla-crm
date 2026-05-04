import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

const SOURCES = ['referral', 'facebook', 'instagram', 'website', 'walk_in', 'cold_call', 'exhibition', 'other'];
const STATUSES = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];

export default function LeadEdit({ lead, users = [], serviceCategories = {}, canAssign = false }) {
    const { data, setData, put, processing, errors } = useForm({
        type: lead.type ?? 'individual',
        company_name: lead.company_name ?? '',
        name: lead.name ?? '',
        phone: lead.phone ?? '',
        email: lead.email ?? '',
        address: lead.address ?? '',
        source: lead.source ?? 'referral',
        status: lead.status ?? 'new',
        service_group: lead.service_group ?? '',
        service_type: lead.service_type ?? '',
        estimated_value: lead.estimated_value ?? '',
        assigned_to: lead.assigned_to ?? '',
        follow_up_at: lead.follow_up_at ? lead.follow_up_at.substring(0, 16) : '',
        notes: lead.notes ?? '',
    });

    const serviceTypes = data.service_group ? (serviceCategories[data.service_group] ?? []) : [];

    function submit(e) {
        e.preventDefault();
        put(route('crm.leads.update', lead.id));
    }

    return (
        <AppLayout>
            <Head title={`Edit Lead: ${lead.name}`} />
            <PageHeader title={`Edit: ${lead.name}`} subtitle={lead.code} back={route('crm.leads.show', lead.id)} />
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    {/* Type toggle */}
                    <div className="inline-flex p-1 rounded-lg bg-gray-100 text-sm">
                        {['individual', 'corporate'].map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setData('type', t)}
                                className={`px-4 py-1.5 rounded-md font-semibold capitalize transition-colors ${
                                    data.type === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {data.type === 'corporate' && (
                            <FormField label="Company Name" error={errors.company_name} required className="sm:col-span-2">
                                <input className="form-input" value={data.company_name}
                                    onChange={e => setData('company_name', e.target.value)}
                                    placeholder="e.g. Richmond Group Ltd." />
                            </FormField>
                        )}
                        <FormField label={data.type === 'corporate' ? 'Contact Person Name' : 'Full Name'} error={errors.name} required>
                            <input className="form-input" value={data.name} onChange={e => setData('name', e.target.value)} />
                        </FormField>
                        <FormField label="Phone" error={errors.phone} required>
                            <input className="form-input" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                        </FormField>
                        <FormField label="Email" error={errors.email}>
                            <input type="email" className="form-input" value={data.email} onChange={e => setData('email', e.target.value)} />
                        </FormField>
                        <FormField label="Source" error={errors.source} required>
                            <select className="form-input" value={data.source} onChange={e => setData('source', e.target.value)}>
                                {SOURCES.map(s => <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Status" error={errors.status}>
                            <select className="form-input" value={data.status} onChange={e => setData('status', e.target.value)}>
                                {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s === 'contacted' ? 'Meeting' : s.replace(/_/g, ' ')}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Service Category" error={errors.service_group}>
                            <select className="form-input" value={data.service_group} onChange={e => { setData('service_group', e.target.value); setData('service_type', ''); }}>
                                <option value="">Select category…</option>
                                {Object.keys(serviceCategories).map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Service Type" error={errors.service_type}>
                            <select className="form-input" value={data.service_type} onChange={e => setData('service_type', e.target.value)} disabled={!data.service_group}>
                                <option value="">{data.service_group ? 'Select service…' : 'Select category first'}</option>
                                {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Estimated Value (৳)" error={errors.estimated_value}>
                            <input type="number" className="form-input" min="0" step="1000" value={data.estimated_value} onChange={e => setData('estimated_value', e.target.value)} />
                        </FormField>
                        {canAssign && (
                            <FormField label="Assign To" error={errors.assigned_to}>
                                <select className="form-input" value={data.assigned_to} onChange={e => setData('assigned_to', e.target.value)}>
                                    <option value="">Unassigned</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </FormField>
                        )}
                        <FormField label="Follow-up Date" error={errors.follow_up_at}>
                            <input type="datetime-local" className="form-input" value={data.follow_up_at} onChange={e => setData('follow_up_at', e.target.value)} />
                        </FormField>
                    </div>
                    <FormField label="Address" error={errors.address}>
                        <textarea className="form-input" rows={2} value={data.address} onChange={e => setData('address', e.target.value)} placeholder="Site address…" />
                    </FormField>
                    <FormField label="Notes" error={errors.notes}>
                        <textarea className="form-input" rows={3} value={data.notes} onChange={e => setData('notes', e.target.value)} />
                    </FormField>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Saving…' : 'Update Lead'}</button>
                        <a href={route('crm.leads.show', lead.id)} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
