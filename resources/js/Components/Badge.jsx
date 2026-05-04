const colorMap = {
    // Status colors
    pending: 'bg-amber-100 text-amber-800',
    draft: 'bg-amber-100 text-amber-800',
    new: 'bg-amber-100 text-amber-800',
    active: 'bg-green-100 text-green-800',
    approved: 'bg-green-100 text-green-800',
    paid: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    received: 'bg-green-100 text-green-800',
    present: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    sent: 'bg-blue-100 text-blue-800',
    partially_paid: 'bg-blue-100 text-blue-800',
    partially_received: 'bg-blue-100 text-blue-800',
    contacted: 'bg-blue-100 text-blue-800',
    qualified: 'bg-blue-100 text-blue-800',
    proposal_sent: 'bg-blue-100 text-blue-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
    lost: 'bg-red-100 text-red-800',
    absent: 'bg-red-100 text-red-800',
    on_hold: 'bg-purple-100 text-purple-800',
    superseded: 'bg-gray-100 text-gray-500',
    po_raised: 'bg-emerald-100 text-emerald-800',
    expired: 'bg-gray-100 text-gray-500',
    converted: 'bg-emerald-100 text-emerald-700',
    under_review: 'bg-indigo-100 text-indigo-700',
    won: 'bg-purple-100 text-purple-800',
    done: 'bg-green-100 text-green-800',
    review: 'bg-indigo-100 text-indigo-800',
    // Types
    individual: 'bg-gray-100 text-gray-700',
    corporate: 'bg-indigo-100 text-indigo-700',
    supplier: 'bg-blue-100 text-blue-700',
    subcontractor: 'bg-orange-100 text-orange-700',
    both: 'bg-purple-100 text-purple-700',
    // Priority
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700',
    // Employment
    permanent: 'bg-green-100 text-green-700',
    contract: 'bg-amber-100 text-amber-700',
    part_time: 'bg-blue-100 text-blue-700',
    intern: 'bg-purple-100 text-purple-700',
    daily_labour: 'bg-gray-100 text-gray-700',
};

const labelMap = {
    contacted: 'Meeting',
};

export default function Badge({ status, label, className = '' }) {
    const color = colorMap[status] || 'bg-gray-100 text-gray-700';
    const text = label || labelMap[status] || status?.replace(/_/g, ' ');

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${color} ${className}`}>
            {text}
        </span>
    );
}
