import { getTranslations } from 'next-intl/server'
import { NextRequest } from 'next/server'

export type Locale = 'fr' | 'en' | 'ar'

/**
 * Extract locale from request headers
 */
export function getLocaleFromRequest(request?: NextRequest): Locale {
    if (!request) return 'fr' // default fallback

    const pathname = request.nextUrl?.pathname || ''

    // Extract locale from URL path (e.g., /fr/..., /en/..., /ar/...)
    const localeMatch = pathname.match(/^\/(fr|en|ar)(\/|$)/)
    if (localeMatch) {
        return localeMatch[1] as Locale
    }

    // Fallback to accept-language header
    const acceptLanguage = request.headers.get('accept-language')
    if (acceptLanguage) {
        if (acceptLanguage.includes('ar')) return 'ar'
        if (acceptLanguage.includes('en')) return 'en'
    }

    return 'fr' // default
}

/**
 * Get translated error message for a given error code
 */
export async function getErrorMessage(
    code: string,
    locale: Locale = 'fr',
    params?: Record<string, string | number>
): Promise<string> {
    try {
        const t = await getTranslations({ locale, namespace: 'errors' })

        // Convert error code to translation key (e.g., INVALID_STATUS_TRANSITION -> invalidStatusTransition)
        const key = code
            .split('_')
            .map((part, index) =>
                index === 0
                    ? part.toLowerCase()
                    : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            )
            .join('')

        let message = t(key)

        // If translation not found, try with the original code
        if (message === key) {
            message = t(code.toLowerCase())
        }

        // If still not found, use generic error
        if (message === code.toLowerCase() || message === key) {
            message = t('generic')
        }

        // Replace parameters in message
        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                message = message.replace(`{${paramKey}}`, String(value))
            })
        }

        return message
    } catch (error) {
        // Fallback to English or code itself
        return code.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
    }
}

/**
 * Get translated validation message
 */
export async function getValidationMessage(
    key: string,
    locale: Locale = 'fr',
    params?: Record<string, string | number>
): Promise<string> {
    try {
        const t = await getTranslations({ locale, namespace: 'validation' })
        let message = t(key)

        // Replace parameters in message
        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                message = message.replace(`{${paramKey}}`, String(value))
            })
        }

        return message
    } catch (error) {
        return key
    }
}

/**
 * Error code to translation key mapping
 */
export const ERROR_CODE_MAP: Record<string, string> = {
    // Auth errors
    'UNAUTHORIZED': 'unauthorized',
    'FORBIDDEN': 'forbidden',
    'NOT_FOUND': 'notFound',
    'INVALID_CREDENTIALS': 'invalidCredentials',

    // Animal errors
    'INVALID_STATUS_TRANSITION': 'invalidStatusTransition',
    'HAS_ACTIVE_EVENTS': 'hasActiveEvents',
    'HAS_EVENTS': 'hasEvents',
    'INACTIVE_TARGET': 'inactiveTarget',
    'TARGET_NOT_FOUND': 'animalNotFound',
    'ANIMAL_NOT_FOUND': 'animalNotFound',

    // Event errors
    'FUTURE_EVENT_NOT_ALLOWED': 'futureEventNotAllowed',
    'ALREADY_DEAD': 'alreadyDead',
    'ALREADY_SOLD': 'alreadySold',
    'CANNOT_SELL_DEAD': 'cannotSellDead',
    'SALE_REQUIRES_COST': 'saleRequiresCost',
    'BIRTH_NOT_FOR_LOTS': 'birthNotForLots',
    'BIRTH_EVENT_EXISTS': 'birthEventExists',
    'DEATH_EVENT_EXISTS': 'deathEventExists',
    'EVENT_NOT_FOUND': 'eventNotFound',

    // Cashbox errors
    'INSUFFICIENT_BALANCE': 'insufficientBalance',
    'CREDIT_EXPENSE_NOT_FOUND': 'creditExpenseNotFound',
    'ALREADY_REIMBURSED': 'alreadyReimbursed',
    'EXCEEDS_REMAINING_DEBT': 'exceedsRemainingDebt',
    'INVALID_REIMBURSEMENT_AMOUNT': 'invalidReimbursementAmount',
    'INVALID_AMOUNT': 'invalidAmount',

    // Member errors
    'MEMBER_NOT_FOUND': 'memberNotFound',
    'LAST_OWNER_REMOVAL': 'lastOwnerRemoval',
    'LAST_OWNER_ROLE_CHANGE': 'lastOwnerRoleChange',

    // Lot errors
    'NOT_A_LOT': 'notALot',
    'INSUFFICIENT_LOT_COUNT': 'insufficientLotCount',
    'LOT_COUNT_ZERO': 'lotCountZero',

    // Export errors
    'EXPORT_PERMISSION_DENIED': 'exportPermissionDenied',
    'FINANCIAL_EXPORT_RESTRICTED': 'financialExportRestricted',

    // Farm errors
    'FARM_NOT_FOUND': 'farmNotFound',

    // Database errors
    'DUPLICATE_RESOURCE': 'duplicateResource',
    'INVALID_REFERENCE': 'invalidReference',
    'MISSING_REQUIRED_FIELD': 'missingRequiredField',
    'CHECK_CONSTRAINT_VIOLATION': 'checkConstraintViolation',

    // Validation errors
    'VALIDATION_ERROR': 'validationError',
    'BAD_REQUEST': 'validationError',

    // Generic errors
    'INTERNAL_ERROR': 'serverError',
    'UNKNOWN_ERROR': 'generic'
}

/**
 * Get translation key from error code
 */
export function getTranslationKey(code: string): string {
    return ERROR_CODE_MAP[code] || ERROR_CODE_MAP['UNKNOWN_ERROR']
}
