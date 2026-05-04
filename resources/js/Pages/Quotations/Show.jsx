import { Head, Link, router, useForm } from '@inertiajs/react';
import { Fragment, useState } from 'react';
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
    ArrowPathIcon, ClockIcon,
} from '@heroicons/react/24/outline';

function fmt(n) {
    return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sprintf2(n) {
    return String(n).padStart(2, '0');
}

const STATUS_ACTIONS = {
    draft:        ['send'],
    sent:         ['approve', 'reject', 'revise'],
    under_review: ['approve', 'reject', 'revise'],
    approved:     ['convert', 'revise'],
    rejected:     ['revise'],
    expired:      [],
    converted:    [],
    superseded:   [],
};

export default function QuotationShow({ quotation, company = {}, grandTotalInWords = '', lineage = [] }) {
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
    const displayCode = quotation.display_code || quotation.code;
    const hasRevisions = lineage.length > 1;

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
    function doRevise() {
        if (confirm('Create a new revision? The current quotation will be marked as superseded, and you will be sent to edit the new draft.')) {
            router.post(route('quotations.revise', quotation.id));
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
            <PageHeader title={`Quotation: ${displayCode}`} subtitle={quotation.subject} back={route('quotations.index')}>
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
                {actions.includes('revise') && (
                    <button onClick={doRevise} className="btn btn-secondary flex items-center gap-2 text-sm" title="Create a new revision (supersedes this one)">
                        <ArrowPathIcon className="w-4 h-4" /> Revise
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

            {/* Revisions panel — only shown if quotation has been revised */}
            {hasRevisions && (
                <div className="px-4 sm:px-6 pt-4 print:hidden">
                    <div className="card overflow-hidden">
                        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm flex items-center justify-center">
                                <ClockIcon className="w-4 h-4 text-white" strokeWidth={2.2} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Revision History</h3>
                                <p className="text-xs text-gray-500 font-medium">{lineage.length} version{lineage.length !== 1 ? 's' : ''} of this quotation</p>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {lineage.map(rev => (
                                <Link
                                    key={rev.id}
                                    href={route('quotations.show', rev.id)}
                                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                                        rev.is_current
                                            ? 'bg-primary-50/50 border-l-4 border-primary-500'
                                            : 'hover:bg-gray-50 border-l-4 border-transparent'
                                    }`}
                                >
                                    <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-700 flex-shrink-0">
                                        {sprintf2(rev.revision_no)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-gray-900">{rev.display_code}</span>
                                            {rev.is_current && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                                                    Viewing
                                                </span>
                                            )}
                                            <Badge status={rev.status} />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Created {formatDate(rev.created_at)}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-bold text-gray-900 tabular-nums">৳ {fmt(rev.grand_total)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Printable quotation document — matches the client-facing PDF format */}
            <div className="p-4 sm:p-6 print:p-0">
                <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-200 print:shadow-none print:border-0 p-8 sm:p-10 print:p-0 text-[14px] text-gray-800 leading-snug">

                    {/* Header: Date left, Logo right */}
                    <div className="flex items-start justify-between gap-6 mb-5">
                        <div className="text-[14px]">
                            Date: <span className="font-semibold">{formatDate(quotation.document_date ?? quotation.created_at)}</span>
                        </div>
                        <div className="text-right">
                            {company.logo ? (
                                <img src={company.logo} alt={company.name} className="inline-block max-h-20 max-w-[260px] object-contain" />
                            ) : (
                                <div className="text-[17px] font-bold text-gray-900">{company.name || 'Interior Villa'}</div>
                            )}
                        </div>
                    </div>

                    {/* To block — use custom bill_to if set, else auto-build from client/lead */}
                    {(() => {
                        const person = quotation.client ?? quotation.lead;
                        const companyName = quotation.client?.company_name ?? quotation.lead?.company_name;
                        const contactName = person?.name;
                        return (
                            <div className="text-[14px] mb-4 leading-relaxed">
                                <div className="text-gray-500">To</div>
                                {quotation.bill_to ? (
                                    <div className="whitespace-pre-line">
                                        <span className="font-bold text-gray-900">{quotation.bill_to.split('\n')[0]}</span>
                                        {quotation.bill_to.split('\n').slice(1).map((line, i) => (
                                            <div key={i}>{line}</div>
                                        ))}
                                    </div>
                                ) : person ? (
                                    <>
                                        <div className="font-bold text-gray-900">
                                            {companyName || contactName}
                                        </div>
                                        {companyName && contactName && (
                                            <div>Attn: {contactName}</div>
                                        )}
                                        {person.address && <div>{person.address}</div>}
                                    </>
                                ) : (
                                    <div className="font-bold text-gray-900">Valued Client</div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Subject bar */}
                    <div className="bg-gray-100 px-3 py-2.5 text-[14px] font-bold text-gray-900 mb-4 tracking-wide">
                        SUBJECT : <span>{quotation.subject?.toUpperCase()}</span>
                    </div>

                    {/* BOQ Table */}
                    <table className="w-full text-[13.5px] border-collapse">
                        <thead>
                            <tr>
                                <th className="bg-gray-50 border border-gray-300 px-3 py-2 text-left font-bold w-12">SL</th>
                                <th className="bg-gray-50 border border-gray-300 px-3 py-2 text-left font-bold">Description</th>
                                <th className="bg-gray-50 border border-gray-300 px-3 py-2 text-right font-bold w-20">Quantity</th>
                                <th className="bg-gray-50 border border-gray-300 px-3 py-2 text-center font-bold w-14">Unit</th>
                                <th className="bg-gray-50 border border-gray-300 px-3 py-2 text-right font-bold w-20">Rate</th>
                                <th className="bg-gray-50 border border-gray-300 px-3 py-2 text-right font-bold w-28">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(grouped).map(([cat, items], ci) => {
                                const catTotal = items.reduce((s, i) => s + parseFloat(i.total || 0), 0);
                                return (
                                    <Fragment key={cat}>
                                        {/* Section header row */}
                                        <tr>
                                            <td className="bg-emerald-50 border border-gray-300 px-3 py-2 text-center font-bold">{ci + 1}</td>
                                            <td className="bg-emerald-50 border border-gray-300 px-3 py-2 font-bold" colSpan={5}>{cat}</td>
                                        </tr>
                                        {/* Item rows */}
                                        {items.map((item, ii) => (
                                            <tr key={item.id}>
                                                <td className="border border-gray-200 px-3 py-2 text-center text-gray-500 align-top">
                                                    {ci + 1}.{ii + 1}
                                                </td>
                                                <td className="border border-gray-200 px-3 py-2 align-top">
                                                    {item.item_name && (
                                                        <div className="font-bold text-gray-900 mb-1 text-[14px]">{item.item_name}</div>
                                                    )}
                                                    <div className="whitespace-pre-line leading-relaxed">{item.description}</div>
                                                </td>
                                                <td className="border border-gray-200 px-3 py-2 text-right tabular-nums align-top">{fmt(item.quantity)}</td>
                                                <td className="border border-gray-200 px-3 py-2 text-center align-top">{item.unit}</td>
                                                <td className="border border-gray-200 px-3 py-2 text-right tabular-nums align-top">{fmt(item.unit_rate)}</td>
                                                <td className="border border-gray-200 px-3 py-2 text-right tabular-nums align-top">{fmt(item.total)}</td>
                                            </tr>
                                        ))}
                                        {/* Sub-total row */}
                                        <tr>
                                            <td className="bg-gray-50 border border-gray-300 px-3 py-2 text-center font-bold" colSpan={5}>SUB-TOTAL</td>
                                            <td className="bg-gray-50 border border-gray-300 px-3 py-2 text-right font-bold tabular-nums">{fmt(catTotal)}</td>
                                        </tr>
                                    </Fragment>
                                );
                            })}

                            {/* Transportation */}
                            {parseFloat(quotation.transportation_amount) > 0 && (
                                <tr>
                                    <td className="bg-gray-100 border border-gray-300 px-3 py-2 font-bold" colSpan={5}>Transportation</td>
                                    <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-right font-bold tabular-nums">{fmt(quotation.transportation_amount)}</td>
                                </tr>
                            )}

                            {/* Discount */}
                            {parseFloat(quotation.discount_amount) > 0 && (
                                <tr>
                                    <td className="bg-gray-100 border border-gray-300 px-3 py-2 font-bold" colSpan={5}>
                                        Discount {quotation.discount_type === 'percentage' ? `(${quotation.discount_value}%)` : '(Fixed)'}
                                    </td>
                                    <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-right font-bold tabular-nums text-red-600">
                                        − {fmt(quotation.discount_amount)}
                                    </td>
                                </tr>
                            )}

                            {/* TOTAL (subtotal − discount + transport) */}
                            <tr>
                                <td className="bg-gray-100 border border-gray-300 px-3 py-2 font-bold text-right" colSpan={5}>TOTAL</td>
                                <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-right font-bold tabular-nums">
                                    {fmt(parseFloat(quotation.subtotal) - parseFloat(quotation.discount_amount || 0) + parseFloat(quotation.transportation_amount || 0))}
                                </td>
                            </tr>

                            {/* Supervision */}
                            {parseFloat(quotation.supervision_amount) > 0 && (
                                <tr>
                                    <td className="bg-gray-100 border border-gray-300 px-3 py-2 font-bold" colSpan={5}>
                                        Supervision &amp; Implementation {parseFloat(quotation.supervision_pct).toFixed(0)}%
                                    </td>
                                    <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-right font-bold tabular-nums">{fmt(quotation.supervision_amount)}</td>
                                </tr>
                            )}

                            {/* VAT */}
                            {parseFloat(quotation.vat_amount) > 0 && (
                                <tr>
                                    <td className="bg-gray-100 border border-gray-300 px-3 py-2 font-bold" colSpan={5}>VAT ({quotation.vat_pct}%)</td>
                                    <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-right font-bold tabular-nums">{fmt(quotation.vat_amount)}</td>
                                </tr>
                            )}

                            {/* GRAND TOTAL */}
                            <tr>
                                <td className="bg-gray-900 border border-gray-900 px-3 py-2.5 text-white font-bold text-right text-[15px]" colSpan={5}>GRAND TOTAL (BDT)</td>
                                <td className="bg-gray-900 border border-gray-900 px-3 py-2.5 text-amber-300 font-bold text-right tabular-nums text-[15px]">
                                    {fmt(quotation.grand_total)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* In Words */}
                    {grandTotalInWords && (
                        <div className="mt-4 text-[14px] font-bold text-gray-900">
                            <span className="text-emerald-700">In Words:</span>{' '}
                            <span className="text-gray-700">{grandTotalInWords}</span>
                        </div>
                    )}

                    {/* Terms */}
                    {quotation.terms && (
                        <div className="mt-5 text-[13.5px] text-gray-700">
                            <h4 className="text-[14px] font-bold text-gray-900 mb-2 tracking-wide">TERMS &amp; CONDITION :</h4>
                            {quotation.terms.split(/\r\n|\r|\n/).filter(l => l.trim()).map((line, i) => (
                                <div key={i} className="leading-relaxed">{line}</div>
                            ))}
                        </div>
                    )}

                    {/* Sign-off */}
                    <div className="mt-7 text-[14px]">
                        <div className="mb-1.5">THANKING YOU</div>
                        {company.signature ? (
                            <img src={company.signature} alt="Signature" className="block max-h-[70px] max-w-[220px] object-contain my-1" />
                        ) : (
                            <div className="h-[60px]" />
                        )}
                        <div className="font-bold text-gray-900">
                            {company.ceo_name || quotation.createdBy?.name}
                        </div>
                        <div className="text-gray-600 text-[13px]">{company.ceo_title || 'CEO'}</div>
                        <div className="font-bold text-gray-900 text-[16px] mt-1.5">{company.name || 'Interior Villa'}</div>
                        {(company.phone || company.phone2) && (
                            <div className="text-gray-700 text-[13px] mt-1">
                                Cell: {[company.phone, company.phone2].filter(Boolean).join(', ')}
                            </div>
                        )}
                        {company.email && (
                            <div className="text-gray-700 text-[13px]">Email: {company.email}</div>
                        )}
                    </div>

                    {/* Footer address */}
                    {company.address && (
                        <div className="mt-6 pt-3 border-t border-gray-300 text-center font-bold text-[14px] text-gray-900">
                            {company.address}
                        </div>
                    )}
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
