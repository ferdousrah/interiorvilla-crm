import { Head, router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import FormField from '@/Components/FormField';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, Cog6ToothIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function MaterialsIndex(props) {
    const materials         = props.materials || {};
    const serviceCategories = props.serviceCategories || {};
    const filters           = props.filters || {};
    const items = materials.data || [];

    // DB-backed lookups (refreshed via router.reload when user adds new ones)
    const availableUnits      = props.availableUnits      || [];
    const availableCategories = props.availableCategories || [];

    const [ui, setUi] = useState({
        modalOpen: false,
        editMaterial: null,
        search: filters.search || '',
        category: filters.category || '',
    });
    const setUiField = (k, v) => setUi(s => ({ ...s, [k]: v }));

    function applyFilters(overrides = {}) {
        const params = { search: ui.search, category: ui.category, ...overrides };
        Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
        router.get(route('settings.materials.index'), params, { preserveState: true, replace: true });
    }

    function openNew() {
        setUi(s => ({ ...s, modalOpen: true, editMaterial: null }));
    }
    function openEdit(mat) {
        setUi(s => ({ ...s, modalOpen: true, editMaterial: mat }));
    }
    function closeModal() {
        setUi(s => ({ ...s, modalOpen: false, editMaterial: null }));
    }
    function deleteMaterial(mat) {
        if (confirm(`Delete "${mat.name}"?`)) {
            router.delete(route('settings.materials.destroy', mat.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout>
            <Head title="Materials" />
            <PageHeader title="Materials Catalog" subtitle={`${materials.total ?? items.length} items`}>
                <button onClick={openNew} className="btn btn-primary flex items-center gap-2 text-sm">
                    <PlusIcon className="w-4 h-4" /> New Material
                </button>
            </PageHeader>

            <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50">
                <form onSubmit={e => { e.preventDefault(); applyFilters(); }} className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                        <input type="search" placeholder="Search materials…" className="form-input pl-8 text-sm py-2 w-60"
                            value={ui.search} onChange={e => setUiField('search', e.target.value)} />
                    </div>
                    <select className="form-input text-sm py-2" value={ui.category}
                        onChange={e => { setUiField('category', e.target.value); applyFilters({ category: e.target.value }); }}>
                        <option value="">All Categories</option>
                        {availableCategories.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
                    </select>
                    <button type="submit" className="btn btn-secondary text-sm">Search</button>
                </form>
            </div>

            <div className="p-4 sm:p-6">
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Default Rate</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Types</th>
                                <th className="px-4 py-3 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {items.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No materials yet. Add one to get started.</td></tr>
                            )}
                            {items.map(m => {
                                const cat = availableCategories.find(c => c.slug === m.category);
                                return (
                                    <tr key={m.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3"><span className="text-sm">{cat?.icon ?? '📦'} {cat?.name ?? m.category}</span></td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{m.name}</p>
                                            {m.description && <p className="text-xs text-gray-400 truncate max-w-xs">{m.description}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{m.unit}</td>
                                        <td className="px-4 py-3 text-right font-medium text-primary-600">{Number(m.default_rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}৳</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(m.service_types ?? []).slice(0, 3).map(s => (
                                                    <span key={s.id} className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                                                        {s.service_type}
                                                    </span>
                                                ))}
                                                {(m.service_types ?? []).length > 3 && (
                                                    <span className="text-[10px] text-gray-400">+{m.service_types.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center gap-1 justify-end">
                                                <button onClick={() => openEdit(m)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded">
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => deleteMaterial(m)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <MaterialModal
                key={ui.editMaterial?.id ?? 'new'}
                open={ui.modalOpen}
                material={ui.editMaterial}
                serviceCategories={serviceCategories}
                availableUnits={availableUnits}
                availableCategories={availableCategories}
                onClose={closeModal}
            />
        </AppLayout>
    );
}

function MaterialModal({ open, material, serviceCategories, availableUnits, availableCategories, onClose }) {
    const isEdit = !!material;
    const form = useForm({
        category:     material?.category || (availableCategories[0]?.slug ?? 'material'),
        name:         material?.name || '',
        unit:         material?.unit || (availableUnits[0]?.code ?? 'ls'),
        default_rate: material?.default_rate || '',
        description:  material?.description || '',
        is_active:    material ? !!material.is_active : true,
        service_types: (material?.service_types ?? []).map(s => ({ group: s.service_group, type: s.service_type })),
    });

    const [savingLookup, setSavingLookup] = useState(false);
    const [showUnitManager, setShowUnitManager] = useState(false);

    function addServiceType(group, type) {
        const exists = form.data.service_types.some(s => s.group === group && s.type === type);
        if (!exists) form.setData('service_types', [...form.data.service_types, { group, type }]);
    }
    function removeServiceType(idx) {
        form.setData('service_types', form.data.service_types.filter((_, i) => i !== idx));
    }
    function submit(e) {
        e.preventDefault();
        if (isEdit) form.put(route('settings.materials.update', material.id), { onSuccess: onClose });
        else form.post(route('settings.materials.store'), { onSuccess: onClose });
    }

    async function addNewUnit() {
        const code = prompt('Unit code (short, e.g. "pair", "carton"):');
        if (!code?.trim()) return;
        const name = prompt('Full name (optional, e.g. "Pair"):') ?? null;
        try {
            setSavingLookup(true);
            const { data: unit } = await axios.post(route('api.material-units.store'), {
                code: code.trim(),
                name: name?.trim() || null,
            });
            form.setData('unit', unit.code);
            // Refresh the page props so the new unit shows up in the dropdown permanently
            router.reload({ only: ['availableUnits'], preserveScroll: true });
        } catch (err) {
            alert(err.response?.data?.message ?? 'Failed to add unit.');
        } finally {
            setSavingLookup(false);
        }
    }

    async function addNewCategory() {
        const name = prompt('Category name (e.g. "Equipment Rental", "3D Rendering"):');
        if (!name?.trim()) return;
        const icon = prompt('Icon emoji (optional, e.g. "🔧"):') ?? '📦';
        try {
            setSavingLookup(true);
            const { data: cat } = await axios.post(route('api.material-categories.store'), {
                name: name.trim(),
                icon: icon.trim() || '📦',
            });
            form.setData('category', cat.slug);
            router.reload({ only: ['availableCategories'], preserveScroll: true });
        } catch (err) {
            alert(err.response?.data?.message ?? 'Failed to add category.');
        } finally {
            setSavingLookup(false);
        }
    }

    return (
        <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Material' : 'New Material'} size="lg">
            <form onSubmit={submit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Category" error={form.errors.category} required>
                        <div className="flex gap-2">
                            <select className="form-input flex-1"
                                value={form.data.category}
                                onChange={e => form.setData('category', e.target.value)}>
                                {availableCategories.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
                                {form.data.category && !availableCategories.some(c => c.slug === form.data.category) && (
                                    <option value={form.data.category}>{form.data.category} (legacy)</option>
                                )}
                            </select>
                            <button type="button" onClick={addNewCategory} disabled={savingLookup}
                                className="btn text-sm flex items-center gap-1 px-2" title="Add a new category">
                                <PlusIcon className="w-4 h-4" /> New
                            </button>
                        </div>
                    </FormField>
                    <FormField label="Name" error={form.errors.name} required>
                        <input className="form-input" value={form.data.name} onChange={e => form.setData('name', e.target.value)}
                            placeholder="e.g. Plywood 18mm" />
                    </FormField>
                    <FormField label="Unit" error={form.errors.unit} required>
                        <div className="flex gap-2">
                            <select className="form-input flex-1"
                                value={form.data.unit}
                                onChange={e => form.setData('unit', e.target.value)}>
                                <option value="">Select unit…</option>
                                {availableUnits.map(u => <option key={u.code} value={u.code}>{u.name ? `${u.name} (${u.code})` : u.code}</option>)}
                                {form.data.unit && !availableUnits.some(u => u.code === form.data.unit) && (
                                    <option value={form.data.unit}>{form.data.unit} (custom)</option>
                                )}
                            </select>
                            <button type="button" onClick={addNewUnit} disabled={savingLookup}
                                className="btn text-sm flex items-center gap-1 px-2" title="Add a new unit">
                                <PlusIcon className="w-4 h-4" /> New
                            </button>
                            <button type="button" onClick={() => setShowUnitManager(true)}
                                className="btn text-sm flex items-center gap-1 px-2" title="Edit / delete existing units">
                                <Cog6ToothIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </FormField>
                    <FormField label="Default Rate (৳)" error={form.errors.default_rate}>
                        <input type="number" min="0" step="0.01" className="form-input" value={form.data.default_rate}
                            onChange={e => form.setData('default_rate', e.target.value)} />
                    </FormField>
                </div>

                <FormField label="Description" error={form.errors.description}>
                    <textarea className="form-input" rows={2} value={form.data.description}
                        onChange={e => form.setData('description', e.target.value)} />
                </FormField>

                <div>
                    <label className="form-label">Available For Service Types <span className="text-gray-400 font-normal">(pick multiple)</span></label>
                    <p className="text-[10px] text-gray-400 mb-2">This material will show up in Cost Estimations using these service types.</p>

                    {form.data.service_types.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3 p-3 bg-primary-50 rounded-lg border border-primary-100">
                            {form.data.service_types.map((s, i) => (
                                <span key={i} className="flex items-center gap-1 text-xs bg-white text-primary-700 border border-primary-200 rounded-full px-2.5 py-1">
                                    <span className="text-[9px] text-primary-400 uppercase">{s.group}</span>
                                    {s.type}
                                    <button type="button" onClick={() => removeServiceType(i)} className="text-primary-400 hover:text-red-500 ml-1">×</button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {Object.entries(serviceCategories).map(([group, types]) => (
                            <div key={group}>
                                <p className="text-xs font-semibold text-gray-700 mb-1.5">{group}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {types.map(t => {
                                        const picked = form.data.service_types.some(s => s.group === group && s.type === t);
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => picked ? removeServiceType(form.data.service_types.findIndex(s => s.group === group && s.type === t)) : addServiceType(group, t)}
                                                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                                                    picked
                                                        ? 'bg-primary-100 border-primary-300 text-primary-700 font-medium'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-600'
                                                }`}
                                            >
                                                {picked ? '✓ ' : '+ '}{t}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.data.is_active} onChange={e => form.setData('is_active', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600" />
                    <span className="text-sm text-gray-600">Active (available for selection)</span>
                </label>

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <button type="submit" disabled={form.processing} className="btn btn-primary">
                        {form.processing ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Material')}
                    </button>
                    <button type="button" onClick={onClose} className="btn">Cancel</button>
                </div>
            </form>

            <UnitManagerModal
                open={showUnitManager}
                units={availableUnits}
                onClose={() => setShowUnitManager(false)}
            />
        </Modal>
    );
}

function UnitManagerModal({ open, units, onClose }) {
    const [editingId, setEditingId] = useState(null);
    const [editCode, setEditCode] = useState('');
    const [editName, setEditName] = useState('');
    const [busy, setBusy] = useState(false);

    function startEdit(u) {
        setEditingId(u.id);
        setEditCode(u.code);
        setEditName(u.name ?? '');
    }
    function cancelEdit() {
        setEditingId(null);
        setEditCode('');
        setEditName('');
    }
    async function saveEdit(u) {
        if (!editCode.trim()) return;
        try {
            setBusy(true);
            await axios.patch(route('api.material-units.update', u.id), {
                code: editCode.trim(),
                name: editName.trim() || null,
            });
            cancelEdit();
            router.reload({ only: ['availableUnits', 'materials'], preserveScroll: true });
        } catch (err) {
            alert(err.response?.data?.message ?? 'Failed to update unit.');
        } finally {
            setBusy(false);
        }
    }
    async function removeUnit(u) {
        if (!confirm(`Delete unit "${u.code}"?`)) return;
        try {
            setBusy(true);
            await axios.delete(route('api.material-units.destroy', u.id));
            router.reload({ only: ['availableUnits'], preserveScroll: true });
        } catch (err) {
            alert(err.response?.data?.message ?? 'Failed to delete unit.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal open={open} onClose={onClose} title="Manage Units" size="md">
            <div className="p-5 space-y-2 max-h-[70vh] overflow-y-auto">
                {units.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">No units yet.</p>
                )}
                {units.map(u => (
                    <div key={u.id} className="flex items-center gap-2 p-2 border border-gray-100 rounded">
                        {editingId === u.id ? (
                            <>
                                <input className="form-input text-sm flex-1" value={editCode}
                                    onChange={e => setEditCode(e.target.value)} placeholder="code (e.g. sft)" />
                                <input className="form-input text-sm flex-1" value={editName}
                                    onChange={e => setEditName(e.target.value)} placeholder="display name (optional)" />
                                <button onClick={() => saveEdit(u)} disabled={busy}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Save">
                                    <CheckIcon className="w-4 h-4" />
                                </button>
                                <button onClick={cancelEdit} disabled={busy}
                                    className="p-1.5 text-gray-400 hover:bg-gray-100 rounded" title="Cancel">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="flex-1">
                                    <span className="font-medium text-gray-900 text-sm">{u.name || u.code}</span>
                                    <span className="text-xs text-gray-400 ml-2">({u.code})</span>
                                </div>
                                <button onClick={() => startEdit(u)} disabled={busy}
                                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded" title="Rename">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => removeUnit(u)} disabled={busy}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded" title="Delete">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>
            <div className="flex justify-end px-5 py-3 border-t border-gray-100">
                <button onClick={onClose} className="btn text-sm">Done</button>
            </div>
        </Modal>
    );
}
