import { useForm, usePage, router, Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import ThemeToggle from '@/Components/ThemeToggle';
import BreedSelect from '@/Components/BreedSelect';
import { useTheme } from '@/hooks/useTheme';

export default function Create({ breeds = [] }) {
    const { flash, auth } = usePage().props;
    const { t } = useTranslation();
    useTheme();

    const PET_TYPES = [
        { value: 'dog', emoji: '🐶', label: t('pets.create.dog_label'), description: t('pets.create.dog_desc') },
        { value: 'cat', emoji: '🐱', label: t('pets.create.cat_label'), description: t('pets.create.cat_desc') },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        type: '',
        breed: '',
        age: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/pets', { onSuccess: () => reset() });
    }

    function logout(e) {
        e.preventDefault();
        router.post('/logout');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-1">{t('pets.create.title')}</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('pets.create.subtitle')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                            <LanguageSwitcher />
                            <ThemeToggle />
                        </div>
                        <Link
                            href="/my-pets"
                            className="text-sm text-indigo-600 font-medium hover:underline"
                        >
                            {t('pets.create.view_my_pets')}
                        </Link>
                        <button
                            onClick={logout}
                            className="text-xs text-gray-400 hover:text-gray-600 transition"
                        >
                            {t('nav.sign_out')} ({auth?.user?.name})
                        </button>
                    </div>
                </div>

                {/* Flash messages */}
                {flash?.success && (
                    <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm font-medium">
                        {flash.error}
                    </div>
                )}

                {/* Error Summary */}
                {Object.keys(errors).length > 0 && (
                    <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
                        <h3 className="text-sm font-semibold text-red-800 mb-3">{t('auth.register.fix_errors')}</h3>
                        <ul className="space-y-2">
                            {Object.entries(errors).map(([field, error]) => (
                                <li key={field} className="text-sm text-red-700 flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">•</span>
                                    <span>{error}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <form
                    onSubmit={submit}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-5"
                >
                    {/* Pet type selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            {t('pets.create.type_label')} <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {PET_TYPES.map((pt) => (
                                <button
                                    key={pt.value}
                                    type="button"
                                    disabled={processing}
                                    onClick={() => setData((prev) => ({ ...prev, type: pt.value, breed: '' }))}
                                    className={`flex flex-col items-center gap-1 rounded-xl border-2 py-4 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                        data.type === pt.value
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <span className="text-3xl">{pt.emoji}</span>
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{pt.label}</span>
                                    <span className="text-xs text-gray-400">{pt.description}</span>
                                </button>
                            ))}
                        </div>
                        {errors.type && <p className="mt-1.5 text-xs text-red-500">{errors.type}</p>}
                    </div>

                    {/* Pet name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                            {t('pets.create.name_label')} <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            disabled={processing}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={t('pets.create.name_placeholder')}
                            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500/30 ${
                                errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                            }`}
                        />
                        {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Breed + Age */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t('pets.create.breed_label')}</label>
                            <BreedSelect
                                type={data.type}
                                value={data.breed}
                                onChange={(v) => setData('breed', v)}
                                disabled={processing}
                                hasError={!!errors.breed}
                                t={t}
                                breeds={breeds}
                            />
                            {errors.breed && <p className="mt-1.5 text-xs text-red-500">{errors.breed}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                {t('pets.create.age_label')} <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                disabled={processing}
                                value={data.age}
                                onChange={(e) => setData('age', e.target.value)}
                                placeholder={t('pets.create.age_placeholder')}
                                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500/30 ${
                                    errors.age ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-indigo-400'
                                }`}
                            />
                            {errors.age && <p className="mt-1.5 text-xs text-red-500">{errors.age}</p>}
                        </div>
                    </div>

                    {/* Owner info — read-only, taken from auth user */}
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            {t('pets.create.owner_section')}
                        </p>
                        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            <p><span className="font-medium text-gray-700 dark:text-gray-200">{auth?.user?.name}</span></p>
                            <p className="text-gray-500">{auth?.user?.email}</p>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {processing && (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        )}
                        {processing ? t('pets.create.submitting') : t('pets.create.submit')}
                    </button>
                </form>
            </div>
        </div>
    );
}
