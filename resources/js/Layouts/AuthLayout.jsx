import LanguageSwitcher from '@/Components/LanguageSwitcher';
import ThemeToggle from '@/Components/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';

export default function AuthLayout({ title, subtitle, children }) {
    useTheme();
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-end mb-4 gap-2">
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-1">{title}</h1>
                    {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm">{subtitle}</p>}
                </div>
                {children}
            </div>
        </div>
    );
}
