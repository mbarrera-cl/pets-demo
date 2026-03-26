import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from '@/hooks/useTranslation';

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function GridIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    );
}

function PawIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="12" cy="13" r="4" />
            <circle cx="7"  cy="8"  r="1.5" />
            <circle cx="17" cy="8"  r="1.5" />
            <circle cx="5"  cy="13" r="1.5" />
            <circle cx="19" cy="13" r="1.5" />
        </svg>
    );
}

function UsersIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function ChevronIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    );
}

function TagIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 3h8l9 9a2 2 0 010 2.828l-5.172 5.172a2 2 0 01-2.828 0L3 11V3z" />
        </svg>
    );
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV = [
    { href: '/admin',        Icon: GridIcon,  key: 'admin.nav.dashboard', exact: true },
    { href: '/admin/pets',   Icon: PawIcon,   key: 'admin.nav.pets',      exact: false },
    { href: '/admin/users',  Icon: UsersIcon, key: 'admin.nav.users',     exact: false },
    { href: '/admin/breeds', Icon: TagIcon,   key: 'admin.nav.breeds',    exact: false },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
    const { url } = usePage();
    const { t } = useTranslation();

    function isActive(href, exact) {
        if (exact) return url === href;
        return url === href || url.startsWith(href + '/') || url.startsWith(href + '?');
    }

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800 dark:border-gray-700 shrink-0">
                {!collapsed && (
                    <span className="font-bold text-white text-sm truncate">🐾 PetRegistry</span>
                )}
                {collapsed && <span className="text-xl mx-auto">🐾</span>}
                {/* Desktop collapse toggle */}
                <button
                    onClick={onToggleCollapse}
                    className="hidden lg:flex text-gray-400 hover:text-white transition p-1 rounded"
                    title={collapsed ? t('admin.nav.expand') : t('admin.nav.collapse')}
                >
                    <ChevronIcon className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
                {NAV.map(({ href, Icon, key, exact }) => {
                    const active = isActive(href, exact);
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onCloseMobile}
                            title={collapsed ? t(key) : undefined}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                                active
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-700 hover:text-white'
                            } ${collapsed ? 'justify-center' : ''}`}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            {!collapsed && <span className="truncate">{t(key)}</span>}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside
                className={`hidden lg:flex flex-col bg-gray-900 dark:bg-gray-950 transition-all duration-200 shrink-0 ${
                    collapsed ? 'w-16' : 'w-64'
                }`}
            >
                {sidebarContent}
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={onCloseMobile}
                />
            )}

            {/* Mobile drawer */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 dark:bg-gray-950 flex flex-col lg:hidden transform transition-transform duration-200 ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
