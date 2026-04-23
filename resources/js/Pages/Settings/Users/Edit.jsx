import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';

export default function UserEdit({ user, roles }) {
    const [showResetModal, setShowResetModal] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        roles: (user.roles ?? []).map(r => r.name),
        is_active: user.is_active,
    });

    const resetForm = useForm({ password: '', password_confirmation: '' });

    function toggleRole(roleName) {
        setData('roles', data.roles.includes(roleName)
            ? data.roles.filter(r => r !== roleName)
            : [...data.roles, roleName]
        );
    }

    function submit(e) {
        e.preventDefault();
        put(route('settings.users.update', user.id));
    }

    function submitReset(e) {
        e.preventDefault();
        resetForm.post(route('settings.users.reset-password', user.id), {
            onSuccess: () => setShowResetModal(false),
        });
    }

    return (
        <AppLayout>
            <Head title={`Edit ${user.name}`} />
            <PageHeader title={`Edit User: ${user.name}`} back={route('settings.users.index')} />
            <div className="p-4 sm:p-6 max-w-2xl space-y-6">
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

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={() => setShowResetModal(true)} className="btn btn-secondary">
                            Reset Password
                        </button>
                        <a href={route('settings.users.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>

            <Modal open={showResetModal} onClose={() => setShowResetModal(false)} title="Reset Password" size="sm">
                <form onSubmit={submitReset} className="p-4 sm:p-6 space-y-4">
                    <FormField label="New Password" error={resetForm.errors.password} required>
                        <input
                            type="password"
                            className="form-input"
                            value={resetForm.data.password}
                            onChange={e => resetForm.setData('password', e.target.value)}
                        />
                    </FormField>
                    <FormField label="Confirm Password" error={resetForm.errors.password_confirmation} required>
                        <input
                            type="password"
                            className="form-input"
                            value={resetForm.data.password_confirmation}
                            onChange={e => resetForm.setData('password_confirmation', e.target.value)}
                        />
                    </FormField>
                    <p className="text-xs text-gray-500">User will be required to change password on next login.</p>
                    <div className="flex gap-3">
                        <button type="submit" disabled={resetForm.processing} className="btn btn-primary">
                            {resetForm.processing ? 'Resetting…' : 'Reset Password'}
                        </button>
                        <button type="button" onClick={() => setShowResetModal(false)} className="btn">Cancel</button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
