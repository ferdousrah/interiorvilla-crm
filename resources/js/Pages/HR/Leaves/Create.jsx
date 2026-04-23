import { Head, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';

export default function LeaveCreate({ isManager, leaveTypes, employees, myEmployee }) {
    const { data, setData, post, processing, errors } = useForm({
        employee_id: myEmployee?.id ?? '',
        leave_type_id: '',
        from_date: '',
        to_date: '',
        reason: '',
    });

    // Compute days
    const days = (() => {
        if (!data.from_date || !data.to_date) return 0;
        const from = new Date(data.from_date);
        const to = new Date(data.to_date);
        if (to < from) return 0;
        return Math.round((to - from) / (1000 * 60 * 60 * 24)) + 1;
    })();

    function submit(e) {
        e.preventDefault();
        post(route('hr.leaves.store'));
    }

    return (
        <AppLayout>
            <Head title="New Leave Request" />
            <PageHeader title="New Leave Request" back={route('hr.leaves.index')} />
            <div className="p-4 sm:p-6 max-w-xl">
                <form onSubmit={submit} className="card p-6 space-y-4">
                    {isManager && (
                        <FormField label="Employee" error={errors.employee_id} required>
                            <select
                                className="form-input"
                                value={data.employee_id}
                                onChange={e => setData('employee_id', e.target.value)}
                            >
                                <option value="">Select employee…</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                                ))}
                            </select>
                        </FormField>
                    )}

                    <FormField label="Leave Type" error={errors.leave_type_id} required>
                        <select
                            className="form-input"
                            value={data.leave_type_id}
                            onChange={e => setData('leave_type_id', e.target.value)}
                        >
                            <option value="">Select type…</option>
                            {leaveTypes.map(lt => (
                                <option key={lt.id} value={lt.id}>
                                    {lt.name}{lt.days_per_year ? ` (${lt.days_per_year} days/year)` : ''}
                                    {lt.is_paid ? '' : ' - Unpaid'}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="From Date" error={errors.from_date} required>
                            <input
                                type="date"
                                className="form-input"
                                value={data.from_date}
                                onChange={e => setData('from_date', e.target.value)}
                            />
                        </FormField>
                        <FormField label="To Date" error={errors.to_date} required>
                            <input
                                type="date"
                                className="form-input"
                                value={data.to_date}
                                min={data.from_date}
                                onChange={e => setData('to_date', e.target.value)}
                            />
                        </FormField>
                    </div>

                    {days > 0 && (
                        <div className="bg-blue-50 text-blue-700 text-sm px-3 py-2 rounded">
                            Duration: <strong>{days} day{days !== 1 ? 's' : ''}</strong>
                        </div>
                    )}

                    <FormField label="Reason" error={errors.reason}>
                        <textarea
                            className="form-input"
                            rows={3}
                            placeholder="Reason for leave (optional)…"
                            value={data.reason}
                            onChange={e => setData('reason', e.target.value)}
                        />
                    </FormField>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Submitting…' : 'Submit Request'}
                        </button>
                        <a href={route('hr.leaves.index')} className="btn">Cancel</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
