import { Link } from '@inertiajs/react';

/** Page links + "Showing x–y of z" for a Laravel paginator passed as an Inertia prop. */
export default function Pagination({ data }) {
    if (!data || !data.total) return null;

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3">
            <div className="text-sm text-gray-500">
                Showing {data.from}–{data.to} of {data.total}
            </div>
            {data.last_page > 1 && (
                <div className="flex flex-wrap items-center gap-1">
                    {data.links?.map((link, i) => (
                        link.url ? (
                            <Link
                                key={i}
                                href={link.url}
                                preserveScroll
                                preserveState
                                className={`px-3 py-1.5 text-sm rounded ${
                                    link.active ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span key={i} className="px-3 py-1.5 text-sm text-gray-300"
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        )
                    ))}
                </div>
            )}
        </div>
    );
}
