import { useState } from 'react';
import { Link, router, usePage, useForm } from '@inertiajs/react';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from '@/Components/LanguageSwitcher';

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ emoji, label, value, gradient }) {
    return (
        <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-sm`}>
            <p className="text-3xl mb-1">{emoji}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm opacity-80">{label}</p>
        </div>
    );
}

// ─── PetCard ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    dog: { emoji: '🐶', bgColor: 'bg-amber-50  border-amber-100',  badge: 'bg-amber-100  text-amber-700'  },
    cat: { emoji: '🐱', bgColor: 'bg-purple-50 border-purple-100', badge: 'bg-purple-100 text-purple-700' },
};

function PetCard({ pet, onDelete, t }) {
    const cfg = TYPE_CONFIG[pet.type];
    const [confirming, setConfirming] = useState(false);

    const typeLabel = pet.type === 'dog' ? t('pets.create.dog_label') : t('pets.create.cat_label');

    return (
        <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className={`${cfg.bgColor} border-b px-5 py-4 flex items-center justify-between`}>
                <span className="text-4xl">{cfg.emoji}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                    {typeLabel}
                </span>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3 flex-1">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
                    {pet.breed
                        ? <p className="text-sm text-gray-500">{pet.breed}</p>
                        : <p className="text-sm text-gray-400 italic">{t('pets.index.no_breed')}</p>
                    }
                </div>

                <p className="flex items-center gap-1.5 text-sm text-gray-600">
                    <span>🎂</span>
                    {pet.age === 0
                        ? t('pets.index.age_less_than_1')
                        : pet.age === 1
                        ? t('pets.index.age_1_year')
                        : t('pets.index.age_years', { age: pet.age })
                    }
                </p>

                <p className="text-xs text-gray-400">
                    {t('pets.index.registered_on')} {new Date(pet.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                    })}
                </p>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-50 flex justify-end min-h-[44px] items-center">
                {!confirming ? (
                    <button
                        onClick={() => setConfirming(true)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                        {t('pets.index.remove')}
                    </button>
                ) : (
                    <div className="flex items-center gap-3 animate-in fade-in duration-150">
                        <span className="text-xs text-gray-500">{t('pets.index.are_you_sure')}</span>
                        <button
                            onClick={() => setConfirming(false)}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {t('pets.index.cancel')}
                        </button>
                        <button
                            onClick={() => onDelete(pet.id)}
                            className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                        >
                            {t('pets.index.confirm_remove')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onClear, t }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <p className="text-6xl mb-4">{hasFilters ? '🔍' : '🐾'}</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
                {hasFilters ? t('pets.index.no_results_title') : t('pets.index.empty_title')}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
                {hasFilters ? t('pets.index.no_results_subtitle') : t('pets.index.empty_subtitle')}
            </p>
            {hasFilters ? (
                <button
                    onClick={onClear}
                    className="text-sm text-indigo-600 font-medium hover:underline"
                >
                    {t('pets.index.clear_filters')}
                </button>
            ) : (
                <Link
                    href="/"
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-purple-700 transition"
                >
                    {t('pets.index.empty_btn')}
                </Link>
            )}
        </div>
    );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ links }) {
    return (
        <div className="flex items-center justify-center gap-1 mt-8">
            {links.map((link, i) => (
                <button
                    key={i}
                    disabled={!link.url || link.active}
                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        link.active
                            ? 'bg-indigo-600 text-white font-semibold'
                            : link.url
                            ? 'text-gray-600 hover:bg-gray-100'
                            : 'text-gray-300 cursor-not-allowed'
                    }`}
                />
            ))}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Index({ pets, stats, filters = {} }) {
    const { flash, auth } = usePage().props;
    const { t } = useTranslation();
    const { delete: destroy } = useForm({});

    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType]     = useState(filters.type   ?? '');
    const [sort, setSort]     = useState(filters.sort   ?? 'newest');

    const hasFilters = !!(filters.search || filters.type);

    function applyFilters(overrides = {}) {
        const params = { search, type, sort, ...overrides };
        Object.keys(params).forEach((k) => !params[k] && delete params[k]);
        router.get('/my-pets', params, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch('');
        setType('');
        setSort('newest');
        router.get('/my-pets');
    }

    function handleDelete(petId) {
        destroy(`/pets/${petId}`, { preserveScroll: true });
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">

            {/* Nav */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <span className="font-semibold text-gray-900">🐾 {t('app_name')}</span>
                        <div className="hidden sm:flex items-center gap-4 text-sm">
                            <Link
                                href="/my-pets"
                                className="text-indigo-600 font-medium border-b-2 border-indigo-600 pb-0.5"
                            >
                                {t('nav.my_pets')}
                            </Link>
                            <Link href="/" className="text-gray-500 hover:text-gray-800 transition">
                                {t('nav.register_pet')}
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        <span className="text-sm text-gray-500 hidden sm:block">{auth?.user?.name}</span>
                        <button
                            onClick={() => router.post('/logout')}
                            className="text-sm text-gray-400 hover:text-gray-700 transition"
                        >
                            {t('nav.sign_out')}
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

                {/* Flash */}
                {flash?.success && (
                    <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
                        {flash.success}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('pets.index.title')}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{t('pets.index.subtitle')}</p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-purple-700 transition self-start sm:self-auto"
                    >
                        {t('pets.index.register_btn')}
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <StatCard emoji="🐾" label={t('pets.index.stat_total')} value={stats.total} gradient="from-indigo-500 to-indigo-600" />
                    <StatCard emoji="🐶" label={t('pets.index.stat_dogs')}  value={stats.dogs}  gradient="from-amber-400  to-amber-500"  />
                    <StatCard emoji="🐱" label={t('pets.index.stat_cats')}  value={stats.cats}  gradient="from-purple-500 to-purple-600" />
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                                placeholder={t('pets.index.search_placeholder')}
                                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                            />
                        </div>

                        {/* Type tabs */}
                        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm shrink-0">
                            {[
                                { value: '',    label: t('pets.index.filter_all')  },
                                { value: 'dog', label: t('pets.index.filter_dogs') },
                                { value: 'cat', label: t('pets.index.filter_cats') },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => { setType(opt.value); applyFilters({ type: opt.value }); }}
                                    className={`px-4 py-2.5 transition ${
                                        type === opt.value
                                            ? 'bg-indigo-600 text-white font-medium'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Sort */}
                        <select
                            value={sort}
                            onChange={(e) => { setSort(e.target.value); applyFilters({ sort: e.target.value }); }}
                            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 bg-white text-gray-600 transition shrink-0"
                        >
                            <option value="newest">{t('pets.index.sort_newest')}</option>
                            <option value="oldest">{t('pets.index.sort_oldest')}</option>
                            <option value="name">{t('pets.index.sort_name')}</option>
                            <option value="age">{t('pets.index.sort_age')}</option>
                        </select>

                        {/* Search button */}
                        <button
                            onClick={() => applyFilters()}
                            className="px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shrink-0"
                        >
                            {t('pets.index.search_btn')}
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pets.data.length === 0 ? (
                        <EmptyState hasFilters={hasFilters} onClear={clearFilters} t={t} />
                    ) : (
                        pets.data.map((pet) => (
                            <PetCard key={pet.id} pet={pet} onDelete={handleDelete} t={t} />
                        ))
                    )}
                </div>

                {/* Paginación */}
                {pets.last_page > 1 && <Pagination links={pets.links} />}
            </div>
        </div>
    );
}
