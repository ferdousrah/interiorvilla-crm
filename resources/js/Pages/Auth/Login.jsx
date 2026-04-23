import { useForm, Head, usePage } from '@inertiajs/react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useThemeColor } from '@/Hooks/useThemeColor';

export default function Login() {
    const { appSettings } = usePage().props;
    const appName = appSettings?.app_name || 'Interior Villa';
    const companyName = appSettings?.company_name || 'Interior Villa BD';
    const logoUrl = appSettings?.company_logo;
    useThemeColor();
    const { data, setData, post, processing, errors } = useForm({
        email: '', password: '', remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Login" />
            <div className="min-h-screen flex">
                {/* Left: Branding panel */}
                <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary-400 blur-3xl" />
                        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-indigo-400 blur-3xl" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-violet-400 blur-3xl" />
                    </div>

                    {/* Grid pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                        <div>
                            <div className="flex items-center gap-3">
                                {logoUrl ? (
                                    <img src={logoUrl} alt={appName} className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1 border border-white/20" />
                                ) : (
                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                                        <span className="text-white font-bold text-lg">{appName.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                )}
                                <div>
                                    <div className="text-white font-semibold text-lg">{appName}</div>
                                    <div className="text-primary-300 text-xs tracking-widest uppercase">Management System</div>
                                </div>
                            </div>
                        </div>

                        <div className="max-w-md">
                            <h2 className="text-4xl font-bold text-white leading-tight">
                                Design. Build.
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-violet-400">
                                    Deliver Excellence.
                                </span>
                            </h2>
                            <p className="mt-5 text-gray-400 text-base leading-relaxed">
                                Streamline your interior design projects from lead to handover.
                                Manage clients, procurement, inventory, accounts and your team — all in one place.
                            </p>

                            {/* Feature pills */}
                            <div className="mt-8 flex flex-wrap gap-2">
                                {['CRM', 'Projects', 'Procurement', 'Inventory', 'Accounts', 'HR'].map(f => (
                                    <span key={f} className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/5 text-gray-300 border border-white/10 backdrop-blur-sm">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-xs text-gray-500">
                                {companyName} &copy; {new Date().getFullYear()}
                            </div>
                            <div className="h-4 w-px bg-gray-700" />
                            <div className="text-xs text-gray-500">Dhaka, Bangladesh</div>
                        </div>
                    </div>
                </div>

                {/* Right: Login form */}
                <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 lg:p-12">
                    <div className="w-full max-w-md">
                        {/* Mobile logo */}
                        <div className="lg:hidden text-center mb-8">
                            {logoUrl ? (
                                <img src={logoUrl} alt={appName} className="w-14 h-14 rounded-2xl object-contain mx-auto mb-3 shadow-lg bg-white p-1 border border-gray-100" />
                            ) : (
                                <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary-500/25">
                                    <span className="text-white font-bold text-xl">{appName.substring(0, 2).toUpperCase()}</span>
                                </div>
                            )}
                            <h1 className="text-xl font-bold text-gray-900">{appName}</h1>
                            <p className="text-gray-500 text-sm mt-0.5">Management System</p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                            <p className="text-gray-500 text-sm mt-1">Sign in to your account to continue</p>
                        </div>

                        <form onSubmit={submit} className="mt-8 space-y-5">
                            <div>
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="form-input py-3"
                                    placeholder="you@interiorvilla.com"
                                    required
                                    autoFocus
                                />
                                {errors.email && <p className="form-error">{errors.email}</p>}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-sm font-medium text-gray-700">Password</label>
                                    <a href="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                                        Forgot password?
                                    </a>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        className="form-input py-3 pr-10"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword
                                            ? <EyeSlashIcon className="w-4.5 h-4.5" />
                                            : <EyeIcon className="w-4.5 h-4.5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="form-error">{errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={e => setData('remember', e.target.checked)}
                                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500"
                                    />
                                    Remember me
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="btn-primary w-full justify-center py-3 text-base"
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : 'Sign in'}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-xs text-gray-400 lg:hidden">
                            {companyName} &copy; {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
