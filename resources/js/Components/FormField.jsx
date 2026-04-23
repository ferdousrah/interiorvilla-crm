export default function FormField({ label, error, children, required, hint }) {
    return (
        <div>
            {label && (
                <label className="form-label">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            {children}
            {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
            {error && <p className="form-error">{error}</p>}
        </div>
    );
}
