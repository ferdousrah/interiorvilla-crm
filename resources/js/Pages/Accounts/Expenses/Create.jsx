import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'cheque', 'bkash', 'nagad', 'rocket', 'other'];

export default function ExpenseCreate({ expenseHeads, cashBankHeads, projects }) {
    const { data, setData, post, processing, errors } = useForm({
        account_head_id: '',
        project_id: '',
        amount: '',
        expense_date: new Date().toISOString().substring(0, 10),
        paid_from: '',
        description: '',
        reference: '',
        notes: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('accounts.expenses.store'));
    }

    return (
        <AppLayout>
            <Head title="Record Expense" />
            <PageHeader title="Record Expense" back={route('accounts.expenses.index')} />
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <FormField label="Description" error={errors.description} required>
                        <input className="form-input" value={data.description} onChange={e => setData('description', e.target.value)} placeholder="What was this expense for?" />
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Expense Category" error={errors.account_head_id} required>
                            <select className="form-input" value={data.account_head_id} onChange={e => setData('account_head_id', e.target.value)}>
                                <option value="">Select category…</option>
                                {expenseHeads.map(h => <option key={h.id} value={h.id}>{h.code} — {h.name}</option>)}
                            </select>
                        </FormField>

                        <FormField label="Project (optional)" error={errors.project_id}>
                            <select className="form-input" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                                <option value="">No project</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                            </select>
                        </FormField>

                        <FormField label="Amount (৳)" error={errors.amount} required>
                            <input type="number" step="0.01" min="0.01" className="form-input" value={data.amount} onChange={e => setData('amount', e.target.value)} />
                        </FormField>

                        <FormField label="Expense Date" error={errors.expense_date} required>
                            <input type="date" className="form-input" value={data.expense_date} onChange={e => setData('expense_date', e.target.value)} />
                        </FormField>

                        <FormField label="Paid From (Account)" error={errors.paid_from} required>
                            <select className="form-input" value={data.paid_from} onChange={e => setData('paid_from', e.target.value)}>
                                <option value="">Select account…</option>
                                {cashBankHeads.map(h => <option key={h.id} value={h.id}>{h.code} — {h.name}</option>)}
                            </select>
                        </FormField>

                        <FormField label="Reference" error={errors.reference}>
                            <input className="form-input" value={data.reference} onChange={e => setData('reference', e.target.value)} placeholder="Receipt no / voucher" />
                        </FormField>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Saving…' : 'Record Expense'}
                        </button>
                        <a href={route('accounts.expenses.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
