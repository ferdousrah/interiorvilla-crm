import { useForm, Head } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email: email || '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/reset-password');
    };

    return (
        <>
            <Head title="Reset Password" />
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md card p-8">
                    <h1 className="text-xl font-bold text-gray-900 mb-6">Reset Password</h1>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="form-label">Email</label>
                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="form-input" required />
                            {errors.email && <p className="form-error">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="form-label">New Password</label>
                            <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="form-input" required />
                            {errors.password && <p className="form-error">{errors.password}</p>}
                        </div>
                        <div>
                            <label className="form-label">Confirm Password</label>
                            <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} className="form-input" required />
                        </div>
                        <button type="submit" disabled={processing} className="btn-primary w-full justify-center">
                            {processing ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
