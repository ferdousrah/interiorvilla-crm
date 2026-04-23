import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import Modal from '@/Components/Modal';
import FormField from '@/Components/FormField';
import { formatDate } from '@/utils/formatters';
import {
    PencilIcon, TrashIcon, CheckCircleIcon,
    DocumentDuplicateIcon, ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const CATEGORIES = [
    { key: 'material', label: 'Materials', icon: '🧱' },
    { key: 'labor', label: 'Labor', icon: '👷' },
    { key: 'subcontractor', label: 'Subcontractor', icon: '🏗️' },
    { key: 'transport', label: 'Transport', icon: '🚛' },
    { key: 'overhead', label: 'Overhead', icon: '🏢' },
    { key: 'contingency', label: 'Contingency', icon: '🛡️' },
    { key: 'other', label: 'Other', icon: '📦' },
];

function fmt(n) { return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function CostEstimationShow({ estimation }) {
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const { data, setData, post, processing } = useForm({
        markup_pct: estimation.markup_pct ?? 20,
        subject: estimation.title ?? '',
    });

    // Group items
    const grouped = useMemo(() => {
        const m = {};
        (estimation.items ?? []).forEach(item => {
            const c = item.category || 'other';
            if (!m[c]) m[c] = [];
            m[c].push(item);
        });
        return m;
    }, [estimation.items]);

    const totalEstimated = parseFloat(estimation.total_estimated) || 0;
    const markupPct = parseFloat(estimation.markup_pct) || 0;
    const markupAmount = parseFloat(estimation.markup_amount) || 0;
    const suggestedQuote = parseFloat(estimation.suggested_quote) || 0;

    // Live preview in modal
    const liveMarkup = totalEstimated * (parseFloat(data.markup_pct) || 0) / 100;
    const liveQuote = totalEstimated + liveMarkup;

    function doFinalize() {
        if (confirm('Mark this cost estimation as final? You can still edit it later.')) {
            router.patch(route('cost-estimations.finalize', estimation.id));
        }
    }

    function doDelete() {
        if (confirm(`Delete ${estimation.code}?`)) {
            router.delete(route('cost-estimations.destroy', estimation.id));
        }
    }

    function submitGenerateQuote(e) {
        e.preventDefault();
        post(route('cost-estimations.generate-quotation', estimation.id));
    }

    return (
        <AppLayout>
            <Head title={`Cost Estimation ${estimation.code}`} />
            <PageHeader title={estimation.code} subtitle={estimation.title} back={route('cost-estimations.index')}>
                {estimation.status === 'draft' && (
                    <button onClick={doFinalize} className="btn btn-secondary flex items-center gap-2 text-sm">
                        <CheckCircleIcon className="w-4 h-4" /> Mark Final
                    </button>
                )}
                <button onClick={() => setShowQuoteModal(true)} className="btn btn-primary flex items-center gap-2 text-sm">
                    <DocumentDuplicateIcon className="w-4 h-4" /> Generate Quotation
                </button>
                <Link href={route('cost-estimations.edit', estimation.id)} className="btn flex items-center gap-2 text-sm">
                    <PencilIcon className="w-4 h-4" /> Edit
                </Link>
                <button onClick={doDelete} className="btn btn-danger text-sm">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </PageHeader>

            <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
                {/* Info bar */}
                <div className="card p-5">
                    <div className="grid grid-cols-4 gap-6 text-sm">
                        <div>
                            <p className="text-xs text-gray-400 uppercase">Status</p>
                            <Badge status={estimation.status} className="mt-1" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase">Lead / Client</p>
                            <p className="font-medium text-gray-800 mt-1">
                                {estimation.client?.name ?? estimation.lead?.name ?? '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase">Project</p>
                            <p className="font-medium text-gray-800 mt-1">
                                {estimation.project ? `${estimation.project.name} (${estimation.project.code})` : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase">Created</p>
                            <p className="text-gray-700 mt-1">{formatDate(estimation.created_at)} by {estimation.createdBy?.name}</p>
                        </div>
                    </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="card p-4">
                        <p className="text-xs text-gray-500 uppercase">Total Cost</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">{fmt(totalEstimated)}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs text-gray-500 uppercase">Markup ({markupPct}%)</p>
                        <p className="text-xl font-bold text-green-600 mt-1">+ {fmt(markupAmount)}</p>
                    </div>
                    <div className="card p-4 bg-primary-50 border-primary-200">
                        <p className="text-xs text-primary-600 uppercase font-semibold">Suggested Quote</p>
                        <p className="text-xl font-bold text-primary-700 mt-1">{fmt(suggestedQuote)}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs text-gray-500 uppercase">Profit Margin</p>
                        <p className="text-xl font-bold text-green-600 mt-1">
                            {totalEstimated > 0 ? `${((markupAmount / totalEstimated) * 100).toFixed(1)}%` : '—'}
                        </p>
                    </div>
                </div>

                {/* Cost breakdown */}
                <div className="space-y-4">
                    {Object.entries(grouped).map(([cat, items], ci) => {
                        const cfg = CATEGORIES.find(c => c.key === cat) ?? { label: cat, icon: '📦' };
                        const catTotal = items.reduce((s, i) => s + parseFloat(i.estimated_total || 0), 0);
                        const pct = totalEstimated > 0 ? ((catTotal / totalEstimated) * 100).toFixed(0) : 0;

                        return (
                            <div key={cat}>
                                <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2 rounded-t-lg">
                                    <span className="text-sm font-semibold flex items-center gap-2">
                                        <span>{cfg.icon}</span> {ci + 1}. {cfg.label}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-300">{pct}%</span>
                                        <span className="text-sm font-bold">{fmt(catTotal)}</span>
                                    </div>
                                </div>
                                <table className="w-full text-sm border border-gray-200 border-t-0 rounded-b-lg overflow-hidden">
                                    <thead className="bg-gray-50">
                                        <tr className="text-xs text-gray-500 uppercase">
                                            <th className="px-4 py-2 text-left w-8">#</th>
                                            <th className="px-4 py-2 text-left">Description</th>
                                            <th className="px-4 py-2 text-center w-16">Unit</th>
                                            <th className="px-4 py-2 text-right w-20">Qty</th>
                                            <th className="px-4 py-2 text-right w-28">Rate</th>
                                            <th className="px-4 py-2 text-right w-28">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items.map((item, ii) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-2 text-gray-400 text-xs">{ii + 1}</td>
                                                <td className="px-4 py-2 text-gray-800">{item.description}</td>
                                                <td className="px-4 py-2 text-center text-gray-500">{item.unit}</td>
                                                <td className="px-4 py-2 text-right text-gray-700">{item.quantity}</td>
                                                <td className="px-4 py-2 text-right text-gray-700">{fmt(item.estimated_rate)}</td>
                                                <td className="px-4 py-2 text-right font-medium text-gray-900">{fmt(item.estimated_total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>

                {/* Summary */}
                <div className="flex justify-end">
                    <div className="w-80 card p-5 space-y-2">
                        <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                            <span className="text-gray-500">Total Cost</span>
                            <span className="font-semibold">{fmt(totalEstimated)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                            <span className="text-gray-500">Markup ({markupPct}%)</span>
                            <span className="text-green-600 font-medium">+ {fmt(markupAmount)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t-2 border-gray-800">
                            <span className="font-bold text-gray-800">Client Quote</span>
                            <span className="text-xl font-bold text-primary-700">BDT {fmt(suggestedQuote)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generate Quotation Modal */}
            <Modal open={showQuoteModal} onClose={() => setShowQuoteModal(false)} title="Generate Quotation" size="md">
                <form onSubmit={submitGenerateQuote} className="p-4 sm:p-6 space-y-5">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                        A new <strong>Quotation</strong> will be created from this cost estimation.
                        Each cost item's rate will be multiplied by the markup % to generate client-facing prices.
                    </div>

                    <FormField label="Quotation Subject" required>
                        <input className="form-input" value={data.subject} onChange={e => setData('subject', e.target.value)}
                            placeholder="e.g. Interior Design — 3BHK Apartment" />
                    </FormField>

                    <FormField label="Markup Percentage">
                        <input type="number" min="0" max="200" step="0.5" className="form-input"
                            value={data.markup_pct} onChange={e => setData('markup_pct', e.target.value)} />
                    </FormField>

                    {/* Live preview */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Your Cost</span>
                            <span className="font-medium">{fmt(totalEstimated)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Markup ({data.markup_pct || 0}%)</span>
                            <span className="text-green-600">+ {fmt(liveMarkup)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                            <span className="font-bold">Quotation Total</span>
                            <span className="text-xl font-bold text-primary-700">BDT {fmt(liveQuote)}</span>
                        </div>
                        <p className="text-xs text-green-600 text-right">
                            Your profit: {fmt(liveMarkup)} ({data.markup_pct || 0}% margin)
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" disabled={processing} className="btn btn-primary flex items-center gap-2">
                            <DocumentDuplicateIcon className="w-4 h-4" />
                            {processing ? 'Generating…' : 'Generate Quotation'}
                        </button>
                        <button type="button" onClick={() => setShowQuoteModal(false)} className="btn">Cancel</button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
