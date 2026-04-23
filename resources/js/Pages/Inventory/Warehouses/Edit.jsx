import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

export default function WarehouseEdit({ warehouse }) {
    const { data, setData, put, processing, errors } = useForm({
        name: warehouse.name,
        location: warehouse.location ?? '',
        is_active: warehouse.is_active,
    });

    function submit(e) {
        e.preventDefault();
        put(route('inventory.warehouses.update', warehouse.id));
    }

    return (
        <AppLayout>
            <Head title={`Edit ${warehouse.name}`} />
            <PageHeader title={`Edit Warehouse: ${warehouse.name}`} back={route('inventory.warehouses.index')} />
            <div className="p-4 sm:p-6 max-w-lg">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <FormField label="Warehouse Name" error={errors.name} required>
                        <input className="form-input" value={data.name} onChange={e => setData('name', e.target.value)} />
                    </FormField>
                    <FormField label="Location" error={errors.location}>
                        <input className="form-input" value={data.location} onChange={e => setData('location', e.target.value)} />
                    </FormField>
                    <FormField label="Status" error={errors.is_active}>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded border-gray-300 text-primary-600"
                                checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} />
                            <span className="text-sm">Active</span>
                        </label>
                    </FormField>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>
                        <a href={route('inventory.warehouses.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
