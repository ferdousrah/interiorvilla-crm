import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function WarehousesIndex({ warehouses }) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({ name: '', location: '', notes: '' });

    function openCreate() {
        reset();
        setEditing(null);
        setShowModal(true);
    }

    function openEdit(w) {
        setData({ name: w.name, location: w.location ?? '', notes: w.notes ?? '' });
        setEditing(w);
        setShowModal(true);
    }

    function submit(e) {
        e.preventDefault();
        if (editing) {
            put(route('inventory.warehouses.update', editing.id), { onSuccess: () => { setShowModal(false); reset(); } });
        } else {
            post(route('inventory.warehouses.store'), { onSuccess: () => { setShowModal(false); reset(); } });
        }
    }

    return (
        <AppLayout>
            <Head title="Warehouses" />
            <PageHeader title="Warehouses">
                <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> New Warehouse
                </button>
            </PageHeader>
            <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(warehouses ?? []).map(w => (
                        <div key={w.id} className="card p-4 flex items-start justify-between">
                            <div>
                                <h3 className="font-medium">{w.name}</h3>
                                {w.location && <p className="text-sm text-gray-500 mt-1">{w.location}</p>}
                                {w.notes && <p className="text-xs text-gray-400 mt-1">{w.notes}</p>}
                            </div>
                            <button onClick={() => openEdit(w)} className="text-gray-400 hover:text-yellow-600">
                                <PencilIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {(warehouses ?? []).length === 0 && (
                        <p className="col-span-3 text-center text-gray-400 py-8">No warehouses configured.</p>
                    )}
                </div>
            </div>

            <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Warehouse' : 'New Warehouse'} size="md">
                <form onSubmit={submit} className="p-4 sm:p-6 space-y-4">
                    <FormField label="Name" error={errors.name} required>
                        <input className="form-input" autoFocus value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Main Warehouse, Site Store" />
                    </FormField>
                    <FormField label="Location" error={errors.location}>
                        <input className="form-input" value={data.location} onChange={e => setData('location', e.target.value)} placeholder="e.g. Tejgaon, Dhaka" />
                    </FormField>
                    <FormField label="Notes" error={errors.notes}>
                        <textarea className="form-input" rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Optional internal note" />
                    </FormField>
                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Saving…' : editing ? 'Update Warehouse' : 'Create Warehouse'}
                        </button>
                        <button type="button" onClick={() => setShowModal(false)} className="btn">Cancel</button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
