import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Admin/Pagination';
import { useTranslation } from '@/hooks/useTranslation';

export default function Index({ users, filters = {}, adminCount }) {
    const { auth } = usePage().props;
    const { t } = useTranslation();

    const [search, setSearch] = useState(filters.search ?? '');
    const [role,   setRole]   = useState(filters.role   ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [sort,   setSort]   = useState(filters.sort   ?? 'newest');

    const [confirmingDelete, setConfirmingDelete] = useState(null); // user id

    const hasFilters = !!(filters.search || filters.role || filters.status);

    function applyFilters(overrides = {}) {
        const params = { search, role, status, sort, ...overrides };
        Object.keys(params).forEach((k) => !params[k] && delete params[k]);
        router.get('/admin/users', params, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch(''); setRole(''); setStatus(''); setSort('newest');
        router.get('/admin/users');
    }

    function handleDelete(userId) {
        router.delete(`/admin/users/${userId}`, { preserveScroll: true });
        setConfirmingDelete(null);
    }

    return (
        <AdminLayout title={t('admin.users.title')}>
            <div className="space-y-6 max-w-6xl">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.users.title')}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{t('admin.users.subtitle')}</p>
                    </div>
                    <Link
                        href="/admin/users/create"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-purple-700 transition self-start sm:self-auto"
                    >
                        + {t('admin.users.add_user')}
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
                                placeholder={t('admin.users.search_placeholder')}
                                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                            />
                        </div>

                        {/* Role filter */}
                        <select
                            value={role}
                            onChange={(e) => { setRole(e.target.value); applyFilters({ role: e.target.value }); }}
                            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 dark:text-white text-gray-600 transition shrink-0"
                        >
                            <option value="">{t('admin.users.filter_all')}</option>
                            <option value="admin">{t('admin.users.filter_admins')}</option>
                            <option value="user">{t('admin.users.filter_users')}</option>
                        </select>

                        {/* Status filter */}
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
                            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 dark:text-white text-gray-600 transition shrink-0"
                        >
                            <option value="">{t('admin.users.filter_all')}</option>
                            <option value="active">{t('admin.users.filter_active')}</option>
                            <option value="inactive">{t('admin.users.filter_inactive')}</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sort}
                            onChange={(e) => { setSort(e.target.value); applyFilters({ sort: e.target.value }); }}
                            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 dark:text-white text-gray-600 transition shrink-0"
                        >
                            <option value="newest">{t('admin.users.sort_newest')}</option>
                            <option value="oldest">{t('admin.users.sort_oldest')}</option>
                            <option value="name">{t('admin.users.sort_name')}</option>
                        </select>

                        <button
                            onClick={() => applyFilters()}
                            className="px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shrink-0"
                        >
                            {t('admin.users.search_btn')}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    {users.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <p className="text-5xl mb-4">👤</p>
                            <h3 className="text-lg font-semibold text-gray-700 mb-1">{t('admin.users.empty_title')}</h3>
                            <p className="text-sm text-gray-400 mb-4">{t('admin.users.empty_subtitle')}</p>
                            {hasFilters && (
                                <button onClick={clearFilters} className="text-sm text-indigo-600 font-medium hover:underline">
                                    {t('admin.users.clear_filters')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        <th className="px-5 py-3">{t('admin.users.col_user')}</th>
                                        <th className="px-5 py-3">{t('admin.users.col_role')}</th>
                                        <th className="px-5 py-3">{t('admin.users.col_status')}</th>
                                        <th className="px-5 py-3">{t('admin.users.col_joined')}</th>
                                        <th className="px-5 py-3 text-right">{t('admin.users.col_actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {users.data.map((user) => {
                                        const isSelf = user.id === auth?.user?.id;
                                        const isLastAdmin = user.role === 'admin' && adminCount <= 1;

                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                            <span className="text-xs font-bold text-indigo-600">
                                                                {user.name?.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                                {user.name}
                                                                {isSelf && <span className="ml-1.5 text-xs text-gray-400">(you)</span>}
                                                            </p>
                                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                                        user.role === 'admin'
                                                            ? 'bg-indigo-100 text-indigo-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {user.role === 'admin' ? t('admin.users.role_admin') : t('admin.users.role_user')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                                        user.is_active
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-600'
                                                    }`}>
                                                        {user.is_active ? t('admin.users.status_active') : t('admin.users.status_inactive')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                                                    {new Date(user.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric', month: 'short', day: 'numeric',
                                                    })}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {confirmingDelete === user.id ? (
                                                        <div className="flex items-center justify-end gap-2 animate-in fade-in duration-150">
                                                            {isLastAdmin && (
                                                                <span className="text-xs text-amber-600 font-medium">Last admin!</span>
                                                            )}
                                                            <span className="text-xs text-gray-500">{t('admin.users.delete_confirm')}</span>
                                                            <button
                                                                onClick={() => setConfirmingDelete(null)}
                                                                className="text-xs text-gray-400 hover:text-gray-600 transition"
                                                            >
                                                                {t('admin.users.cancel')}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(user.id)}
                                                                className="text-xs font-semibold text-red-500 hover:text-red-700 transition"
                                                            >
                                                                {t('admin.users.confirm_delete')}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-3">
                                                            <Link
                                                                href={`/admin/users/${user.id}/edit`}
                                                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                                                            >
                                                                {t('admin.users.edit')}
                                                            </Link>
                                                            {!isSelf && (
                                                                <button
                                                                    onClick={() => setConfirmingDelete(user.id)}
                                                                    className="text-xs text-gray-400 hover:text-red-500 transition"
                                                                >
                                                                    {t('admin.users.delete')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <Pagination links={users.links} />
            </div>
        </AdminLayout>
    );
}
