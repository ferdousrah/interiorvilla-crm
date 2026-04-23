import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

const DEPARTMENTS = ['design', 'execution', 'procurement', 'accounts', 'hr', 'it', 'sales', 'administration'];

export default function EmployeeEdit({ employee }) {
    const { data, setData, put, processing, errors } = useForm({
        name: employee.name, phone: employee.phone, email: employee.email ?? '',
        nid: employee.nid ?? '', department: employee.department ?? 'design',
        designation: employee.designation, join_date: employee.join_date?.substring(0, 10) ?? '',
        basic_salary: employee.basic_salary ?? '', bank_account: employee.bank_account ?? '',
        bank_name: employee.bank_name ?? '', address: employee.address ?? '',
        emergency_contact: employee.emergency_contact ?? '', is_active: employee.is_active,
    });

    function submit(e) {
        e.preventDefault();
        put(route('hr.employees.update', employee.id));
    }

    return (
        <AppLayout>
            <Head title={`Edit ${employee.name}`} />
            <PageHeader title={`Edit: ${employee.name}`} back={route('hr.employees.show', employee.id)} />
            <div className="p-4 sm:p-6 max-w-3xl">
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
                        <FormField label="NID Number" error={errors.nid}>
                            <input className="form-input" value={data.nid} onChange={e => setData('nid', e.target.value)} />
                        </FormField>
                        <FormField label="Department" error={errors.department}>
                            <select className="form-input" value={data.department} onChange={e => setData('department', e.target.value)}>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Designation" error={errors.designation} required>
                            <input className="form-input" value={data.designation} onChange={e => setData('designation', e.target.value)} />
                        </FormField>
                        <FormField label="Join Date" error={errors.join_date}>
                            <input type="date" className="form-input" value={data.join_date} onChange={e => setData('join_date', e.target.value)} />
                        </FormField>
                        <FormField label="Basic Salary (৳)" error={errors.basic_salary}>
                            <input type="number" className="form-input" value={data.basic_salary} onChange={e => setData('basic_salary', e.target.value)} />
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
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded" />
                        Active
                    </label>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Saving…' : 'Update Employee'}</button>
                        <a href={route('hr.employees.show', employee.id)} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
