'use client';

import { useLocale } from 'next-intl';
import { type Locale } from '@/i18n';
import {
    formatCurrency,
    formatNumber,
    formatDate,
    formatShortDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,
    parseDate,
} from './formatting';

export function useLocaleFormatting() {
    const locale = useLocale() as Locale;

    return {
        locale,
        formatCurrency: (amount: number) => formatCurrency(amount, locale),
        formatNumber: (number: number) => formatNumber(number, locale),
        formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => formatDate(date, locale, options),
        formatShortDate: (date: Date) => formatShortDate(date, locale),
        formatTime: (date: Date) => formatTime(date, locale),
        formatDateTime: (date: Date) => formatDateTime(date, locale),
        formatRelativeTime: (date: Date, baseDate?: Date) => formatRelativeTime(date, locale, baseDate),
        parseDate: (dateString: string) => parseDate(dateString, locale),
    };
}