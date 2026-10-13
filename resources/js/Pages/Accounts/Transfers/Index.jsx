import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import dayjs from 'dayjs';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import FilterBar from '@/Components/FilterBar';
import Pagination from '@/Components/Pagination';
import { usePermissions } from '@/Hooks/usePermissions';
import { formatBDT, formatDate } from '@/utils/formatters';
import { PlusIcon, PencilIcon, TrashIcon, ArrowRightIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

const today = () => dayjs().format('YYYY-MM-DD');
const blank = () => ({ from_account_id: '', to_account_id: '', amount: '', transfer_date: today(), reference: '', notes: '' });

export default function FundTransfers({ transfers, accounts = [], filters = {} }) {
    const { can, hasRole } = usePermissions();
    const canEdit = can('create.invoices');
    const canDelete = hasRole('admin');

    const [modal, setModal] = useState(null); // null | 'new' | transfer being edited
    const form = useForm(blank());
    const editing = modal && modal !== 'new' ? modal : null;

    function openNew() {
        form.clearErrors();
        form.setData(blank());
        setModal('new');
    }

    function openEdit(t) {
        form.clearErrors();
        form.setData({
            from_account_id: t.from_account_id,
            to_account_id: t.to_account_id,
            amount: String(t.amount ?? ''),
            transfer_date: dayjs(t.transfer_date).format('YYYY-MM-DD'),
            reference: t.reference ?? '',
            notes: t.notes ?? '',
        });
        setModal(t);
    }

    function swap() {
        form.setData(d => ({ ...d, from_account_id: d.to_account_id, to_account_id: d.from_account_id }));
    }

    function submit(e) {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => setModal(null) };
        if (editing) form.put(route('accounts.transfers.update', editing.id), options);
        else form.post(route('accounts.transfers.store'), options);
    }

    function remove(t) {
        const from = t.from_account?.name ?? 'the source account';
        if (confirm(`Delete transfer ${t.code}?\n\n${formatBDT(t.amount)} goes back to ${from} and the ledger entry is removed.`)) {
            router.delete(route('accounts.transfers.destroy', t.id), { preserveScroll: true });
        }
    }

    const rows = transfers.data ?? transfers;
    const fromAccount = accounts.find(a => a.id === form.data.from_account_id);
    const amount = parseFloat(form.data.amount) || 0;
    // When editing, the transfer's own amount has already left the source account.
    const available = fromAccount
        ? fromAccount.balance + (editing && editing.from_account_id === fromAccount.id ? Number(editing.amount) : 0)
        : null;
    const overdraws = available !== null && amount > available;

    return (
        <AppLayout>
            <Head title="Fund Transfers" />
            <PageHeader title="Fund Transfers" subtitle="Move money between your cash, bank and wallet accounts">
                {canEdit && (
                    <button onClick={openNew} className="btn btn-primary flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" /> New Transfer
                    </button>
                )}
            </PageHeader>

            <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {accounts.map(a => (
                        <div key={a.id} className="card p-3">
                            <p className="text-xs text-gray-500"><span className="font-mono">{a.code}</span> · {a.name}</p>
                            <p className={`text-lg font-bold tabular-nums mt-1 ${a.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>{formatBDT(a.balance)}</p>
                        </div>
                    ))}
                </div>

                <FilterBar routeName="accounts.transfers.index" filters={filters} fields={[
                    { type: 'search', name: 'search', placeholder: 'Code, reference, notes…' },
                    { type: 'select', name: 'account_id', placeholder: 'All accounts', options: accounts.map(a => ({ value: a.id, label: a.name })) },
                    { type: 'date', name: 'from', label: 'From' },
                    { type: 'date', name: 'to', label: 'To' },
                ]} />

                <div className="card overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Date', 'Code', 'From', '', 'To', 'Amount', 'Reference', 'By', ''].map((h, i) => (
                                <th key={i} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(t.transfer_date)}</td>
                                    <td className="px-4 py-3 text-xs font-mono text-primary-700">{t.code}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{t.from_account?.name ?? '—'}</td>
                                    <td className="px-1 py-3 text-gray-300"><ArrowRightIcon className="w-4 h-4" /></td>
                                    <td className="px-4 py-3 text-sm font-medium">{t.to_account?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm font-semibold tabular-nums">{formatBDT(t.amount)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{t.reference ?? t.notes ?? '—'}</td>
                                    <td className="px-4 py-3 text-xs text-gray-600">{t.created_by?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        {canEdit && (
                                            <button type="button" onClick={() => openEdit(t)} title="Edit transfer"
                                                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button type="button" onClick={() => remove(t)} title="Delete transfer"
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                                    No transfers yet. Use one when you withdraw cash from the bank or deposit cash into it.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination data={transfers} />
            </div>

            <Modal open={!!modal} onClose={() => setModal(null)} size="md"
                title={editing ? `Edit Transfer ${editing.code}` : 'New Transfer'}>
                <form onSubmit={submit} className="p-6 space-y-4">
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <FormField label="From" error={form.errors.from_account_id} required>
                                <select className="form-input" value={form.data.from_account_id}
                                    onChange={e => form.setData('from_account_id', e.target.value)}>
                                    <option value="">Select account…</option>
                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </FormField>
                        </div>
                        <button type="button" onClick={swap} title="Swap accounts"
                            className="btn px-2.5 mb-px"><ArrowsRightLeftIcon className="w-4 h-4" /></button>
                        <div className="flex-1">
                            <FormField label="To" error={form.errors.to_account_id} required>
                                <select className="form-input" value={form.data.to_account_id}
                                    onChange={e => form.setData('to_account_id', e.target.value)}>
                                    <option value="">Select account…</option>
                                    {accounts.filter(a => a.id !== form.data.from_account_id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </FormField>
                        </div>
                    </div>
                    {available !== null && (
                        <p className={`text-xs ${overdraws ? 'text-amber-700' : 'text-gray-500'}`}>
                            Available in {fromAccount.name}: <span className="font-semibold tabular-nums">{formatBDT(available)}</span>
                            {overdraws && ' — this transfer is more than that, so the account will go negative.'}
                        </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Amount (৳)" error={form.errors.amount} required>
                            <input type="number" step="0.01" min="0.01" className="form-input text-right tabular-nums"
                                value={form.data.amount} onChange={e => form.setData('amount', e.target.value)} />
                        </FormField>
                        <FormField label="Date" error={form.errors.transfer_date} required>
                            <input type="date" className="form-input" value={form.data.transfer_date}
                                onChange={e => form.setData('transfer_date', e.target.value)} />
                        </FormField>
                    </div>
                    <FormField label="Reference" error={form.errors.reference}>
                        <input className="form-input" value={form.data.reference} placeholder="Cheque no., deposit slip, TrxID…"
                            onChange={e => form.setData('reference', e.target.value)} />
                    </FormField>
                    <FormField label="Notes" error={form.errors.notes}>
                        <textarea className="form-input" rows={2} value={form.data.notes}
                            onChange={e => form.setData('notes', e.target.value)} />
                    </FormField>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setModal(null)} className="btn">Cancel</button>
                        <button type="submit" disabled={form.processing} className="btn btn-primary">
                            {form.processing ? 'Saving…' : (editing ? 'Save Changes' : 'Transfer')}
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
