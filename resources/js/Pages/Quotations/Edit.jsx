import { Head, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import MaterialPicker from '@/Components/MaterialPicker';
import { PlusIcon, TrashIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

const DEFAULT_CATEGORIES = [
    'Civil Work', 'False Ceiling', 'Flooring', 'Wall Treatment',
    'Electrical Work', 'HVAC / AC', 'Furniture (Custom)',
    'Loose Furniture', 'Curtains & Blinds', 'Painting & Finishing',
    'Plumbing', 'Decoration & Accessories', 'Miscellaneous',
];
const UNITS = ['sft', 'rft', 'pcs', 'set', 'ls', 'nos', 'kg', 'bag', 'box', 'mtr', 'rmt'];

function fmt(n) {
    return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function newItem(category = '') {
    return { material_id: '', category, description: '', unit: 'sft', quantity: '', unit_rate: '', _key: Math.random() };
}

export default function QuotationEdit({ quotation, clients, leads, projects, serviceCategories = {} }) {
    const { data, setData, put, processing, errors } = useForm({
        client_id:             quotation.client_id ?? '',
        lead_id:               quotation.lead_id ?? '',
        project_id:            quotation.project_id ?? '',
        service_group:         quotation.service_group ?? '',
        service_type:          quotation.service_type ?? '',
        subject:               quotation.subject ?? '',
        document_date:         quotation.document_date?.substring(0, 10) ?? '',
        valid_until:           quotation.valid_until?.substring(0, 10) ?? '',
        discount_type:         quotation.discount_type ?? 'percentage',
        discount_value:        quotation.discount_value ?? '',
        vat_pct:               quotation.vat_pct ?? '',
        transportation_amount: quotation.transportation_amount ?? '0',
        supervision_pct:       quotation.supervision_pct ?? '0',
        terms:                 quotation.terms ?? '',
        notes:                 quotation.notes ?? '',
        items: (quotation.items ?? []).map(i => ({
            material_id: '',
            category:    i.category,
            description: i.description,
            unit:        i.unit,
            quantity:    i.quantity,
            unit_rate:   i.unit_rate,
            _key:        Math.random(),
        })),
    });

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
            description:  mat.description || mat.name,
            unit:         mat.unit || items[idx].unit,
            unit_rate:    mat.default_rate != null ? String(mat.default_rate) : items[idx].unit_rate,
        };
        setData('items', items);
    }

    const serviceGroups = Object.keys(serviceCategories);
    const serviceTypes  = data.service_group ? (serviceCategories[data.service_group] ?? []) : [];

    function onServiceGroupChange(v) {
        setData('service_group', v);
        setData('service_type', '');
    }
    function onServiceTypeChange(v) {
        setData('service_type', v);
        if (v && (!data.subject || data.subject.startsWith('Financial Proposal for '))) {
            setData('subject', `Financial Proposal for ${v}`);
        }
    }

    const categories = useMemo(() => {
        const map = {};
        data.items.forEach((item, idx) => {
            const cat = item.category || 'Uncategorized';
            if (!map[cat]) map[cat] = [];
            map[cat].push({ ...item, _idx: idx });
        });
        return map;
    }, [data.items]);

    const subtotal = useMemo(() =>
        data.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_rate) || 0), 0),
        [data.items]
    );
    const discountAmount = useMemo(() => {
        const v = parseFloat(data.discount_value) || 0;
        return data.discount_type === 'percentage' ? subtotal * v / 100 : Math.min(v, subtotal);
    }, [subtotal, data.discount_type, data.discount_value]);
    const afterDiscount     = subtotal - discountAmount;
    const vatAmount         = afterDiscount * (parseFloat(data.vat_pct) || 0) / 100;
    const transport         = parseFloat(data.transportation_amount) || 0;
    const supervisionBase   = afterDiscount + transport;
    const supervisionAmount = supervisionBase * (parseFloat(data.supervision_pct) || 0) / 100;
    const grandTotal        = afterDiscount + transport + supervisionAmount + vatAmount;

    const categoryTotals = useMemo(() => {
        const map = {};
        data.items.forEach(item => {
            const cat = item.category || 'Uncategorized';
            map[cat] = (map[cat] || 0) + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_rate) || 0);
        });
        return map;
    }, [data.items]);

    function updateItem(idx, field, value) {
        const items = [...data.items];
        items[idx] = { ...items[idx], [field]: value };
        setData('items', items);
    }
    function addItem(category) { setData('items', [...data.items, newItem(category)]); }
    function removeItem(idx) { setData('items', data.items.filter((_, i) => i !== idx)); }
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
        put(route('quotations.update', quotation.id));
    }

    return (
        <AppLayout>
            <Head title={`Edit ${quotation.code}`} />
            <PageHeader title={`Edit: ${quotation.code}`} subtitle={quotation.subject} back={route('quotations.show', quotation.id)} />

            <form onSubmit={submit} className="p-4 sm:p-6 space-y-6 max-w-6xl">
                {/* Header */}
                <div className="card p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Quotation Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField label="Client (if already exists)" error={errors.client_id}>
                            <select className="form-input" value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                                <option value="">— Not a client yet —</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                            </select>
                        </FormField>
                        <FormField label="Linked Lead" error={errors.lead_id}>
                            <select className="form-input" value={data.lead_id} onChange={e => setData('lead_id', e.target.value)}>
                                <option value="">None</option>
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
                        <FormField label="Service Type" error={errors.service_type}>
                            <select className="form-input" value={data.service_type} onChange={e => onServiceTypeChange(e.target.value)} disabled={!data.service_group}>
                                <option value="">{data.service_group ? 'Select service…' : 'Pick a category first'}</option>
                                {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Subject" error={errors.subject} required>
                            <input className="form-input" value={data.subject} onChange={e => setData('subject', e.target.value)} />
                        </FormField>

                        <FormField label="Document Date" error={errors.document_date} required>
                            <input type="date" className="form-input" value={data.document_date} onChange={e => setData('document_date', e.target.value)} />
                        </FormField>
                        <FormField label="Valid Until" error={errors.valid_until}>
                            <input type="date" className="form-input" value={data.valid_until} onChange={e => setData('valid_until', e.target.value)} />
                        </FormField>
                        <FormField label="Internal Notes" error={errors.notes}>
                            <input className="form-input" value={data.notes} onChange={e => setData('notes', e.target.value)} />
                        </FormField>
                    </div>
                </div>

                {/* BOQ */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700">Bill of Quantities</h3>
                        <button type="button" onClick={openCategoryModal} className="btn btn-secondary text-sm flex items-center gap-1.5">
                            <PlusCircleIcon className="w-4 h-4" /> Add Category
                        </button>
                    </div>
                    <div className="space-y-6">
                        {Object.entries(categories).map(([cat, catItems]) => (
                            <div key={cat} className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                                        <span className="text-sm font-semibold text-gray-700">{cat}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-primary-700">{fmt(categoryTotals[cat] || 0)}</span>
                                        <button type="button" onClick={() => addItem(cat)} className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 font-medium">
                                            <PlusIcon className="w-3.5 h-3.5" /> Add Item
                                        </button>
                                    </div>
                                </div>
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
                                                        <textarea className="form-input text-xs w-full leading-snug" rows={2}
                                                            value={item.description}
                                                            onChange={e => updateItem(item._idx, 'description', e.target.value)}
                                                            placeholder="Pick an item above, or type a custom description"
                                                            required />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input className="form-input text-sm w-full font-medium" list="units-list" value={item.unit}
                                                            onChange={e => updateItem(item._idx, 'unit', e.target.value)} />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="number" min="0" step="0.01" className="form-input text-sm w-full text-right font-semibold tabular-nums"
                                                            value={item.quantity} onChange={e => updateItem(item._idx, 'quantity', e.target.value)} required />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="number" min="0" step="0.01" className="form-input text-sm w-full text-right font-semibold tabular-nums"
                                                            value={item.unit_rate} onChange={e => updateItem(item._idx, 'unit_rate', e.target.value)} required />
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
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-400 mr-1 self-center">Quick add:</span>
                        {DEFAULT_CATEGORIES.filter(c => !categories[c]).map(cat => (
                            <button key={cat} type="button" onClick={() => addItem(cat)}
                                className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
                                + {cat}
                            </button>
                        ))}
                    </div>
                    <datalist id="units-list">{UNITS.map(u => <option key={u} value={u} />)}</datalist>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="card p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Terms & Conditions</h3>
                        <textarea className="form-input text-sm" rows={8} value={data.terms} onChange={e => setData('terms', e.target.value)} />
                    </div>
                    <div className="card p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Cost Summary</h3>
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
                                <span className="font-semibold">{fmt(subtotal)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 w-24 flex-shrink-0">Discount</span>
                                <select className="form-input text-xs py-1 w-28" value={data.discount_type} onChange={e => setData('discount_type', e.target.value)}>
                                    <option value="percentage">%</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                                <input type="number" min="0" step="0.01" className="form-input text-xs py-1 w-24 text-right"
                                    value={data.discount_value} onChange={e => setData('discount_value', e.target.value)} placeholder="0" />
                                {discountAmount > 0 && <span className="text-xs text-red-500 ml-auto">- {fmt(discountAmount)}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 w-24 flex-shrink-0">Transportation</span>
                                <input type="number" min="0" step="0.01" className="form-input text-xs py-1 w-40 text-right"
                                    value={data.transportation_amount}
                                    onChange={e => setData('transportation_amount', e.target.value)} placeholder="0" />
                                {transport > 0 && <span className="text-xs text-gray-500 ml-auto">+ {fmt(transport)}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 w-24 flex-shrink-0">Supervision</span>
                                <div className="flex items-center gap-1">
                                    <input type="number" min="0" max="100" step="0.5" className="form-input text-xs py-1 w-20 text-right"
                                        value={data.supervision_pct}
                                        onChange={e => setData('supervision_pct', e.target.value)} placeholder="10" />
                                    <span className="text-xs text-gray-400">%</span>
                                </div>
                                {supervisionAmount > 0 && <span className="text-xs text-gray-500 ml-auto">+ {fmt(supervisionAmount)}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 w-24 flex-shrink-0">VAT / Tax</span>
                                <div className="flex items-center gap-1">
                                    <input type="number" min="0" max="100" step="0.5" className="form-input text-xs py-1 w-20 text-right"
                                        value={data.vat_pct} onChange={e => setData('vat_pct', e.target.value)} placeholder="0" />
                                    <span className="text-xs text-gray-400">%</span>
                                </div>
                                {vatAmount > 0 && <span className="text-xs text-gray-500 ml-auto">+ {fmt(vatAmount)}</span>}
                            </div>
                            <div className="flex justify-between pt-3 border-t-2 border-gray-200">
                                <span className="font-bold text-gray-800">Grand Total</span>
                                <span className="text-xl font-bold text-primary-700">BDT {fmt(grandTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pb-6">
                    <button type="submit" disabled={processing} className="btn btn-primary">
                        {processing ? 'Saving…' : 'Save Changes'}
                    </button>
                    <a href={route('quotations.show', quotation.id)} className="btn">Cancel</a>
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
        </AppLayout>
    );
}
