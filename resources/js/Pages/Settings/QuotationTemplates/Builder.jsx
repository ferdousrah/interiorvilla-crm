import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import {
    PlusIcon, TrashIcon, Bars3Icon, ChevronUpIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline';

function newItem() {
    return { description: '', unit: 'sft', default_quantity: '', default_rate: '', material_id: '', _key: Math.random() };
}
function newSection() {
    return { name: '', items: [newItem()], _key: Math.random() };
}

function fmt(n) {
    return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function QuotationTemplateBuilder({ template, serviceCategories = {}, materials = [] }) {
    const isEdit = !!template;

    const initialSections = template?.sections?.length
        ? template.sections.map(s => ({
              name: s.name,
              _key: Math.random(),
              items: (s.items ?? []).map(i => ({
                  description:      i.description ?? '',
                  unit:             i.unit ?? 'sft',
                  default_quantity: i.default_quantity ?? '',
                  default_rate:     i.default_rate ?? '',
                  material_id:      i.material_id ?? '',
                  _key:             Math.random(),
              })),
          }))
        : [newSection()];

    const { data, setData, post, put, processing, errors } = useForm({
        name:                    template?.name ?? '',
        service_group:           template?.service_group ?? '',
        service_type:            template?.service_type ?? '',
        description:             template?.description ?? '',
        default_terms:           template?.default_terms ?? '',
        default_supervision_pct: template?.default_supervision_pct ?? '10',
        is_active:               template?.is_active ?? true,
        sort_order:              template?.sort_order ?? 0,
        sections:                initialSections,
    });

    const groups = Object.keys(serviceCategories);
    const serviceTypes = data.service_group ? (serviceCategories[data.service_group] ?? []) : [];

    function onGroupChange(v) {
        setData('service_group', v);
        setData('service_type', '');
    }

    // Totals preview
    const grandPreview = useMemo(() => {
        let subtotal = 0;
        data.sections.forEach(s => {
            s.items.forEach(i => {
                subtotal += (parseFloat(i.default_quantity) || 1) * (parseFloat(i.default_rate) || 0);
            });
        });
        const supervision = subtotal * (parseFloat(data.default_supervision_pct) || 0) / 100;
        return { subtotal, supervision, grand: subtotal + supervision };
    }, [data.sections, data.default_supervision_pct]);

    // --- Section helpers ---
    function addSection() {
        setData('sections', [...data.sections, newSection()]);
    }
    function removeSection(idx) {
        if (!confirm('Remove this section and all its items?')) return;
        setData('sections', data.sections.filter((_, i) => i !== idx));
    }
    function updateSection(idx, field, value) {
        const next = [...data.sections];
        next[idx] = { ...next[idx], [field]: value };
        setData('sections', next);
    }
    function moveSection(idx, dir) {
        const next = [...data.sections];
        const target = idx + dir;
        if (target < 0 || target >= next.length) return;
        [next[idx], next[target]] = [next[target], next[idx]];
        setData('sections', next);
    }

    // --- Item helpers ---
    function addItem(sIdx) {
        const next = [...data.sections];
        next[sIdx] = { ...next[sIdx], items: [...next[sIdx].items, newItem()] };
        setData('sections', next);
    }
    function removeItem(sIdx, iIdx) {
        const next = [...data.sections];
        next[sIdx] = { ...next[sIdx], items: next[sIdx].items.filter((_, i) => i !== iIdx) };
        setData('sections', next);
    }
    function updateItem(sIdx, iIdx, field, value) {
        const next = [...data.sections];
        const items = [...next[sIdx].items];
        items[iIdx] = { ...items[iIdx], [field]: value };
        next[sIdx] = { ...next[sIdx], items };
        setData('sections', next);
    }
    function applyMaterial(sIdx, iIdx, materialId) {
        const material = materials.find(m => m.id === materialId);
        const next = [...data.sections];
        const items = [...next[sIdx].items];
        items[iIdx] = {
            ...items[iIdx],
            material_id:   materialId,
            description:   material ? material.name : items[iIdx].description,
            unit:          material ? material.unit : items[iIdx].unit,
            default_rate:  material ? material.default_rate : items[iIdx].default_rate,
        };
        next[sIdx] = { ...next[sIdx], items };
        setData('sections', next);
    }

    function submit(e) {
        e.preventDefault();
        if (isEdit) {
            put(route('settings.quotation-templates.update', template.id));
        } else {
            post(route('settings.quotation-templates.store'));
        }
    }

    return (
        <AppLayout>
            <Head title={isEdit ? `Edit: ${template.name}` : 'New Template'} />
            <PageHeader title={isEdit ? `Edit: ${template.name}` : 'New Quotation Template'}
                subtitle="Define reusable sections and items for a service type"
                back={route('settings.quotation-templates.index')} />

            <form onSubmit={submit} className="p-4 sm:p-6 space-y-5 max-w-6xl">

                {/* Metadata */}
                <div className="card p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Template Info</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField label="Template Name" error={errors.name} required>
                            <input className="form-input" value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="e.g. Corporate Office Fit-Out (Standard)" />
                        </FormField>
                        <FormField label="Service Category" error={errors.service_group} hint="Shown when matching in Quotation form">
                            <select className="form-input" value={data.service_group} onChange={e => onGroupChange(e.target.value)}>
                                <option value="">Any category</option>
                                {groups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Service Type" error={errors.service_type}>
                            <select className="form-input" value={data.service_type}
                                onChange={e => setData('service_type', e.target.value)}
                                disabled={!data.service_group}>
                                <option value="">Any type</option>
                                {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </FormField>

                        <div className="sm:col-span-2 lg:col-span-3">
                            <FormField label="Description (internal)" error={errors.description}>
                                <textarea className="form-input" rows={2} value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    placeholder="What kind of project is this template for?" />
                            </FormField>
                        </div>

                        <FormField label="Default Supervision %" error={errors.default_supervision_pct}>
                            <input type="number" min="0" max="100" step="0.5" className="form-input"
                                value={data.default_supervision_pct}
                                onChange={e => setData('default_supervision_pct', e.target.value)} />
                        </FormField>
                        <FormField label="Sort Order" error={errors.sort_order}>
                            <input type="number" min="0" className="form-input" value={data.sort_order}
                                onChange={e => setData('sort_order', parseInt(e.target.value) || 0)} />
                        </FormField>
                        <FormField label="Status">
                            <label className="inline-flex items-center gap-2 mt-2 cursor-pointer">
                                <input type="checkbox" className="rounded"
                                    checked={data.is_active}
                                    onChange={e => setData('is_active', e.target.checked)} />
                                <span className="text-sm text-gray-700">Active (available in Quotation form)</span>
                            </label>
                        </FormField>
                    </div>
                </div>

                {/* Sections builder */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700">Sections &amp; Items</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Each section becomes a category in the quotation (e.g. "Partition, Paneling &amp; Door Works"). Items become line items.
                            </p>
                        </div>
                        <button type="button" onClick={addSection} className="btn btn-secondary text-sm flex items-center gap-1.5">
                            <PlusIcon className="w-4 h-4" /> Add Section
                        </button>
                    </div>

                    <div className="space-y-6">
                        {data.sections.map((section, sIdx) => (
                            <div key={section._key} className="border border-gray-200 rounded-xl overflow-hidden">
                                {/* Section header */}
                                <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                                    <Bars3Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <input
                                        className="form-input text-sm flex-1 font-semibold"
                                        value={section.name}
                                        onChange={e => updateSection(sIdx, 'name', e.target.value)}
                                        placeholder="Section name e.g. Partition, Paneling & Door Works"
                                        required
                                    />
                                    <div className="flex items-center gap-1">
                                        <button type="button" onClick={() => moveSection(sIdx, -1)} disabled={sIdx === 0}
                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Move up">
                                            <ChevronUpIcon className="w-4 h-4" />
                                        </button>
                                        <button type="button" onClick={() => moveSection(sIdx, 1)} disabled={sIdx === data.sections.length - 1}
                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Move down">
                                            <ChevronDownIcon className="w-4 h-4" />
                                        </button>
                                        <button type="button" onClick={() => removeSection(sIdx)}
                                            className="p-1 text-gray-300 hover:text-red-500" title="Delete section">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="p-3 space-y-2">
                                    {section.items.map((item, iIdx) => (
                                        <div key={item._key} className="grid grid-cols-12 gap-2 items-start border border-gray-100 rounded-lg p-2 hover:border-gray-200">
                                            <div className="col-span-12 sm:col-span-5">
                                                <label className="text-[10px] uppercase tracking-wide text-gray-400">Description</label>
                                                <textarea className="form-input text-xs leading-snug" rows={2}
                                                    value={item.description}
                                                    onChange={e => updateItem(sIdx, iIdx, 'description', e.target.value)}
                                                    placeholder="Full spec — e.g. Supply fitting and fixing of 12mm Patterned glass…"
                                                    required />
                                            </div>
                                            <div className="col-span-6 sm:col-span-2">
                                                <label className="text-[10px] uppercase tracking-wide text-gray-400">Link Material (opt.)</label>
                                                <select className="form-input text-xs"
                                                    value={item.material_id}
                                                    onChange={e => applyMaterial(sIdx, iIdx, e.target.value)}>
                                                    <option value="">— none —</option>
                                                    {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-3 sm:col-span-1">
                                                <label className="text-[10px] uppercase tracking-wide text-gray-400">Unit</label>
                                                <input className="form-input text-xs" value={item.unit}
                                                    onChange={e => updateItem(sIdx, iIdx, 'unit', e.target.value)}
                                                    placeholder="sft" required />
                                            </div>
                                            <div className="col-span-3 sm:col-span-2">
                                                <label className="text-[10px] uppercase tracking-wide text-gray-400">Default Qty</label>
                                                <input type="number" min="0" step="0.01" className="form-input text-xs text-right"
                                                    value={item.default_quantity}
                                                    onChange={e => updateItem(sIdx, iIdx, 'default_quantity', e.target.value)}
                                                    placeholder="optional" />
                                            </div>
                                            <div className="col-span-10 sm:col-span-1">
                                                <label className="text-[10px] uppercase tracking-wide text-gray-400">Rate</label>
                                                <input type="number" min="0" step="0.01" className="form-input text-xs text-right"
                                                    value={item.default_rate}
                                                    onChange={e => updateItem(sIdx, iIdx, 'default_rate', e.target.value)}
                                                    placeholder="0" required />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1 flex items-end justify-end pb-1">
                                                <button type="button" onClick={() => removeItem(sIdx, iIdx)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500" title="Remove item">
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button type="button" onClick={() => addItem(sIdx)}
                                        className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 font-medium mt-1">
                                        <PlusIcon className="w-3.5 h-3.5" /> Add Item
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Default Terms */}
                <div className="card p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Default Terms &amp; Conditions</h3>
                    <p className="text-xs text-gray-400 mb-2">Prefilled into the quotation when this template is applied. User can still edit per-quotation.</p>
                    <textarea className="form-input text-sm" rows={6}
                        value={data.default_terms}
                        onChange={e => setData('default_terms', e.target.value)}
                        placeholder="1. Execution time 60 days&#10;2. Payment 50% advance…" />
                </div>

                {/* Preview */}
                <div className="card p-6 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Preview</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Sections</p>
                            <p className="text-xl font-bold">{data.sections.length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Items</p>
                            <p className="text-xl font-bold">{data.sections.reduce((s, sec) => s + sec.items.length, 0)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Subtotal (est.)</p>
                            <p className="text-xl font-bold text-gray-800">{fmt(grandPreview.subtotal)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">With {data.default_supervision_pct || 0}% supervision</p>
                            <p className="text-xl font-bold text-primary-700">BDT {fmt(grandPreview.grand)}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pb-6">
                    <button type="submit" disabled={processing} className="btn btn-primary">
                        {processing ? 'Saving…' : (isEdit ? 'Update Template' : 'Create Template')}
                    </button>
                    <Link href={route('settings.quotation-templates.index')} className="btn">Cancel</Link>
                </div>
            </form>
        </AppLayout>
    );
}
