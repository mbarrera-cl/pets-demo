import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/hooks/useTranslation';

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    dog: { emoji: '🐶', badge: 'bg-amber-100 text-amber-700'   },
    cat: { emoji: '🐱', badge: 'bg-purple-100 text-purple-700' },
};

// ─── Health condition card ─────────────────────────────────────────────────────

function ConditionCard({ condition, index, t }) {
    return (
        <div className="rounded-xl border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-4 space-y-2">
            <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{condition.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{condition.description}</p>
                </div>
            </div>
            {condition.symptoms && (
                <div className="pl-9">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('admin.health.symptoms')}</p>
                    <p className="text-xs text-gray-600">{condition.symptoms}</p>
                </div>
            )}
            {condition.prevention && (
                <div className="pl-9">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('admin.health.prevention')}</p>
                    <p className="text-xs text-gray-600">{condition.prevention}</p>
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Show({ pet, healthInfo: initialHealth }) {
    const { t } = useTranslation();
    const [health,  setHealth]  = useState(initialHealth ?? null);
    const [loading, setLoading] = useState(!initialHealth && !!pet.breed);
    const [error,   setError]   = useState(false);

    const cfg      = TYPE_CONFIG[pet.type] ?? { emoji: '🐾', badge: 'bg-gray-100 text-gray-600' };
    const typeLabel = pet.type === 'dog' ? t('pets.create.dog_label') : t('pets.create.cat_label');

    const ageText = pet.age === 0
        ? t('admin.pet_show.age_less_1')
        : t('admin.pet_show.age_years').replace(':age', pet.age);

    async function fetchHealth(refresh = false) {
        setLoading(true);
        setError(false);
        try {
            const url = `/admin/pets/${pet.id}/health-insights${refresh ? '?refresh=1' : ''}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setHealth(data.conditions ?? []);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!initialHealth && pet.breed) {
            fetchHealth();
        }
    }, []);

    return (
        <AdminLayout title={pet.name}>
            <div className="max-w-3xl space-y-6">

                {/* Back link */}
                <Link
                    href="/admin/pets"
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition"
                >
                    {t('admin.pet_show.back')}
                </Link>

                {/* Pet info card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                    <div className="flex items-start gap-4">
                        <div className="text-5xl">{cfg.emoji}</div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pet.name}</h1>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                                    {typeLabel}
                                </span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                {pet.breed || <span className="italic">{t('admin.pet_show.no_breed')}</span>}
                                {' · '}
                                {ageText}
                            </p>
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    {t('admin.pet_show.owner_label')}
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{pet.owner_name}</p>
                                <p className="text-xs text-gray-400">{pet.owner_email}</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                {t('admin.pet_show.registered')}{' '}
                                {new Date(pet.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'long', day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Health section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                    {/* Section header */}
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                🏥 {t('admin.health.title')}
                            </h2>
                            {pet.breed && (
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {t('admin.health.subtitle').replace(':breed', pet.breed)}
                                </p>
                            )}
                        </div>
                        {pet.breed && !loading && (
                            <button
                                onClick={() => fetchHealth(true)}
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition font-medium"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {t('admin.health.refresh')}
                            </button>
                        )}
                    </div>

                    {/* No breed */}
                    {!pet.breed && (
                        <div className="flex items-center gap-3 py-8 justify-center text-center">
                            <p className="text-sm text-gray-400">{t('admin.health.no_breed')}</p>
                        </div>
                    )}

                    {/* Loading */}
                    {pet.breed && loading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <svg className="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <p className="text-sm text-gray-400">{t('admin.health.loading')}</p>
                        </div>
                    )}

                    {/* Error */}
                    {pet.breed && !loading && error && (
                        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 text-center">
                            {t('admin.health.error')}
                        </div>
                    )}

                    {/* No data */}
                    {pet.breed && !loading && !error && health !== null && health.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-8">{t('admin.health.no_data')}</p>
                    )}

                    {/* Conditions */}
                    {pet.breed && !loading && !error && health && health.length > 0 && (
                        <div className="space-y-3">
                            {health.map((condition, i) => (
                                <ConditionCard key={i} condition={condition} index={i} t={t} />
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    {pet.breed && !loading && !error && health && health.length > 0 && (
                        <p className="text-xs text-gray-300 text-right mt-4">
                            {t('admin.health.powered_by')}
                        </p>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
