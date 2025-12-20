import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['fr', 'en', 'ar'] as const;
export type Locale = typeof locales[number];

// @ts-ignore - Temporary fix for version compatibility
export default getRequestConfig(async ({ requestLocale }) => {
    // Validate that the incoming `locale` parameter is valid
    // If invalid, default to 'fr'
    const validLocale = locales.includes(requestLocale as any) ? requestLocale : 'fr';

    return {
        messages: (await import(`../../messages/${validLocale}.json`)).default,
        locale: validLocale
    };
});