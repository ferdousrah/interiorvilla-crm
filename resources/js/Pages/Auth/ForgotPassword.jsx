import { useForm, Head } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <>
            <Head title="Forgot Password" />
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md card p-8">
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Forgot Password</h1>
                    <p className="text-sm text-gray-600 mb-6">Enter your email to receive a password reset link.</p>

                    {status && <div className="bg-green-50 text-green-800 px-4 py-3 rounded-lg text-sm mb-4">{status}</div>}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                className="form-input"
                                required
                            />
                            {errors.email && <p className="form-error">{errors.email}</p>}
                        </div>
                        <button type="submit" disabled={processing} className="btn-primary w-full justify-center">
                            {processing ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                    <div className="mt-4 text-center">
                        <a href="/login" className="text-sm text-primary-600 hover:underline">Back to login</a>
                    </div>
                </div>
            </div>
        </>
    );
}
