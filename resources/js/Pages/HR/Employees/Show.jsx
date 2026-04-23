import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Badge from '@/Components/Badge';
import { PencilIcon } from '@heroicons/react/24/outline';

const TABS = ['Details', 'Documents', 'Leave History', 'Attendance'];

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Attendance grid: map day-of-month → status for a given year/month
function AttendanceMonth({ records, year, month }) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const byDay = {};
    records.forEach(r => {
        const d = new Date(r.date);
        if (d.getFullYear() === year && d.getMonth() + 1 === month) {
            byDay[d.getDate()] = r;
        }
    });

    const statusColor = {
        present: 'bg-green-100 text-green-700',
        absent: 'bg-red-100 text-red-700',
        half_day: 'bg-yellow-100 text-yellow-700',
        on_leave: 'bg-blue-100 text-blue-700',
        holiday: 'bg-purple-100 text-purple-700',
        off: 'bg-gray-100 text-gray-500',
    };

    const counts = { present: 0, absent: 0, on_leave: 0, half_day: 0 };
    Object.values(byDay).forEach(r => {
        if (counts[r.status] !== undefined) counts[r.status]++;
    });

    return (
        <div>
            <div className="grid grid-cols-7 gap-1 mb-4">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const rec = byDay[day];
                    return (
                        <div
                            key={day}
                            title={rec ? `${rec.status}${rec.check_in ? ` (${rec.check_in})` : ''}` : 'No record'}
                            className={`rounded p-1 text-center text-xs font-medium ${rec ? (statusColor[rec.status] || 'bg-gray-100 text-gray-500') : 'bg-gray-50 text-gray-300'}`}
                        >
                            <div className="text-gray-500 text-[10px]">{day}</div>
                            {rec && <div className="truncate">{rec.status.replace(/_/g, ' ')}</div>}
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-4 text-sm">
                <span className="text-green-700">Present: {counts.present}</span>
                <span className="text-red-700">Absent: {counts.absent}</span>
                <span className="text-blue-700">Leave: {counts.on_leave}</span>
                <span className="text-yellow-700">Half Day: {counts.half_day}</span>
            </div>
        </div>
    );
}

export default function EmployeeShow({ employee }) {
    const [tab, setTab] = useState('Details');
    const now = new Date();
    const [attYear, setAttYear] = useState(now.getFullYear());
    const [attMonth, setAttMonth] = useState(now.getMonth() + 1);

    const attendance = employee.attendance ?? [];
    const leaveRequests = employee.leave_requests ?? [];
    const documents = employee.documents ?? [];

    function prevMonth() {
        if (attMonth === 1) { setAttYear(y => y - 1); setAttMonth(12); }
        else setAttMonth(m => m - 1);
    }
    function nextMonth() {
        if (attMonth === 12) { setAttYear(y => y + 1); setAttMonth(1); }
        else setAttMonth(m => m + 1);
    }

    return (
        <AppLayout>
            <Head title={employee.name} />
            <PageHeader
                title={employee.name}
                back={route('hr.employees.index')}
                subtitle={`${employee.code} · ${employee.designation ?? ''}`}
            >
                <Link href={route('hr.employees.edit', employee.id)} className="btn btn-secondary flex items-center gap-2">
                    <PencilIcon className="w-4 h-4" /> Edit
                </Link>
            </PageHeader>

            {/* Header card */}
            <div className="px-6 pb-4">
                <div className="card p-5 flex flex-wrap gap-6">
                    <div>
                        <div className="text-xs text-gray-500 uppercase">Department</div>
                        <div className="font-medium capitalize">{employee.department ?? '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase">Phone</div>
                        <div className="font-medium">{employee.phone}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase">Type</div>
                        <Badge status={employee.employment_type} />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase">Join Date</div>
                        <div className="font-medium">{formatDate(employee.join_date)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase">Status</div>
                        <Badge status={employee.is_active ? 'active' : 'cancelled'} label={employee.is_active ? 'Active' : 'Inactive'} />
                    </div>
                    {employee.basic_salary && (
                        <div>
                            <div className="text-xs text-gray-500 uppercase">Salary</div>
                            <div className="font-medium">{Number(employee.basic_salary).toLocaleString('en-IN')}৳</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6">
                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex gap-1">
                        {TABS.map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </nav>
                </div>

                {tab === 'Details' && (
                    <div className="card p-6 max-w-2xl">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            {[
                                ['Employee Code', employee.code],
                                ['Full Name', employee.name],
                                ['Email', employee.email],
                                ['Phone', employee.phone],
                                ['Department', employee.department],
                                ['Designation', employee.designation],
                                ['Employment Type', employee.employment_type?.replace(/_/g, ' ')],
                                ['Join Date', formatDate(employee.join_date)],
                                ['Contract End', formatDate(employee.contract_end_date)],
                                ['Basic Salary', employee.basic_salary ? `${Number(employee.basic_salary).toLocaleString('en-IN')}৳` : '—'],
                                ['NID Number', employee.nid_number],
                                ['Emergency Contact', employee.emergency_contact_name],
                                ['Emergency Phone', employee.emergency_contact_phone],
                            ].map(([label, val]) => (
                                <div key={label}>
                                    <dt className="text-xs text-gray-500 uppercase mb-0.5">{label}</dt>
                                    <dd className="text-sm text-gray-900 capitalize">{val ?? '—'}</dd>
                                </div>
                            ))}
                            <div className="col-span-2">
                                <dt className="text-xs text-gray-500 uppercase mb-0.5">Address</dt>
                                <dd className="text-sm text-gray-900">{employee.address ?? '—'}</dd>
                            </div>
                            {employee.notes && (
                                <div className="col-span-2">
                                    <dt className="text-xs text-gray-500 uppercase mb-0.5">Notes</dt>
                                    <dd className="text-sm text-gray-900">{employee.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                )}

                {tab === 'Documents' && (
                    <div>
                        {documents.length === 0 ? (
                            <div className="card p-10 text-center text-gray-400">No documents uploaded.</div>
                        ) : (
                            <div className="card overflow-hidden max-w-3xl">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {['Type', 'File Name', 'Expiry', 'Uploaded'].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {documents.map(doc => (
                                            <tr key={doc.id}>
                                                <td className="px-4 py-3 text-sm capitalize">{doc.type}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <a href={`/storage/${doc.file_path}`} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                                                        {doc.file_name}
                                                    </a>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{formatDate(doc.expiry_date)}</td>
                                                <td className="px-4 py-3 text-sm">{formatDate(doc.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'Leave History' && (
                    <div className="max-w-3xl">
                        {leaveRequests.length === 0 ? (
                            <div className="card p-10 text-center text-gray-400">No leave requests found.</div>
                        ) : (
                            <div className="card overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {['Type', 'From', 'To', 'Days', 'Reason', 'Status'].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {leaveRequests.map(lr => (
                                            <tr key={lr.id}>
                                                <td className="px-4 py-3 text-sm">{lr.leave_type?.name ?? '—'}</td>
                                                <td className="px-4 py-3 text-sm">{formatDate(lr.from_date)}</td>
                                                <td className="px-4 py-3 text-sm">{formatDate(lr.to_date)}</td>
                                                <td className="px-4 py-3 text-sm">{lr.days}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{lr.reason ?? '—'}</td>
                                                <td className="px-4 py-3"><Badge status={lr.status} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'Attendance' && (
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-4 mb-4">
                            <button onClick={prevMonth} className="btn">‹</button>
                            <span className="font-medium text-gray-700">
                                {new Date(attYear, attMonth - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={nextMonth} className="btn">›</button>
                        </div>
                        <div className="card p-4">
                            <AttendanceMonth records={attendance} year={attYear} month={attMonth} />
                        </div>
                        <div className="mt-3 flex gap-3 flex-wrap text-xs">
                            {[
                                ['bg-green-100 text-green-700', 'Present'],
                                ['bg-red-100 text-red-700', 'Absent'],
                                ['bg-yellow-100 text-yellow-700', 'Half Day'],
                                ['bg-blue-100 text-blue-700', 'On Leave'],
                                ['bg-purple-100 text-purple-700', 'Holiday'],
                                ['bg-gray-100 text-gray-500', 'Off'],
                            ].map(([cls, label]) => (
                                <span key={label} className={`px-2 py-0.5 rounded ${cls}`}>{label}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
