import { usePage } from '@inertiajs/react';

export function useTranslation() {
    const { translations, locale } = usePage().props;

    function t(key, params = {}) {
        let text = translations?.[key] ?? key;

        Object.entries(params).forEach(([param, value]) => {
            text = text.replace(`:${param}`, value);
        });

        return text;
    }

    return { t, locale };
}
