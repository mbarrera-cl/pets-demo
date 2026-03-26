import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Admin/Pagination';
import { useTranslation } from '@/hooks/useTranslation';

export default function Index({ breeds, filters = {} }) {
    const { t } = useTranslation();

    const [search, setSearch] = useState(filters.search ?? '');
    const [type,   setType]   = useState(filters.type   ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [sort,   setSort]   = useState(filters.sort   ?? 'type');

    const [confirmingDelete, setConfirmingDelete] = useState(null);

    const hasFilters = !!(filters.search || filters.type || filters.status);

    function applyFilters(overrides = {}) {
        const params = { search, type, status, sort, ...overrides };
        Object.keys(params).forEach((k) => !params[k] && delete params[k]);
        router.get('/admin/breeds', params, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch(''); setType(''); setStatus(''); setSort('type');
        router.get('/admin/breeds');
    }

    function handleDelete(breedId) {
        router.delete(`/admin/breeds/${breedId}`, { preserveScroll: true });
        setConfirmingDelete(null);
    }

    return (
        <AdminLayout title={t('admin.breeds.title')}>
            <div className="space-y-6 max-w-6xl">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.breeds.title')}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{t('admin.breeds.subtitle')}</p>
                    </div>
                    <Link
                        href="/admin/breeds/create"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-purple-700 transition self-start sm:self-auto"
                    >
                        + {t('admin.breeds.add_breed')}
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                        {/* Search */}
                        <div className="flex-1 relative min-w-0">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                                placeholder={t('admin.breeds.search_placeholder')}
                                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                            />
                        </div>

                        {/* Type filter */}
                        <select
                            value={type}
                            onChange={(e) => { setType(e.target.value); applyFilters({ type: e.target.value }); }}
                            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 dark:text-white text-gray-600 transition shrink-0"
                        >
                            <option value="">{t('admin.breeds.filter_all')}</option>
                            <option value="dog">{t('admin.breeds.filter_dogs')}</option>
                            <option value="cat">{t('admin.breeds.filter_cats')}</option>
                        </select>

                        {/* Status filter */}
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
                            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 dark:text-white text-gray-600 transition shrink-0"
                        >
                            <option value="">{t('admin.breeds.filter_all')}</option>
                            <option value="active">{t('admin.breeds.filter_active')}</option>
                            <option value="inactive">{t('admin.breeds.filter_inactive')}</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sort}
                            onChange={(e) => { setSort(e.target.value); applyFilters({ sort: e.target.value }); }}
                            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 dark:text-white text-gray-600 transition shrink-0"
                        >
                            <option value="type">{t('admin.breeds.sort_default')}</option>
                            <option value="name">{t('admin.breeds.sort_name')}</option>
                            <option value="newest">{t('admin.breeds.sort_newest')}</option>
                        </select>

                        <button
                            onClick={() => applyFilters()}
                            className="px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shrink-0"
                        >
                            {t('admin.breeds.search_btn')}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    {breeds.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <p className="text-5xl mb-4">🏷️</p>
                            <h3 className="text-lg font-semibold text-gray-700 mb-1">{t('admin.breeds.empty_title')}</h3>
                            <p className="text-sm text-gray-400 mb-4">{t('admin.breeds.empty_subtitle')}</p>
                            {hasFilters && (
                                <button onClick={clearFilters} className="text-sm text-indigo-600 font-medium hover:underline">
                                    {t('admin.breeds.clear_filters')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        <th className="px-5 py-3">{t('admin.breeds.col_name')}</th>
                                        <th className="px-5 py-3">{t('admin.breeds.col_type')}</th>
                                        <th className="px-5 py-3">{t('admin.breeds.col_status')}</th>
                                        <th className="px-5 py-3">{t('admin.breeds.col_order')}</th>
                                        <th className="px-5 py-3 text-right">{t('admin.breeds.col_actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {breeds.data.map((breed) => (
                                        <tr key={breed.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                            <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{breed.name}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                                    breed.type === 'dog'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                    {breed.type === 'dog' ? '🐶 Dog' : '🐱 Cat'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                                    breed.is_active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-600'
                                                }`}>
                                                    {breed.is_active ? t('admin.breeds.status_active') : t('admin.breeds.status_inactive')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-400 text-xs">{breed.sort_order}</td>
                                            <td className="px-5 py-3.5">
                                                {confirmingDelete === breed.id ? (
                                                    <div className="flex items-center justify-end gap-2 animate-in fade-in duration-150">
                                                        <span className="text-xs text-gray-500">{t('admin.breeds.delete_confirm')}</span>
                                                        <button
                                                            onClick={() => setConfirmingDelete(null)}
                                                            className="text-xs text-gray-400 hover:text-gray-600 transition"
                                                        >
                                                            {t('admin.breeds.cancel')}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(breed.id)}
                                                            className="text-xs font-semibold text-red-500 hover:text-red-700 transition"
                                                        >
                                                            {t('admin.breeds.confirm_delete')}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-3">
                                                        <Link
                                                            href={`/admin/breeds/${breed.id}/edit`}
                                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                                                        >
                                                            {t('admin.breeds.edit')}
                                                        </Link>
                                                        <button
                                                            onClick={() => setConfirmingDelete(breed.id)}
                                                            className="text-xs text-gray-400 hover:text-red-500 transition"
                                                        >
                                                            {t('admin.breeds.delete')}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <Pagination links={breeds.links} />
            </div>
        </AdminLayout>
    );
}
