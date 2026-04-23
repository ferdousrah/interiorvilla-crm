import { Head, useForm, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import {
    UserCircleIcon, CameraIcon, TrashIcon,
    KeyIcon, ShieldCheckIcon, EnvelopeIcon, PhoneIcon,
} from '@heroicons/react/24/outline';

export default function ProfileEdit({ user }) {
    const avatarInputRef = useRef(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    // Profile form
    const profileForm = useForm({
        name:  user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
    });

    // Password form
    const passwordForm = useForm({
        current_password:      '',
        password:              '',
        password_confirmation: '',
    });

    const currentAvatar = user.avatar_path ? `/storage/${user.avatar_path}` : null;
    const displayAvatar = avatarPreview || currentAvatar;

    const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '?';

    function submitProfile(e) {
        e.preventDefault();
        profileForm.put(route('profile.update'));
    }

    function submitPassword(e) {
        e.preventDefault();
        passwordForm.put(route('profile.password'), {
            onSuccess: () => passwordForm.reset(),
        });
    }

    function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target.result);
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append('avatar', file);
        router.post(route('profile.avatar'), formData, {
            forceFormData: true,
            onSuccess: () => setAvatarPreview(null),
        });
    }

    function removeAvatar() {
        if (confirm('Remove your profile photo?')) {
            router.delete(route('profile.avatar.remove'));
            setAvatarPreview(null);
        }
    }

    return (
        <AppLayout>
            <Head title="My Profile" />
            <PageHeader title="My Profile" subtitle="Manage your account information" />

            <div className="p-4 sm:p-6 max-w-3xl space-y-6">

                {/* ── Avatar Section ──────────────── */}
                <div className="card p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center shadow-sm border-2 border-white ring-2 ring-gray-100">
                                {displayAvatar ? (
                                    <img src={displayAvatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-primary-400">{initials}</span>
                                )}
                            </div>
                            {/* Camera overlay */}
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <CameraIcon className="w-7 h-7 text-white" />
                            </button>
                            <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarUpload} />
                        </div>

                        {/* Info + buttons */}
                        <div className="text-center sm:text-left flex-1">
                            <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <div className="flex gap-2 mt-3 justify-center sm:justify-start">
                                <button type="button" onClick={() => avatarInputRef.current?.click()}
                                    className="btn btn-secondary text-xs flex items-center gap-1.5">
                                    <CameraIcon className="w-3.5 h-3.5" /> Change Photo
                                </button>
                                {(currentAvatar || avatarPreview) && (
                                    <button type="button" onClick={removeAvatar}
                                        className="btn text-xs text-red-500 hover:text-red-700 flex items-center gap-1.5">
                                        <TrashIcon className="w-3.5 h-3.5" /> Remove
                                    </button>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">JPG, PNG or WebP. Max 2MB.</p>
                        </div>
                    </div>
                </div>

                {/* ── Personal Info ───────────────── */}
                <form onSubmit={submitProfile}>
                    <div className="card p-5 sm:p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <UserCircleIcon className="w-5 h-5 text-gray-400" /> Personal Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Full Name" error={profileForm.errors.name} required>
                                <input className="form-input" value={profileForm.data.name}
                                    onChange={e => profileForm.setData('name', e.target.value)} />
                            </FormField>
                            <FormField label="Email Address" error={profileForm.errors.email} required>
                                <div className="relative">
                                    <EnvelopeIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                    <input type="email" className="form-input pl-9" value={profileForm.data.email}
                                        onChange={e => profileForm.setData('email', e.target.value)} />
                                </div>
                            </FormField>
                            <FormField label="Phone Number" error={profileForm.errors.phone}>
                                <div className="relative">
                                    <PhoneIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                    <input className="form-input pl-9" value={profileForm.data.phone}
                                        onChange={e => profileForm.setData('phone', e.target.value)} placeholder="+880..." />
                                </div>
                            </FormField>
                        </div>
                        <div className="mt-5 pt-4 border-t border-gray-100">
                            <button type="submit" disabled={profileForm.processing} className="btn btn-primary">
                                {profileForm.processing ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* ── Change Password ─────────────── */}
                <form onSubmit={submitPassword}>
                    <div className="card p-5 sm:p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                            <KeyIcon className="w-5 h-5 text-gray-400" /> Change Password
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">Leave blank if you don't want to change your password.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <FormField label="Current Password" error={passwordForm.errors.current_password} required>
                                    <input type="password" className="form-input" value={passwordForm.data.current_password}
                                        onChange={e => passwordForm.setData('current_password', e.target.value)}
                                        placeholder="Enter your current password" />
                                </FormField>
                            </div>
                            <FormField label="New Password" error={passwordForm.errors.password} required>
                                <input type="password" className="form-input" value={passwordForm.data.password}
                                    onChange={e => passwordForm.setData('password', e.target.value)}
                                    placeholder="Min 8 characters" />
                            </FormField>
                            <FormField label="Confirm New Password" error={passwordForm.errors.password_confirmation} required>
                                <input type="password" className="form-input" value={passwordForm.data.password_confirmation}
                                    onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                                    placeholder="Repeat new password" />
                            </FormField>
                        </div>
                        <div className="mt-5 pt-4 border-t border-gray-100">
                            <button type="submit" disabled={passwordForm.processing} className="btn btn-primary flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4" />
                                {passwordForm.processing ? 'Updating…' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
