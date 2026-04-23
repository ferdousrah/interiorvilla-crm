import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { formatBDT, formatDate } from '@/utils/formatters';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const CATEGORIES = ['rent', 'salaries', 'utilities', 'transport', 'marketing', 'office_supplies', 'maintenance', 'entertainment', 'other'];

export default function Expenses({ expenses, accountHeads, projects }) {
    const [showForm, setShowForm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        description: '', category: 'other', amount: '',
        expense_date: new Date().toISOString().substring(0, 10),
        account_head_id: '', project_id: '', payment_method: 'cash',
        reference: '', notes: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('accounts.expenses.store'), { onSuccess: () => { reset(); setShowForm(false); } });
    }

    return (
        <AppLayout>
            <Head title="Expenses" />
            <PageHeader title="Expenses" subtitle={`${(expenses.data ?? expenses).length} expenses`}>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Add Expense
                </button>
            </PageHeader>
            <div className="p-4 sm:p-6">
                {showForm && (
                    <form onSubmit={submit} className="card p-4 mb-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <FormField label="Description" error={errors.description} required>
                                <input className="form-input text-sm" value={data.description} onChange={e => setData('description', e.target.value)} />
                            </FormField>
                            <FormField label="Category" error={errors.category}>
                                <select className="form-input text-sm" value={data.category} onChange={e => setData('category', e.target.value)}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Amount (৳)" error={errors.amount} required>
                                <input type="number" className="form-input text-sm" value={data.amount} onChange={e => setData('amount', e.target.value)} />
                            </FormField>
                            <FormField label="Date" error={errors.expense_date}>
                                <input type="date" className="form-input text-sm" value={data.expense_date} onChange={e => setData('expense_date', e.target.value)} />
                            </FormField>
                            <FormField label="Account Head" error={errors.account_head_id}>
                                <select className="form-input text-sm" value={data.account_head_id} onChange={e => setData('account_head_id', e.target.value)}>
                                    <option value="">-- Auto --</option>
                                    {(accountHeads ?? []).map(h => <option key={h.id} value={h.id}>{h.code} - {h.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Project" error={errors.project_id}>
                                <select className="form-input text-sm" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                                    <option value="">-- No Project --</option>
                                    {(projects ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Payment Method" error={errors.payment_method}>
                                <select className="form-input text-sm" value={data.payment_method} onChange={e => setData('payment_method', e.target.value)}>
                                    {['cash','bank_transfer','cheque','mobile_banking'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                                </select>
                            </FormField>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" disabled={processing} className="btn btn-primary text-sm">{processing ? '…' : 'Record Expense'}</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn text-sm">Cancel</button>
                        </div>
                    </form>
                )}
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Date','Description','Category','Amount','Project','Method'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(expenses.data ?? expenses).map(exp => (
                                <tr key={exp.id}>
                                    <td className="px-4 py-3 text-sm">{formatDate(exp.expense_date)}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{exp.description}</td>
                                    <td className="px-4 py-3 text-sm capitalize text-gray-600">{exp.category?.replace('_', ' ')}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-red-600">{formatBDT(exp.amount)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{exp.project?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm capitalize text-gray-500">{exp.payment_method?.replace('_', ' ')}</td>
                                </tr>
                            ))}
                            {(expenses.data ?? expenses).length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No expenses found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
