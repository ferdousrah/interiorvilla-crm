import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import { formatBDT, formatDate } from '@/utils/formatters';
import { useState } from 'react';
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

export default function InvoiceShow({ invoice }) {
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
            <div className="p-4 sm:p-6 max-w-4xl">
                {showPayment && <RecordPaymentForm invoice={invoice} onClose={() => setShowPayment(false)} />}
                <div className="card p-4 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Client</p>
                            <p className="font-semibold">{invoice.client?.name}</p>
                            <p className="text-gray-600">{invoice.client?.phone}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Invoice Details</p>
                            <p>Date: {formatDate(invoice.invoice_date)}</p>
                            {invoice.due_date && <p>Due: {formatDate(invoice.due_date)}</p>}
                            {invoice.project && <p>Project: {invoice.project.name}</p>}
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Payment Status</p>
                            <Badge variant={STATUS_COLORS[invoice.status]}>{invoice.status}</Badge>
                            <p className="mt-2">Total: <strong>{formatBDT(invoice.grand_total)}</strong></p>
                            <p className="text-green-700">Paid: {formatBDT(invoice.paid_amount)}</p>
                            <p className="text-red-600 font-semibold">Balance: {formatBDT(invoice.balance_due)}</p>
                        </div>
                    </div>
                </div>

                <div className="card overflow-hidden mb-4">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['#','Description','Qty','Unit Price','Total'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(invoice.items ?? []).map((item, i) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 text-sm">{i + 1}</td>
                                    <td className="px-4 py-3 text-sm">{item.description}</td>
                                    <td className="px-4 py-3 text-sm">{item.quantity}</td>
                                    <td className="px-4 py-3 text-sm">{formatBDT(item.unit_price)}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{formatBDT(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-right text-sm space-y-1">
                    <div>Subtotal: {formatBDT(invoice.subtotal)}</div>
                    {invoice.vat_amount > 0 && <div>VAT: {formatBDT(invoice.vat_amount)}</div>}
                    {invoice.discount_amount > 0 && <div>Discount: -{formatBDT(invoice.discount_amount)}</div>}
                    <div className="font-bold text-primary-700 text-base">Grand Total: {formatBDT(invoice.grand_total)}</div>
                </div>
            </div>

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
