import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { PlusIcon, TrashIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

const CATEGORIES = [
    { key: 'material',      label: 'Materials',      icon: '🧱' },
    { key: 'labor',         label: 'Labor',          icon: '👷' },
    { key: 'subcontractor', label: 'Subcontractor',  icon: '🏗️' },
    { key: 'transport',     label: 'Transport',      icon: '🚛' },
    { key: 'overhead',      label: 'Overhead',       icon: '🏢' },
    { key: 'contingency',   label: 'Contingency',    icon: '🛡️' },
    { key: 'other',         label: 'Other',          icon: '📦' },
];

const CAT_COLORS = {
    material: 'bg-blue-500', labor: 'bg-amber-500', subcontractor: 'bg-violet-500',
    transport: 'bg-teal-500', overhead: 'bg-slate-500', contingency: 'bg-rose-500', other: 'bg-gray-500',
};

const UNITS = ['sft', 'rft', 'pcs', 'set', 'ls', 'nos', 'kg', 'bag', 'box', 'mtr', 'rmt', 'day', 'hr', 'trip'];

function fmt(n) { return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function newItem(cat) { return { material_id: '', category: cat, description: '', unit: 'ls', quantity: '1', estimated_rate: '', actual_total: '', _key: Math.random() }; }

export default function CostEstimationCreate({ clients = [], leads = [], projects = [], prefill = {}, serviceCategories = {} }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        service_group: '',
        service_type: '',
        lead_id: prefill?.lead_id ?? '',
        client_id: prefill?.client_id ?? '',
        project_id: prefill?.project_id ?? '',
        markup_pct: '20',
        notes: '',
        items: [newItem('material'), newItem('labor')],
    });

    const [availableMaterials, setAvailableMaterials] = useState([]);
    const [materialsLoading, setMaterialsLoading] = useState(false);

    const serviceTypes = data.service_group ? (serviceCategories[data.service_group] ?? []) : [];

    // Auto-fill title & load filtered materials when service type changes
    useEffect(() => {
        if (data.service_group && data.service_type) {
            if (!data.title || data.title.startsWith('Cost Estimation —')) {
                setData('title', `Cost Estimation — ${data.service_type}`);
            }
            setMaterialsLoading(true);
            axios.get('/api/materials', { params: { group: data.service_group, type: data.service_type } })
                .then(r => setAvailableMaterials(r.data || []))
                .catch(() => setAvailableMaterials([]))
                .finally(() => setMaterialsLoading(false));
        } else {
            setAvailableMaterials([]);
        }
    }, [data.service_group, data.service_type]);

    const grouped = useMemo(() => {
        const m = {};
        data.items.forEach((item, idx) => {
            const c = item.category || 'other';
            if (!m[c]) m[c] = [];
            m[c].push({ ...item, _idx: idx });
        });
        return m;
    }, [data.items]);

    const totalEstimated = useMemo(() =>
        data.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.estimated_rate) || 0), 0), [data.items]);

    const markupPct = parseFloat(data.markup_pct) || 0;
    const markupAmount = totalEstimated * markupPct / 100;
    const suggestedQuote = totalEstimated + markupAmount;

    const catTotals = useMemo(() => {
        const m = {};
        data.items.forEach(i => {
            const c = i.category || 'other';
            m[c] = (m[c] || 0) + (parseFloat(i.quantity) || 0) * (parseFloat(i.estimated_rate) || 0);
        });
        return m;
    }, [data.items]);

    function updateItem(idx, field, val) {
        const next = [...data.items];
        next[idx] = { ...next[idx], [field]: val };
        setData('items', next);
    }

    function selectMaterialForItem(idx, materialId) {
        const mat = availableMaterials.find(m => m.id === materialId);
        if (!mat) {
            updateItem(idx, 'material_id', '');
            return;
        }
        const next = [...data.items];
        next[idx] = {
            ...next[idx],
            material_id: mat.id,
            category: mat.category,
            description: mat.name,
            unit: mat.unit,
            estimated_rate: mat.default_rate,
        };
        setData('items', next);
    }

    function addItem(cat) { setData('items', [...data.items, newItem(cat)]); }
    function removeItem(idx) { setData('items', data.items.filter((_, i) => i !== idx)); }
    function addCategory() { const n = prompt('Category name:'); if (n?.trim()) setData('items', [...data.items, newItem(n.trim())]); }

    function submit(e) { e.preventDefault(); post(route('cost-estimations.store')); }

    return (
        <AppLayout>
            <Head title="New Cost Estimation" />
            <PageHeader title="New Cost Estimation" subtitle="Calculate your internal project costs" back={route('cost-estimations.index')} />

            <form onSubmit={submit} className="p-4 sm:p-6 space-y-6 max-w-6xl">
                {/* Header */}
                <div className="card p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Estimation Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField label="Service Category" error={errors.service_group} required>
                            <select className="form-input" value={data.service_group}
                                onChange={e => { setData('service_group', e.target.value); setData('service_type', ''); }}>
                                <option value="">Select category…</option>
                                {Object.keys(serviceCategories).map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Service Type" error={errors.service_type} required>
                            <select className="form-input" value={data.service_type}
                                onChange={e => setData('service_type', e.target.value)} disabled={!data.service_group}>
                                <option value="">{data.service_group ? 'Select service…' : 'Select category first'}</option>
                                {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Title (auto-filled)" error={errors.title} required>
                            <input className="form-input" value={data.title} onChange={e => setData('title', e.target.value)}
                                placeholder="e.g. 3BHK Apartment — Gulshan" />
                        </FormField>
                        <FormField label="Lead" error={errors.lead_id}>
                            <select className="form-input" value={data.lead_id} onChange={e => setData('lead_id', e.target.value)}>
                                <option value="">None</option>
                                {leads.map(l => <option key={l.id} value={l.id}>{l.name} · {l.phone}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Client" error={errors.client_id}>
                            <select className="form-input" value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                                <option value="">None</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                            </select>
                        </FormField>
                        <FormField label="Project" error={errors.project_id}>
                            <select className="form-input" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                                <option value="">None</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                            </select>
                        </FormField>
                        <FormField label="Profit Markup %" error={errors.markup_pct}>
                            <input type="number" min="0" max="200" step="0.5" className="form-input" value={data.markup_pct}
                                onChange={e => setData('markup_pct', e.target.value)} />
                        </FormField>
                        <div className="sm:col-span-2">
                            <FormField label="Internal Notes" error={errors.notes}>
                                <input className="form-input" value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Notes…" />
                            </FormField>
                        </div>
                    </div>
                    {data.service_type && (
                        <div className="mt-4 text-xs text-gray-400">
                            {materialsLoading ? 'Loading materials…' : `${availableMaterials.length} materials available for this service type`}
                        </div>
                    )}
                </div>

                {/* Cost Items */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700">Cost Breakdown</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Select materials from the catalog or add custom items.</p>
                        </div>
                        <button type="button" onClick={addCategory} className="btn btn-secondary text-sm flex items-center gap-1.5">
                            <PlusCircleIcon className="w-4 h-4" /> Custom Category
                        </button>
                    </div>

                    <div className="space-y-5">
                        {Object.entries(grouped).map(([cat, catItems]) => {
                            const cfg = CATEGORIES.find(c => c.key === cat) ?? { label: cat, icon: '📦' };
                            return (
                                <div key={cat} className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-2 h-6 rounded-full ${CAT_COLORS[cat] ?? 'bg-gray-400'}`} />
                                            <span className="text-lg">{cfg.icon}</span>
                                            <span className="text-sm font-bold text-gray-700">{cfg.label}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-gray-700">{fmt(catTotals[cat] || 0)}৳</span>
                                            <button type="button" onClick={() => addItem(cat)} className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 font-medium">
                                                <PlusIcon className="w-3.5 h-3.5" /> Add Item
                                            </button>
                                        </div>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-xs text-gray-400 uppercase bg-white border-b border-gray-100">
                                                <th className="px-3 py-2 text-left w-48">Select Material</th>
                                                <th className="px-3 py-2 text-left">Description</th>
                                                <th className="px-3 py-2 text-left w-24">Unit</th>
                                                <th className="px-3 py-2 text-right w-24">Qty</th>
                                                <th className="px-3 py-2 text-right w-32">Rate (৳)</th>
                                                <th className="px-3 py-2 text-right w-32">Total (৳)</th>
                                                <th className="px-3 py-2 w-8" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {catItems.map(item => {
                                                const total = (parseFloat(item.quantity) || 0) * (parseFloat(item.estimated_rate) || 0);
                                                const categoryMaterials = availableMaterials.filter(m => m.category === cat);
                                                return (
                                                    <tr key={item._key} className="hover:bg-gray-50/50 group">
                                                        <td className="px-3 py-1.5">
                                                            <select className="form-input text-xs w-full"
                                                                value={item.material_id || ''}
                                                                onChange={e => selectMaterialForItem(item._idx, e.target.value)}
                                                                disabled={!data.service_type || categoryMaterials.length === 0}>
                                                                <option value="">
                                                                    {!data.service_type ? 'Pick service type first' :
                                                                     categoryMaterials.length === 0 ? 'No materials' : '— Custom —'}
                                                                </option>
                                                                {categoryMaterials.map(m => (
                                                                    <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            <input className="form-input text-xs w-full" value={item.description}
                                                                onChange={e => updateItem(item._idx, 'description', e.target.value)}
                                                                placeholder="Item description" required />
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            <input className="form-input text-xs w-full" list="ce-units" value={item.unit}
                                                                onChange={e => updateItem(item._idx, 'unit', e.target.value)} />
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            <input type="number" min="0" step="0.01" className="form-input text-xs text-right w-full"
                                                                value={item.quantity} onChange={e => updateItem(item._idx, 'quantity', e.target.value)} required />
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            <input type="number" min="0" step="0.01" className="form-input text-xs text-right w-full"
                                                                value={item.estimated_rate} onChange={e => updateItem(item._idx, 'estimated_rate', e.target.value)} required />
                                                        </td>
                                                        <td className="px-3 py-1.5 text-right font-medium text-gray-700 text-xs">
                                                            {total > 0 ? fmt(total) : '—'}
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            <button type="button" onClick={() => removeItem(item._idx)}
                                                                className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                                                <TrashIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-400 self-center mr-1">Quick add:</span>
                        {CATEGORIES.filter(c => !grouped[c.key]).map(cat => (
                            <button key={cat.key} type="button" onClick={() => addItem(cat.key)}
                                className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-primary-400 hover:text-primary-600">
                                {cat.icon} {cat.label}
                            </button>
                        ))}
                    </div>
                    <datalist id="ce-units">{UNITS.map(u => <option key={u} value={u} />)}</datalist>
                </div>

                {/* Summary */}
                <div className="card p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Cost Summary & Markup</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            {CATEGORIES.map(cat => {
                                const t = catTotals[cat.key] ?? 0;
                                if (t === 0 && !grouped[cat.key]) return null;
                                return (
                                    <div key={cat.key} className="flex justify-between text-sm border-b border-gray-50 py-1">
                                        <span className="text-gray-600">{cat.icon} {cat.label}</span>
                                        <span className="font-medium text-gray-700">{fmt(t)}৳</span>
                                    </div>
                                );
                            })}
                            <div className="flex justify-between text-sm font-bold pt-2 border-t-2 border-gray-200">
                                <span>Total Cost</span>
                                <span>{fmt(totalEstimated)}৳</span>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-primary-50/30 rounded-xl p-5 space-y-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">Pricing Preview</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Total Estimated Cost</span>
                                    <span className="font-semibold">{fmt(totalEstimated)}৳</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">(+) Markup ({data.markup_pct || 0}%)</span>
                                    <span className="text-green-600 font-medium">+ {fmt(markupAmount)}৳</span>
                                </div>
                                <div className="flex justify-between pt-3 border-t-2 border-gray-300">
                                    <span className="font-bold text-gray-800">Suggested Client Quote</span>
                                    <span className="text-2xl font-bold text-primary-700">{fmt(suggestedQuote)}৳</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pb-6">
                    <button type="submit" disabled={processing} className="btn btn-primary">
                        {processing ? 'Saving…' : 'Save Cost Estimation'}
                    </button>
                    <a href={route('cost-estimations.index')} className="btn">Cancel</a>
                </div>
            </form>
        </AppLayout>
    );
}
