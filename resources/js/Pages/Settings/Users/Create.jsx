import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

export default function UserCreate({ roles }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        roles: [],
        is_active: true,
    });

    function toggleRole(roleName) {
        setData('roles', data.roles.includes(roleName)
            ? data.roles.filter(r => r !== roleName)
            : [...data.roles, roleName]
        );
    }

    function submit(e) {
        e.preventDefault();
        post(route('settings.users.store'));
    }

    return (
        <AppLayout>
            <Head title="New User" />
            <PageHeader title="New User" back={route('settings.users.index')} />
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Full Name" error={errors.name} required>
                            <input className="form-input" value={data.name} onChange={e => setData('name', e.target.value)} />
                        </FormField>
                        <FormField label="Email" error={errors.email} required>
                            <input type="email" className="form-input" value={data.email} onChange={e => setData('email', e.target.value)} />
                        </FormField>
                        <FormField label="Phone" error={errors.phone}>
                            <input className="form-input" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                        </FormField>
                        <FormField label="Password" error={errors.password} required>
                            <input type="password" className="form-input" value={data.password} onChange={e => setData('password', e.target.value)} />
                        </FormField>
                        <FormField label="Confirm Password" error={errors.password_confirmation} required>
                            <input type="password" className="form-input" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} />
                        </FormField>
                    </div>

                    <FormField label="Roles" error={errors.roles} required>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            {roles.map(role => (
                                <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-primary-600"
                                        checked={data.roles.includes(role.name)}
                                        onChange={() => toggleRole(role.name)}
                                    />
                                    <span className="text-sm text-gray-700 capitalize">{role.name.replace(/_/g, ' ')}</span>
                                </label>
                            ))}
                        </div>
                    </FormField>

                    <FormField label="Status" error={errors.is_active}>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-primary-600"
                                checked={data.is_active}
                                onChange={e => setData('is_active', e.target.checked)}
                            />
                            <span className="text-sm text-gray-700">Active</span>
                        </label>
                    </FormField>

                    <p className="text-xs text-gray-500">User will be required to change password on first login.</p>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Creating…' : 'Create User'}
                        </button>
                        <a href={route('settings.users.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
