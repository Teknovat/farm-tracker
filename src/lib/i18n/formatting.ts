import { type Locale } from '@/i18n';

// Currency formatting for different locales
export function formatCurrency(amount: number, locale: Locale): string {
    const formatters: Record<Locale, Intl.NumberFormat> = {
        fr: new Intl.NumberFormat('fr-TN', {
            style: 'currency',
            currency: 'TND',
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        }),
        en: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'TND',
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        }),
        ar: new Intl.NumberFormat('ar-TN', {
            style: 'currency',
            currency: 'TND',
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        }),
    };

    return formatters[locale].format(amount);
}

// Number formatting for different locales
export function formatNumber(number: number, locale: Locale): string {
    const formatters: Record<Locale, Intl.NumberFormat> = {
        fr: new Intl.NumberFormat('fr-TN'),
        en: new Intl.NumberFormat('en-US'),
        ar: new Intl.NumberFormat('ar-TN'),
    };

    return formatters[locale].format(number);
}

// Date formatting for different locales
export function formatDate(date: Date, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    const formatters: Record<Locale, Intl.DateTimeFormat> = {
        fr: new Intl.DateTimeFormat('fr-TN', { ...defaultOptions, ...options }),
        en: new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }),
        ar: new Intl.DateTimeFormat('ar-TN', { ...defaultOptions, ...options }),
    };

    return formatters[locale].format(date);
}

// Short date formatting (for tables and compact displays)
export function formatShortDate(date: Date, locale: Locale): string {
    return formatDate(date, locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

// Time formatting
export function formatTime(date: Date, locale: Locale): string {
    const formatters: Record<Locale, Intl.DateTimeFormat> = {
        fr: new Intl.DateTimeFormat('fr-TN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }),
        en: new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }),
        ar: new Intl.DateTimeFormat('ar-TN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }),
    };

    return formatters[locale].format(date);
}

// DateTime formatting
export function formatDateTime(date: Date, locale: Locale): string {
    return `${formatDate(date, locale)} ${formatTime(date, locale)}`;
}

// Relative time formatting (e.g., "2 days ago", "in 3 hours")
export function formatRelativeTime(date: Date, locale: Locale, baseDate: Date = new Date()): string {
    const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar-TN' : locale === 'fr' ? 'fr-TN' : 'en-US', {
        numeric: 'auto',
    });

    const diffInSeconds = Math.floor((date.getTime() - baseDate.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (Math.abs(diffInYears) >= 1) {
        return rtf.format(diffInYears, 'year');
    } else if (Math.abs(diffInMonths) >= 1) {
        return rtf.format(diffInMonths, 'month');
    } else if (Math.abs(diffInWeeks) >= 1) {
        return rtf.format(diffInWeeks, 'week');
    } else if (Math.abs(diffInDays) >= 1) {
        return rtf.format(diffInDays, 'day');
    } else if (Math.abs(diffInHours) >= 1) {
        return rtf.format(diffInHours, 'hour');
    } else if (Math.abs(diffInMinutes) >= 1) {
        return rtf.format(diffInMinutes, 'minute');
    } else {
        return rtf.format(diffInSeconds, 'second');
    }
}

// Parse date input based on locale
export function parseDate(dateString: string, locale: Locale): Date | null {
    try {
        // Try parsing as ISO string first
        if (dateString.includes('T') || dateString.includes('-')) {
            return new Date(dateString);
        }

        // Locale-specific parsing patterns
        const patterns: Record<Locale, RegExp[]> = {
            fr: [
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
                /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
            ],
            en: [
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
                /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY
            ],
            ar: [
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
                /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
            ],
        };

        for (const pattern of patterns[locale]) {
            const match = dateString.match(pattern);
            if (match) {
                const [, first, second, year] = match;

                // For English, first is month, second is day
                // For French and Arabic, first is day, second is month
                const day = locale === 'en' ? parseInt(second) : parseInt(first);
                const month = locale === 'en' ? parseInt(first) : parseInt(second);

                return new Date(parseInt(year), month - 1, day);
            }
        }

        // Fallback to native Date parsing
        return new Date(dateString);
    } catch {
        return null;
    }
}