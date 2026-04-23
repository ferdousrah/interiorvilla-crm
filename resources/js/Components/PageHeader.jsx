import { Link } from '@inertiajs/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function PageHeader({ title, subtitle, back, children }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-white gap-3">
            <div className="flex items-center gap-3 min-w-0">
                {back && (
                    <Link href={back} className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </Link>
                )}
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{title}</h1>
                    {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>}
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {children}
                </div>
            )}
        </div>
    );
}
