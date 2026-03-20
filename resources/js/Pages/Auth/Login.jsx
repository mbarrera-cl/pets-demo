import { useForm, Link, usePage } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function Login() {
    const { flash } = usePage().props;
    const { t } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e) {
        e.preventDefault();
        post('/login', {
            onFinish: () => setData('password', ''),
        });
    }

    return (
        <AuthLayout title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
            {flash?.error && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm">
                    {flash.error}
                </div>
            )}

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
                    {flash.success}
                </div>
            )}

            <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.login.email')}</label>
                    <input
                        type="email"
                        disabled={processing}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="jane@example.com"
                        autoComplete="email"
                        autoFocus
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                    <div className="flex justify-between mb-1.5">
                        <label className="text-sm font-medium text-gray-700">{t('auth.login.password')}</label>
                        <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                            {t('auth.login.forgot_password')}
                        </Link>
                    </div>
                    <input
                        type="password"
                        disabled={processing}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Your password"
                        autoComplete="current-password"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">{t('auth.login.remember_me')}</span>
                </label>

                {/* Submit */}
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
                    {processing ? t('auth.login.submitting') : t('auth.login.submit')}
                </button>

                <p className="text-center text-sm text-gray-500">
                    {t('auth.login.no_account')}{' '}
                    <Link href="/register" className="text-indigo-600 font-medium hover:underline">
                        {t('auth.login.create_one')}
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
