import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

export default function PurchaseOrderEdit({ purchaseOrder, vendors, projects }) {
    const { data, setData, put, processing, errors } = useForm({
        expected_delivery_date: purchaseOrder.expected_delivery_date ?? '',
        delivery_address: purchaseOrder.delivery_address ?? '',
        notes: purchaseOrder.notes ?? '',
    });

    function submit(e) {
        e.preventDefault();
        put(route('procurement.purchase-orders.update', purchaseOrder.id));
    }

    return (
        <AppLayout>
            <Head title={`Edit PO ${purchaseOrder.code}`} />
            <PageHeader title={`Edit PO: ${purchaseOrder.code}`} back={route('procurement.purchase-orders.show', purchaseOrder.id)} />
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <div className="card p-4 mb-4 bg-amber-50 border border-amber-200 text-sm text-amber-800">
                    Only delivery details and notes can be edited after a PO is created.
                </div>
                <form onSubmit={submit} className="card p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                        <div><span className="font-medium">Vendor:</span> {purchaseOrder.vendor?.name}</div>
                        <div><span className="font-medium">Status:</span> <span className="capitalize">{purchaseOrder.status}</span></div>
                        <div><span className="font-medium">Order Date:</span> {purchaseOrder.order_date}</div>
                        <div><span className="font-medium">Total:</span> {Number(purchaseOrder.grand_total).toLocaleString('en-IN')}৳</div>
                    </div>

                    <FormField label="Expected Delivery Date" error={errors.expected_delivery_date}>
                        <input type="date" className="form-input" value={data.expected_delivery_date} onChange={e => setData('expected_delivery_date', e.target.value)} />
                    </FormField>

                    <FormField label="Delivery Address" error={errors.delivery_address}>
                        <textarea className="form-input" rows={2} value={data.delivery_address} onChange={e => setData('delivery_address', e.target.value)} />
                    </FormField>

                    <FormField label="Notes" error={errors.notes}>
                        <textarea className="form-input" rows={3} value={data.notes} onChange={e => setData('notes', e.target.value)} />
                    </FormField>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>
                        <a href={route('procurement.purchase-orders.show', purchaseOrder.id)} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
