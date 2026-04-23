import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';

const reports = [
    { name: 'Trial Balance', description: 'All account balances at a point in time', route: 'accounts.reports.trial-balance', icon: '⚖️' },
    { name: 'Client Ledger', description: 'Invoices and receipts for a client', route: 'accounts.reports.client-ledger', icon: '👤' },
    { name: 'Vendor Ledger', description: 'Purchase orders and payments for a vendor', route: 'accounts.reports.vendor-ledger', icon: '🏭' },
    { name: 'Cash & Bank Statement', description: 'Cash and bank account transactions', route: 'accounts.reports.cash-bank', icon: '🏦' },
    { name: 'Project P&L', description: 'Profit and loss for a project', route: 'accounts.reports.project-pl', icon: '📊' },
    { name: 'Receivables Report', description: 'Outstanding client invoices', route: 'accounts.reports.receivables', icon: '📥' },
    { name: 'Payables Report', description: 'Outstanding vendor payments', route: 'accounts.reports.payables', icon: '📤' },
];

export default function ReportsIndex() {
    return (
        <AppLayout>
            <Head title="Financial Reports" />
            <PageHeader title="Financial Reports" subtitle="Accounting reports and statements" />
            <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reports.map(r => (
                        <Link key={r.route} href={route(r.route)}
                            className="card p-5 hover:shadow-md transition-shadow group">
                            <div className="text-3xl mb-3">{r.icon}</div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">{r.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{r.description}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
