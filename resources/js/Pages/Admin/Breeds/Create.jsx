import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function Create() {
    const { t } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        name:       '',
        type:       'dog',
        is_active:  true,
        sort_order: 0,
    });

    function submit(e) {
        e.preventDefault();
        post('/admin/breeds');
    }

    return (
        <AdminLayout title={t('admin.breeds.create_title')}>
            <div className="max-w-xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.breeds.create_title')}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('admin.breeds.create_subtitle')}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                    <form onSubmit={submit} className="space-y-5">

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                {t('admin.breeds.field_name')}
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                {t('admin.breeds.field_type')}
                            </label>
                            <select
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 dark:text-white text-gray-700 transition"
                            >
                                <option value="dog">🐶 Dog</option>
                                <option value="cat">🐱 Cat</option>
                            </select>
                            {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
                        </div>

                        {/* Sort Order */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                                {t('admin.breeds.field_sort_order')}
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="999"
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                            />
                            <p className="text-xs text-gray-400 mt-1">{t('admin.breeds.field_order_hint')}</p>
                            {errors.sort_order && <p className="text-xs text-red-500 mt-1">{errors.sort_order}</p>}
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
                                {t('admin.breeds.field_is_active')}
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition"
                            >
                                {processing ? t('admin.breeds.btn_creating') : t('admin.breeds.btn_create')}
                            </button>
                            <Link
                                href="/admin/breeds"
                                className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition"
                            >
                                {t('admin.breeds.btn_cancel')}
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
