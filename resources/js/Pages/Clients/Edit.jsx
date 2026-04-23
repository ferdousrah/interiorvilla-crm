import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import MapPicker from '@/Components/MapPicker';

export default function ClientEdit({ client }) {
    const { data, setData, put, processing, errors } = useForm({
        name: client.name, phone: client.phone, email: client.email ?? '',
        address: client.address ?? '', city: client.city ?? '', notes: client.notes ?? '',
        latitude: client.latitude ?? '', longitude: client.longitude ?? '',
        is_active: client.is_active,
    });

    function submit(e) {
        e.preventDefault();
        put(route('clients.update', client.id));
    }

    function setLocation({ lat, lng }) {
        setData({ ...data, latitude: lat ?? '', longitude: lng ?? '' });
    }

    return (
        <AppLayout>
            <Head title={`Edit ${client.name}`} />
            <PageHeader title={`Edit: ${client.name}`} back={route('clients.show', client.id)} />
            <div className="p-4 sm:p-6 max-w-3xl mx-auto">
                {Object.keys(errors).length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        <strong>Please fix the following:</strong>
                        <ul className="list-disc ml-5 mt-1 text-xs">
                            {Object.entries(errors).map(([field, msg]) => <li key={field}><strong>{field}:</strong> {msg}</li>)}
                        </ul>
                    </div>
                )}
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Full Name" error={errors.name} required>
                            <input className="form-input" value={data.name} onChange={e => setData('name', e.target.value)} />
                        </FormField>
                        <FormField label="Phone" error={errors.phone} required>
                            <input className="form-input" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                        </FormField>
                        <FormField label="Email" error={errors.email}>
                            <input type="email" className="form-input" value={data.email} onChange={e => setData('email', e.target.value)} />
                        </FormField>
                        <FormField label="City" error={errors.city}>
                            <input className="form-input" value={data.city} onChange={e => setData('city', e.target.value)} />
                        </FormField>
                    </div>
                    <FormField label="Address" error={errors.address}>
                        <textarea className="form-input" rows={2} value={data.address} onChange={e => setData('address', e.target.value)} />
                    </FormField>

                    <FormField label="Location on Map" error={errors.latitude || errors.longitude} hint="Search, or click the map to drop a pin">
                        <MapPicker
                            value={{ lat: data.latitude, lng: data.longitude }}
                            onChange={setLocation}
                            address={data.address || data.city}
                            height={320}
                        />
                    </FormField>

                    <FormField label="Notes" error={errors.notes}>
                        <textarea className="form-input" rows={3} value={data.notes} onChange={e => setData('notes', e.target.value)} />
                    </FormField>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded" />
                        Active
                    </label>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Saving…' : 'Update Client'}</button>
                        <a href={route('clients.show', client.id)} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
