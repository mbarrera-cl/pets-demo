import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import StatCard from '@/Components/Admin/StatCard';
import Pagination from '@/Components/Admin/Pagination';
import { useTranslation } from '@/hooks/useTranslation';

// ─── Type badge ───────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    dog: { emoji: '🐶', badge: 'bg-amber-100 text-amber-700'   },
    cat: { emoji: '🐱', badge: 'bg-purple-100 text-purple-700' },
};

function TypeBadge({ type, label }) {
    const cfg = TYPE_CONFIG[type] ?? { emoji: '🐾', badge: 'bg-gray-100 text-gray-700' };
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
            {cfg.emoji} {label}
        </span>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Index({ pets, stats, filters = {} }) {
    const { t } = useTranslation();

    const [search, setSearch] = useState(filters.search ?? '');
    const [type,   setType]   = useState(filters.type   ?? '');
    const [sort,   setSort]   = useState(filters.sort   ?? 'newest');

    const hasFilters = !!(filters.search || filters.type);

    function applyFilters(overrides = {}) {
        const params = { search, type, sort, ...overrides };
        Object.keys(params).forEach((k) => !params[k] && delete params[k]);
        router.get('/admin/pets', params, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch(''); setType(''); setSort('newest');
        router.get('/admin/pets');
    }

    return (
        <AdminLayout title={t('admin.pets.title')}>
            <div className="space-y-6 max-w-6xl">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.pets.title')}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{t('admin.pets.subtitle')}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard emoji="🐾" label={t('admin.pets.stat_total')} value={stats.total} gradient="from-indigo-500 to-indigo-600" />
                    <StatCard emoji="🐶" label={t('admin.pets.stat_dogs')}  value={stats.dogs}  gradient="from-amber-400  to-amber-500"  />
                    <StatCard emoji="🐱" label={t('admin.pets.stat_cats')}  value={stats.cats}  gradient="from-purple-500 to-purple-600" />
                    <StatCard emoji="👤" label={t('admin.pets.stat_users')} value={stats.users} gradient="from-teal-500   to-teal-600"   />
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                                placeholder={t('admin.pets.search_placeholder')}
                                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                            />
                        </div>

                        <div className="flex rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden text-sm shrink-0">
                            {[
                                { value: '',    label: t('admin.pets.filter_all')  },
                                { value: 'dog', label: t('admin.pets.filter_dogs') },
                                { value: 'cat', label: t('admin.pets.filter_cats') },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => { setType(opt.value); applyFilters({ type: opt.value }); }}
                                    className={`px-4 py-2.5 transition ${
                                        type === opt.value
                                            ? 'bg-indigo-600 text-white font-medium'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <select
                            value={sort}
                            onChange={(e) => { setSort(e.target.value); applyFilters({ sort: e.target.value }); }}
                            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 dark:text-white text-gray-600 transition shrink-0"
                        >
                            <option value="newest">{t('admin.pets.sort_newest')}</option>
                            <option value="oldest">{t('admin.pets.sort_oldest')}</option>
                            <option value="name">{t('admin.pets.sort_name')}</option>
                            <option value="age">{t('admin.pets.sort_age')}</option>
                            <option value="owner">{t('admin.pets.sort_owner')}</option>
                        </select>

                        <button
                            onClick={() => applyFilters()}
                            className="px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shrink-0"
                        >
                            {t('admin.pets.search_btn')}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    {pets.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <p className="text-6xl mb-4">🔍</p>
                            <h3 className="text-lg font-semibold text-gray-700 mb-1">{t('admin.pets.empty_title')}</h3>
                            <p className="text-sm text-gray-400 mb-6">{t('admin.pets.empty_subtitle')}</p>
                            {hasFilters && (
                                <button onClick={clearFilters} className="text-sm text-indigo-600 font-medium hover:underline">
                                    {t('admin.pets.clear_filters')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        <th className="px-5 py-3">{t('admin.pets.col_pet')}</th>
                                        <th className="px-5 py-3">{t('admin.pets.col_type')}</th>
                                        <th className="px-5 py-3">{t('admin.pets.col_breed')}</th>
                                        <th className="px-5 py-3">{t('admin.pets.col_age')}</th>
                                        <th className="px-5 py-3">{t('admin.pets.col_owner')}</th>
                                        <th className="px-5 py-3">{t('admin.pets.col_date')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {pets.data.map((pet) => {
                                        const cfg = TYPE_CONFIG[pet.type] ?? { emoji: '🐾' };
                                        const typeLabel = pet.type === 'dog'
                                            ? t('pets.create.dog_label')
                                            : t('pets.create.cat_label');
                                        const ageText = pet.age === 0
                                            ? t('admin.pets.age_less_than_1')
                                            : pet.age === 1
                                            ? t('admin.pets.age_1_year')
                                            : t('admin.pets.age_years').replace(':age', pet.age);

                                        return (
                                            <tr
                                                key={pet.id}
                                                onClick={() => router.visit(`/admin/pets/${pet.id}`)}
                                                className="hover:bg-indigo-50 dark:hover:bg-gray-700 transition cursor-pointer"
                                            >
                                                <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">
                                                    <span className="mr-2">{cfg.emoji}</span>
                                                    {pet.name}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <TypeBadge type={pet.type} label={typeLabel} />
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-500">
                                                    {pet.breed || t('admin.pets.no_breed')}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-500">{ageText}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className="block text-gray-900 font-medium">{pet.owner_name}</span>
                                                    <span className="block text-xs text-gray-400">{pet.owner_email}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                                                    {new Date(pet.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric', month: 'short', day: 'numeric',
                                                    })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <Pagination links={pets.links} />
            </div>
        </AdminLayout>
    );
}
