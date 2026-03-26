import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import StatCard from '@/Components/Admin/StatCard';
import { useTranslation } from '@/hooks/useTranslation';

const TYPE_EMOJI = { dog: '🐶', cat: '🐱' };

function RecentPetsTable({ pets, t }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{t('admin.dashboard.recent_pets')}</h2>
                <Link href="/admin/pets" className="text-xs text-indigo-600 hover:underline">
                    {t('admin.dashboard.view_all_pets')} →
                </Link>
            </div>
            {pets.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">{t('admin.dashboard.no_recent')}</p>
            ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                    {pets.map((pet) => (
                        <div key={pet.id} className="flex items-center gap-3 px-5 py-3">
                            <span className="text-xl">{TYPE_EMOJI[pet.type] ?? '🐾'}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{pet.name}</p>
                                <p className="text-xs text-gray-400 truncate">{pet.owner_name}</p>
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">
                                {new Date(pet.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function RecentUsersTable({ users, t }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{t('admin.dashboard.recent_users')}</h2>
                <Link href="/admin/users" className="text-xs text-indigo-600 hover:underline">
                    {t('admin.dashboard.view_all_users')} →
                </Link>
            </div>
            {users.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">{t('admin.dashboard.no_recent')}</p>
            ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                    {users.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 px-5 py-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-indigo-600">
                                    {user.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{user.name}</p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                user.role === 'admin'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-gray-100 text-gray-500'
                            }`}>
                                {user.role}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Dashboard({ stats, recentPets, recentUsers }) {
    const { t } = useTranslation();

    return (
        <AdminLayout title={t('admin.dashboard.title')}>
            <div className="space-y-6 max-w-6xl">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.dashboard.title')}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{t('admin.dashboard.subtitle')}</p>
                </div>

                {/* Stats row 1 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard emoji="👤" label={t('admin.dashboard.stat_total_users')} value={stats.total_users}  gradient="from-indigo-500 to-indigo-600" />
                    <StatCard emoji="🐾" label={t('admin.dashboard.stat_total_pets')}  value={stats.total_pets}   gradient="from-purple-500 to-purple-600" />
                    <StatCard emoji="🐶" label={t('admin.dashboard.stat_dogs')}         value={stats.dogs}         gradient="from-amber-400  to-amber-500"  />
                    <StatCard emoji="🐱" label={t('admin.dashboard.stat_cats')}         value={stats.cats}         gradient="from-pink-400   to-pink-500"   />
                </div>

                {/* Stats row 2 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard emoji="✅" label={t('admin.dashboard.stat_active_users')} value={stats.active_users}  gradient="from-teal-500   to-teal-600"   />
                    <StatCard emoji="🛡️" label={t('admin.dashboard.stat_admins')}        value={stats.admin_users}   gradient="from-slate-500  to-slate-600"  />
                    <StatCard emoji="🆕" label={t('admin.dashboard.stat_new_users')}    value={stats.new_users_30d} gradient="from-cyan-500   to-cyan-600"   />
                    <StatCard emoji="📋" label={t('admin.dashboard.stat_new_pets')}     value={stats.new_pets_30d}  gradient="from-violet-500 to-violet-600" />
                </div>

                {/* Recent activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RecentPetsTable  pets={recentPets}   t={t} />
                    <RecentUsersTable users={recentUsers} t={t} />
                </div>
            </div>
        </AdminLayout>
    );
}
