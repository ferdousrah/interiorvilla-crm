import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import { usePermissions } from '@/Hooks/usePermissions';
import { PlusIcon, PencilIcon, TrashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'income', 'expense'];

export default function ChartOfAccounts({ groups, accountHeads }) {
    const [showModal, setShowModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', code: '', group_id: '', opening_balance: '0', is_bank: false,
    });

    const groupForm = useForm({ name: '', type: 'asset' });

    const { can, hasRole } = usePermissions();
    const canEdit = can('create.invoices');
    const canDelete = hasRole('admin');

    const [editing, setEditing] = useState(null);
    const editForm = useForm({ name: '', code: '', group_id: '', opening_balance: '0', is_active: true });

    function openEdit(head) {
        editForm.clearErrors();
        editForm.setData({
            name: head.name ?? '',
            code: head.code ?? '',
            group_id: head.group_id ?? '',
            opening_balance: String(head.opening_balance ?? '0'),
            is_active: !!head.is_active,
        });
        setEditing(head);
    }

    function submitEdit(e) {
        e.preventDefault();
        editForm.put(route('accounts.account-heads.update', editing.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    }

    function removeHead(head) {
        if (confirm(`Delete account ${head.code} — ${head.name}?`)) {
            router.delete(route('accounts.account-heads.destroy', head.id), { preserveScroll: true });
        }
    }

    function submit(e) {
        e.preventDefault();
        post(route('accounts.account-heads.store'), { onSuccess: () => { reset(); setShowModal(false); } });
    }

    function submitGroup(e) {
        e.preventDefault();
        groupForm.post(route('accounts.account-groups.store'), {
            onSuccess: () => { groupForm.reset(); setShowGroupModal(false); },
        });
    }

    const grouped = (groups ?? []).reduce((acc, g) => {
        acc[g.type] = acc[g.type] ?? [];
        acc[g.type].push(g);
        return acc;
    }, {});

    return (
        <AppLayout>
            <Head title="Chart of Accounts" />
            <PageHeader title="Chart of Accounts">
                <button onClick={() => setShowGroupModal(true)} className="btn btn-secondary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Add Group
                </button>
                <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Add Account
                </button>
            </PageHeader>
            <div className="p-4 sm:p-6 space-y-6">
                {ACCOUNT_TYPES.map(type => {
                    const typeGroups = grouped[type] ?? [];
                    const typeHeads = (accountHeads ?? []).filter(h => typeGroups.some(g => g.id === h.group_id));
                    if (typeHeads.length === 0 && typeGroups.length === 0) return null;
                    return (
                        <div key={type}>
                            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2 capitalize">{type}</h3>
                            <div className="card overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>{['Code','Account Name','Group','Opening Balance',''].map((h, i) => (
                                            <th key={i} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                        ))}</tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {typeHeads.map(head => (
                                            <tr key={head.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm font-mono text-primary-600">{head.code}</td>
                                                <td className="px-4 py-2 text-sm font-medium">
                                                    {head.name}
                                                    {!head.is_active && (
                                                        <span className="ml-2 text-[10px] font-semibold uppercase bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">Inactive</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-500">
                                                    {typeGroups.find(g => g.id === head.group_id)?.name}
                                                </td>
                                                <td className="px-4 py-2 text-sm">{Number(head.opening_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}৳</td>
                                                <td className="px-4 py-2 text-right whitespace-nowrap">
                                                    {canEdit && (
                                                        <button type="button" onClick={() => openEdit(head)} title="Edit account"
                                                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded hover:text-primary-600">
                                                            <PencilIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {canDelete && (head.is_system ? (
                                                        <span className="inline-block p-1.5 text-gray-300" title="System account — cannot be deleted">
                                                            <LockClosedIcon className="w-4 h-4" />
                                                        </span>
                                                    ) : (
                                                        <button type="button" onClick={() => removeHead(head)} title="Delete account"
                                                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded hover:text-red-500">
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    ))}
                                                </td>
                                            </tr>
                                        ))}
                                        {typeHeads.length === 0 && (
                                            <tr><td colSpan={5} className="px-4 py-3 text-center text-sm text-gray-400">No accounts in this category.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal open={showModal} onClose={() => setShowModal(false)} title="New Account">
                <form onSubmit={submit} className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Account Name" error={errors.name} required>
                            <input className="form-input" value={data.name} onChange={e => setData('name', e.target.value)} />
                        </FormField>
                        <FormField label="Code" error={errors.code} required>
                            <input className="form-input" value={data.code} onChange={e => setData('code', e.target.value)} placeholder="e.g. 1010" />
                        </FormField>
                        <FormField label="Group" error={errors.group_id} required>
                            <div className="flex gap-2">
                                <select className="form-input flex-1" value={data.group_id} onChange={e => setData('group_id', e.target.value)}>
                                    <option value="">Select Group…</option>
                                    {(groups ?? []).map(g => <option key={g.id} value={g.id}>{g.name} ({g.type})</option>)}
                                </select>
                                <button type="button" onClick={() => setShowGroupModal(true)}
                                    className="btn btn-secondary px-3 flex-shrink-0" title="Create a new group">
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </FormField>
                        <FormField label="Opening Balance (৳)" error={errors.opening_balance}>
                            <input type="number" className="form-input" value={data.opening_balance} onChange={e => setData('opening_balance', e.target.value)} />
                        </FormField>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={data.is_bank} onChange={e => setData('is_bank', e.target.checked)} className="rounded" />
                        Bank Account
                    </label>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? '…' : 'Create Account'}</button>
                        <button type="button" onClick={() => setShowModal(false)} className="btn">Cancel</button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!editing} onClose={() => setEditing(null)}
                title={editing ? `Edit Account ${editing.code}` : ''}>
                {editing && (
                    <form onSubmit={submitEdit} className="p-5 space-y-4">
                        {editing.is_system && (
                            <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded px-3 py-2">
                                This is a system account that the software posts to automatically, so its code and group are locked.
                                You can still change the name and opening balance.
                            </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Account Name" error={editForm.errors.name} required>
                                <input className="form-input" value={editForm.data.name}
                                    onChange={e => editForm.setData('name', e.target.value)} />
                            </FormField>
                            <FormField label="Code" error={editForm.errors.code} required>
                                <input className="form-input disabled:bg-gray-50 disabled:text-gray-500" value={editForm.data.code}
                                    disabled={editing.is_system}
                                    onChange={e => editForm.setData('code', e.target.value)} />
                            </FormField>
                            <FormField label="Group" error={editForm.errors.group_id} required>
                                <select className="form-input disabled:bg-gray-50 disabled:text-gray-500" value={editForm.data.group_id}
                                    disabled={editing.is_system}
                                    onChange={e => editForm.setData('group_id', e.target.value)}>
                                    {(groups ?? []).map(g => <option key={g.id} value={g.id}>{g.name} ({g.type})</option>)}
                                </select>
                            </FormField>
                            <FormField label="Opening Balance (৳)" error={editForm.errors.opening_balance}>
                                <input type="number" step="0.01" className="form-input" value={editForm.data.opening_balance}
                                    onChange={e => editForm.setData('opening_balance', e.target.value)} />
                            </FormField>
                        </div>
                        {!editing.is_system && (
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" className="rounded" checked={editForm.data.is_active}
                                    onChange={e => editForm.setData('is_active', e.target.checked)} />
                                Active <span className="text-gray-400">— inactive accounts are hidden from the dropdowns but keep their history</span>
                            </label>
                        )}
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={editForm.processing} className="btn btn-primary">
                                {editForm.processing ? 'Saving…' : 'Save Changes'}
                            </button>
                            <button type="button" onClick={() => setEditing(null)} className="btn">Cancel</button>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal open={showGroupModal} onClose={() => setShowGroupModal(false)} title="New Account Group" size="sm">
                <form onSubmit={submitGroup} className="p-5 space-y-4">
                    <p className="text-sm text-gray-600">
                        Groups categorize your accounts (e.g. "Cash &amp; Bank" under Asset, "Sales Revenue" under Income).
                    </p>
                    <FormField label="Group Name" error={groupForm.errors.name} required>
                        <input className="form-input" value={groupForm.data.name}
                            onChange={e => groupForm.setData('name', e.target.value)}
                            placeholder="e.g. Cash & Bank, Operating Expenses" autoFocus />
                    </FormField>
                    <FormField label="Type" error={groupForm.errors.type} required>
                        <select className="form-input" value={groupForm.data.type}
                            onChange={e => groupForm.setData('type', e.target.value)}>
                            {ACCOUNT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                        </select>
                        <p className="text-[11px] text-gray-500 mt-1.5">
                            <strong>Asset</strong>: cash, bank, receivables · <strong>Liability</strong>: payables, loans · <strong>Equity</strong>: capital · <strong>Income</strong>: revenue · <strong>Expense</strong>: costs
                        </p>
                    </FormField>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={groupForm.processing} className="btn btn-primary">
                            {groupForm.processing ? '…' : 'Create Group'}
                        </button>
                        <button type="button" onClick={() => setShowGroupModal(false)} className="btn">Cancel</button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
