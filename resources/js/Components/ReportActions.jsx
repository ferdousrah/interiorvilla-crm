import { PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

/**
 * Print + Download PDF buttons for report pages.
 * `filters` is the current filter object — we append ?format=pdf to the same URL
 * so the backend returns a DomPDF download using the same query params.
 */
export default function ReportActions({ filters = {} }) {
    const currentParams = new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
    );
    currentParams.set('format', 'pdf');
    const pdfUrl = `${window.location.pathname}?${currentParams.toString()}`;

    return (
        <div className="flex items-center gap-2 print:hidden">
            <a
                href={pdfUrl}
                className="btn flex items-center gap-2 text-sm"
                title="Download as PDF"
                target="_blank"
                rel="noopener">
                <DocumentArrowDownIcon className="w-4 h-4" /> PDF
            </a>
            <button
                type="button"
                onClick={() => window.print()}
                className="btn flex items-center gap-2 text-sm"
                title="Print report">
                <PrinterIcon className="w-4 h-4" /> Print
            </button>
        </div>
    );
}
