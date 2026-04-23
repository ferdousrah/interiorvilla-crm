import { useForm, Head } from '@inertiajs/react';

export default function ChangePassword() {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/change-password');
    };

    return (
        <>
            <Head title="Change Password" />
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md card p-8">
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Change Your Password</h1>
                    <p className="text-sm text-gray-600 mb-6">You must change your password before continuing.</p>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="form-label">New Password</label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                className="form-input"
                                required
                                autoFocus
                            />
                            {errors.password && <p className="form-error">{errors.password}</p>}
                        </div>
                        <div>
                            <label className="form-label">Confirm Password</label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={e => setData('password_confirmation', e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>
                        <button type="submit" disabled={processing} className="btn-primary w-full justify-center">
                            {processing ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
