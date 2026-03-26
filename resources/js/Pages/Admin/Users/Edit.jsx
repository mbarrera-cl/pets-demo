import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function Edit({ user }) {
    const { t } = useTranslation();

    const { data, setData, put, processing, errors } = useForm({
        name:                  user.name,
        email:                 user.email,
        password:              '',
        password_confirmation: '',
        role:                  user.role,
        is_active:             user.is_active,
    });

    function submit(e) {
        e.preventDefault();
        put(`/admin/users/${user.id}`);
    }

    return (
        <AdminLayout title={t('admin.users.edit_title')}>
            <div className="max-w-xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.users.edit_title')}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('admin.users.edit_subtitle')}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                    <form onSubmit={submit} className="space-y-5">

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                {t('admin.users.field_name')}
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                {t('admin.users.field_email')}
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>

                        {/* Password (optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                {t('admin.users.field_password')}
                                <span className="ml-1.5 text-xs text-gray-400 font-normal">
                                    — {t('admin.users.field_password_hint')}
                                </span>
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                            />
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        {data.password && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                    {t('admin.users.field_confirm_password')}
                                </label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                                />
                            </div>
                        )}

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                {t('admin.users.field_role')}
                            </label>
                            <select
                                value={data.role}
                                onChange={(e) => setData('role', e.target.value)}
                                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 dark:text-white text-gray-700 transition"
                            >
                                <option value="user">{t('admin.users.role_user')}</option>
                                <option value="admin">{t('admin.users.role_admin')}</option>
                            </select>
                            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
                        </div>

                        {/* Is Active */}
                        <div className="flex items-center gap-3">
                            <input
                                id="is_active"
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {t('admin.users.field_is_active')}
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition"
                            >
                                {processing ? t('admin.users.btn_saving') : t('admin.users.btn_save')}
                            </button>
                            <Link
                                href="/admin/users"
                                className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition"
                            >
                                {t('admin.users.btn_cancel')}
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
