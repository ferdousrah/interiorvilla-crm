import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { PlusIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function EmployeesIndex({ employees }) {
    return (
        <AppLayout>
            <Head title="Employees" />
            <PageHeader title="Employees" subtitle={`${(employees.data ?? employees).length} employees`}>
                <Link href={route('hr.employees.create')} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> New Employee
                </Link>
            </PageHeader>
            <div className="p-4 sm:p-6">
                <div className="card overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{['Code','Name','Department','Designation','Phone','Salary','Status','Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(employees.data ?? employees).map(emp => (
                                <tr key={emp.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{emp.code}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{emp.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{emp.department}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{emp.designation}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{emp.phone}</td>
                                    <td className="px-4 py-3 text-sm">{Number(emp.basic_salary ?? 0).toLocaleString('en-IN')}৳</td>
                                    <td className="px-4 py-3"><Badge variant={emp.is_active ? 'success' : 'gray'}>{emp.is_active ? 'Active' : 'Inactive'}</Badge></td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link href={route('hr.employees.show', emp.id)} className="text-gray-400 hover:text-primary-600"><EyeIcon className="w-4 h-4" /></Link>
                                            <Link href={route('hr.employees.edit', emp.id)} className="text-gray-400 hover:text-yellow-600"><PencilIcon className="w-4 h-4" /></Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(employees.data ?? employees).length === 0 && (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No employees found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
