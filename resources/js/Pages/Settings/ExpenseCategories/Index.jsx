import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import FormField from '@/Components/FormField';
import {
    PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, TagIcon,
} from '@heroicons/react/24/outline';

export default function ExpenseCategoriesIndex({ categories, filters = {} }) {
    const [ui, setUi] = useState({
        modalOpen: false,
        editCategory: null,
        search: filters.search ?? '',
    });
    const setUiField = (k, v) => setUi(s => ({ ...s, [k]: v }));

    const form = useForm({
        name: '',
        description: '',
        is_active: true,
        sort_order: 0,
    });

    function openCreate() {
        form.reset();
        form.clearErrors();
        form.setData({ name: '', description: '', is_active: true, sort_order: 0 });
        setUi(s => ({ ...s, modalOpen: true, editCategory: null }));
    }

    function openEdit(cat) {
        form.reset();
        form.clearErrors();
        form.setData({
            name: cat.name,
            description: cat.description ?? '',
            is_active: cat.is_active,
            sort_order: cat.sort_order ?? 0,
        });
        setUi(s => ({ ...s, modalOpen: true, editCategory: cat }));
    }

    function closeModal() {
        setUi(s => ({ ...s, modalOpen: false, editCategory: null }));
    }

    function submit(e) {
        e.preventDefault();
        if (ui.editCategory) {
            form.put(route('settings.expense-categories.update', ui.editCategory.id), {
                preserveScroll: true,
                onSuccess: closeModal,
            });
        } else {
            form.post(route('settings.expense-categories.store'), {
                preserveScroll: true,
                onSuccess: closeModal,
            });
        }
    }

    function destroy(cat) {
        if (!confirm(`Delete category "${cat.name}"? Existing expenses referencing it will keep their records but lose the label.`)) return;
        router.delete(route('settings.expense-categories.destroy', cat.id), { preserveScroll: true });
    }

    function applySearch(e) {
        e.preventDefault();
        router.get(route('settings.expense-categories.index'), { search: ui.search }, {
            preserveState: true, replace: true,
        });
    }

    const rows = categories.data ?? [];

    return (
        <AppLayout>
            <Head title="Expense Categories" />
            <PageHeader title="Expense Categories" subtitle="Categorize expenses for reports and budgeting">
                <button onClick={openCreate} className="btn btn-primary flex items-center gap-2 text-sm">
                    <PlusIcon className="w-4 h-4" /> Add Category
                </button>
            </PageHeader>

            <div className="p-4 sm:p-6 space-y-4">
                <form onSubmit={applySearch} className="card p-3 flex gap-2">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text"
                            className="form-input pl-9 text-sm"
                            placeholder="Search categories…"
                            value={ui.search}
                            onChange={e => setUiField('search', e.target.value)} />
                    </div>
                    <button type="submit" className="btn text-sm">Search</button>
                </form>

                <div className="card overflow-hidden">
                    <table className="min-w-full text-sm divide-y divide-gray-100">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Name</th>
                                <th className="px-4 py-3 text-left">Description</th>
                                <th className="px-4 py-3 text-center w-24">Sort</th>
                                <th className="px-4 py-3 text-center w-24">Active</th>
                                <th className="px-4 py-3 text-right w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.length === 0 && (
                                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                                    <TagIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                    No categories yet. Click <strong>Add Category</strong> to create the first one.
                                </td></tr>
                            )}
                            {rows.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-800">
                                        {c.name}
                                        <p className="text-[11px] text-gray-400 font-normal mt-0.5">{c.slug}</p>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{c.description || <span className="text-gray-300">—</span>}</td>
                                    <td className="px-4 py-3 text-center text-gray-500">{c.sort_order}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {c.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-primary-600" title="Edit">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => destroy(c)} className="text-gray-400 hover:text-red-600" title="Delete">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {categories.links && categories.links.length > 3 && (
                    <div className="flex justify-center gap-1">
                        {categories.links.map((l, i) => (
                            l.url
                                ? <Link key={i} href={l.url}
                                      className={`px-3 py-1.5 text-xs rounded-md border ${l.active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'}`}
                                      dangerouslySetInnerHTML={{ __html: l.label }} />
                                : <span key={i}
                                      className="px-3 py-1.5 text-xs rounded-md border bg-gray-50 text-gray-400 border-gray-200"
                                      dangerouslySetInnerHTML={{ __html: l.label }} />
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit modal */}
            <Modal open={ui.modalOpen} onClose={closeModal}
                title={ui.editCategory ? 'Edit Category' : 'Add Category'} size="md">
                <form onSubmit={submit} className="p-4 sm:p-6 space-y-4">
                    <FormField label="Name" required error={form.errors.name}>
                        <input type="text" className="form-input"
                            value={form.data.name}
                            onChange={e => form.setData('name', e.target.value)}
                            placeholder="e.g. Rent, Utilities, Office Supplies" autoFocus />
                    </FormField>

                    <FormField label="Description (optional)" error={form.errors.description}>
                        <textarea className="form-input" rows={2}
                            value={form.data.description}
                            onChange={e => form.setData('description', e.target.value)}
                            placeholder="Brief note about what goes in this category" />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Sort Order" hint="Lower numbers appear first" error={form.errors.sort_order}>
                            <input type="number" min="0" className="form-input"
                                value={form.data.sort_order}
                                onChange={e => form.setData('sort_order', parseInt(e.target.value) || 0)} />
                        </FormField>
                        <FormField label="Status">
                            <label className="inline-flex items-center gap-2 mt-2 cursor-pointer">
                                <input type="checkbox" className="rounded"
                                    checked={form.data.is_active}
                                    onChange={e => form.setData('is_active', e.target.checked)} />
                                <span className="text-sm text-gray-700">Active (available in expense form)</span>
                            </label>
                        </FormField>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={form.processing} className="btn btn-primary">
                            {form.processing ? 'Saving…' : (ui.editCategory ? 'Update Category' : 'Add Category')}
                        </button>
                        <button type="button" onClick={closeModal} className="btn">Cancel</button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
