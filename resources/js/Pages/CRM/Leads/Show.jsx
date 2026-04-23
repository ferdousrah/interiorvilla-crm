import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import Modal from '@/Components/Modal';
import FormField from '@/Components/FormField';
import { formatDate, formatDateTime, isPastDue } from '@/utils/formatters';
import {
    PencilIcon, ArrowRightIcon, PhoneIcon, EnvelopeIcon,
    CalendarIcon, UserIcon, CurrencyDollarIcon, TrashIcon,
    DocumentTextIcon, PlusIcon,
} from '@heroicons/react/24/outline';

const INVOICE_STATUS_STYLE = {
    draft:          'bg-gray-100 text-gray-700',
    sent:           'bg-blue-100 text-blue-700',
    partially_paid: 'bg-amber-100 text-amber-800',
    paid:           'bg-emerald-100 text-emerald-700',
    overdue:        'bg-red-100 text-red-700',
    cancelled:      'bg-gray-100 text-gray-500',
};

function fmtCurrency(n) {
    return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ACTIVITY_TYPES = ['call', 'email', 'whatsapp', 'site_visit', 'meeting', 'note'];
const ACTIVITY_ICONS = {
    call: '📞', email: '✉️', whatsapp: '💬', site_visit: '🏠', meeting: '🤝', note: '📝',
};

export default function LeadShow({ lead, users = [], accountHeads = [], incomeSources = [] }) {
    const [showActivityForm, setShowActivityForm] = useState(false);
    const [paidServiceModal, setPaidServiceModal] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        type: 'call',
        summary: '',
        next_action: '',
        next_action_at: '',
        performed_at: new Date().toISOString().substring(0, 16),
    });

    const paidServiceForm = useForm({
        description: '',
        amount: '',
        service_date: new Date().toISOString().substring(0, 10),
        income_source: incomeSources[0] ?? 'Visit Charge',
        payment_method: 'cash',
        account_head_id: accountHeads[0]?.id ?? '',
        reference: '',
        notes: '',
    });

    function submitPaidService(e) {
        e.preventDefault();
        paidServiceForm.post(route('crm.leads.paid-services.store', lead.id), {
            preserveScroll: true,
            onSuccess: () => {
                paidServiceForm.reset('description', 'amount', 'reference', 'notes');
                setPaidServiceModal(false);
            },
        });
    }

    function submitActivity(e) {
        e.preventDefault();
        post(route('crm.leads.activities.store', lead.id), {
            onSuccess: () => { reset(); setShowActivityForm(false); },
        });
    }

    function deleteActivity(activityId) {
        if (confirm('Delete this activity?')) {
            router.delete(route('crm.activities.destroy', activityId), { preserveScroll: true });
        }
    }

    function convertToClient() {
        if (confirm('Convert this lead to a client? A new client record will be created.')) {
            router.post(route('crm.leads.convert', lead.id));
        }
    }

    function deleteLead() {
        if (confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) {
            router.delete(route('crm.leads.destroy', lead.id));
        }
    }

    const projects = lead.projects ?? lead.project ?? [];
    const projectList = Array.isArray(projects) ? projects : [projects].filter(Boolean);

    return (
        <AppLayout>
            <Head title={lead.name} />
            <PageHeader title={lead.name} subtitle={`${lead.code} · ${lead.source?.replace(/_/g, ' ')}`} back={route('crm.index')}>
                <Link href={route('crm.leads.edit', lead.id)} className="btn flex items-center gap-2">
                    <PencilIcon className="w-4 h-4" /> Edit
                </Link>
                {!lead.client_id && lead.status !== 'lost' && (
                    <button onClick={convertToClient} className="btn btn-secondary flex items-center gap-2">
                        <ArrowRightIcon className="w-4 h-4" /> Convert to Client
                    </button>
                )}
                <button onClick={deleteLead} className="btn btn-danger flex items-center gap-2">
                    <TrashIcon className="w-4 h-4" /> Delete
                </button>
            </PageHeader>

            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Left column — info */}
                <div className="space-y-4">
                    {/* Status card */}
                    <div className="card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Status</h3>
                            <Badge status={lead.status} />
                        </div>
                        {lead.lost_reason && (
                            <p className="text-xs text-red-600 bg-red-50 rounded p-2 mt-1">{lead.lost_reason}</p>
                        )}
                        {lead.converted_at && (
                            <p className="text-xs text-green-600 mt-1">Won on {formatDate(lead.converted_at)}</p>
                        )}
                    </div>

                    {/* Contact info */}
                    <div className="card p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Contact</h3>
                        <dl className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <PhoneIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="font-medium">{lead.phone}</span>
                            </div>
                            {lead.email && (
                                <div className="flex items-center gap-2">
                                    <EnvelopeIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <a href={`mailto:${lead.email}`} className="text-primary-600 hover:underline truncate">{lead.email}</a>
                                </div>
                            )}
                            {lead.address && (
                                <div className="flex items-start gap-2">
                                    <span className="text-gray-400 text-xs mt-0.5">📍</span>
                                    <span className="text-gray-700 text-xs leading-relaxed">{lead.address}</span>
                                </div>
                            )}
                            {(lead.service_group || lead.service_type) && (
                                <div className="flex items-start gap-2">
                                    <span className="text-gray-400 text-xs mt-0.5">Service</span>
                                    <div>
                                        {lead.service_group && <p className="text-gray-700 text-sm">{lead.service_group}</p>}
                                        {lead.service_type && <p className="text-gray-500 text-xs">{lead.service_type}</p>}
                                    </div>
                                </div>
                            )}
                            {lead.project_type && !lead.service_group && (
                                <div className="flex items-start gap-2">
                                    <span className="text-gray-400 text-xs mt-0.5">Type</span>
                                    <span>{lead.project_type}</span>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Pipeline info */}
                    <div className="card p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Pipeline</h3>
                        <dl className="space-y-2 text-sm">
                            {lead.estimated_value > 0 && (
                                <div className="flex items-center gap-2">
                                    <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold text-primary-600">
                                        {Number(lead.estimated_value).toLocaleString('en-IN')}৳
                                    </span>
                                </div>
                            )}
                            {lead.follow_up_at && (
                                <div className={`flex items-center gap-2 ${isPastDue(lead.follow_up_at) ? 'text-red-600' : 'text-blue-600'}`}>
                                    <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                                    <span>{formatDate(lead.follow_up_at)}{isPastDue(lead.follow_up_at) && ' (overdue)'}</span>
                                </div>
                            )}
                            {lead.assigned_to_user && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                    <span>{lead.assigned_to_user?.name ?? lead.assignedTo?.name}</span>
                                </div>
                            )}
                            {!lead.assigned_to_user && lead.assignedTo && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                    <span>{lead.assignedTo.name}</span>
                                </div>
                            )}
                            <div className="text-xs text-gray-400 pt-1 border-t border-gray-100">
                                Created {formatDate(lead.created_at)}
                                {lead.createdBy && <span> by {lead.createdBy.name}</span>}
                            </div>
                        </dl>
                    </div>

                    {/* Notes */}
                    {lead.notes && (
                        <div className="card p-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Notes</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.notes}</p>
                        </div>
                    )}

                    {/* Linked client */}
                    {lead.client && (
                        <div className="card p-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Linked Client</h3>
                            <Link href={route('clients.show', lead.client.id)} className="text-sm text-primary-600 hover:underline font-medium">
                                {lead.client.name}
                            </Link>
                            <p className="text-xs text-gray-400">{lead.client.code}</p>
                        </div>
                    )}

                    {/* Linked projects */}
                    {projectList.length > 0 && (
                        <div className="card p-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Projects</h3>
                            <div className="space-y-1">
                                {projectList.map(p => (
                                    <div key={p.id}>
                                        <Link href={route('projects.show', p.id)} className="text-sm text-primary-600 hover:underline font-medium">
                                            {p.name}
                                        </Link>
                                        <p className="text-xs text-gray-400">{p.code}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Paid Services — invoices attached to this lead (visit charge, 3D-only, etc.) */}
                    <div className="card p-4">
                        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                                <DocumentTextIcon className="w-4 h-4" /> Paid Services
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaidServiceModal(true)}
                                    className="btn btn-primary text-xs flex items-center gap-1 px-2 py-1"
                                    title="Quick entry — creates a paid invoice + receipt in one step">
                                    <PlusIcon className="w-3 h-3" /> Log
                                </button>
                                <Link
                                    href={`${route('accounts.invoices.create')}?lead_id=${lead.id}`}
                                    className="text-[11px] text-gray-500 hover:text-primary-600 hover:underline"
                                    title="Create a regular invoice with multiple line items, VAT, due-date, etc.">
                                    Full invoice →
                                </Link>
                            </div>
                        </div>

                        {(() => {
                            const invoices = lead.invoices ?? [];
                            if (invoices.length === 0) {
                                return (
                                    <p className="text-xs text-gray-400 italic py-2">
                                        No services billed yet. Use this for visit charges, 3D-only design fees, etc.
                                    </p>
                                );
                            }
                            const totalBilled = invoices.reduce((s, i) => s + parseFloat(i.grand_total || 0), 0);
                            const totalPaid   = invoices.reduce((s, i) => s + parseFloat(i.paid_amount  || 0), 0);
                            const totalDue    = totalBilled - totalPaid;
                            return (
                                <>
                                    <div className="space-y-2">
                                        {invoices.map(inv => (
                                            <Link key={inv.id}
                                                href={route('accounts.invoices.show', inv.id)}
                                                className="block border border-gray-100 rounded-lg p-2.5 hover:border-primary-300 hover:bg-primary-50/40 transition-colors">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-semibold text-primary-700">{inv.code}</span>
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${INVOICE_STATUS_STYLE[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                        {inv.status?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                                                    <span>{formatDate(inv.invoice_date)}</span>
                                                    <span className="font-semibold text-gray-800">BDT {fmtCurrency(inv.grand_total)}</span>
                                                </div>
                                                {parseFloat(inv.paid_amount || 0) > 0 && parseFloat(inv.paid_amount) < parseFloat(inv.grand_total) && (
                                                    <p className="text-[11px] text-amber-700 mt-0.5">
                                                        Paid {fmtCurrency(inv.paid_amount)} · Due {fmtCurrency(parseFloat(inv.grand_total) - parseFloat(inv.paid_amount))}
                                                    </p>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-gray-100 space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Total billed</span>
                                            <span className="font-semibold">BDT {fmtCurrency(totalBilled)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Received</span>
                                            <span className="font-semibold text-emerald-700">BDT {fmtCurrency(totalPaid)}</span>
                                        </div>
                                        {totalDue > 0.01 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Due</span>
                                                <span className="font-semibold text-red-700">BDT {fmtCurrency(totalDue)}</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Right column — activity timeline */}
                <div className="lg:col-span-2">
                    <div className="card p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-700">Activity Timeline</h3>
                            <button onClick={() => setShowActivityForm(!showActivityForm)} className="btn btn-primary text-xs">
                                + Log Activity
                            </button>
                        </div>

                        {showActivityForm && (
                            <form onSubmit={submitActivity} className="mb-5 bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <FormField label="Activity Type" error={errors.type} required>
                                        <select className="form-input text-sm" value={data.type} onChange={e => setData('type', e.target.value)}>
                                            {ACTIVITY_TYPES.map(t => (
                                                <option key={t} value={t}>{ACTIVITY_ICONS[t]} {t.replace(/_/g, ' ')}</option>
                                            ))}
                                        </select>
                                    </FormField>
                                    <FormField label="Date & Time" error={errors.performed_at} required>
                                        <input type="datetime-local" className="form-input text-sm" value={data.performed_at} onChange={e => setData('performed_at', e.target.value)} />
                                    </FormField>
                                </div>
                                <FormField label="Summary" error={errors.summary} required>
                                    <textarea className="form-input text-sm" rows={2} value={data.summary} onChange={e => setData('summary', e.target.value)} placeholder="What happened?" />
                                </FormField>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <FormField label="Next Action" error={errors.next_action}>
                                        <input className="form-input text-sm" value={data.next_action} onChange={e => setData('next_action', e.target.value)} placeholder="Follow-up task…" />
                                    </FormField>
                                    <FormField label="Next Action Date" error={errors.next_action_at}>
                                        <input type="datetime-local" className="form-input text-sm" value={data.next_action_at} onChange={e => setData('next_action_at', e.target.value)} />
                                    </FormField>
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" disabled={processing} className="btn btn-primary text-xs">{processing ? 'Saving…' : 'Log Activity'}</button>
                                    <button type="button" onClick={() => setShowActivityForm(false)} className="btn text-xs">Cancel</button>
                                </div>
                            </form>
                        )}

                        {/* Timeline */}
                        <div className="relative">
                            {(lead.activities ?? []).length === 0 && (
                                <p className="text-sm text-gray-400 py-4 text-center">No activities yet. Log the first interaction!</p>
                            )}
                            <div className="space-y-0">
                                {(lead.activities ?? []).map((act, idx) => (
                                    <div key={act.id} className="flex gap-4 pb-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-primary-50 border-2 border-primary-200 flex items-center justify-center text-sm flex-shrink-0">
                                                {ACTIVITY_ICONS[act.type] ?? '📋'}
                                            </div>
                                            {idx < (lead.activities?.length ?? 0) - 1 && (
                                                <div className="w-0.5 bg-gray-200 flex-1 mt-1"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 pb-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="font-medium text-sm capitalize">{act.type?.replace(/_/g, ' ')}</span>
                                                    <span className="text-gray-400 text-xs ml-2">{formatDateTime(act.performed_at ?? act.created_at)}</span>
                                                    {act.performedBy && <span className="text-gray-400 text-xs ml-1">· {act.performedBy.name}</span>}
                                                </div>
                                                <button onClick={() => deleteActivity(act.id)} className="text-gray-300 hover:text-red-400 ml-2 flex-shrink-0">
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{act.summary}</p>
                                            {act.next_action && (
                                                <div className="mt-1 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 inline-block">
                                                    Next: {act.next_action}
                                                    {act.next_action_at && <span className="ml-1">({formatDate(act.next_action_at)})</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Paid-Service modal — creates invoice + receipt in one step */}
            <Modal open={paidServiceModal} onClose={() => setPaidServiceModal(false)} title="Log Paid Service" size="md">
                <form onSubmit={submitPaidService} className="p-4 sm:p-6 space-y-4">
                    <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        Use this for visit charges, 3D-only design fees, and other small services where payment is already received.
                        A fully-paid invoice and receipt will be created in one step. The lead stays in the pipeline.
                    </p>

                    <FormField label="Service Description" required error={paidServiceForm.errors.description}>
                        <input type="text" className="form-input"
                            value={paidServiceForm.data.description}
                            onChange={e => paidServiceForm.setData('description', e.target.value)}
                            placeholder="e.g. Site visit — Dhamrai, 3D rendering (2 views)" />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Amount (BDT)" required error={paidServiceForm.errors.amount}>
                            <input type="number" min="0" step="0.01" className="form-input"
                                value={paidServiceForm.data.amount}
                                onChange={e => paidServiceForm.setData('amount', e.target.value)}
                                placeholder="0.00" />
                        </FormField>
                        <FormField label="Date" required error={paidServiceForm.errors.service_date}>
                            <input type="date" className="form-input"
                                value={paidServiceForm.data.service_date}
                                onChange={e => paidServiceForm.setData('service_date', e.target.value)} />
                        </FormField>
                    </div>

                    <FormField label="Income Source" required error={paidServiceForm.errors.income_source} hint="Categorizes the earning for revenue-by-source reports">
                        <div className="flex gap-2 flex-wrap">
                            {incomeSources.map(src => {
                                const active = paidServiceForm.data.income_source === src;
                                return (
                                    <button key={src} type="button"
                                        onClick={() => paidServiceForm.setData('income_source', src)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'}`}>
                                        {src}
                                    </button>
                                );
                            })}
                        </div>
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Payment Method" required error={paidServiceForm.errors.payment_method}>
                            <select className="form-input"
                                value={paidServiceForm.data.payment_method}
                                onChange={e => paidServiceForm.setData('payment_method', e.target.value)}>
                                <option value="cash">Cash</option>
                                <option value="bkash">bKash</option>
                                <option value="nagad">Nagad</option>
                                <option value="rocket">Rocket</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cheque">Cheque</option>
                                <option value="other">Other</option>
                            </select>
                        </FormField>
                        <FormField label="Deposit Account" required error={paidServiceForm.errors.account_head_id} hint="Where the money was received">
                            <select className="form-input"
                                value={paidServiceForm.data.account_head_id}
                                onChange={e => paidServiceForm.setData('account_head_id', e.target.value)}>
                                <option value="">Select account…</option>
                                {accountHeads.map(a => (
                                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                                ))}
                            </select>
                        </FormField>
                    </div>

                    <FormField label="Reference / Txn ID (optional)" error={paidServiceForm.errors.reference}>
                        <input type="text" className="form-input"
                            value={paidServiceForm.data.reference}
                            onChange={e => paidServiceForm.setData('reference', e.target.value)}
                            placeholder="bKash txn ID, cheque no., etc." />
                    </FormField>

                    <FormField label="Internal Notes (optional)" error={paidServiceForm.errors.notes}>
                        <textarea className="form-input" rows={2}
                            value={paidServiceForm.data.notes}
                            onChange={e => paidServiceForm.setData('notes', e.target.value)} />
                    </FormField>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={paidServiceForm.processing} className="btn btn-primary">
                            {paidServiceForm.processing ? 'Saving…' : 'Record Paid Service'}
                        </button>
                        <button type="button" onClick={() => setPaidServiceModal(false)} className="btn">Cancel</button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
