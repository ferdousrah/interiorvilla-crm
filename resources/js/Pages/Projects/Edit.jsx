import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

const TYPES = ['residential', 'commercial', 'office', 'retail', 'restaurant', 'hospital', 'other'];
const STATUSES = ['survey', 'planning', 'design', 'execution', 'finishing', 'handover', 'completed', 'on_hold', 'cancelled'];

export default function ProjectEdit({ project, clients, engineers = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        name:               project.name ?? '',
        client_id:          project.client_id ?? '',
        type:               project.type ?? 'residential',
        status:             project.status ?? 'planning',
        site_address:       project.site_address ?? '',
        area_sqft:          project.area_sqft ?? '',
        start_date:         project.start_date?.substring(0, 10) ?? '',
        expected_end_date:  project.expected_end_date?.substring(0, 10) ?? '',
        contract_value:     project.contract_value ?? '',
        budget_limit:       project.budget_limit ?? '',
        site_engineer_id:   project.site_engineer_id ?? '',
        notes:              project.notes ?? '',
    });

    function submit(e) {
        e.preventDefault();
        put(route('projects.update', project.id));
    }

    return (
        <AppLayout>
            <Head title={`Edit ${project.name}`} />
            <PageHeader title={`Edit: ${project.name}`} back={route('projects.show', project.id)} />
            <div className="p-4 sm:p-6 max-w-3xl mx-auto">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <FormField label="Project Name" error={errors.name} required>
                        <input className="form-input" value={data.name} onChange={e => setData('name', e.target.value)} />
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Client" error={errors.client_id} required>
                            <select className="form-input" value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                                <option value="">— Select Client —</option>
                                {(clients ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Type" error={errors.type} required>
                            <select className="form-input" value={data.type} onChange={e => setData('type', e.target.value)}>
                                {TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Status" error={errors.status} required>
                            <select className="form-input" value={data.status} onChange={e => setData('status', e.target.value)}>
                                {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Site Engineer" error={errors.site_engineer_id}
                            hint={engineers.length === 0 ? 'Assign the "site_engineer" role to a user under Settings → Users.' : 'Users with the Site Engineer role'}>
                            <select className="form-input" value={data.site_engineer_id} onChange={e => setData('site_engineer_id', e.target.value)}>
                                <option value="">— none —</option>
                                {engineers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Contract Value (BDT)" error={errors.contract_value}>
                            <input type="number" min="0" step="0.01" className="form-input"
                                value={data.contract_value} onChange={e => setData('contract_value', e.target.value)} />
                        </FormField>
                        <FormField label="Budget Limit (BDT)" error={errors.budget_limit}>
                            <input type="number" min="0" step="0.01" className="form-input"
                                value={data.budget_limit} onChange={e => setData('budget_limit', e.target.value)} />
                        </FormField>
                        <FormField label="Area (sqft)" error={errors.area_sqft}>
                            <input type="number" min="0" step="0.01" className="form-input"
                                value={data.area_sqft} onChange={e => setData('area_sqft', e.target.value)} />
                        </FormField>
                        <FormField label="Start Date" error={errors.start_date}>
                            <input type="date" className="form-input" value={data.start_date} onChange={e => setData('start_date', e.target.value)} />
                        </FormField>
                        <FormField label="Expected End Date" error={errors.expected_end_date}>
                            <input type="date" className="form-input" value={data.expected_end_date} onChange={e => setData('expected_end_date', e.target.value)} />
                        </FormField>
                    </div>

                    <FormField label="Site Address" error={errors.site_address} required>
                        <textarea className="form-input" rows={2} value={data.site_address}
                            onChange={e => setData('site_address', e.target.value)}
                            placeholder="Full site address" />
                    </FormField>

                    <FormField label="Notes" error={errors.notes}>
                        <textarea className="form-input" rows={3} value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                            placeholder="Internal notes about the project" />
                    </FormField>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Saving…' : 'Update Project'}
                        </button>
                        <a href={route('projects.show', project.id)} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
