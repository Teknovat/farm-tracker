import { type Locale } from '@/i18n';

const LOCALE_STORAGE_KEY = 'farm-management-locale';

// Client-side locale preference management
export function getStoredLocale(): Locale | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
        return stored as Locale || null;
    } catch {
        return null;
    }
}

export function setStoredLocale(locale: Locale): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
        // Ignore storage errors
    }
}

export function removeStoredLocale(): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(LOCALE_STORAGE_KEY);
    } catch {
        // Ignore storage errors
    }
}

// Detect user's preferred locale from browser settings
export function detectBrowserLocale(): Locale {
    if (typeof window === 'undefined') return 'fr';

    const browserLang = navigator.language.toLowerCase();

    // Check for exact matches first
    if (browserLang.startsWith('fr')) return 'fr';
    if (browserLang.startsWith('ar')) return 'ar';
    if (browserLang.startsWith('en')) return 'en';

    // Default to French for Tunisia
    return 'fr';
}

// Get the best locale for the user
export function getBestLocale(): Locale {
    // First check stored preference
    const stored = getStoredLocale();
    if (stored) return stored;

    // Then check browser preference
    return detectBrowserLocale();
}