import LanguageSwitcher from '@/Components/LanguageSwitcher';

export default function AuthLayout({ title, subtitle, children }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-end mb-4">
                    <LanguageSwitcher />
                </div>
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900 mb-1">{title}</h1>
                    {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
                </div>
                {children}
            </div>
        </div>
    );
}
