import { useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import Modal from '@/Components/Modal';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Add / rename / delete vendor categories from the vendor form.
 * Renames cascade to existing vendors server-side; deletes are blocked
 * while any vendor still uses the category.
 */
export default function VendorCategoryManager({ open, onClose, categories = [] }) {
    const [newName, setNewName] = useState('');
    const [editing, setEditing] = useState(null); // { id, name }
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    function refresh() {
        router.reload({ only: ['categories'] });
    }
    function fail(e) {
        setError(e.response?.data?.message ?? Object.values(e.response?.data?.errors ?? {}).flat()[0] ?? 'Something went wrong.');
    }

    async function add() {
        if (!newName.trim() || busy) return;
        setBusy(true); setError('');
        try {
            await axios.post(route('api.vendor-categories.store'), { name: newName.trim() });
            setNewName('');
            refresh();
        } catch (e) { fail(e); } finally { setBusy(false); }
    }

    async function saveRename() {
        if (!editing?.name.trim() || busy) return;
        setBusy(true); setError('');
        try {
            await axios.patch(route('api.vendor-categories.update', editing.id), { name: editing.name.trim() });
            setEditing(null);
            refresh();
        } catch (e) { fail(e); } finally { setBusy(false); }
    }

    async function remove(cat) {
        if (busy || !confirm(`Delete category "${cat.name}"?`)) return;
        setBusy(true); setError('');
        try {
            await axios.delete(route('api.vendor-categories.destroy', cat.id));
            refresh();
        } catch (e) { fail(e); } finally { setBusy(false); }
    }

    return (
        <Modal open={open} onClose={onClose} size="sm" title="Manage Vendor Categories">
            <div className="p-6 space-y-4">
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>}

                <div className="flex gap-2">
                    <input type="text" placeholder="New category name" className="form-input text-sm flex-1" value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
                    <button type="button" onClick={add} disabled={busy || !newName.trim()} className="btn btn-primary text-sm flex items-center gap-1">
                        <PlusIcon className="w-4 h-4" /> Add
                    </button>
                </div>

                <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg max-h-72 overflow-y-auto">
                    {categories.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No categories yet.</p>}
                    {categories.map(cat => (
                        <div key={cat.id} className="flex items-center gap-2 px-3 py-2">
                            {editing?.id === cat.id ? (
                                <>
                                    <input type="text" className="form-input text-sm flex-1 py-1" value={editing.name} autoFocus
                                        onChange={e => setEditing(s => ({ ...s, name: e.target.value }))}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveRename(); } }} />
                                    <button type="button" onClick={saveRename} disabled={busy} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                                        <CheckIcon className="w-4 h-4" />
                                    </button>
                                    <button type="button" onClick={() => setEditing(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded">
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="text-sm text-gray-800 flex-1 capitalize">{cat.name}</span>
                                    <button type="button" onClick={() => { setEditing({ id: cat.id, name: cat.name }); setError(''); }}
                                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded" title="Rename (updates existing vendors too)">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button type="button" onClick={() => remove(cat)} disabled={busy}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded" title="Delete">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                <p className="text-xs text-gray-400">Renaming a category also updates all vendors using it. A category in use cannot be deleted.</p>

                <div className="flex justify-end">
                    <button type="button" onClick={onClose} className="btn text-sm">Done</button>
                </div>
            </div>
        </Modal>
    );
}
