import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import { formatBDT, formatDate } from '@/utils/formatters';

export default function ExpenseShow({ expense }) {
    return (
        <AppLayout>
            <Head title={`Expense ${expense.code}`} />
            <PageHeader title={`Expense: ${expense.code}`} back={route('accounts.expenses.index')} />
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <div className="card p-6">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Code</dt>
                            <dd className="font-mono font-medium text-primary-600">{expense.code}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Amount</dt>
                            <dd className="font-semibold text-red-600 text-lg">{formatBDT(expense.amount)}</dd>
                        </div>
                        <div className="col-span-2">
                            <dt className="text-xs text-gray-500 uppercase">Description</dt>
                            <dd className="font-medium">{expense.description}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Category</dt>
                            <dd>{(expense.accountHead ?? expense.account_head)?.name ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Paid From</dt>
                            <dd>{(expense.paidFrom ?? expense.paid_from_account)?.name ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Date</dt>
                            <dd>{formatDate(expense.expense_date)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Project</dt>
                            <dd>
                                {expense.project
                                    ? <Link href={route('projects.show', expense.project.id)} className="text-primary-600 hover:underline">{expense.project.name}</Link>
                                    : <span className="text-gray-400">—</span>
                                }
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Reference</dt>
                            <dd>{expense.reference ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 uppercase">Recorded By</dt>
                            <dd>{expense.created_by?.name ?? '—'}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </AppLayout>
    );
}
