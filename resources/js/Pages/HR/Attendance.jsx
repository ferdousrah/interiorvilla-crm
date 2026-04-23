import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import FormField from '@/Components/FormField';

const STATUS_OPTIONS = ['present', 'absent', 'half_day', 'on_leave', 'holiday', 'off'];

const STATUS_CELL = {
    present:   'bg-green-100 text-green-700',
    absent:    'bg-red-100 text-red-700',
    half_day:  'bg-yellow-100 text-yellow-700',
    on_leave:  'bg-blue-100 text-blue-700',
    holiday:   'bg-purple-100 text-purple-700',
    off:       'bg-gray-100 text-gray-500',
};

const STATUS_ABBR = {
    present: 'P', absent: 'A', half_day: 'H', on_leave: 'L', holiday: 'Ho', off: '—',
};

export default function Attendance({ employees, attendance, month }) {
    const [currentMonth, setCurrentMonth] = useState(month);
    const [modal, setModal] = useState(null); // { employee, day }
    const [form, setForm] = useState({ status: 'present', check_in: '', check_out: '', notes: '' });
    const [saving, setSaving] = useState(false);

    // Bulk
    const [bulkDate, setBulkDate] = useState('');
    const [bulkStatus, setBulkStatus] = useState('present');
    const [selectedEmps, setSelectedEmps] = useState([]);

    const [year, m] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, m, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Build lookup: attendance[employee_id][day] = record
    const attMap = {};
    Object.entries(attendance).forEach(([empId, records]) => {
        attMap[empId] = {};
        (Array.isArray(records) ? records : Object.values(records)).forEach(r => {
            const d = new Date(r.date).getDate();
            attMap[empId][d] = r;
        });
    });

    function prevMonth() {
        const d = new Date(year, m - 2, 1);
        setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        loadMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    function nextMonth() {
        const d = new Date(year, m, 1);
        setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        loadMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    function loadMonth(mo) {
        router.get(route('hr.attendance.index'), { month: mo }, { preserveState: false });
    }

    function openCell(employee, day) {
        const existing = attMap[employee.id]?.[day];
        setForm({
            status: existing?.status ?? 'present',
            check_in: existing?.check_in ?? '',
            check_out: existing?.check_out ?? '',
            notes: existing?.notes ?? '',
        });
        setModal({ employee, day });
    }

    function saveCell() {
        if (!modal) return;
        setSaving(true);
        const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(modal.day).padStart(2, '0')}`;
        router.post(route('hr.attendance.store'), {
            employee_id: modal.employee.id,
            date: dateStr,
            ...form,
        }, {
            preserveState: false,
            onFinish: () => { setSaving(false); setModal(null); },
        });
    }

    function saveBulk() {
        if (!bulkDate || selectedEmps.length === 0) return;
        router.post(route('hr.attendance.bulk'), {
            employee_ids: selectedEmps,
            date: bulkDate,
            status: bulkStatus,
        }, { preserveState: false });
        setSelectedEmps([]);
    }

    function toggleEmp(id) {
        setSelectedEmps(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
    }

    // Monthly summary per employee
    function summary(empId) {
        const rec = attMap[empId] ?? {};
        const counts = { P: 0, A: 0, L: 0, H: 0 };
        Object.values(rec).forEach(r => {
            if (r.status === 'present') counts.P++;
            else if (r.status === 'absent') counts.A++;
            else if (r.status === 'on_leave') counts.L++;
            else if (r.status === 'half_day') counts.H++;
        });
        return counts;
    }

    const monthLabel = new Date(year, m - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    return (
        <AppLayout>
            <Head title="Attendance" />
            <PageHeader title="Attendance" subtitle={monthLabel} />

            <div className="p-4 sm:p-6 space-y-6">
                {/* Month nav */}
                <div className="flex items-center gap-4">
                    <button onClick={prevMonth} className="btn">‹ Prev</button>
                    <span className="font-semibold text-gray-700">{monthLabel}</span>
                    <button onClick={nextMonth} className="btn">Next ›</button>
                </div>

                {/* Bulk mark */}
                <div className="card p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Bulk Mark Attendance</h3>
                    <div className="flex flex-wrap gap-3 items-end">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Date</label>
                            <input type="date" className="form-input" value={bulkDate} onChange={e => setBulkDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Status</label>
                            <select className="form-input" value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
                                {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <button onClick={saveBulk} disabled={!bulkDate || selectedEmps.length === 0} className="btn btn-primary">
                            Mark {selectedEmps.length > 0 ? `${selectedEmps.length} Selected` : 'Selected'}
                        </button>
                        {selectedEmps.length > 0 && (
                            <button onClick={() => setSelectedEmps([])} className="btn">Clear Selection</button>
                        )}
                    </div>
                </div>

                {/* Attendance grid */}
                <div className="card overflow-auto">
                    <table className="min-w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-2 py-2 text-left sticky left-0 bg-gray-50 z-10 w-8">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300"
                                        checked={selectedEmps.length === employees.length && employees.length > 0}
                                        onChange={e => setSelectedEmps(e.target.checked ? employees.map(e => e.id) : [])}
                                    />
                                </th>
                                <th className="px-3 py-2 text-left sticky left-8 bg-gray-50 z-10 min-w-[160px] font-medium text-gray-500 uppercase">Employee</th>
                                {days.map(d => (
                                    <th key={d} className="px-1 py-2 text-center font-medium text-gray-400 w-8">{d}</th>
                                ))}
                                <th className="px-3 py-2 text-center font-medium text-gray-400 uppercase">P</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-400 uppercase">A</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-400 uppercase">L</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-400 uppercase">H</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {employees.map(emp => {
                                const s = summary(emp.id);
                                return (
                                    <tr key={emp.id} className="hover:bg-gray-50">
                                        <td className="px-2 py-1.5 sticky left-0 bg-white">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300"
                                                checked={selectedEmps.includes(emp.id)}
                                                onChange={() => toggleEmp(emp.id)}
                                            />
                                        </td>
                                        <td className="px-3 py-1.5 sticky left-8 bg-white font-medium text-gray-900 whitespace-nowrap">
                                            {emp.name}
                                        </td>
                                        {days.map(day => {
                                            const rec = attMap[emp.id]?.[day];
                                            return (
                                                <td key={day} className="px-0.5 py-1">
                                                    <button
                                                        onClick={() => openCell(emp, day)}
                                                        title={rec ? rec.status.replace(/_/g, ' ') : 'Click to record'}
                                                        className={`w-7 h-6 rounded text-center font-medium transition-colors
                                                            ${rec ? STATUS_CELL[rec.status] : 'bg-gray-50 text-gray-300 hover:bg-gray-100'}`}
                                                    >
                                                        {rec ? STATUS_ABBR[rec.status] : '·'}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                        <td className="px-3 py-1.5 text-center font-medium text-green-700">{s.P}</td>
                                        <td className="px-3 py-1.5 text-center font-medium text-red-700">{s.A}</td>
                                        <td className="px-3 py-1.5 text-center font-medium text-blue-700">{s.L}</td>
                                        <td className="px-3 py-1.5 text-center font-medium text-yellow-700">{s.H}</td>
                                    </tr>
                                );
                            })}
                            {employees.length === 0 && (
                                <tr><td colSpan={days.length + 6} className="px-4 py-8 text-center text-gray-400">No active employees.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs">
                    {Object.entries(STATUS_ABBR).map(([s, abbr]) => (
                        <span key={s} className={`px-2 py-0.5 rounded font-medium ${STATUS_CELL[s]}`}>
                            {abbr} = {s.replace(/_/g, ' ')}
                        </span>
                    ))}
                </div>
            </div>

            {/* Cell edit modal */}
            <Modal
                open={!!modal}
                onClose={() => setModal(null)}
                title={modal ? `${modal.employee.name} — Day ${modal.day} ${monthLabel}` : ''}
                size="sm"
            >
                <div className="p-4 sm:p-6 space-y-4">
                    <FormField label="Status">
                        <select
                            className="form-input"
                            value={form.status}
                            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                        >
                            {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </FormField>
                    {form.status === 'present' || form.status === 'half_day' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormField label="Check In">
                                <input type="time" className="form-input" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} />
                            </FormField>
                            <FormField label="Check Out">
                                <input type="time" className="form-input" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} />
                            </FormField>
                        </div>
                    ) : null}
                    <FormField label="Notes">
                        <input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                    </FormField>
                    <div className="flex gap-3">
                        <button onClick={saveCell} disabled={saving} className="btn btn-primary">
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={() => setModal(null)} className="btn">Cancel</button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
