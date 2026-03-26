import { router, usePage } from '@inertiajs/react';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import ThemeToggle from '@/Components/ThemeToggle';

function MenuIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

export default function Topbar({ onOpenMobile, title }) {
    const { auth } = usePage().props;
    const { t } = useTranslation();

    return (
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
                {/* Mobile hamburger */}
                <button
                    onClick={onOpenMobile}
                    className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition"
                >
                    <MenuIcon className="w-5 h-5" />
                </button>
                {title && (
                    <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100 hidden sm:block">{title}</h1>
                )}
            </div>

            <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <ThemeToggle />
                <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block truncate max-w-[140px]">
                    {auth?.user?.name}
                </span>
                <button
                    onClick={() => router.post('/logout')}
                    className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                >
                    {t('nav.sign_out')}
                </button>
            </div>
        </header>
    );
}
