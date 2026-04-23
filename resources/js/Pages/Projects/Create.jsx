import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

export default function ProjectCreate({ clients, engineers = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '', client_id: '', description: '',
        start_date: '', end_date: '', contract_value: '', status: 'planning',
        site_engineer_id: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('projects.store'));
    }

    return (
        <AppLayout>
            <Head title="New Project" />
            <PageHeader title="New Project" back={route('projects.index')} />
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <FormField label="Project Name" error={errors.name} required>
                        <input className="form-input" value={data.name} onChange={e => setData('name', e.target.value)} />
                    </FormField>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Client" error={errors.client_id}>
                            <select className="form-input" value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                                <option value="">-- No Client --</option>
                                {(clients ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Status" error={errors.status}>
                            <select className="form-input" value={data.status} onChange={e => setData('status', e.target.value)}>
                                {['planning','in_progress','on_hold','completed','cancelled'].map(s => (
                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Contract Value (BDT)" error={errors.contract_value}>
                            <input type="number" className="form-input" value={data.contract_value} onChange={e => setData('contract_value', e.target.value)} />
                        </FormField>
                        <FormField label="Site Engineer" error={errors.site_engineer_id} hint={engineers.length === 0 ? 'Assign the "site_engineer" role to a user under Settings → Users.' : 'Users with the Site Engineer role'}>
                            <select className="form-input" value={data.site_engineer_id} onChange={e => setData('site_engineer_id', e.target.value)}>
                                <option value="">— none —</option>
                                {engineers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Start Date" error={errors.start_date}>
                            <input type="date" className="form-input" value={data.start_date} onChange={e => setData('start_date', e.target.value)} />
                        </FormField>
                        <FormField label="End Date" error={errors.end_date}>
                            <input type="date" className="form-input" value={data.end_date} onChange={e => setData('end_date', e.target.value)} />
                        </FormField>
                    </div>
                    <FormField label="Description" error={errors.description}>
                        <textarea className="form-input" rows={3} value={data.description} onChange={e => setData('description', e.target.value)} />
                    </FormField>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Creating…' : 'Create Project'}</button>
                        <a href={route('projects.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
