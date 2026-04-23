import { InboxIcon } from '@heroicons/react/24/outline';

export default function EmptyState({ title = 'No items found', description, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <InboxIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
            {description && <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>}
            {action}
        </div>
    );
}
