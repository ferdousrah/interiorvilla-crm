import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import {
    BookOpenIcon, FunnelIcon, UsersIcon, ReceiptPercentIcon, BriefcaseIcon,
    ShoppingCartIcon, CubeIcon, CurrencyDollarIcon, UserGroupIcon,
    Cog6ToothIcon, MagnifyingGlassIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline';

const SECTIONS = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: BookOpenIcon,
        color: 'from-primary-500 to-primary-600',
        intro: 'Welcome to Interior Villa CRM. This guide explains every module and the typical day-to-day workflow.',
        items: [
            { q: 'How do I log in for the first time?', a: 'Use the credentials your admin shared. On first login you will be required to change your password.' },
            { q: 'How do I change my password?', a: 'Click your profile in the bottom-left corner of the sidebar → Profile → change password.' },
            { q: 'Where do I find my notifications?', a: 'The bell icon in the top bar shows new in-app notifications (overdue follow-ups, expense approvals, etc.).' },
        ],
    },
    {
        id: 'crm',
        title: 'CRM (Leads & Pipeline)',
        icon: FunnelIcon,
        color: 'from-blue-500 to-blue-600',
        intro: 'Capture prospects, schedule follow-ups, and move them through the sales pipeline.',
        items: [
            { q: 'How do I add a new lead?', a: 'CRM → Pipeline → "+ New Lead". Choose Individual or Corporate, fill name (or company name + contact person), phone, and source.' },
            { q: 'What does the Kanban pipeline show?', a: 'Each lead sits in a column based on its status: New → Contacted → Qualified → Proposal Sent → Won / Lost. Drag-and-drop to move them between stages.' },
            { q: 'How do I schedule a follow-up?', a: 'Open a lead → set the Follow-up Date. The lead will appear on the dashboard\'s "Today\'s Follow-ups" card and on CRM → Follow-ups.' },
            { q: 'How do I convert a lead to a client?', a: 'Open the lead → click "Convert to Client", or mark the linked quotation as approved and convert it to a project (a client is auto-created).' },
        ],
    },
    {
        id: 'clients',
        title: 'Clients',
        icon: UsersIcon,
        color: 'from-emerald-500 to-emerald-600',
        intro: 'Maintain your client directory with full project, invoice, and payment history.',
        items: [
            { q: 'How are clients created?', a: 'Either manually under Clients → "+ Add Client", or automatically when a lead is converted / when an approved quotation becomes a project.' },
            { q: 'Where do I see all of a client\'s projects and invoices?', a: 'Open the client\'s detail page — Projects, Invoices, Receipts, and Leads tabs are all on the same page.' },
        ],
    },
    {
        id: 'sales',
        title: 'Sales (Cost Estimations, Quotations, Materials)',
        icon: ReceiptPercentIcon,
        color: 'from-amber-500 to-orange-500',
        intro: 'Build internal cost estimations, then convert them into client-facing quotations.',
        items: [
            { q: 'How do I create a quotation?', a: 'Sales → Quotations → "+ New Quotation". Select the client or lead, pick a service category + type, then add line items by category in the BOQ.' },
            { q: 'How does the Item picker work?', a: 'After choosing a Service Type, the Item dropdown filters to materials linked to that service. Picking an item auto-fills description, unit, and rate.' },
            { q: 'What is a Quotation Revision?', a: 'After sending a quotation, click "Revise" to clone it as Rev 02. The original becomes "Superseded" (read-only) and the new draft opens for editing.' },
            { q: 'How do I share a quotation with the client?', a: 'On the quotation page: Send Email, WhatsApp, or Copy Link — the link works for 30 days without requiring login.' },
            { q: 'How do I add a new material?', a: 'Sales → Materials → "+ Add Material". Set name, description, default rate, unit, and which service types it applies to.' },
            { q: 'Cost Estimation vs Quotation — what\'s the difference?', a: 'A cost estimation is internal (what it costs you, with markup). A quotation is what you send to the client (typically generated from a cost estimation).' },
        ],
    },
    {
        id: 'projects',
        title: 'Projects',
        icon: BriefcaseIcon,
        color: 'from-indigo-500 to-indigo-600',
        intro: 'Track design and construction projects from planning through handover.',
        items: [
            { q: 'How is a project created?', a: 'Most projects are auto-created when an approved quotation is converted. You can also create one manually under Projects → "+ New Project".' },
            { q: 'What are project phases?', a: 'Reorderable stages within a project (Planning, Execution, Finishing, etc.) — drag to reorder, mark as complete, track progress.' },
            { q: 'How do site engineers submit expenses?', a: 'My Expenses → "+ Add Expense". Site engineers see only their own expenses; admin/accounts approve them.' },
        ],
    },
    {
        id: 'procurement',
        title: 'Procurement',
        icon: ShoppingCartIcon,
        color: 'from-rose-500 to-rose-600',
        intro: 'Vendors, requisitions, purchase orders, and goods receipts.',
        items: [
            { q: 'What is the requisition flow?', a: 'Site team raises a Requisition → Admin approves → it becomes a Purchase Order to a Vendor → goods arrive and are recorded in a GRN (Goods Receipt Note).' },
            { q: 'Who can approve requisitions?', a: 'Users with the "approve.purchase_orders" permission — typically Admin and Accounts roles.' },
        ],
    },
    {
        id: 'inventory',
        title: 'Inventory',
        icon: CubeIcon,
        color: 'from-teal-500 to-teal-600',
        intro: 'Track stock items, warehouses, issuances, and adjustments.',
        items: [
            { q: 'How do I issue stock to a project?', a: 'Inventory → Stock Issue → select project + items + quantities. Stock levels update automatically.' },
            { q: 'How do I correct stock counts?', a: 'Inventory → Adjustments → record the corrected quantity with a reason (audit trail kept).' },
        ],
    },
    {
        id: 'accounts',
        title: 'Accounts',
        icon: CurrencyDollarIcon,
        color: 'from-violet-500 to-violet-600',
        intro: 'Invoices, payments, expenses, and financial reports.',
        items: [
            { q: 'How do I create an invoice?', a: 'Accounts → Invoices → "+ New Invoice". Link it to a Client, Lead, or Project. Add line items, VAT, and discount.' },
            { q: 'How do I record a client payment?', a: 'Accounts → Receipts → "+ New Receipt". Pick the invoice, enter the amount + payment method (cash, cheque, bank).' },
            { q: 'Where do I see profit/loss reports?', a: 'Accounts → Reports — includes trial balance, client/vendor ledger, cash flow, receivables, and payables.' },
        ],
    },
    {
        id: 'hr',
        title: 'HR',
        icon: UserGroupIcon,
        color: 'from-pink-500 to-pink-600',
        intro: 'Employee directory, leave requests, attendance.',
        items: [
            { q: 'How do I add an employee?', a: 'HR → Employees → "+ Add Employee". Upload supporting documents (NID, contract, etc.) via the attachments tab.' },
            { q: 'How does leave approval work?', a: 'Employees submit leave requests; HR/Admin approves or rejects from HR → Leave.' },
        ],
    },
    {
        id: 'settings',
        title: 'Settings',
        icon: Cog6ToothIcon,
        color: 'from-slate-500 to-slate-600',
        intro: 'Company branding, users, roles, and audit log.',
        items: [
            { q: 'How do I change the company logo?', a: 'Settings → General → upload your logo. There\'s also a separate Quotation Logo for letterhead-style branding on quotations only.' },
            { q: 'How do I add a new user?', a: 'Settings → Users → "+ Add User". Pick a role; the user receives a default password and is forced to change it on first login.' },
            { q: 'Can I create custom roles?', a: 'Yes — Settings → Roles → "+ Create New Role". Pick which modules and actions the role can access.' },
            { q: 'Where can I see who changed what?', a: 'Settings → Audit Log shows every create / update / delete action with the user, timestamp, and changed fields.' },
        ],
    },
];

function GuideSection({ section, openId, setOpenId }) {
    const Icon = section.icon;
    return (
        <div id={section.id} className="card overflow-hidden scroll-mt-20">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} shadow-md flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <div>
                    <h2 className="text-base font-bold text-gray-900">{section.title}</h2>
                    <p className="text-xs text-gray-600 font-medium">{section.intro}</p>
                </div>
            </div>
            <div className="divide-y divide-gray-100">
                {section.items.map((it, idx) => {
                    const key = `${section.id}-${idx}`;
                    const open = openId === key;
                    return (
                        <div key={key}>
                            <button
                                type="button"
                                onClick={() => setOpenId(open ? null : key)}
                                className="w-full text-left px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                            >
                                <ChevronDownIcon
                                    className={`w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                                />
                                <span className="text-sm font-semibold text-gray-900 flex-1">{it.q}</span>
                            </button>
                            {open && (
                                <div className="px-5 pb-4 pl-12 text-sm text-gray-700 leading-relaxed">
                                    {it.a}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function UserGuide() {
    const [search, setSearch] = useState('');
    const [openId, setOpenId] = useState(null);

    const q = search.trim().toLowerCase();
    const filteredSections = q
        ? SECTIONS.map(s => ({
            ...s,
            items: s.items.filter(it =>
                it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
            ),
        })).filter(s => s.items.length > 0)
        : SECTIONS;

    return (
        <AppLayout>
            <Head title="User Guide" />
            <PageHeader
                title="User Guide"
                subtitle="How to use the Interior Villa CRM — module by module"
            />

            <div className="p-4 sm:p-6 max-w-5xl space-y-6">

                {/* Search */}
                <div className="card p-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                        <input
                            type="search"
                            placeholder="Search the guide… (e.g. 'create quotation', 'leave', 'logo')"
                            className="form-input pl-10 text-sm w-full"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Quick navigation chips */}
                {!q && (
                    <div className="card p-4">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Jump to module</p>
                        <div className="flex flex-wrap gap-2">
                            {SECTIONS.map(s => {
                                const Icon = s.icon;
                                return (
                                    <a
                                        key={s.id}
                                        href={`#${s.id}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 transition-all"
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {s.title.split(' ')[0]}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Sections */}
                {filteredSections.length === 0 ? (
                    <div className="card p-10 text-center">
                        <BookOpenIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-gray-700">No matches for "{search}"</p>
                        <p className="text-xs text-gray-500 mt-1">Try a different keyword.</p>
                    </div>
                ) : (
                    filteredSections.map(section => (
                        <GuideSection key={section.id} section={section} openId={openId} setOpenId={setOpenId} />
                    ))
                )}

                {/* Footer note */}
                <div className="card p-4 text-center text-xs text-gray-500">
                    Need more help? Contact your system administrator.
                </div>
            </div>
        </AppLayout>
    );
}
