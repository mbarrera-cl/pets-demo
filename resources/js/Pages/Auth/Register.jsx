import { useForm, Link, usePage } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function Register() {
    const { flash } = usePage().props;
    const { t } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/register', {
            onFinish: () => {
                setData('password', '');
                setData('password_confirmation', '');
            },
        });
    }

    return (
        <AuthLayout title={t('auth.register.title')} subtitle={t('auth.register.subtitle')}>
            {flash?.error && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm">
                    {flash.error}
                </div>
            )}

            {Object.keys(errors).length > 0 && (
                <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
                    <h3 className="text-sm font-semibold text-red-800 mb-2">{t('auth.register.fix_errors')}</h3>
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
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('auth.register.name')} <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        disabled={processing}
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder={t('auth.register.name_placeholder')}
                        autoComplete="name"
                        autoFocus
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('auth.register.email')} <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="email"
                        disabled={processing}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="e.g. jane@example.com"
                        autoComplete="email"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('auth.register.password')} <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="password"
                        disabled={processing}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder={t('auth.register.password_placeholder')}
                        autoComplete="new-password"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
                    <p className="mt-1 text-xs text-gray-400">{t('auth.register.password_hint')}</p>
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('auth.register.confirm_password')} <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="password"
                        disabled={processing}
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder={t('auth.register.confirm_placeholder')}
                        autoComplete="new-password"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500/30 ${
                            errors.password_confirmation ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                        }`}
                    />
                    {errors.password_confirmation && (
                        <p className="mt-1.5 text-xs text-red-500">{errors.password_confirmation}</p>
                    )}
                </div>

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
                    {processing ? t('auth.register.submitting') : t('auth.register.submit')}
                </button>

                <p className="text-center text-sm text-gray-500">
                    {t('auth.register.has_account')}{' '}
                    <Link href="/login" className="text-indigo-600 font-medium hover:underline">
                        {t('auth.register.sign_in')}
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
