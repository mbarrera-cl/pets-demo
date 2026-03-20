import { useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function ResetPassword({ token, email }) {
    const { t } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/reset-password', {
            onFinish: () => {
                setData('password', '');
                setData('password_confirmation', '');
            },
        });
    }

    return (
        <AuthLayout title={t('auth.reset.title')} subtitle={t('auth.reset.subtitle')}>
            {Object.keys(errors).length > 0 && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4">
                    <ul className="space-y-1">
                        {Object.entries(errors).map(([field, error]) => (
                            <li key={field} className="text-sm text-red-700 flex items-start gap-2">
                                <span className="text-red-500">•</span>
                                <span>{error}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                {/* Email (pre-filled) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.login.email')}</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="email"
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 outline-none"
                    />
                </div>

                {/* New Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('auth.reset.new_password')} <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="password"
                        disabled={processing}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Min 8 chars, uppercase, number, symbol"
                        autoComplete="new-password"
                        autoFocus
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
                    <p className="mt-1 text-xs text-gray-400">{t('auth.reset.password_hint')}</p>
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('auth.reset.confirm_password')} <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="password"
                        disabled={processing}
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="Repeat new password"
                        autoComplete="new-password"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.password_confirmation ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.password_confirmation && (
                        <p className="mt-1.5 text-xs text-red-500">{errors.password_confirmation}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {processing && (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    )}
                    {processing ? t('auth.reset.submitting') : t('auth.reset.submit')}
                </button>
            </form>
        </AuthLayout>
    );
}
