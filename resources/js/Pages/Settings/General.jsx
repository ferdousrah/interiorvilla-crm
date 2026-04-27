import { Head, useForm, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import FormField from '@/Components/FormField';
import { PhotoIcon, TrashIcon, ArrowUpTrayIcon, BuildingOfficeIcon, SwatchIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { THEME_OPTIONS, THEME_LABELS, THEME_PREVIEW, SIDEBAR_OPTIONS, SIDEBAR_LABELS, SIDEBAR_PREVIEW, SIDEBAR_IS_LIGHT } from '@/Hooks/useThemeColor';

export default function GeneralSettings({ settings }) {
    const logoInputRef = useRef(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const sigInputRef = useRef(null);
    const [sigPreview, setSigPreview] = useState(null);
    const quotationLogoInputRef = useRef(null);
    const [quotationLogoPreview, setQuotationLogoPreview] = useState(null);

    const { data, setData, put, processing, errors } = useForm({
        app_name:          settings.app_name ?? '',
        company_name:      settings.company_name ?? '',
        company_tagline:   settings.company_tagline ?? 'Build Your Dream',
        company_email:     settings.company_email ?? '',
        company_phone:     settings.company_phone ?? '',
        company_phone2:    settings.company_phone2 ?? '',
        company_address:   settings.company_address ?? '',
        company_ceo_name:  settings.company_ceo_name ?? '',
        company_ceo_title: settings.company_ceo_title ?? 'CEO',
        currency_symbol:   settings.currency_symbol ?? '৳',
        tax_label:         settings.tax_label ?? 'VAT',
        default_tax_pct:   settings.default_tax_pct ?? '0',
        theme_color:       settings.theme_color ?? 'indigo',
        sidebar_color:     settings.sidebar_color ?? 'slate_dark',
    });

    const currentLogo = settings.company_logo
        ? `/storage/${settings.company_logo}`
        : null;
    const currentSig = settings.company_signature
        ? `/storage/${settings.company_signature}`
        : null;
    const currentQuotationLogo = settings.quotation_logo
        ? `/storage/${settings.quotation_logo}`
        : null;

    function submit(e) {
        e.preventDefault();
        put(route('settings.general.update'));
    }

    function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onload = (ev) => setLogoPreview(ev.target.result);
        reader.readAsDataURL(file);

        // Upload
        const formData = new FormData();
        formData.append('logo', file);
        router.post(route('settings.general.logo'), formData, {
            forceFormData: true,
            onSuccess: () => setLogoPreview(null),
        });
    }

    function removeLogo() {
        if (confirm('Remove the company logo?')) {
            router.delete(route('settings.general.logo.remove'));
            setLogoPreview(null);
        }
    }

    function handleSigUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => setSigPreview(ev.target.result);
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append('signature', file);
        router.post(route('settings.general.signature'), formData, {
            forceFormData: true,
            onSuccess: () => setSigPreview(null),
        });
    }

    function removeSig() {
        if (confirm('Remove the signature?')) {
            router.delete(route('settings.general.signature.remove'));
            setSigPreview(null);
        }
    }

    function handleQuotationLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => setQuotationLogoPreview(ev.target.result);
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append('logo', file);
        router.post(route('settings.general.quotation-logo'), formData, {
            forceFormData: true,
            onSuccess: () => setQuotationLogoPreview(null),
        });
    }

    function removeQuotationLogo() {
        if (confirm('Remove the quotation logo? Quotations will fall back to the main company logo.')) {
            router.delete(route('settings.general.quotation-logo.remove'));
            setQuotationLogoPreview(null);
        }
    }

    return (
        <AppLayout>
            <Head title="General Settings" />
            <PageHeader title="General Settings" subtitle="Company information and branding" />

            <div className="p-4 sm:p-6 max-w-3xl space-y-6">

                {/* ── Logo Section ────────────────── */}
                <div className="card p-5 sm:p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <PhotoIcon className="w-5 h-5 text-gray-400" /> Company Logo
                    </h3>
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                        {/* Logo preview */}
                        <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                            {logoPreview || currentLogo ? (
                                <img
                                    src={logoPreview || currentLogo}
                                    alt="Logo"
                                    className="w-full h-full object-contain p-2"
                                />
                            ) : (
                                <div className="text-center">
                                    <BuildingOfficeIcon className="w-10 h-10 text-gray-300 mx-auto" />
                                    <p className="text-[10px] text-gray-400 mt-1">No logo</p>
                                </div>
                            )}
                        </div>

                        {/* Upload controls */}
                        <div className="space-y-3">
                            <p className="text-xs text-gray-500">
                                Upload your company logo. Recommended: square image, PNG or SVG, at least 200x200px.
                                This logo will appear in the sidebar, login page, PDFs, and invoices.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => logoInputRef.current?.click()}
                                    className="btn btn-secondary text-sm flex items-center gap-2"
                                >
                                    <ArrowUpTrayIcon className="w-4 h-4" /> Upload Logo
                                </button>
                                {(currentLogo || logoPreview) && (
                                    <button type="button" onClick={removeLogo} className="btn btn-danger text-sm flex items-center gap-2">
                                        <TrashIcon className="w-4 h-4" /> Remove
                                    </button>
                                )}
                            </div>
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                className="hidden"
                                onChange={handleLogoUpload}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Quotation Logo Section ──────── */}
                <div className="card p-5 sm:p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <PhotoIcon className="w-5 h-5 text-gray-400" /> Quotation Logo
                        <span className="text-[10px] font-normal text-gray-400 ml-1">(optional)</span>
                    </h3>
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                        {/* Quotation logo preview */}
                        <div className="w-44 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                            {quotationLogoPreview || currentQuotationLogo ? (
                                <img
                                    src={quotationLogoPreview || currentQuotationLogo}
                                    alt="Quotation logo"
                                    className="w-full h-full object-contain p-2"
                                />
                            ) : (
                                <div className="text-center">
                                    <PhotoIcon className="w-8 h-8 text-gray-300 mx-auto" />
                                    <p className="text-[10px] text-gray-400 mt-1">Uses main logo</p>
                                </div>
                            )}
                        </div>

                        {/* Upload controls */}
                        <div className="space-y-3 flex-1">
                            <p className="text-xs text-gray-500">
                                Upload a separate logo to be used <strong>only on quotations</strong> (PDF, public link, print). If none is uploaded, the main company logo is used. Often used when you want a wider letterhead-style image with company name + tagline baked in.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => quotationLogoInputRef.current?.click()}
                                    className="btn btn-secondary text-sm flex items-center gap-2"
                                >
                                    <ArrowUpTrayIcon className="w-4 h-4" /> Upload Quotation Logo
                                </button>
                                {(currentQuotationLogo || quotationLogoPreview) && (
                                    <button type="button" onClick={removeQuotationLogo} className="btn btn-danger text-sm flex items-center gap-2">
                                        <TrashIcon className="w-4 h-4" /> Remove
                                    </button>
                                )}
                            </div>
                            <input
                                ref={quotationLogoInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                className="hidden"
                                onChange={handleQuotationLogoUpload}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Signature Section ───────────── */}
                <div className="card p-5 sm:p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <PencilSquareIcon className="w-5 h-5 text-gray-400" /> Authorized Signature
                    </h3>
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                        {/* Signature preview */}
                        <div className="w-44 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                            {sigPreview || currentSig ? (
                                <img
                                    src={sigPreview || currentSig}
                                    alt="Signature"
                                    className="w-full h-full object-contain p-2"
                                />
                            ) : (
                                <div className="text-center">
                                    <PencilSquareIcon className="w-8 h-8 text-gray-300 mx-auto" />
                                    <p className="text-[10px] text-gray-400 mt-1">No signature</p>
                                </div>
                            )}
                        </div>

                        {/* Upload controls */}
                        <div className="space-y-3 flex-1">
                            <p className="text-xs text-gray-500">
                                Upload a scanned signature (PNG with <strong>transparent background</strong> works best). It will appear above the signatory name in quotation PDFs and printed copies. Max 1MB.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => sigInputRef.current?.click()}
                                    className="btn btn-secondary text-sm flex items-center gap-2"
                                >
                                    <ArrowUpTrayIcon className="w-4 h-4" /> Upload Signature
                                </button>
                                {(currentSig || sigPreview) && (
                                    <button type="button" onClick={removeSig} className="btn btn-danger text-sm flex items-center gap-2">
                                        <TrashIcon className="w-4 h-4" /> Remove
                                    </button>
                                )}
                            </div>
                            <input
                                ref={sigInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={handleSigUpload}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Company Info ────────────────── */}
                <form onSubmit={submit} className="space-y-6">
                    <div className="card p-5 sm:p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <BuildingOfficeIcon className="w-5 h-5 text-gray-400" /> Company Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Application Name" error={errors.app_name} required>
                                <input className="form-input" value={data.app_name} onChange={e => setData('app_name', e.target.value)}
                                    placeholder="Interior Villa" />
                                <p className="text-[10px] text-gray-400 mt-1">Shown in browser tab and sidebar</p>
                            </FormField>
                            <FormField label="Company Name" error={errors.company_name} required>
                                <input className="form-input" value={data.company_name} onChange={e => setData('company_name', e.target.value)}
                                    placeholder="Interior Villa BD" />
                                <p className="text-[10px] text-gray-400 mt-1">Used in invoices, quotations, PDFs</p>
                            </FormField>
                            <FormField label="Tagline" error={errors.company_tagline}>
                                <input className="form-input" value={data.company_tagline} onChange={e => setData('company_tagline', e.target.value)}
                                    placeholder="Build Your Dream" />
                                <p className="text-[10px] text-gray-400 mt-1">Shown under the logo on quotations/PDFs</p>
                            </FormField>
                            <FormField label="Company Email" error={errors.company_email}>
                                <input type="email" className="form-input" value={data.company_email} onChange={e => setData('company_email', e.target.value)}
                                    placeholder="info@interiorvilla.com" />
                            </FormField>
                            <FormField label="Phone (Primary)" error={errors.company_phone}>
                                <input className="form-input" value={data.company_phone} onChange={e => setData('company_phone', e.target.value)}
                                    placeholder="+880 1XXX-XXXXXX" />
                            </FormField>
                            <FormField label="Phone (Secondary)" error={errors.company_phone2}>
                                <input className="form-input" value={data.company_phone2} onChange={e => setData('company_phone2', e.target.value)}
                                    placeholder="Optional" />
                            </FormField>
                            <div className="sm:col-span-2">
                                <FormField label="Company Address" error={errors.company_address}>
                                    <textarea className="form-input" rows={2} value={data.company_address} onChange={e => setData('company_address', e.target.value)}
                                        placeholder="Full address shown on invoices and quotations" />
                                </FormField>
                            </div>
                            <FormField label="Signatory Name" error={errors.company_ceo_name}>
                                <input className="form-input" value={data.company_ceo_name} onChange={e => setData('company_ceo_name', e.target.value)}
                                    placeholder="MD. Ashikur Rahman" />
                                <p className="text-[10px] text-gray-400 mt-1">Shown in the quotation signature block</p>
                            </FormField>
                            <FormField label="Signatory Title" error={errors.company_ceo_title}>
                                <input className="form-input" value={data.company_ceo_title} onChange={e => setData('company_ceo_title', e.target.value)}
                                    placeholder="CEO / Managing Director" />
                            </FormField>
                        </div>
                    </div>

                    {/* ── Theme Color ────────────────── */}
                    <div className="card p-5 sm:p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                            <SwatchIcon className="w-5 h-5 text-gray-400" /> Theme Color
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">Choose a primary color for the entire application — buttons, links, sidebar, and accents.</p>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                            {THEME_OPTIONS.map(color => {
                                const active = data.theme_color === color;
                                return (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setData('theme_color', color)}
                                        className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                                            active ? 'bg-gray-100 ring-2 ring-offset-1 ring-gray-300 scale-105' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-xl shadow-sm transition-transform ${active ? 'scale-110 shadow-md' : 'group-hover:scale-105'}`}
                                            style={{ backgroundColor: THEME_PREVIEW[color] }}
                                        >
                                            {active && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {THEME_LABELS[color]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Sidebar Color ──────────────── */}
                    <div className="card p-5 sm:p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                            <SwatchIcon className="w-5 h-5 text-gray-400" /> Sidebar Background
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">Choose the sidebar navigation background color.</p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-3">
                            {SIDEBAR_OPTIONS.map(key => {
                                const active = data.sidebar_color === key;
                                const isLight = SIDEBAR_IS_LIGHT[key];
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setData('sidebar_color', key)}
                                        className={`group flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
                                            active ? 'bg-gray-100 ring-2 ring-offset-1 ring-gray-300 scale-105' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div
                                            className={`w-full aspect-[3/4] rounded-lg shadow-sm transition-transform ${active ? 'scale-105 shadow-md' : 'group-hover:scale-105'} ${isLight ? 'border border-gray-200' : ''}`}
                                            style={{ backgroundColor: SIDEBAR_PREVIEW[key], minHeight: 40 }}
                                        >
                                            {active && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <svg className={`w-4 h-4 ${isLight ? 'text-primary-600' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-[9px] font-medium leading-tight text-center ${active ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {SIDEBAR_LABELS[key]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Financial Defaults ─────────── */}
                    <div className="card p-5 sm:p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Financial Defaults</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField label="Currency Symbol" error={errors.currency_symbol}>
                                <input className="form-input" value={data.currency_symbol} onChange={e => setData('currency_symbol', e.target.value)}
                                    placeholder="৳" />
                            </FormField>
                            <FormField label="Tax Label" error={errors.tax_label}>
                                <input className="form-input" value={data.tax_label} onChange={e => setData('tax_label', e.target.value)}
                                    placeholder="VAT" />
                                <p className="text-[10px] text-gray-400 mt-1">Label used on invoices (VAT, GST, Tax, etc.)</p>
                            </FormField>
                            <FormField label="Default Tax %" error={errors.default_tax_pct}>
                                <input type="number" min="0" max="100" step="0.5" className="form-input" value={data.default_tax_pct}
                                    onChange={e => setData('default_tax_pct', e.target.value)} placeholder="0" />
                                <p className="text-[10px] text-gray-400 mt-1">Pre-filled when creating invoices/quotations</p>
                            </FormField>
                        </div>
                    </div>

                    {/* ── Save ────────────────────────── */}
                    <div className="flex gap-3">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Saving…' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
