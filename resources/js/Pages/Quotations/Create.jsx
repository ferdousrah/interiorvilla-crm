import { Head, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import MaterialPicker from '@/Components/MaterialPicker';
import {
    PlusIcon, TrashIcon, PlusCircleIcon, DocumentDuplicateIcon, CheckCircleIcon,
    UserGroupIcon, ClipboardDocumentListIcon, CalculatorIcon, DocumentTextIcon,
    LightBulbIcon, InboxIcon,
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
    return { material_id: '', category, item_name: '', description: '', unit: 'sft', quantity: '', unit_rate: '', _key: Math.random() };
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
        items: [],
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

    // ── Materials picker (filtered by selected service type) ──
    const [availableMaterials, setAvailableMaterials] = useState([]);

    useEffect(() => {
        if (!data.service_group || !data.service_type) {
            setAvailableMaterials([]);
            return;
        }
        axios.get('/api/materials', {
            params: { group: data.service_group, type: data.service_type },
        })
            .then(r => setAvailableMaterials(r.data || []))
            .catch(() => setAvailableMaterials([]));
    }, [data.service_group, data.service_type]);

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

    function selectMaterialForItem(idx, materialId) {
        if (!materialId) {
            updateItem(idx, 'material_id', '');
            return;
        }
        const mat = availableMaterials.find(m => m.id === materialId);
        if (!mat) return;
        const items = [...data.items];
        items[idx] = {
            ...items[idx],
            material_id:  mat.id,
            item_name:    mat.name || items[idx].item_name,
            description:  mat.description || items[idx].description,
            unit:         mat.unit || items[idx].unit,
            unit_rate:    mat.default_rate != null ? String(mat.default_rate) : items[idx].unit_rate,
        };
        setData('items', items);
    }

    function addItem(category) {
        setData('items', [...data.items, newItem(category)]);
    }

    function removeItem(idx) {
        setData('items', data.items.filter((_, i) => i !== idx));
    }

    // ── Add-Category modal ───────────────────────────────────
    const [categoryModal, setCategoryModal] = useState({ open: false, value: '' });

    function openCategoryModal() {
        setCategoryModal({ open: true, value: '' });
    }

    function confirmAddCategory(e) {
        e?.preventDefault();
        const name = categoryModal.value.trim();
        if (!name) return;
        setData('items', [...data.items, newItem(name)]);
        setCategoryModal({ open: false, value: '' });
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
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-md shadow-primary-500/20 flex items-center justify-center flex-shrink-0">
                            <UserGroupIcon className="w-5 h-5 text-white" strokeWidth={2.2} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Quotation Details</h3>
                            <p className="text-xs text-gray-500 font-medium">Who is this quote for, and what service is it about</p>
                        </div>
                    </div>
                    {/* Client or Lead notice */}
                    <div className="mb-5 p-3 rounded-xl bg-blue-50/60 border border-blue-200 flex items-start gap-2.5">
                        <LightBulbIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <div className="text-sm text-blue-800 leading-relaxed">
                            Select a <strong>Client</strong> if they already exist, <em>or</em> a <strong>Lead</strong> for prospects. A client record is created automatically when the quotation converts to a project.
                        </div>
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
                    <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <ClipboardDocumentListIcon className="w-5 h-5 text-white" strokeWidth={2.2} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Bill of Quantities</h3>
                                <p className="text-xs text-gray-500 font-medium">Group line items into categories — each row: qty × rate</p>
                            </div>
                        </div>
                        <button type="button" onClick={openCategoryModal}
                            className="btn btn-secondary text-sm flex items-center gap-1.5">
                            <PlusCircleIcon className="w-4 h-4" /> Add Category
                        </button>
                    </div>

                    {Object.keys(categories).length === 0 && (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 px-4 text-center bg-gray-50/40">
                            <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-200 mx-auto flex items-center justify-center mb-3">
                                <InboxIcon className="w-6 h-6 text-gray-400" strokeWidth={2} />
                            </div>
                            <p className="text-sm font-semibold text-gray-700">No items yet</p>
                            <p className="text-xs text-gray-500 mt-1">Pick a category below to start adding line items.</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {Object.entries(categories).map(([cat, catItems]) => (
                            <div key={cat} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                {/* Category header */}
                                <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 flex items-center justify-between border-b border-gray-200">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-1 h-6 rounded-full bg-primary-500" />
                                        <span className="text-sm font-bold text-gray-900 truncate">{cat}</span>
                                        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{catItems.length}</span>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-sm font-bold text-primary-700 tabular-nums">
                                            {fmt(categoryTotals[cat] || 0)}৳
                                        </span>
                                        <button type="button" onClick={() => addItem(cat)}
                                            className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 font-semibold px-2 py-1 rounded-md hover:bg-primary-50 transition-colors">
                                            <PlusIcon className="w-3.5 h-3.5" /> Add Item
                                        </button>
                                    </div>
                                </div>

                                {/* Items table */}
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs text-gray-500 uppercase font-semibold bg-white border-b border-gray-100">
                                            <th className="px-3 py-2 text-left w-40">Item</th>
                                            <th className="px-3 py-2 text-left">Description</th>
                                            <th className="px-3 py-2 text-left w-24">Unit</th>
                                            <th className="px-3 py-2 text-right w-24">Qty</th>
                                            <th className="px-3 py-2 text-right w-32">Rate</th>
                                            <th className="px-3 py-2 text-right w-32">Amount</th>
                                            <th className="px-3 py-2 w-8" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {catItems.map(item => {
                                            const amt = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_rate) || 0);
                                            return (
                                                <tr key={item._key} className="hover:bg-gray-50/50 group">
                                                    <td className="px-3 py-2 align-top">
                                                        <MaterialPicker
                                                            materials={availableMaterials}
                                                            value={item.material_id}
                                                            onChange={(id) => selectMaterialForItem(item._idx, id)}
                                                            disabled={!data.service_type}
                                                            placeholders={{
                                                                disabled: 'Pick service type first',
                                                                empty: 'No materials for this service',
                                                                active: 'Search items…',
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 align-top">
                                                        <div className="space-y-1">
                                                            <input
                                                                type="text"
                                                                className="form-input text-sm w-full font-bold leading-tight"
                                                                value={item.item_name}
                                                                onChange={e => updateItem(item._idx, 'item_name', e.target.value)}
                                                                placeholder="Item name (bold heading shown to client)"
                                                            />
                                                            <textarea
                                                                className="form-input text-xs w-full leading-snug"
                                                                rows={2}
                                                                value={item.description}
                                                                onChange={e => updateItem(item._idx, 'description', e.target.value)}
                                                                placeholder="Full specification — shown below the item name"
                                                                required
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            className="form-input text-sm w-full font-medium"
                                                            list="units-list"
                                                            value={item.unit}
                                                            onChange={e => updateItem(item._idx, 'unit', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            className="form-input text-sm w-full text-right font-semibold tabular-nums"
                                                            value={item.quantity}
                                                            onChange={e => updateItem(item._idx, 'quantity', e.target.value)}
                                                            placeholder="0"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            className="form-input text-sm w-full text-right font-semibold tabular-nums"
                                                            value={item.unit_rate}
                                                            onChange={e => updateItem(item._idx, 'unit_rate', e.target.value)}
                                                            placeholder="0.00"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-bold text-gray-900 tabular-nums">
                                                        {amt > 0 ? fmt(amt) : <span className="text-gray-300 font-normal">—</span>}
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
                    <div className="mt-5 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-2">Quick add category</p>
                        <div className="flex flex-wrap gap-1.5">
                            {DEFAULT_CATEGORIES.filter(c => !categories[c]).map(cat => (
                                <button key={cat} type="button" onClick={() => addItem(cat)}
                                    className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 transition-all">
                                    + {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <datalist id="units-list">
                        {UNITS.map(u => <option key={u} value={u} />)}
                    </datalist>
                </div>

                {/* ── Summary & Discount ─────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Terms */}
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/20 flex items-center justify-center flex-shrink-0">
                                <DocumentTextIcon className="w-5 h-5 text-white" strokeWidth={2.2} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Terms & Conditions</h3>
                                <p className="text-xs text-gray-500 font-medium">Shown on the printed quotation</p>
                            </div>
                        </div>
                        <textarea className="form-input text-sm leading-relaxed" rows={10} value={data.terms}
                            onChange={e => setData('terms', e.target.value)} />
                    </div>

                    {/* Totals calculator */}
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <CalculatorIcon className="w-5 h-5 text-white" strokeWidth={2.2} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Cost Summary</h3>
                                <p className="text-xs text-gray-500 font-medium">Live totals as you edit</p>
                            </div>
                        </div>

                        {/* Category breakdown */}
                        {Object.values(categoryTotals).some(v => v > 0) && (
                            <div className="space-y-1.5 mb-4 pb-4 border-b border-gray-100">
                                <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-2">By Category</p>
                                {Object.entries(categoryTotals).map(([cat, total]) => total > 0 && (
                                    <div key={cat} className="flex justify-between text-sm">
                                        <span className="text-gray-600 truncate mr-2">{cat}</span>
                                        <span className="font-semibold text-gray-800 tabular-nums flex-shrink-0">{fmt(total)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-3.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-700 font-medium">Subtotal</span>
                                <span className="font-bold text-gray-900 tabular-nums">{fmt(subtotal)}</span>
                            </div>

                            {/* Discount */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 font-medium w-28 flex-shrink-0">Discount</span>
                                <select className="form-input text-xs py-1.5 w-24"
                                    value={data.discount_type} onChange={e => setData('discount_type', e.target.value)}>
                                    <option value="percentage">%</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                                <input type="number" min="0" step="0.01" className="form-input text-sm py-1.5 w-24 text-right tabular-nums font-semibold"
                                    value={data.discount_value} onChange={e => setData('discount_value', e.target.value)} placeholder="0" />
                                <span className="text-xs text-red-600 font-semibold ml-auto flex-shrink-0 tabular-nums">
                                    {discountAmount > 0 && `− ${fmt(discountAmount)}`}
                                </span>
                            </div>

                            {/* Transportation */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 font-medium w-28 flex-shrink-0">Transportation</span>
                                <input type="number" min="0" step="0.01" className="form-input text-sm py-1.5 flex-1 text-right tabular-nums font-semibold"
                                    value={data.transportation_amount}
                                    onChange={e => setData('transportation_amount', e.target.value)}
                                    placeholder="0" />
                                <span className="text-xs text-gray-600 font-semibold ml-auto flex-shrink-0 tabular-nums w-24 text-right">
                                    {transport > 0 && `+ ${fmt(transport)}`}
                                </span>
                            </div>

                            {/* Supervision & Implementation */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 font-medium w-28 flex-shrink-0">Supervision</span>
                                <div className="flex items-center gap-1 flex-1">
                                    <input type="number" min="0" max="100" step="0.5" className="form-input text-sm py-1.5 w-20 text-right tabular-nums font-semibold"
                                        value={data.supervision_pct}
                                        onChange={e => setData('supervision_pct', e.target.value)}
                                        placeholder="10" />
                                    <span className="text-xs text-gray-500 font-medium">%</span>
                                </div>
                                <span className="text-xs text-gray-600 font-semibold ml-auto flex-shrink-0 tabular-nums w-24 text-right">
                                    {supervisionAmount > 0 && `+ ${fmt(supervisionAmount)}`}
                                </span>
                            </div>

                            {/* VAT */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 font-medium w-28 flex-shrink-0">VAT / Tax</span>
                                <div className="flex items-center gap-1 flex-1">
                                    <input type="number" min="0" max="100" step="0.5" className="form-input text-sm py-1.5 w-20 text-right tabular-nums font-semibold"
                                        value={data.vat_pct} onChange={e => setData('vat_pct', e.target.value)} placeholder="0" />
                                    <span className="text-xs text-gray-500 font-medium">%</span>
                                </div>
                                <span className="text-xs text-gray-600 font-semibold ml-auto flex-shrink-0 tabular-nums w-24 text-right">
                                    {vatAmount > 0 && `+ ${fmt(vatAmount)}`}
                                </span>
                            </div>

                            {/* Grand total */}
                            <div className="mt-4 -mx-6 -mb-6 px-6 py-4 bg-gradient-to-br from-primary-600 to-primary-700 rounded-b-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[11px] text-primary-100 font-semibold uppercase tracking-wider">Grand Total</p>
                                        <p className="text-[10px] text-primary-200 mt-0.5">Inclusive of all charges</p>
                                    </div>
                                    <span className="text-2xl font-bold text-white tabular-nums">৳ {fmt(grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Actions ────────────────────────────────── */}
                <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-white/95 backdrop-blur border-t border-gray-200 flex items-center justify-between gap-3 z-10">
                    <a href={route('quotations.index')} className="btn">Cancel</a>
                    <div className="flex items-center gap-3">
                        {grandTotal > 0 && (
                            <span className="text-sm text-gray-600 font-medium hidden sm:inline">
                                Total: <span className="text-primary-700 font-bold tabular-nums">৳ {fmt(grandTotal)}</span>
                            </span>
                        )}
                        <button type="submit" disabled={processing} className="btn btn-primary px-6 py-2.5 text-sm font-semibold shadow-md shadow-primary-500/20">
                            {processing ? 'Creating…' : 'Create Quotation →'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Add Category modal */}
            <Modal open={categoryModal.open} onClose={() => setCategoryModal({ open: false, value: '' })}
                title="Add Category" size="sm">
                <form onSubmit={confirmAddCategory} className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                            Category name
                        </label>
                        <input
                            type="text"
                            autoFocus
                            className="form-input w-full text-sm"
                            placeholder="e.g. Civil Work, False Ceiling, Electrical…"
                            value={categoryModal.value}
                            onChange={e => setCategoryModal(s => ({ ...s, value: e.target.value }))}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Items added under this category will be grouped together in the BOQ.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setCategoryModal({ open: false, value: '' })} className="btn">
                            Cancel
                        </button>
                        <button type="submit" disabled={!categoryModal.value.trim()} className="btn btn-primary">
                            Add Category
                        </button>
                    </div>
                </form>
            </Modal>

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
