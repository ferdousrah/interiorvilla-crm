import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import {
    PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon,
    DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

function fmtBDT(n) {
    return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function QuotationTemplatesIndex({ templates = [], serviceCategories = {}, filters = {} }) {
    const [ui, setUi] = useState({
        search: filters.search ?? '',
        service_group: filters.service_group ?? '',
    });

    function applyFilter(e) {
        e?.preventDefault();
        router.get(route('settings.quotation-templates.index'), ui, { preserveState: true, replace: true });
    }

    function destroy(t) {
        if (!confirm(`Delete template "${t.name}"? This cannot be undone.`)) return;
        router.delete(route('settings.quotation-templates.destroy', t.id), { preserveScroll: true });
    }

    const groups = Object.keys(serviceCategories);

    return (
        <AppLayout>
            <Head title="Quotation Templates" />
            <PageHeader title="Quotation Templates" subtitle="Pre-built section + item lists used to start a quotation in seconds">
                <Link href={route('settings.quotation-templates.create')} className="btn btn-primary flex items-center gap-2 text-sm">
                    <PlusIcon className="w-4 h-4" /> New Template
                </Link>
            </PageHeader>

            <div className="p-4 sm:p-6 space-y-4">
                <form onSubmit={applyFilter} className="card p-3 flex gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" className="form-input pl-9 text-sm"
                            placeholder="Search templates by name…"
                            value={ui.search}
                            onChange={e => setUi(s => ({ ...s, search: e.target.value }))} />
                    </div>
                    <select className="form-input text-sm min-w-[180px]"
                        value={ui.service_group}
                        onChange={e => { const v = e.target.value; setUi(s => ({ ...s, service_group: v })); router.get(route('settings.quotation-templates.index'), { ...ui, service_group: v }, { preserveState: true, replace: true }); }}>
                        <option value="">All Categories</option>
                        {groups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <button type="submit" className="btn text-sm">Search</button>
                </form>

                {templates.length === 0 && (
                    <div className="card p-12 text-center">
                        <DocumentDuplicateIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500 font-medium">No templates yet</p>
                        <p className="text-xs text-gray-400 mt-1 mb-4">
                            Build a reusable template for common service types (e.g. "Corporate Office Fit-Out", "3BHK Apartment Interior")
                        </p>
                        <Link href={route('settings.quotation-templates.create')} className="btn btn-primary text-sm">
                            Create first template
                        </Link>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(t => (
                        <div key={t.id} className="card p-4 flex flex-col hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{t.name}</h3>
                                    {(t.service_group || t.service_type) && (
                                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                            {t.service_group}{t.service_group && t.service_type ? ' → ' : ''}{t.service_type}
                                        </p>
                                    )}
                                </div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {t.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {t.description && (
                                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.description}</p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-600 border-t border-gray-100 pt-2.5 mt-auto">
                                <span>{t.sections_count ?? t.sections?.length ?? 0} sections</span>
                                <span>·</span>
                                <span>{t.item_count ?? 0} items</span>
                                {(t.total_value > 0) && (
                                    <span className="ml-auto font-semibold text-primary-700">~ BDT {fmtBDT(t.total_value)}</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                                <Link href={route('settings.quotation-templates.edit', t.id)}
                                    className="btn text-xs flex-1 flex items-center justify-center gap-1">
                                    <PencilIcon className="w-3.5 h-3.5" /> Edit
                                </Link>
                                <button onClick={() => destroy(t)}
                                    className="btn text-xs text-red-600 hover:bg-red-50">
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
