import { Link } from '@inertiajs/react';
import EmptyState from '@/Components/EmptyState';

export default function DataTable({ columns, data, pagination, emptyTitle }) {
    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-left table-header ${col.className || ''}`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data?.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-12">
                                    <EmptyState title={emptyTitle || 'No records found'} />
                                </td>
                            </tr>
                        ) : (
                            data?.map((row, rowIdx) => (
                                <tr key={row.id || rowIdx} className="hover:bg-gray-50 transition-colors">
                                    {columns.map((col) => (
                                        <td key={col.key} className={`px-4 py-3 ${col.cellClassName || ''}`}>
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 mt-2">
                    <div className="text-sm text-gray-500">
                        Showing {pagination.from}–{pagination.to} of {pagination.total}
                    </div>
                    <div className="flex items-center gap-1">
                        {pagination.links?.map((link, i) => (
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`px-3 py-1.5 text-sm rounded ${
                                        link.active
                                            ? 'bg-primary-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 text-sm text-gray-400"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            )
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
