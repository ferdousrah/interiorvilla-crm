import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

const CATEGORIES = ['furniture', 'fabric', 'lighting', 'flooring', 'paint', 'hardware', 'electrical', 'plumbing', 'contractor', 'other'];

export default function VendorCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '', phone: '', email: '', address: '', category: 'other',
        bank_name: '', bank_account: '', notes: '',
    });
    function submit(e) {
        e.preventDefault();
        post(route('procurement.vendors.store'));
    }
    return (
        <AppLayout>
            <Head title="New Vendor" />
            <PageHeader title="New Vendor" back={route('procurement.vendors.index')} />
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Name" error={errors.name} required>
                            <input className="form-input" value={data.name} onChange={e => setData('name', e.target.value)} />
                        </FormField>
                        <FormField label="Phone" error={errors.phone} required>
                            <input className="form-input" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                        </FormField>
                        <FormField label="Email" error={errors.email}>
                            <input type="email" className="form-input" value={data.email} onChange={e => setData('email', e.target.value)} />
                        </FormField>
                        <FormField label="Category" error={errors.category}>
                            <select className="form-input" value={data.category} onChange={e => setData('category', e.target.value)}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Bank Name" error={errors.bank_name}>
                            <input className="form-input" value={data.bank_name} onChange={e => setData('bank_name', e.target.value)} />
                        </FormField>
                        <FormField label="Bank Account" error={errors.bank_account}>
                            <input className="form-input" value={data.bank_account} onChange={e => setData('bank_account', e.target.value)} />
                        </FormField>
                    </div>
                    <FormField label="Address" error={errors.address}>
                        <textarea className="form-input" rows={2} value={data.address} onChange={e => setData('address', e.target.value)} />
                    </FormField>
                    <FormField label="Notes" error={errors.notes}>
                        <textarea className="form-input" rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)} />
                    </FormField>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Saving…' : 'Save Vendor'}</button>
                        <a href={route('procurement.vendors.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
