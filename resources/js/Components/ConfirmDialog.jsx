import Modal from '@/Components/Modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm Action', message = 'Are you sure?', confirmLabel = 'Confirm', variant = 'danger' }) {
    return (
        <Modal open={open} onClose={onClose} size="sm">
            <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'}`}>
                        <ExclamationTriangleIcon className={`h-5 w-5 ${variant === 'danger' ? 'text-red-600' : 'text-amber-600'}`} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-600 mt-0.5">{message}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
