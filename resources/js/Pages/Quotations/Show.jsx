import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import Modal from '@/Components/Modal';
import FormField from '@/Components/FormField';
import { formatDate } from '@/utils/formatters';
import {
    PencilIcon, TrashIcon, PrinterIcon, CheckCircleIcon,
    XCircleIcon, PaperAirplaneIcon, FolderOpenIcon,
    EnvelopeIcon, ShareIcon, LinkIcon, DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

function fmt(n) {
    return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_ACTIONS = {
    draft:        ['send'],
    sent:         ['approve', 'reject'],
    under_review: ['approve', 'reject'],
    approved:     ['convert'],
    rejected:     [],
    expired:      [],
    converted:    [],
};

export default function QuotationShow({ quotation, company = {}, grandTotalInWords = '' }) {
    const [convertModal, setConvertModal] = useState(false);
    const [emailModal, setEmailModal] = useState(false);
    const [shareBusy, setShareBusy] = useState(false);
    const { data, setData, post, processing } = useForm({ project_name: quotation.client?.name ? `${quotation.client.name} — Project` : '' });

    const defaultRecipient = quotation.client?.email || quotation.lead?.email || '';
    const recipientName = quotation.client?.name || quotation.lead?.name || 'Valued Client';
    const emailForm = useForm({
        to: defaultRecipient,
        cc: '',
        custom_message: `Dear ${recipientName},\n\nPlease find below our quotation (${quotation.code}) for your review. Feel free to reach out if you have any questions.\n\nBest regards.`,
    });

    const canEdit = ['draft', 'sent', 'under_review'].includes(quotation.status);
    const actions = STATUS_ACTIONS[quotation.status] ?? [];

    // Group items by category
    const grouped = {};
    (quotation.items ?? []).forEach(item => {
        const cat = item.category || 'General';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    });

    function doSend() {
        if (confirm('Mark this quotation as sent to client?')) {
            router.patch(route('quotations.send', quotation.id));
        }
    }
    function doApprove() {
        if (confirm('Mark this quotation as approved by client?')) {
            router.patch(route('quotations.approve', quotation.id));
        }
    }
    function doReject() {
        if (confirm('Mark this quotation as rejected?')) {
            router.patch(route('quotations.reject', quotation.id));
        }
    }
    function doConvert(e) {
        e.preventDefault();
        post(route('quotations.convert', quotation.id), {
            onSuccess: () => setConvertModal(false),
        });
    }
    function doDelete() {
        if (confirm(`Delete quotation ${quotation.code}?`)) {
            router.delete(route('quotations.destroy', quotation.id));
        }
    }

    function submitEmail(e) {
        e.preventDefault();
        emailForm.post(route('quotations.send-email', quotation.id), {
            preserveScroll: true,
            onSuccess: () => setEmailModal(false),
        });
    }

    async function shareWhatsApp() {
        setShareBusy(true);
        try {
            const { data: res } = await axios.get(route('quotations.share-link', quotation.id));
            const phone = (quotation.client?.phone || quotation.lead?.phone || '').replace(/\D/g, '');
            const text = encodeURIComponent(
                `Hi ${recipientName},\n\nHere is your quotation ${quotation.code} from us.\nTotal: BDT ${fmt(quotation.grand_total)}\n\nView full details (PDF download available): ${res.url}`
            );
            const url = phone
                ? `https://wa.me/${phone}?text=${text}`
                : `https://wa.me/?text=${text}`;
            window.open(url, '_blank', 'noopener');
        } catch (err) {
            alert('Could not generate share link.');
        } finally {
            setShareBusy(false);
        }
    }

    async function copyShareLink() {
        setShareBusy(true);
        try {
            const { data: res } = await axios.get(route('quotations.share-link', quotation.id));
            await navigator.clipboard.writeText(res.url);
            alert('Share link copied to clipboard.');
        } catch {
            alert('Could not copy link.');
        } finally {
            setShareBusy(false);
        }
    }

    return (
        <AppLayout>
            <Head title={`Quotation ${quotation.code}`} />
            <div className="print:hidden">
            <PageHeader title={`Quotation: ${quotation.code}`} subtitle={quotation.subject} back={route('quotations.index')}>
                {/* Share buttons — always available */}
                <button onClick={() => setEmailModal(true)} className="btn btn-primary flex items-center gap-2 text-sm">
                    <EnvelopeIcon className="w-4 h-4" /> Send Email
                </button>
                <button onClick={shareWhatsApp} disabled={shareBusy} className="btn flex items-center gap-2 text-sm">
                    <ShareIcon className="w-4 h-4" /> WhatsApp
                </button>
                <button onClick={copyShareLink} disabled={shareBusy} className="btn flex items-center gap-2 text-sm" title="Copy public link">
                    <LinkIcon className="w-4 h-4" /> Copy Link
                </button>
                <a href={route('quotations.pdf', quotation.id)} className="btn flex items-center gap-2 text-sm" title="Download PDF">
                    <DocumentArrowDownIcon className="w-4 h-4" /> PDF
                </a>

                {/* Action buttons based on status */}
                {actions.includes('send') && (
                    <button onClick={doSend} className="btn btn-secondary flex items-center gap-2 text-sm">
                        <PaperAirplaneIcon className="w-4 h-4" /> Mark Sent
                    </button>
                )}
                {actions.includes('approve') && (
                    <button onClick={doApprove} className="btn btn-primary flex items-center gap-2 text-sm">
                        <CheckCircleIcon className="w-4 h-4" /> Approve
                    </button>
                )}
                {actions.includes('reject') && (
                    <button onClick={doReject} className="btn btn-danger flex items-center gap-2 text-sm">
                        <XCircleIcon className="w-4 h-4" /> Reject
                    </button>
                )}
                {actions.includes('convert') && (
                    <button onClick={() => setConvertModal(true)} className="btn btn-primary flex items-center gap-2 text-sm">
                        <FolderOpenIcon className="w-4 h-4" /> Convert to Project
                    </button>
                )}
                {canEdit && (
                    <Link href={route('quotations.edit', quotation.id)} className="btn flex items-center gap-2 text-sm">
                        <PencilIcon className="w-4 h-4" /> Edit
                    </Link>
                )}
                <button onClick={() => window.print()} className="btn flex items-center gap-2 text-sm">
                    <PrinterIcon className="w-4 h-4" /> Print
                </button>
                <button onClick={doDelete} className="btn btn-danger text-sm">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </PageHeader>
            </div>

            {/* Printable quotation document */}
            <div className="p-4 sm:p-6 print:p-0">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 print:shadow-none print:border-0">

                    {/* Company letterhead */}
                    <div className="p-8 pb-5 border-b border-gray-100 bg-gradient-to-br from-primary-50 to-white">
                        <div className="flex items-start justify-between gap-6 flex-wrap">
                            <div className="flex items-start gap-4">
                                {company.logo && (
                                    <img src={company.logo} alt={company.name} className="h-14 w-auto max-w-[180px] object-contain bg-white rounded-md p-1 border border-gray-100" />
                                )}
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{company.name || 'Interior Villa'}</h2>
                                    {company.address && (
                                        <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-line max-w-sm">{company.address}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right text-xs text-gray-600 leading-relaxed">
                                {(company.phone || company.phone2) && (
                                    <p>📞 {[company.phone, company.phone2].filter(Boolean).join(', ')}</p>
                                )}
                                {company.email && <p>✉ {company.email}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Quotation header */}
                    <div className="p-8 pb-6 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">QUOTATION</h1>
                                <p className="text-sm text-gray-500 mt-1">{quotation.code}</p>
                            </div>
                            <div className="text-right">
                                <Badge status={quotation.status} className="text-sm px-3 py-1" />
                                {quotation.valid_until && (
                                    <p className="text-xs text-gray-400 mt-1.5">Valid until {formatDate(quotation.valid_until)}</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Prepared For</p>
                                {(() => {
                                    const person = quotation.client ?? quotation.lead;
                                    if (!person) return <p className="text-gray-400 italic">No client/lead linked</p>;
                                    return (
                                        <>
                                            <p className="font-semibold text-gray-900">{person.name}</p>
                                            {person.phone && <p className="text-gray-500">{person.phone}</p>}
                                            {person.address && <p className="text-gray-500">{person.address}</p>}
                                        </>
                                    );
                                })()}
                            </div>
                            <div className="sm:text-right">
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Date</p>
                                <p className="text-gray-700">{formatDate(quotation.document_date ?? quotation.created_at)}</p>
                                <p className="text-xs font-semibold text-gray-400 uppercase mt-2 mb-1">Prepared By</p>
                                <p className="text-gray-700">{quotation.createdBy?.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* BOQ Table */}
                    <div className="p-8">
                        {/* Subject row */}
                        <div className="mb-5 pb-4 border-b border-gray-100">
                            <p className="text-lg text-gray-800">
                                <span className="font-bold text-gray-900">Subject:</span>{' '}
                                {quotation.subject}
                            </p>
                        </div>

                        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Bill of Quantities</h2>

                        <div className="space-y-5">
                            {Object.entries(grouped).map(([cat, items], ci) => {
                                const catTotal = items.reduce((s, i) => s + parseFloat(i.total || 0), 0);
                                return (
                                    <div key={cat}>
                                        {/* Category header */}
                                        <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2 rounded-t-lg">
                                            <span className="text-sm font-semibold">
                                                {ci + 1}. {cat}
                                            </span>
                                            <span className="text-sm font-bold">{fmt(catTotal)}</span>
                                        </div>
                                        <table className="w-full text-sm border border-gray-200 rounded-b-lg overflow-hidden">
                                            <thead className="bg-gray-50">
                                                <tr className="text-xs text-gray-500 uppercase">
                                                    <th className="px-4 py-2 text-left w-8">#</th>
                                                    <th className="px-4 py-2 text-left">Description</th>
                                                    <th className="px-4 py-2 text-center w-16">Unit</th>
                                                    <th className="px-4 py-2 text-right w-20">Qty</th>
                                                    <th className="px-4 py-2 text-right w-28">Rate</th>
                                                    <th className="px-4 py-2 text-right w-28">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {items.map((item, ii) => (
                                                    <tr key={item.id} className="hover:bg-gray-50/40 align-top">
                                                        <td className="px-4 py-2.5 text-gray-400 text-xs font-mono">{ci + 1}.{ii + 1}</td>
                                                        <td className="px-4 py-2.5 text-gray-800 whitespace-pre-wrap leading-relaxed">{item.description}</td>
                                                        <td className="px-4 py-2.5 text-center text-gray-500">{item.unit}</td>
                                                        <td className="px-4 py-2.5 text-right text-gray-700">{fmt(item.quantity)}</td>
                                                        <td className="px-4 py-2.5 text-right text-gray-700">{fmt(item.unit_rate)}</td>
                                                        <td className="px-4 py-2.5 text-right font-medium text-gray-900">{fmt(item.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Totals */}
                        <div className="mt-6 flex justify-end">
                            <div className="w-72 space-y-2 text-sm">
                                <div className="flex justify-between py-1.5 border-b border-gray-100">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-medium">{fmt(quotation.subtotal)}</span>
                                </div>
                                {parseFloat(quotation.discount_amount) > 0 && (
                                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                                        <span className="text-gray-500">
                                            Discount {quotation.discount_type === 'percentage' ? `(${quotation.discount_value}%)` : '(Fixed)'}
                                        </span>
                                        <span className="text-red-500">- {fmt(quotation.discount_amount)}</span>
                                    </div>
                                )}
                                {parseFloat(quotation.transportation_amount) > 0 && (
                                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                                        <span className="text-gray-500">Transportation</span>
                                        <span className="text-gray-700">+ {fmt(quotation.transportation_amount)}</span>
                                    </div>
                                )}
                                {parseFloat(quotation.supervision_amount) > 0 && (
                                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                                        <span className="text-gray-500">Supervision &amp; Implementation ({quotation.supervision_pct}%)</span>
                                        <span className="text-gray-700">+ {fmt(quotation.supervision_amount)}</span>
                                    </div>
                                )}
                                {parseFloat(quotation.vat_amount) > 0 && (
                                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                                        <span className="text-gray-500">VAT ({quotation.vat_pct}%)</span>
                                        <span className="text-gray-700">+ {fmt(quotation.vat_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t-2 border-gray-800">
                                    <span className="font-bold text-gray-800 text-base">Grand Total</span>
                                    <span className="font-bold text-primary-700 text-xl">BDT {fmt(quotation.grand_total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* In Words */}
                        {grandTotalInWords && (
                            <div className="mt-4 p-3 bg-primary-50 border-l-4 border-primary-600 rounded text-sm text-gray-800">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700 mr-2">In Words:</span>
                                {grandTotalInWords}
                            </div>
                        )}

                        {/* Terms */}
                        {quotation.terms && (
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Terms & Conditions</h3>
                                <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">{quotation.terms}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Send Email Modal */}
            <Modal open={emailModal} onClose={() => setEmailModal(false)} title="Send Quotation by Email" size="md">
                <form onSubmit={submitEmail} className="p-4 sm:p-6 space-y-4">
                    <FormField label="To" required error={emailForm.errors.to}>
                        <input className="form-input" type="text"
                            value={emailForm.data.to}
                            onChange={e => emailForm.setData('to', e.target.value)}
                            placeholder="client@example.com — separate multiple with commas" />
                    </FormField>
                    <FormField label="CC (optional)" error={emailForm.errors.cc}>
                        <input className="form-input" type="text"
                            value={emailForm.data.cc}
                            onChange={e => emailForm.setData('cc', e.target.value)}
                            placeholder="manager@example.com" />
                    </FormField>
                    <FormField label="Message" error={emailForm.errors.custom_message}>
                        <textarea className="form-input" rows={6}
                            value={emailForm.data.custom_message}
                            onChange={e => emailForm.setData('custom_message', e.target.value)}
                            placeholder="Optional personal note…" />
                    </FormField>
                    <p className="text-xs text-gray-500">
                        The email includes a secure link (valid 30 days) so the client can view the full quotation without logging in.
                    </p>
                    <div className="flex gap-3">
                        <button type="submit" disabled={emailForm.processing} className="btn btn-primary flex items-center gap-2">
                            <EnvelopeIcon className="w-4 h-4" />
                            {emailForm.processing ? 'Sending…' : 'Send Email'}
                        </button>
                        <button type="button" onClick={() => setEmailModal(false)} className="btn">Cancel</button>
                    </div>
                </form>
            </Modal>

            {/* Convert to Project Modal */}
            <Modal open={convertModal} onClose={() => setConvertModal(false)} title="Convert to Project" size="sm">
                <form onSubmit={doConvert} className="p-4 sm:p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        A new project will be created with contract value <strong>BDT {fmt(quotation.grand_total)}</strong>.
                    </p>
                    <FormField label="Project Name" required>
                        <input className="form-input" value={data.project_name}
                            onChange={e => setData('project_name', e.target.value)}
                            placeholder="Project name…" />
                    </FormField>
                    <div className="flex gap-3">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Creating…' : 'Create Project'}
                        </button>
                        <button type="button" onClick={() => setConvertModal(false)} className="btn">Cancel</button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
