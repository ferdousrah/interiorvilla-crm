import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'income', 'expense'];

export default function ChartOfAccounts({ groups, accountHeads }) {
    const [showModal, setShowModal] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', code: '', group_id: '', opening_balance: '0', is_bank: false,
    });

    function submit(e) {
        e.preventDefault();
        post(route('accounts.account-heads.store'), { onSuccess: () => { reset(); setShowModal(false); } });
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
                                        <tr>{['Code','Account Name','Group','Opening Balance'].map(h => (
                                            <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                        ))}</tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {typeHeads.map(head => (
                                            <tr key={head.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm font-mono text-primary-600">{head.code}</td>
                                                <td className="px-4 py-2 text-sm font-medium">{head.name}</td>
                                                <td className="px-4 py-2 text-sm text-gray-500">
                                                    {typeGroups.find(g => g.id === head.group_id)?.name}
                                                </td>
                                                <td className="px-4 py-2 text-sm">{Number(head.opening_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}৳</td>
                                            </tr>
                                        ))}
                                        {typeHeads.length === 0 && (
                                            <tr><td colSpan={4} className="px-4 py-3 text-center text-sm text-gray-400">No accounts in this category.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal open={showModal} onClose={() => setShowModal(false)} title="New Account">
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Account Name" error={errors.name} required>
                            <input className="form-input" value={data.name} onChange={e => setData('name', e.target.value)} />
                        </FormField>
                        <FormField label="Code" error={errors.code} required>
                            <input className="form-input" value={data.code} onChange={e => setData('code', e.target.value)} placeholder="e.g. 1010" />
                        </FormField>
                        <FormField label="Group" error={errors.group_id} required>
                            <select className="form-input" value={data.group_id} onChange={e => setData('group_id', e.target.value)}>
                                <option value="">Select Group…</option>
                                {(groups ?? []).map(g => <option key={g.id} value={g.id}>{g.name} ({g.type})</option>)}
                            </select>
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
        </AppLayout>
    );
}
