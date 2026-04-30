import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import { formatBDT, formatDate } from '@/utils/formatters';
import { Fragment, useState } from 'react';
import axios from 'axios';
import {
    EnvelopeIcon, ShareIcon, LinkIcon, DocumentArrowDownIcon, PrinterIcon, BanknotesIcon,
} from '@heroicons/react/24/outline';

const STATUS_COLORS = { draft: 'gray', sent: 'info', partial: 'warning', paid: 'success', overdue: 'danger', cancelled: 'danger' };

function RecordPaymentForm({ invoice, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        amount: invoice.balance_due, payment_date: new Date().toISOString().substring(0, 10),
        payment_method: 'bank_transfer', reference: '', notes: '',
    });
    function submit(e) {
        e.preventDefault();
        post(route('accounts.receipts.store'), { onSuccess: onClose });
    }
    return (
        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
            <h4 className="font-medium text-sm mb-3">Record Payment</h4>
            <form onSubmit={submit} className="space-y-3">
                <input type="hidden" value={invoice.id} name="invoice_id" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <FormField label="Amount (৳)" error={errors.amount} required>
                        <input type="number" className="form-input text-sm" value={data.amount} onChange={e => setData('amount', e.target.value)} />
                    </FormField>
                    <FormField label="Date" error={errors.payment_date}>
                        <input type="date" className="form-input text-sm" value={data.payment_date} onChange={e => setData('payment_date', e.target.value)} />
                    </FormField>
                    <FormField label="Method" error={errors.payment_method}>
                        <select className="form-input text-sm" value={data.payment_method} onChange={e => setData('payment_method', e.target.value)}>
                            {['cash','bank_transfer','cheque','mobile_banking'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                        </select>
                    </FormField>
                </div>
                <FormField label="Reference" error={errors.reference}>
                    <input className="form-input text-sm" value={data.reference} onChange={e => setData('reference', e.target.value)} />
                </FormField>
                <div className="flex gap-2">
                    <button type="submit" disabled={processing} className="btn btn-primary text-xs">{processing ? '…' : 'Record Payment'}</button>
                    <button type="button" onClick={onClose} className="btn text-xs">Cancel</button>
                </div>
            </form>
        </div>
    );
}

export default function InvoiceShow({ invoice, company = {}, grandTotalInWords = '' }) {
    const [showPayment, setShowPayment] = useState(false);
    const [emailModal, setEmailModal] = useState(false);
    const [shareBusy, setShareBusy] = useState(false);
    const canRecord = !['paid', 'cancelled'].includes(invoice.status);

    const recipientName = invoice.client?.name || invoice.lead?.name || 'Valued Client';
    const defaultRecipient = invoice.client?.email || invoice.lead?.email || '';
    const emailForm = useForm({
        to: defaultRecipient,
        cc: '',
        custom_message: `Dear ${recipientName},\n\nPlease find attached our invoice (${invoice.code}). Thank you for your business.\n\nBest regards.`,
    });

    function submitEmail(e) {
        e.preventDefault();
        emailForm.post(route('accounts.invoices.send-email', invoice.id), {
            preserveScroll: true,
            onSuccess: () => setEmailModal(false),
        });
    }

    async function shareWhatsApp() {
        setShareBusy(true);
        try {
            const { data: res } = await axios.get(route('accounts.invoices.share-link', invoice.id));
            const phone = (invoice.client?.phone || invoice.lead?.phone || '').replace(/\D/g, '');
            const text = encodeURIComponent(
                `Hi ${recipientName},\n\nHere is your invoice ${invoice.code} from us.\nGrand Total: BDT ${formatBDT(invoice.grand_total)}\n\nView full details (PDF available): ${res.url}`
            );
            const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
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
            const { data: res } = await axios.get(route('accounts.invoices.share-link', invoice.id));
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
            <Head title={invoice.code} />
            <PageHeader title={invoice.code} subtitle="Invoice" back={route('accounts.invoices.index')}>
                <button onClick={() => setEmailModal(true)} className="btn btn-primary flex items-center gap-2 text-sm">
                    <EnvelopeIcon className="w-4 h-4" /> Send Email
                </button>
                <button onClick={shareWhatsApp} disabled={shareBusy} className="btn flex items-center gap-2 text-sm">
                    <ShareIcon className="w-4 h-4" /> WhatsApp
                </button>
                <button onClick={copyShareLink} disabled={shareBusy} className="btn flex items-center gap-2 text-sm" title="Copy public link">
                    <LinkIcon className="w-4 h-4" /> Copy Link
                </button>
                <a href={route('accounts.invoices.pdf', invoice.id)} className="btn flex items-center gap-2 text-sm" title="Download PDF">
                    <DocumentArrowDownIcon className="w-4 h-4" /> PDF
                </a>
                <button onClick={() => window.print()} className="btn flex items-center gap-2 text-sm">
                    <PrinterIcon className="w-4 h-4" /> Print
                </button>
                {canRecord && (
                    <button onClick={() => setShowPayment(!showPayment)} className="btn btn-secondary flex items-center gap-2 text-sm">
                        <BanknotesIcon className="w-4 h-4" /> Record Payment
                    </button>
                )}
            </PageHeader>
            {showPayment && (
                <div className="px-4 sm:px-6 pt-4 print:hidden">
                    <RecordPaymentForm invoice={invoice} onClose={() => setShowPayment(false)} />
                </div>
            )}

            {/* Printable invoice document — same letterhead format as PDF / public link */}
            {(() => {
                const lineItems = invoice.line_items ?? invoice.lineItems ?? [];
                const balanceDue = parseFloat(invoice.grand_total ?? 0) - parseFloat(invoice.paid_amount ?? 0);
                const person = invoice.client ?? invoice.lead;
                const billCompany = invoice.client?.company_name ?? invoice.lead?.company_name;
                const billContact = person?.name;
                const statusLabel = invoice.status?.replace(/_/g, ' ');
                const statusPill =
                    invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                    invoice.status === 'partially_paid' ? 'bg-blue-100 text-blue-800' :
                    invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    invoice.status === 'draft' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800';

                return (
                    <div className="p-4 sm:p-6 print:p-0">
                        <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-200 print:shadow-none print:border-0 p-8 sm:p-10 print:p-0 text-[14px] text-gray-800 leading-snug">

                            {/* Top: Logo on the left */}
                            <div className="mb-10">
                                {company.logo ? (
                                    <img src={company.logo} alt={company.name} className="block max-h-20 max-w-[240px] object-contain" />
                                ) : (
                                    <div className="text-[17px] font-bold text-gray-900">{company.name || 'Interior Villa'}</div>
                                )}
                            </div>

                            {/* Below: [Invoice No + Bill To] | [INVOICE centered] | [Date right] */}
                            <div className="grid grid-cols-3 items-start gap-6 mb-6">
                                <div className="text-[14px] leading-relaxed">
                                    <div>Invoice No: <span className="font-bold text-gray-900">{invoice.code}</span></div>
                                    <div className="text-gray-500 mt-3">Bill To</div>
                                    {person ? (
                                        <>
                                            <div className="font-bold text-gray-900">{billCompany || billContact}</div>
                                            {person.address && <div>{person.address}</div>}
                                        </>
                                    ) : (
                                        <div className="font-bold text-gray-900">Valued Client</div>
                                    )}
                                </div>
                                <div className="flex justify-center">
                                    <div className="text-[34px] font-bold text-gray-900 tracking-[0.18em] leading-none">INVOICE</div>
                                </div>
                                <div className="text-right text-[14px]">
                                    Date: <span className="font-semibold">{formatDate(invoice.invoice_date ?? invoice.created_at)}</span>
                                </div>
                            </div>

                            {/* Items table */}
                            <table className="w-full text-[13.5px] border-collapse">
                                <thead>
                                    <tr>
                                        <th className="bg-gray-50 border border-gray-300 px-3 py-2 text-left font-bold w-12">SL</th>
                                        <th className="bg-gray-50 border border-gray-300 px-3 py-2 text-left font-bold">Description</th>
                                        <th className="bg-gray-50 border border-gray-300 px-3 py-2 text-right font-bold w-20">Qty</th>
                                        <th className="bg-gray-50 border border-gray-300 px-3 py-2 text-right font-bold w-28">Rate</th>
                                        <th className="bg-gray-50 border border-gray-300 px-3 py-2 text-right font-bold w-32">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="border border-gray-200 px-3 py-6 text-center text-gray-400 italic">No line items</td>
                                        </tr>
                                    ) : lineItems.map((item, i) => (
                                        <tr key={item.id ?? i}>
                                            <td className="border border-gray-200 px-3 py-2 text-center text-gray-500 align-top">{i + 1}</td>
                                            <td className="border border-gray-200 px-3 py-2 align-top whitespace-pre-line">{item.description}</td>
                                            <td className="border border-gray-200 px-3 py-2 text-right tabular-nums align-top">{Number(item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="border border-gray-200 px-3 py-2 text-right tabular-nums align-top">{formatBDT(item.unit_rate)}</td>
                                            <td className="border border-gray-200 px-3 py-2 text-right tabular-nums align-top">{formatBDT(item.total)}</td>
                                        </tr>
                                    ))}

                                    {/* Subtotal */}
                                    <tr>
                                        <td className="bg-gray-100 border border-gray-300 px-3 py-2 font-bold text-right" colSpan={4}>Subtotal</td>
                                        <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-right font-bold tabular-nums">{formatBDT(invoice.subtotal)}</td>
                                    </tr>

                                    {/* Discount */}
                                    {parseFloat(invoice.discount_amount) > 0 && (
                                        <tr>
                                            <td className="bg-gray-100 border border-gray-300 px-3 py-2 font-bold text-right" colSpan={4}>Discount</td>
                                            <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-right font-bold tabular-nums text-red-600">− {formatBDT(invoice.discount_amount)}</td>
                                        </tr>
                                    )}

                                    {/* VAT */}
                                    {parseFloat(invoice.vat_amount) > 0 && (
                                        <tr>
                                            <td className="bg-gray-100 border border-gray-300 px-3 py-2 font-bold text-right" colSpan={4}>VAT ({invoice.vat_pct}%)</td>
                                            <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-right font-bold tabular-nums">{formatBDT(invoice.vat_amount)}</td>
                                        </tr>
                                    )}

                                    {/* Grand Total */}
                                    <tr>
                                        <td className="bg-gray-900 border border-gray-900 px-3 py-2.5 text-white font-bold text-right text-[15px]" colSpan={4}>GRAND TOTAL</td>
                                        <td className="bg-gray-900 border border-gray-900 px-3 py-2.5 text-amber-300 font-bold text-right tabular-nums text-[15px]">BDT {formatBDT(invoice.grand_total)}</td>
                                    </tr>

                                    {/* Paid */}
                                    {parseFloat(invoice.paid_amount) > 0 && (
                                        <tr>
                                            <td className="bg-emerald-50 border border-emerald-200 px-3 py-2 font-bold text-emerald-800 text-right" colSpan={4}>Amount Paid</td>
                                            <td className="bg-emerald-50 border border-emerald-200 px-3 py-2 text-right font-bold tabular-nums text-emerald-800">{formatBDT(invoice.paid_amount)}</td>
                                        </tr>
                                    )}

                                    {/* Balance Due */}
                                    {balanceDue > 0.01 && (
                                        <tr>
                                            <td className="bg-red-50 border border-red-200 px-3 py-2.5 font-bold text-red-800 text-right text-[14px]" colSpan={4}>BALANCE DUE</td>
                                            <td className="bg-red-50 border border-red-200 px-3 py-2.5 text-right font-bold tabular-nums text-red-800 text-[14px]">BDT {formatBDT(balanceDue)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* In Words */}
                            {grandTotalInWords && (
                                <div className="mt-4 text-[14px] font-bold text-gray-900">
                                    <span className="text-emerald-700">In Words:</span>{' '}
                                    <span className="text-gray-700">{grandTotalInWords}</span>
                                </div>
                            )}

                            {/* Notes */}
                            {invoice.notes && (
                                <div className="mt-5 text-[13.5px] text-gray-700">
                                    <h4 className="text-[14px] font-bold text-gray-900 mb-2 tracking-wide">NOTES :</h4>
                                    {invoice.notes.split(/\r\n|\r|\n/).filter(l => l.trim()).map((line, i) => (
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
                                    {company.ceo_name || invoice.createdBy?.name}
                                </div>
                                <div className="text-gray-600 text-[13px]">{company.ceo_title || 'CEO'}</div>
                                <div className="font-bold text-gray-900 text-[16px] mt-1.5">{company.name || 'Interior Villa'}</div>
                                {(company.phone || company.phone2) && (
                                    <div className="text-gray-700 text-[13px] mt-1">
                                        Cell: {[company.phone, company.phone2].filter(Boolean).join(', ')}
                                    </div>
                                )}
                                {company.email && <div className="text-gray-700 text-[13px]">Email: {company.email}</div>}
                            </div>

                            {/* Footer address */}
                            {company.address && (
                                <div className="mt-6 pt-3 border-t border-gray-300 text-center font-bold text-[14px] text-gray-900">
                                    {company.address}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Send Email modal */}
            <Modal open={emailModal} onClose={() => setEmailModal(false)} title="Send Invoice by Email" size="md">
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
                        The full invoice PDF and a public link (valid 30 days) will be included automatically.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setEmailModal(false)} className="btn">Cancel</button>
                        <button type="submit" disabled={emailForm.processing} className="btn btn-primary flex items-center gap-2">
                            <EnvelopeIcon className="w-4 h-4" /> {emailForm.processing ? 'Sending…' : 'Send Email'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
