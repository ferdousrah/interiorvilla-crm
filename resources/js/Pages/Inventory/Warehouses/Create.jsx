import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

export default function WarehouseCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        location: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('inventory.warehouses.store'));
    }

    return (
        <AppLayout>
            <Head title="New Warehouse" />
            <PageHeader title="New Warehouse" back={route('inventory.warehouses.index')} />
            <div className="p-4 sm:p-6 max-w-lg">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <FormField label="Warehouse Name" error={errors.name} required>
                        <input className="form-input" value={data.name} onChange={e => setData('name', e.target.value)} />
                    </FormField>
                    <FormField label="Location" error={errors.location}>
                        <input className="form-input" value={data.location} onChange={e => setData('location', e.target.value)} placeholder="Address or description" />
                    </FormField>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Creating…' : 'Create Warehouse'}
                        </button>
                        <a href={route('inventory.warehouses.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
