import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import ReportActions from '@/Components/ReportActions';
import { formatBDT } from '@/utils/formatters';
import { useState } from 'react';

export default function TrialBalance({ balances = [], asOf }) {
    const [date, setDate] = useState(asOf ?? new Date().toISOString().substring(0, 10));

    function applyFilter(e) {
        e.preventDefault();
        router.get(route('accounts.reports.trial-balance'), { as_of: date }, { preserveState: true, replace: true });
    }

    const totalDebit  = balances.reduce((s, b) => s + parseFloat(b.debit  ?? 0), 0);
    const totalCredit = balances.reduce((s, b) => s + parseFloat(b.credit ?? 0), 0);

    return (
        <AppLayout>
            <Head title="Trial Balance" />
            <PageHeader title="Trial Balance" back={route('accounts.reports.index')}>
                <ReportActions filters={{ as_of: date }} />
            </PageHeader>
            <div className="p-4 sm:p-6">
                <form onSubmit={applyFilter} className="flex gap-3 mb-4 items-end print:hidden">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">As Of Date</label>
                        <input type="date" className="form-input text-sm" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary text-sm">Generate</button>
                </form>

                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Code</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {balances.length === 0 && (
                                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">No balances to show.</td></tr>
                            )}
                            {balances.map(b => (
                                <tr key={b.id}>
                                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{b.code}</td>
                                    <td className="px-4 py-3 text-sm">{b.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{b.group ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm text-right">{b.debit  > 0 ? formatBDT(b.debit)  : '—'}</td>
                                    <td className="px-4 py-3 text-sm text-right">{b.credit > 0 ? formatBDT(b.credit) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-semibold">
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-sm">Total</td>
                                <td className="px-4 py-3 text-sm text-right">{formatBDT(totalDebit)}</td>
                                <td className="px-4 py-3 text-sm text-right">{formatBDT(totalCredit)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
