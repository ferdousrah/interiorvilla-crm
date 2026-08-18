import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Menu } from '@headlessui/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import FormField from '@/Components/FormField';
import {
    PlusIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon,
    StarIcon, XMarkIcon, PhotoIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const PROJECT_TYPES = ['residential', 'commercial', 'office', 'showroom', 'restaurant', 'other'];

const emptyProject = {
    title: '', type: 'residential', location: '', area_sqft: '', year: '',
    description: '', is_featured: false, sort_order: 0,
};

export default function CompanyProfile({ content, stats, services, projects, ceo, coverPhotos, clients }) {
    /* ── Notable clients ───────────────────────── */
    const [newClient, setNewClient] = useState({ name: '', logo: null });
    const [addingClient, setAddingClient] = useState(false);

    function addClient() {
        if (!newClient.name.trim()) return;
        router.post(route('settings.company-profile.clients.store'), newClient, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setAddingClient(true),
            onFinish: () => setAddingClient(false),
            onSuccess: () => setNewClient({ name: '', logo: null }),
        });
    }
    function deleteClient(client) {
        if (confirm(`Remove "${client.name}" from the clients page?`)) {
            router.delete(route('settings.company-profile.clients.destroy', client.id), { preserveScroll: true });
        }
    }

    /* ── Content / stats / services form ───────── */
    const form = useForm({ content, stats, services, ceo_name: ceo?.name ?? '', ceo_title: ceo?.title ?? 'CEO' });

    function uploadCoverPhoto(variant, file) {
        if (!file) return;
        router.post(route('settings.company-profile.cover-photo'), { photo: file, variant }, { forceFormData: true, preserveScroll: true });
    }
    function removeCoverPhoto(variant) {
        if (confirm('Remove this cover photo?')) {
            router.delete(route('settings.company-profile.cover-photo.remove'), { data: { variant }, preserveScroll: true });
        }
    }

    function uploadCeoPhoto(file) {
        if (!file) return;
        router.post(route('settings.company-profile.ceo-photo'), { photo: file }, { forceFormData: true, preserveScroll: true });
    }
    function removeCeoPhoto() {
        if (confirm('Remove the CEO photo?')) {
            router.delete(route('settings.company-profile.ceo-photo.remove'), { preserveScroll: true });
        }
    }

    function saveContent(e) {
        e.preventDefault();
        form.put(route('settings.company-profile.update'), { preserveScroll: true });
    }

    function setContentField(key, value) {
        form.setData('content', { ...form.data.content, [key]: value });
    }
    function setRow(listKey, index, field, value) {
        const list = [...form.data[listKey]];
        list[index] = { ...list[index], [field]: value };
        form.setData(listKey, list);
    }
    function addRow(listKey, row, max) {
        if (form.data[listKey].length >= max) return;
        form.setData(listKey, [...form.data[listKey], row]);
    }
    function removeRow(listKey, index) {
        form.setData(listKey, form.data[listKey].filter((_, i) => i !== index));
    }

    /* ── Portfolio project modal ───────────────── */
    const [modal, setModal] = useState({ open: false, project: null });
    const [projectData, setProjectData] = useState(emptyProject);
    const [keptPhotos, setKeptPhotos] = useState([]);
    const [newPhotos, setNewPhotos] = useState([]);
    const [saving, setSaving] = useState(false);
    const [projectErrors, setProjectErrors] = useState({});

    function openProject(project = null) {
        setModal({ open: true, project });
        setProjectData(project ? {
            title: project.title ?? '', type: project.type ?? 'residential',
            location: project.location ?? '', area_sqft: project.area_sqft ?? '',
            year: project.year ?? '', description: project.description ?? '',
            is_featured: !!project.is_featured, sort_order: project.sort_order ?? 0,
        } : emptyProject);
        setKeptPhotos(project?.photos ?? []);
        setNewPhotos([]);
        setProjectErrors({});
    }
    function closeProject() {
        newPhotos.forEach(p => URL.revokeObjectURL(p.url));
        setModal({ open: false, project: null });
    }

    function addFiles(fileList) {
        const files = Array.from(fileList).map(file => ({ file, url: URL.createObjectURL(file) }));
        setNewPhotos(prev => [...prev, ...files].slice(0, 6));
    }

    function submitProject(e) {
        e.preventDefault();
        const editing = modal.project;
        const payload = {
            ...projectData,
            is_featured: projectData.is_featured ? 1 : 0,
            photos: newPhotos.map(p => p.file),
            ...(editing ? { kept_photos: keptPhotos, _method: 'put' } : {}),
        };
        router.post(
            editing
                ? route('settings.company-profile.projects.update', editing.id)
                : route('settings.company-profile.projects.store'),
            payload,
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
                onSuccess: () => closeProject(),
                onError: errors => setProjectErrors(errors),
            },
        );
    }

    function deleteProject(project) {
        if (confirm(`Remove "${project.title}" from the portfolio? Its photos will be deleted.`)) {
            router.delete(route('settings.company-profile.projects.destroy', project.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout>
            <Head title="Company Profile" />
            <PageHeader title="Company Profile" subtitle="Content and portfolio for the profile PDF sent to clients">
                <Menu as="div" className="relative">
                    <Menu.Button className="btn btn-primary flex items-center gap-2 text-sm">
                        <ArrowDownTrayIcon className="w-4 h-4" /> Download PDF <ChevronDownIcon className="w-3.5 h-3.5" />
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 focus:outline-none">
                        {[
                            { label: 'Full Profile', params: {} },
                            { label: 'Residential Only', params: { category: 'residential' } },
                            { label: 'Commercial Only', params: { category: 'commercial' } },
                        ].map(opt => (
                            <Menu.Item key={opt.label}>
                                {({ active }) => (
                                    <a href={route('settings.company-profile.pdf', opt.params)}
                                        className={`block px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-50' : ''}`}>
                                        {opt.label}
                                    </a>
                                )}
                            </Menu.Item>
                        ))}
                    </Menu.Items>
                </Menu>
            </PageHeader>

            <div className="p-4 sm:p-6 space-y-6 max-w-5xl">

                {/* ── Profile content ─────────────── */}
                <form onSubmit={saveContent} className="space-y-6">
                    <div className="card p-5 space-y-4">
                        <h3 className="font-semibold text-gray-900">Cover &amp; About</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FormField label="Cover headline" required error={form.errors['content.profile_headline']}
                                hint="Use a line break to split into two lines">
                                <textarea rows={2} className="form-input" value={form.data.content.profile_headline}
                                    onChange={e => setContentField('profile_headline', e.target.value)} />
                            </FormField>
                            <FormField label="Cover intro" error={form.errors['content.profile_intro']}>
                                <textarea rows={2} className="form-input" value={form.data.content.profile_intro}
                                    onChange={e => setContentField('profile_intro', e.target.value)} />
                            </FormField>
                        </div>
                        <FormField label="About us" error={form.errors['content.profile_about']}
                            hint="Separate paragraphs with a blank line">
                            <textarea rows={6} className="form-input" value={form.data.content.profile_about}
                                onChange={e => setContentField('profile_about', e.target.value)} />
                        </FormField>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FormField label="Our mission" error={form.errors['content.profile_mission']}>
                                <textarea rows={3} className="form-input" value={form.data.content.profile_mission}
                                    onChange={e => setContentField('profile_mission', e.target.value)} />
                            </FormField>
                            <FormField label="Our promise" error={form.errors['content.profile_promise']}>
                                <textarea rows={3} className="form-input" value={form.data.content.profile_promise}
                                    onChange={e => setContentField('profile_promise', e.target.value)} />
                            </FormField>
                        </div>
                        <FormField label="Back-cover closing line" error={form.errors['content.profile_closing']}>
                            <input type="text" className="form-input" value={form.data.content.profile_closing}
                                onChange={e => setContentField('profile_closing', e.target.value)} />
                        </FormField>
                        <FormField label="Cover photos"
                            hint="One per PDF variant. Residential/Commercial fall back to the Full Profile photo, then to the featured project's photo.">
                            <div className="grid sm:grid-cols-3 gap-4">
                                {[
                                    { variant: 'full', label: 'Full Profile' },
                                    { variant: 'residential', label: 'Residential' },
                                    { variant: 'commercial', label: 'Commercial' },
                                ].map(({ variant, label }) => (
                                    <div key={variant}>
                                        <p className="text-xs font-medium text-gray-600 mb-1.5">{label}</p>
                                        <div className="h-28 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                                            {coverPhotos?.[variant]
                                                ? <img src={coverPhotos[variant]} alt={`${label} cover`} className="w-full h-full object-cover" />
                                                : <PhotoIcon className="w-8 h-8 text-gray-300" />}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <label className="btn btn-secondary text-xs cursor-pointer">
                                                {coverPhotos?.[variant] ? 'Change' : 'Upload'}
                                                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                                                    onChange={e => { uploadCoverPhoto(variant, e.target.files[0]); e.target.value = ''; }} />
                                            </label>
                                            {coverPhotos?.[variant] && (
                                                <button type="button" onClick={() => removeCoverPhoto(variant)} className="text-xs text-red-500 hover:underline">Remove</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FormField>
                        <p className="text-xs text-gray-400">Company name, logo, phone, email and address come from Settings → General.</p>
                    </div>

                    <div className="card p-5 space-y-4">
                        <h3 className="font-semibold text-gray-900">Message from the CEO</h3>
                        <div className="flex items-start gap-5">
                            <div className="shrink-0">
                                <div className="w-28 h-36 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                                    {ceo?.photo
                                        ? <img src={ceo.photo} alt="CEO" className="w-full h-full object-cover" />
                                        : <PhotoIcon className="w-8 h-8 text-gray-300" />}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <label className="btn btn-secondary text-xs cursor-pointer">
                                        {ceo?.photo ? 'Change' : 'Upload'}
                                        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                                            onChange={e => { uploadCeoPhoto(e.target.files[0]); e.target.value = ''; }} />
                                    </label>
                                    {ceo?.photo && (
                                        <button type="button" onClick={removeCeoPhoto} className="text-xs text-red-500 hover:underline">Remove</button>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Portrait photo</p>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <FormField label="CEO name" error={form.errors.ceo_name}>
                                        <input type="text" className="form-input" value={form.data.ceo_name}
                                            onChange={e => form.setData('ceo_name', e.target.value)} />
                                    </FormField>
                                    <FormField label="Designation" error={form.errors.ceo_title}>
                                        <input type="text" placeholder="CEO" className="form-input" value={form.data.ceo_title}
                                            onChange={e => form.setData('ceo_title', e.target.value)} />
                                    </FormField>
                                </div>
                                <FormField label="Message" error={form.errors['content.profile_ceo_message']}
                                    hint="Separate paragraphs with a blank line. The signature image comes from Settings → General.">
                                    <textarea rows={5} className="form-input" value={form.data.content.profile_ceo_message}
                                        onChange={e => setContentField('profile_ceo_message', e.target.value)} />
                                </FormField>
                            </div>
                        </div>
                    </div>

                    <div className="card p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Stats</h3>
                            <button type="button" onClick={() => addRow('stats', { value: '', label: '' }, 6)}
                                className="btn btn-secondary text-xs flex items-center gap-1">
                                <PlusIcon className="w-3.5 h-3.5" /> Add stat
                            </button>
                        </div>
                        {form.data.stats.map((stat, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <input type="text" placeholder="120+" className="form-input w-28 text-sm" value={stat.value}
                                    onChange={e => setRow('stats', i, 'value', e.target.value)} />
                                <input type="text" placeholder="Projects Delivered" className="form-input flex-1 text-sm" value={stat.label}
                                    onChange={e => setRow('stats', i, 'label', e.target.value)} />
                                <button type="button" onClick={() => removeRow('stats', i)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {form.errors.stats && <p className="form-error">{form.errors.stats}</p>}
                    </div>

                    <div className="card p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Services</h3>
                            <button type="button" onClick={() => addRow('services', { name: '', description: '' }, 12)}
                                className="btn btn-secondary text-xs flex items-center gap-1">
                                <PlusIcon className="w-3.5 h-3.5" /> Add service
                            </button>
                        </div>
                        {form.data.services.map((service, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <span className="text-sm text-gray-400 font-medium w-6 pt-2.5">{String(i + 1).padStart(2, '0')}</span>
                                <div className="flex-1 space-y-1.5">
                                    <input type="text" placeholder="Service name" className="form-input text-sm" value={service.name}
                                        onChange={e => setRow('services', i, 'name', e.target.value)} />
                                    <input type="text" placeholder="One-line description" className="form-input text-sm" value={service.description ?? ''}
                                        onChange={e => setRow('services', i, 'description', e.target.value)} />
                                </div>
                                <button type="button" onClick={() => removeRow('services', i)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded mt-2">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {form.errors.services && <p className="form-error">{form.errors.services}</p>}
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={form.processing} className="btn btn-primary text-sm">
                            {form.processing ? 'Saving…' : 'Save Content'}
                        </button>
                    </div>
                </form>

                {/* ── Portfolio ───────────────────── */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-semibold text-gray-900">Portfolio Projects</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                The featured project gets a full page in the PDF; the rest appear in a grid, 4 per page. Landscape photos look best.
                            </p>
                        </div>
                        <button onClick={() => openProject()} className="btn btn-primary flex items-center gap-2 text-sm">
                            <PlusIcon className="w-4 h-4" /> Add Project
                        </button>
                    </div>

                    {projects.length === 0 && (
                        <p className="text-center text-gray-400 py-10 text-sm">No portfolio projects yet. Add your best work.</p>
                    )}

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map(project => (
                            <div key={project.id} className="border border-gray-200 rounded-lg overflow-hidden group">
                                <div className="h-36 bg-gray-100 flex items-center justify-center">
                                    {project.photos?.length
                                        ? <img src={`/storage/${project.photos[0]}`} alt={project.title} className="w-full h-full object-cover" />
                                        : <PhotoIcon className="w-8 h-8 text-gray-300" />}
                                </div>
                                <div className="p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-medium text-gray-900 text-sm">{project.title}</p>
                                        {project.is_featured && <StarSolidIcon className="w-4 h-4 text-amber-400 shrink-0" title="Featured" />}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                                        {project.type}
                                        {project.area_sqft ? ` · ${Number(project.area_sqft).toLocaleString()} sft` : ''}
                                        {project.year ? ` · ${project.year}` : ''}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <button onClick={() => openProject(project)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded">
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteProject(project)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                        <span className="text-[10px] text-gray-400 ml-auto">{project.photos?.length ?? 0} photo{(project.photos?.length ?? 0) === 1 ? '' : 's'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Notable clients ─────────────── */}
                <div className="card p-5">
                    <div className="mb-4">
                        <h3 className="font-semibold text-gray-900">Our Clients</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Shown on the "Who we've worked with" page of the PDF. Logo is optional — without one, the name appears in a box. The page is skipped if this list is empty.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-3 mb-4">
                        <div className="w-64">
                            <input type="text" placeholder="Client / company name" className="form-input text-sm" value={newClient.name}
                                onChange={e => setNewClient(c => ({ ...c, name: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addClient(); } }} />
                        </div>
                        <label className="btn btn-secondary text-xs cursor-pointer">
                            {newClient.logo ? newClient.logo.name : 'Logo (optional)'}
                            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
                                onChange={e => { setNewClient(c => ({ ...c, logo: e.target.files[0] ?? null })); e.target.value = ''; }} />
                        </label>
                        <button type="button" onClick={addClient} disabled={addingClient || !newClient.name.trim()}
                            className="btn btn-primary text-sm flex items-center gap-1.5">
                            <PlusIcon className="w-4 h-4" /> {addingClient ? 'Adding…' : 'Add Client'}
                        </button>
                    </div>

                    {(clients ?? []).length === 0 && (
                        <p className="text-center text-gray-400 py-6 text-sm">No clients added yet.</p>
                    )}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {(clients ?? []).map(client => (
                            <div key={client.id} className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2">
                                <div className="w-10 h-10 rounded bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                    {client.logo
                                        ? <img src={client.logo} alt={client.name} className="max-w-full max-h-full object-contain" />
                                        : <span className="text-sm font-semibold text-gray-400">{client.name.charAt(0)}</span>}
                                </div>
                                <p className="text-sm text-gray-800 flex-1 truncate">{client.name}</p>
                                <button onClick={() => deleteClient(client)} className="p-1 text-gray-300 hover:text-red-500 rounded">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Project modal ─────────────────── */}
            <Modal open={modal.open} onClose={closeProject} size="lg" title={modal.project ? 'Edit Project' : 'Add Portfolio Project'}>
                <form onSubmit={submitProject} className="p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField label="Title" required error={projectErrors.title}>
                            <input type="text" className="form-input" value={projectData.title}
                                onChange={e => setProjectData(d => ({ ...d, title: e.target.value }))} />
                        </FormField>
                        <FormField label="Type" required error={projectErrors.type}>
                            <select className="form-input" value={projectData.type}
                                onChange={e => setProjectData(d => ({ ...d, type: e.target.value }))}>
                                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Location" error={projectErrors.location}>
                            <input type="text" placeholder="Bashundhara R/A, Dhaka" className="form-input" value={projectData.location}
                                onChange={e => setProjectData(d => ({ ...d, location: e.target.value }))} />
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Area (sft)" error={projectErrors.area_sqft}>
                                <input type="number" min="0" className="form-input" value={projectData.area_sqft}
                                    onChange={e => setProjectData(d => ({ ...d, area_sqft: e.target.value }))} />
                            </FormField>
                            <FormField label="Year" error={projectErrors.year}>
                                <input type="text" placeholder="2025" className="form-input" value={projectData.year}
                                    onChange={e => setProjectData(d => ({ ...d, year: e.target.value }))} />
                            </FormField>
                        </div>
                    </div>

                    <FormField label="Description" error={projectErrors.description}
                        hint="Shown on the featured page — 2-3 sentences about scope and result">
                        <textarea rows={3} className="form-input" value={projectData.description}
                            onChange={e => setProjectData(d => ({ ...d, description: e.target.value }))} />
                    </FormField>

                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-primary-600" checked={projectData.is_featured}
                            onChange={e => setProjectData(d => ({ ...d, is_featured: e.target.checked }))} />
                        <StarIcon className="w-4 h-4 text-amber-400" /> Featured project (gets a full page in the PDF)
                    </label>

                    <FormField label="Photos" error={projectErrors.photos || projectErrors['photos.0']}
                        hint="First photo is the main one. Up to 6, landscape orientation recommended.">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {keptPhotos.map(path => (
                                <div key={path} className="relative w-24 h-16 rounded overflow-hidden border border-gray-200">
                                    <img src={`/storage/${path}`} className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => setKeptPhotos(p => p.filter(x => x !== path))}
                                        className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded p-0.5">
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {newPhotos.map((p, i) => (
                                <div key={p.url} className="relative w-24 h-16 rounded overflow-hidden border border-emerald-300">
                                    <img src={p.url} className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => setNewPhotos(prev => prev.filter((_, j) => j !== i))}
                                        className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded p-0.5">
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="text-sm"
                            onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
                    </FormField>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={closeProject} className="btn btn-secondary text-sm">Cancel</button>
                        <button type="submit" disabled={saving} className="btn btn-primary text-sm">
                            {saving ? 'Saving…' : (modal.project ? 'Save Changes' : 'Add Project')}
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
