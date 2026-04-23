import { Head, router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import FormField from '@/Components/FormField';
import {
    PlusIcon, TrashIcon, PencilIcon, ShieldCheckIcon,
    CheckIcon, XMarkIcon, UsersIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline';

const ACTION_LABELS = {
    view:    'View',
    create:  'Create',
    edit:    'Edit',
    update:  'Update',
    delete:  'Delete',
    manage:  'Manage',
    approve: 'Approve',
    record:  'Record',
};

const ACTION_COLORS = {
    view:    'bg-blue-100 text-blue-700 border-blue-200',
    create:  'bg-emerald-100 text-emerald-700 border-emerald-200',
    edit:    'bg-amber-100 text-amber-700 border-amber-200',
    update:  'bg-amber-100 text-amber-700 border-amber-200',
    delete:  'bg-red-100 text-red-700 border-red-200',
    manage:  'bg-violet-100 text-violet-700 border-violet-200',
    approve: 'bg-teal-100 text-teal-700 border-teal-200',
    record:  'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const SYSTEM_ROLES = ['super_admin', 'admin'];

/* ── Collapsible Menu ────────────────────── */
function MenuGroup({ menu, selectedPermissions, onToggle, onToggleBulk, disabled }) {
    const [open, setOpen] = useState(true);

    // Count checked across all submenus
    const allPerms = menu.submenus.flatMap(s => s.permissions);
    const checkedCount = allPerms.filter(p => selectedPermissions.has(p.name)).length;
    const allChecked = checkedCount === allPerms.length;
    const someChecked = checkedCount > 0 && !allChecked;

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            {/* Menu header */}
            <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-3 flex-1 text-left">
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`} />
                    <span className="text-lg">{menu.icon}</span>
                    <span className="text-sm font-semibold text-gray-800">{menu.name}</span>
                    <span className="text-xs text-gray-400">· {checkedCount}/{allPerms.length}</span>
                </button>
                <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={allChecked}
                        ref={el => el && (el.indeterminate = someChecked)}
                        onChange={() => onToggleBulk(allPerms, !allChecked)}
                        disabled={disabled}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-[10px] text-gray-500 font-medium">All</span>
                </label>
            </div>

            {/* Submenus */}
            {open && (
                <div className="divide-y divide-gray-50">
                    {menu.submenus.map(sub => {
                        const subChecked = sub.permissions.filter(p => selectedPermissions.has(p.name)).length;
                        const subAll = subChecked === sub.permissions.length;
                        const subSome = subChecked > 0 && !subAll;
                        return (
                            <div key={sub.name} className="px-4 py-3 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={subAll}
                                            ref={el => el && (el.indeterminate = subSome)}
                                            onChange={() => onToggleBulk(sub.permissions, !subAll)}
                                            disabled={disabled}
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            {sub.name}
                                        </span>
                                        <span className="text-[10px] text-gray-400">{subChecked}/{sub.permissions.length}</span>
                                    </label>
                                </div>
                                <div className="flex flex-wrap gap-1.5 ml-6">
                                    {sub.permissions.map(p => {
                                        const checked = disabled || selectedPermissions.has(p.name);
                                        const color = ACTION_COLORS[p.action] ?? 'bg-gray-100 text-gray-700 border-gray-200';
                                        return (
                                            <label
                                                key={p.id}
                                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs cursor-pointer transition-all select-none ${
                                                    checked ? `${color} font-medium` : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                                                } ${disabled ? 'cursor-not-allowed opacity-80' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => !disabled && onToggle(p.name)}
                                                    disabled={disabled}
                                                    className="sr-only"
                                                />
                                                {checked ? <CheckIcon className="w-3 h-3" /> : <XMarkIcon className="w-3 h-3 opacity-40" />}
                                                <span>{ACTION_LABELS[p.action] ?? p.action}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── Main Page ─────────────────────────── */
export default function RolesIndex({ roles, menus, allPermissions }) {
    const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? null);
    const [showNewRole, setShowNewRole] = useState(false);
    const [renameRole, setRenameRole] = useState(null);

    const selectedRole = useMemo(() => roles.find(r => r.id === selectedRoleId), [roles, selectedRoleId]);
    const selectedPermissions = useMemo(
        () => new Set((selectedRole?.permissions ?? []).map(p => p.name)),
        [selectedRole]
    );
    const isSuperAdmin = selectedRole?.name === 'super_admin';
    const isSystemRole = SYSTEM_ROLES.includes(selectedRole?.name);

    function savePermissions(perms) {
        router.patch(route('settings.roles.permissions', selectedRole.id), {
            permissions: [...perms],
        }, { preserveScroll: true, preserveState: true });
    }

    function togglePermission(permName) {
        if (isSuperAdmin) return;
        const current = new Set(selectedPermissions);
        if (current.has(permName)) current.delete(permName);
        else current.add(permName);
        savePermissions(current);
    }

    function toggleBulk(perms, shouldCheck) {
        if (isSuperAdmin) return;
        const current = new Set(selectedPermissions);
        perms.forEach(p => shouldCheck ? current.add(p.name) : current.delete(p.name));
        savePermissions(current);
    }

    function selectAll() {
        if (isSuperAdmin) return;
        savePermissions(new Set(allPermissions));
    }
    function clearAll() {
        if (isSuperAdmin) return;
        savePermissions(new Set());
    }

    function deleteRole(role) {
        if (confirm(`Delete role "${role.name}"? This cannot be undone.`)) {
            router.delete(route('settings.roles.destroy', role.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout>
            <Head title="Roles & Permissions" />
            <PageHeader title="Roles & Permissions" subtitle={`${roles.length} roles · ${allPermissions.length} permissions`}>
                <button onClick={() => setShowNewRole(true)} className="btn btn-primary flex items-center gap-2 text-sm">
                    <PlusIcon className="w-4 h-4" /> New Role
                </button>
            </PageHeader>

            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">

                {/* ── Roles sidebar ────────────── */}
                <div className="lg:col-span-1">
                    <div className="card overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Roles</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {roles.map(role => {
                                const active = role.id === selectedRoleId;
                                const isSystem = SYSTEM_ROLES.includes(role.name);
                                return (
                                    <button
                                        key={role.id}
                                        onClick={() => setSelectedRoleId(role.id)}
                                        className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-2 ${
                                            active ? 'bg-primary-50 border-l-4 border-primary-500' : 'hover:bg-gray-50 border-l-4 border-transparent'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <p className={`text-sm font-medium capitalize ${active ? 'text-primary-700' : 'text-gray-900'} truncate`}>
                                                {role.name.replace(/_/g, ' ')}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                    <UsersIcon className="w-3 h-3" />{role.users_count ?? 0}
                                                </span>
                                                <span className="text-[10px] text-gray-400">·</span>
                                                <span className="text-[10px] text-gray-400">{role.permissions?.length ?? 0} perms</span>
                                                {isSystem && (
                                                    <span className="text-[9px] font-bold bg-violet-100 text-violet-700 px-1.5 rounded">SYSTEM</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Permissions editor ────────── */}
                <div className="lg:col-span-3">
                    {selectedRole ? (
                        <div className="space-y-4">
                            {/* Role header */}
                            <div className="card px-5 py-4 flex items-center justify-between flex-wrap gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 capitalize flex items-center gap-2">
                                        <ShieldCheckIcon className="w-5 h-5 text-primary-500" />
                                        {selectedRole.name.replace(/_/g, ' ')}
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {isSuperAdmin
                                            ? 'Super Admin has all permissions and cannot be modified.'
                                            : `${selectedPermissions.size} of ${allPermissions.length} permissions granted`}
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {!isSuperAdmin && (
                                        <>
                                            <button onClick={selectAll} className="btn btn-secondary text-xs">Select All</button>
                                            <button onClick={clearAll} className="btn btn-secondary text-xs">Clear All</button>
                                        </>
                                    )}
                                    {!isSystemRole && (
                                        <>
                                            <button onClick={() => setRenameRole(selectedRole)} className="btn btn-secondary text-xs flex items-center gap-1.5">
                                                <PencilIcon className="w-3.5 h-3.5" /> Rename
                                            </button>
                                            <button onClick={() => deleteRole(selectedRole)} className="btn btn-danger text-xs flex items-center gap-1.5">
                                                <TrashIcon className="w-3.5 h-3.5" /> Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Menu sections */}
                            <div className="space-y-3">
                                {menus.map(menu => (
                                    <MenuGroup
                                        key={menu.name}
                                        menu={menu}
                                        selectedPermissions={selectedPermissions}
                                        onToggle={togglePermission}
                                        onToggleBulk={toggleBulk}
                                        disabled={isSuperAdmin}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="card p-12 text-center text-gray-400">Select a role to edit permissions</div>
                    )}
                </div>
            </div>

            <NewRoleModal open={showNewRole} onClose={() => setShowNewRole(false)} menus={menus} />
            {renameRole && <RenameRoleModal role={renameRole} onClose={() => setRenameRole(null)} />}
        </AppLayout>
    );
}

/* ── New Role Modal ─────────────────── */
function NewRoleModal({ open, onClose, menus }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', permissions: [],
    });
    const selectedSet = new Set(data.permissions);

    function toggle(permName) {
        setData('permissions', selectedSet.has(permName)
            ? data.permissions.filter(p => p !== permName)
            : [...data.permissions, permName]);
    }
    function toggleBulk(perms, shouldCheck) {
        const current = new Set(data.permissions);
        perms.forEach(p => shouldCheck ? current.add(p.name) : current.delete(p.name));
        setData('permissions', [...current]);
    }

    function submit(e) {
        e.preventDefault();
        post(route('settings.roles.store'), {
            onSuccess: () => { reset(); onClose(); },
        });
    }

    return (
        <Modal open={open} onClose={onClose} title="Create New Role" size="lg">
            <form onSubmit={submit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <FormField label="Role Name" error={errors.name} required>
                    <input className="form-input" value={data.name}
                        onChange={e => setData('name', e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))}
                        placeholder="e.g. sales_manager" />
                    <p className="text-[10px] text-gray-400 mt-1">Auto-formatted: "Sales Admin" → "sales_admin"</p>
                </FormField>

                <div>
                    <label className="form-label">Permissions ({data.permissions.length} selected)</label>
                    <div className="space-y-2 mt-1">
                        {menus.map(menu => (
                            <MenuGroup
                                key={menu.name}
                                menu={menu}
                                selectedPermissions={selectedSet}
                                onToggle={toggle}
                                onToggleBulk={toggleBulk}
                                disabled={false}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pt-3 border-t border-gray-100">
                    <button type="submit" disabled={processing} className="btn btn-primary">
                        {processing ? 'Creating…' : 'Create Role'}
                    </button>
                    <button type="button" onClick={onClose} className="btn">Cancel</button>
                </div>
            </form>
        </Modal>
    );
}

/* ── Rename Role Modal ───────────────── */
function RenameRoleModal({ role, onClose }) {
    const { data, setData, put, processing, errors } = useForm({ name: role.name });

    function submit(e) {
        e.preventDefault();
        put(route('settings.roles.update', role.id), { onSuccess: onClose });
    }

    return (
        <Modal open={true} onClose={onClose} title="Rename Role" size="sm">
            <form onSubmit={submit} className="p-5 space-y-4">
                <FormField label="Role Name" error={errors.name} required>
                    <input className="form-input" value={data.name}
                        onChange={e => setData('name', e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))} />
                    <p className="text-[10px] text-gray-400 mt-1">Lowercase, underscores only.</p>
                </FormField>
                <div className="flex gap-3">
                    <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Saving…' : 'Save'}</button>
                    <button type="button" onClick={onClose} className="btn">Cancel</button>
                </div>
            </form>
        </Modal>
    );
}
