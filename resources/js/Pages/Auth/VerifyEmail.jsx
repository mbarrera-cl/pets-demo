import { useForm, usePage } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function VerifyEmail() {
    const { flash, auth } = usePage().props;
    const { t } = useTranslation();
    const { post: resend, processing: resending } = useForm({});
    const { post: logout, processing: loggingOut } = useForm({});

    function handleResend(e) {
        e.preventDefault();
        resend('/email/verification-notification');
    }

    function handleLogout(e) {
        e.preventDefault();
        logout('/logout');
    }

    return (
        <AuthLayout title={t('auth.verify.title')} subtitle={`We sent a link to ${auth?.user?.email}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5 text-center">
                <div className="text-5xl">📧</div>

                <p className="text-sm text-gray-600">
                    {t('auth.verify.description')}
                </p>

                {flash?.status && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
                        {flash.status}
                    </div>
                )}

                <form onSubmit={handleResend}>
                    <button
                        type="submit"
                        disabled={resending}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {resending && (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        )}
                        {resending ? t('auth.verify.resending') : t('auth.verify.resend')}
                    </button>
                </form>

                <form onSubmit={handleLogout}>
                    <button
                        type="submit"
                        disabled={loggingOut}
                        className="text-sm text-gray-400 hover:text-gray-600 hover:underline transition"
                    >
                        {t('auth.verify.sign_out')}
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
}
