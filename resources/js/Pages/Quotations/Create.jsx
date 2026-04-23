import { Head, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import {
    PlusIcon, TrashIcon, PlusCircleIcon, DocumentDuplicateIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_CATEGORIES = [
    'Civil Work', 'False Ceiling', 'Flooring', 'Wall Treatment',
    'Electrical Work', 'HVAC / AC', 'Furniture (Custom)',
    'Loose Furniture', 'Curtains & Blinds', 'Painting & Finishing',
    'Plumbing', 'Decoration & Accessories', 'Miscellaneous',
];

const UNITS = ['sft', 'rft', 'pcs', 'set', 'ls', 'nos', 'kg', 'bag', 'box', 'mtr', 'rmt'];

const DEFAULT_TERMS = `1. This quotation is valid for 30 days from the date of issue.
2. 30% advance payment required to start work.
3. 40% payment upon material delivery.
4. 30% balance upon project completion.
5. Any additions/alterations will be charged separately.
6. All disputes subject to local jurisdiction.`;

function newItem(category = '') {
    return { category, description: '', unit: 'sft', quantity: '', unit_rate: '', _key: Math.random() };
}

function fmt(n) {
    const v = parseFloat(n) || 0;
    return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function QuotationCreate({ clients, leads, projects, serviceCategories = {}, prefill }) {
    const today = new Date().toISOString().substring(0, 10);
    const { data, setData, post, processing, errors } = useForm({
        client_id:             prefill?.client_id ?? '',
        lead_id:               prefill?.lead_id ?? '',
        project_id:            prefill?.project_id ?? '',
        service_group:         '',
        service_type:          '',
        subject:               '',
        document_date:         today,
        valid_until:           '',
        discount_type:         'percentage',
        discount_value:        '',
        vat_pct:               '',
        transportation_amount: '0',
        supervision_pct:       '10',
        terms:                 DEFAULT_TERMS,
        notes:                 '',
        items: [
            newItem('Civil Work'),
            newItem('Furniture (Custom)'),
        ],
    });

    const serviceGroups = Object.keys(serviceCategories);
    const serviceTypes  = data.service_group ? (serviceCategories[data.service_group] ?? []) : [];

    function onServiceGroupChange(v) {
        setData('service_group', v);
        setData('service_type', '');
    }
    function onServiceTypeChange(v) {
        setData('service_type', v);
        // Auto-fill subject if empty or follows the generated pattern
        if (v && (!data.subject || data.subject.startsWith('Financial Proposal for '))) {
            setData('subject', `Financial Proposal for ${v}`);
        }
    }

    // ── Template picker ──────────────────────────────────────
    const [templateUi, setTemplateUi] = useState({ open: false, loading: false, list: [] });

    useEffect(() => {
        // When user selects service_group / service_type, fetch matching templates
        if (!data.service_group && !data.service_type) {
            setTemplateUi(s => ({ ...s, list: [] }));
            return;
        }
        setTemplateUi(s => ({ ...s, loading: true }));
        axios.get('/api/quotation-templates', {
            params: { group: data.service_group, type: data.service_type },
        })
        .then(r => setTemplateUi(s => ({ ...s, list: r.data, loading: false })))
        .catch(() => setTemplateUi(s => ({ ...s, list: [], loading: false })));
    }, [data.service_group, data.service_type]);

    function applyTemplate(template) {
        // Convert template sections → BOQ items (category = section name)
        const items = [];
        template.sections.forEach(section => {
            section.items.forEach(ti => {
                items.push({
                    category:    section.name,
                    description: ti.description,
                    unit:        ti.unit,
                    quantity:    ti.default_quantity ?? '',
                    unit_rate:   ti.default_rate ?? '',
                    _key:        Math.random(),
                });
            });
        });

        setData('items', items);
        if (template.default_terms) setData('terms', template.default_terms);
        if (template.default_supervision_pct) setData('supervision_pct', String(template.default_supervision_pct));
        setTemplateUi(s => ({ ...s, open: false }));
    }

    // ── Group items by category ──────────────────────────────
    const categories = useMemo(() => {
        const map = {};
        data.items.forEach((item, idx) => {
            const cat = item.category || 'Uncategorized';
            if (!map[cat]) map[cat] = [];
            map[cat].push({ ...item, _idx: idx });
        });
        return map;
    }, [data.items]);

    // ── Live totals ──────────────────────────────────────────
    const subtotal = useMemo(() =>
        data.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_rate) || 0), 0),
        [data.items]
    );

    const discountAmount = useMemo(() => {
        const v = parseFloat(data.discount_value) || 0;
        return data.discount_type === 'percentage' ? subtotal * v / 100 : Math.min(v, subtotal);
    }, [subtotal, data.discount_type, data.discount_value]);

    const afterDiscount = subtotal - discountAmount;
    const vatAmount     = afterDiscount * (parseFloat(data.vat_pct) || 0) / 100;
    const transport     = parseFloat(data.transportation_amount) || 0;
    const supervisionBase   = afterDiscount + transport;
    const supervisionAmount = supervisionBase * (parseFloat(data.supervision_pct) || 0) / 100;
    const grandTotal    = afterDiscount + transport + supervisionAmount + vatAmount;

    const categoryTotals = useMemo(() => {
        const map = {};
        data.items.forEach(item => {
            const cat = item.category || 'Uncategorized';
            map[cat] = (map[cat] || 0) + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_rate) || 0);
        });
        return map;
    }, [data.items]);

    // ── Item helpers ─────────────────────────────────────────
    function updateItem(idx, field, value) {
        const items = [...data.items];
        items[idx] = { ...items[idx], [field]: value };
        setData('items', items);
    }

    function addItem(category) {
        setData('items', [...data.items, newItem(category)]);
    }

    function removeItem(idx) {
        setData('items', data.items.filter((_, i) => i !== idx));
    }

    function addCategory() {
        const name = prompt('Category name:');
        if (name?.trim()) setData('items', [...data.items, newItem(name.trim())]);
    }

    function submit(e) {
        e.preventDefault();
        post(route('quotations.store'));
    }

    return (
        <AppLayout>
            <Head title="New Quotation" />
            <PageHeader title="New Quotation" subtitle="Build a cost estimate for your client" back={route('quotations.index')}>
                {templateUi.list.length > 0 && (
                    <button type="button" onClick={() => setTemplateUi(s => ({ ...s, open: true }))}
                        className="btn btn-secondary flex items-center gap-2 text-sm">
                        <DocumentDuplicateIcon className="w-4 h-4" /> Apply Template
                        <span className="text-[10px] bg-white/80 text-primary-700 px-1.5 py-0.5 rounded-full font-bold">{templateUi.list.length}</span>
                    </button>
                )}
            </PageHeader>

            <form onSubmit={submit} className="p-4 sm:p-6 space-y-6 max-w-6xl">

                {/* ── Header Info ────────────────────────────── */}
                <div className="card p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Quotation Details</h3>
                    {/* Client or Lead notice */}
                    <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
                        <strong>Tip:</strong> Select a <strong>Client</strong> if they already exist, <em>or</em> select a <strong>Lead</strong> (for prospects not yet clients).
                        A client record will be created automatically when the quotation is converted to a project.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField label="Client (if already exists)" error={errors.client_id}>
                            <select className="form-input" value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                                <option value="">— Not a client yet —</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                            </select>
                        </FormField>
                        <FormField label={<span>Lead <span className="text-xs text-gray-400">(required if no client selected)</span></span>} error={errors.lead_id}>
                            <select className="form-input" value={data.lead_id} onChange={e => setData('lead_id', e.target.value)}>
                                <option value="">— No lead —</option>
                                {leads.map(l => <option key={l.id} value={l.id}>{l.name} · {l.phone}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Linked Project" error={errors.project_id}>
                            <select className="form-input" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                                <option value="">None</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                            </select>
                        </FormField>

                        <FormField label="Service Category" error={errors.service_group}>
                            <select className="form-input" value={data.service_group} onChange={e => onServiceGroupChange(e.target.value)}>
                                <option value="">Select category…</option>
                                {serviceGroups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Service Type" error={errors.service_type} hint="Auto-fills the subject when chosen">
                            <select className="form-input" value={data.service_type} onChange={e => onServiceTypeChange(e.target.value)} disabled={!data.service_group}>
                                <option value="">{data.service_group ? 'Select service…' : 'Pick a category first'}</option>
                                {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Subject / Title" error={errors.subject} required>
                            <input className="form-input" value={data.subject} onChange={e => setData('subject', e.target.value)}
                                placeholder="e.g. Financial Proposal for Corporate Office Interior" />
                        </FormField>

                        <FormField label="Document Date" error={errors.document_date} required>
                            <input type="date" className="form-input" value={data.document_date} onChange={e => setData('document_date', e.target.value)} />
                        </FormField>
                        <FormField label="Valid Until" error={errors.valid_until}>
                            <input type="date" className="form-input" value={data.valid_until} onChange={e => setData('valid_until', e.target.value)} />
                        </FormField>
                        <FormField label="Internal Notes" error={errors.notes}>
                            <input className="form-input" value={data.notes} onChange={e => setData('notes', e.target.value)}
                                placeholder="Internal notes (not shown to client)" />
                        </FormField>
                    </div>
                </div>

                {/* ── BOQ Line Items ─────────────────────────── */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700">Bill of Quantities (BOQ)</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Add items by category. Each item: description × qty × rate = amount.</p>
                        </div>
                        <button type="button" onClick={addCategory}
                            className="btn btn-secondary text-sm flex items-center gap-1.5">
                            <PlusCircleIcon className="w-4 h-4" /> Add Category
                        </button>
                    </div>

                    <div className="space-y-6">
                        {Object.entries(categories).map(([cat, catItems]) => (
                            <div key={cat} className="border border-gray-200 rounded-xl overflow-hidden">
                                {/* Category header */}
                                <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                                        <span className="text-sm font-semibold text-gray-700">{cat}</span>
                                        <span className="text-xs text-gray-400">({catItems.length} items)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-primary-700">
                                            {fmt(categoryTotals[cat] || 0)}
                                        </span>
                                        <button type="button" onClick={() => addItem(cat)}
                                            className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 font-medium">
                                            <PlusIcon className="w-3.5 h-3.5" /> Add Item
                                        </button>
                                    </div>
                                </div>

                                {/* Items table */}
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs text-gray-400 uppercase bg-white border-b border-gray-100">
                                            <th className="px-3 py-2 text-left w-1/2">Description</th>
                                            <th className="px-3 py-2 text-left w-20">Unit</th>
                                            <th className="px-3 py-2 text-right w-24">Qty</th>
                                            <th className="px-3 py-2 text-right w-28">Rate</th>
                                            <th className="px-3 py-2 text-right w-28">Amount</th>
                                            <th className="px-3 py-2 w-8" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {catItems.map(item => {
                                            const amt = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_rate) || 0);
                                            return (
                                                <tr key={item._key} className="hover:bg-gray-50/50 group">
                                                    <td className="px-3 py-2 align-top">
                                                        <textarea
                                                            className="form-input text-xs w-full leading-snug"
                                                            rows={2}
                                                            value={item.description}
                                                            onChange={e => updateItem(item._idx, 'description', e.target.value)}
                                                            placeholder="Full specification — e.g. Supply fitting and fixing of Patterned glass partition having 5mm thickness…"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            className="form-input text-xs"
                                                            list="units-list"
                                                            value={item.unit}
                                                            onChange={e => updateItem(item._idx, 'unit', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            className="form-input text-xs text-right"
                                                            value={item.quantity}
                                                            onChange={e => updateItem(item._idx, 'quantity', e.target.value)}
                                                            placeholder="0"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            className="form-input text-xs text-right"
                                                            value={item.unit_rate}
                                                            onChange={e => updateItem(item._idx, 'unit_rate', e.target.value)}
                                                            placeholder="0.00"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-medium text-gray-700">
                                                        {amt > 0 ? fmt(amt) : <span className="text-gray-300">—</span>}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <button type="button" onClick={() => removeItem(item._idx)}
                                                            className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <TrashIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    {/* Quick-add from default categories */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-400 mr-1 self-center">Quick add:</span>
                        {DEFAULT_CATEGORIES.filter(c => !categories[c]).map(cat => (
                            <button key={cat} type="button" onClick={() => addItem(cat)}
                                className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
                                + {cat}
                            </button>
                        ))}
                    </div>

                    <datalist id="units-list">
                        {UNITS.map(u => <option key={u} value={u} />)}
                    </datalist>
                </div>

                {/* ── Summary & Discount ─────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Terms */}
                    <div className="card p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Terms & Conditions</h3>
                        <textarea className="form-input text-sm" rows={8} value={data.terms}
                            onChange={e => setData('terms', e.target.value)} />
                    </div>

                    {/* Totals calculator */}
                    <div className="card p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Cost Summary</h3>

                        {/* Category breakdown */}
                        <div className="space-y-1.5 mb-4 pb-4 border-b border-gray-100">
                            {Object.entries(categoryTotals).map(([cat, total]) => total > 0 && (
                                <div key={cat} className="flex justify-between text-sm text-gray-500">
                                    <span className="truncate mr-2">{cat}</span>
                                    <span className="font-medium text-gray-700 flex-shrink-0">{fmt(total)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-semibold text-gray-800">{fmt(subtotal)}</span>
                            </div>

                            {/* Discount */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 w-24 flex-shrink-0">Discount</span>
                                <select className="form-input text-xs py-1 w-28"
                                    value={data.discount_type} onChange={e => setData('discount_type', e.target.value)}>
                                    <option value="percentage">%</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                                <input type="number" min="0" step="0.01" className="form-input text-xs py-1 w-24 text-right"
                                    value={data.discount_value} onChange={e => setData('discount_value', e.target.value)} placeholder="0" />
                                <span className="text-xs text-red-500 ml-auto flex-shrink-0">
                                    {discountAmount > 0 && `- ${fmt(discountAmount)}`}
                                </span>
                            </div>

                            {/* Transportation */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 w-24 flex-shrink-0">Transportation</span>
                                <input type="number" min="0" step="0.01" className="form-input text-xs py-1 w-40 text-right"
                                    value={data.transportation_amount}
                                    onChange={e => setData('transportation_amount', e.target.value)}
                                    placeholder="0" />
                                <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
                                    {transport > 0 && `+ ${fmt(transport)}`}
                                </span>
                            </div>

                            {/* Supervision & Implementation */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 w-24 flex-shrink-0">Supervision</span>
                                <div className="flex items-center gap-1">
                                    <input type="number" min="0" max="100" step="0.5" className="form-input text-xs py-1 w-20 text-right"
                                        value={data.supervision_pct}
                                        onChange={e => setData('supervision_pct', e.target.value)}
                                        placeholder="10" />
                                    <span className="text-xs text-gray-400">%</span>
                                </div>
                                <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
                                    {supervisionAmount > 0 && `+ ${fmt(supervisionAmount)}`}
                                </span>
                            </div>

                            {/* VAT */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 w-24 flex-shrink-0">VAT / Tax</span>
                                <div className="flex items-center gap-1">
                                    <input type="number" min="0" max="100" step="0.5" className="form-input text-xs py-1 w-20 text-right"
                                        value={data.vat_pct} onChange={e => setData('vat_pct', e.target.value)} placeholder="0" />
                                    <span className="text-xs text-gray-400">%</span>
                                </div>
                                <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
                                    {vatAmount > 0 && `+ ${fmt(vatAmount)}`}
                                </span>
                            </div>

                            {/* Grand total */}
                            <div className="flex justify-between pt-3 border-t-2 border-gray-200">
                                <span className="font-bold text-gray-800">Grand Total</span>
                                <span className="text-xl font-bold text-primary-700">BDT {fmt(grandTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Actions ────────────────────────────────── */}
                <div className="flex gap-3 pb-6">
                    <button type="submit" disabled={processing} className="btn btn-primary">
                        {processing ? 'Creating…' : 'Create Quotation'}
                    </button>
                    <a href={route('quotations.index')} className="btn">Cancel</a>
                </div>
            </form>

            {/* Apply Template modal */}
            <Modal open={templateUi.open} onClose={() => setTemplateUi(s => ({ ...s, open: false }))}
                title="Apply a Template" size="lg">
                <div className="p-4 sm:p-6 space-y-3">
                    <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        Picking a template will <strong>replace all current items</strong>, and update the Terms + Supervision % if the template sets them.
                    </p>

                    {templateUi.list.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">No templates match the selected service.</p>
                    ) : (
                        <div className="space-y-2">
                            {templateUi.list.map(t => {
                                const itemCount = t.sections.reduce((s, sec) => s + sec.items.length, 0);
                                const subtotal = t.sections.reduce((s, sec) =>
                                    s + sec.items.reduce((ss, i) => ss + (parseFloat(i.default_quantity) || 1) * (parseFloat(i.default_rate) || 0), 0), 0);
                                return (
                                    <button key={t.id} type="button" onClick={() => applyTemplate(t)}
                                        className="w-full text-left border border-gray-200 rounded-lg p-3 hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                                                {(t.service_group || t.service_type) && (
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        {t.service_group}{t.service_group && t.service_type ? ' → ' : ''}{t.service_type}
                                                    </p>
                                                )}
                                                {t.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</p>}
                                            </div>
                                            <CheckCircleIcon className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
                                            <span>{t.sections.length} sections</span>
                                            <span>·</span>
                                            <span>{itemCount} items</span>
                                            {subtotal > 0 && (
                                                <span className="ml-auto font-semibold text-primary-700">~ BDT {fmt(subtotal)}</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={() => setTemplateUi(s => ({ ...s, open: false }))} className="btn">Close</button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
