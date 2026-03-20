import { router } from '@inertiajs/react';
import { useTranslation } from '@/hooks/useTranslation';

export default function LanguageSwitcher() {
    const { locale } = useTranslation();

    function switchTo(lang) {
        router.post(`/language/${lang}`, {}, { preserveScroll: true });
    }

    return (
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
            <button
                onClick={() => switchTo('en')}
                className={`px-2.5 py-1.5 transition ${
                    locale === 'en'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
                EN
            </button>
            <button
                onClick={() => switchTo('es')}
                className={`px-2.5 py-1.5 transition ${
                    locale === 'es'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
                ES
            </button>
        </div>
    );
}
