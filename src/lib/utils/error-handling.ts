import { type ApiResponse } from '@/lib/types'
import { type Locale } from '@/i18n/request'
import { getErrorMessage } from '@/lib/middleware/error-messages'

// Frontend error handling utilities

export interface ErrorInfo {
    message: string
    code?: string
    field?: string
    details?: Array<{ field: string; message: string; code?: string }>
}

/**
 * Extracts error information from API response
 */
export function extractErrorInfo(
    response: ApiResponse,
    locale: Locale = 'fr'
): ErrorInfo {
    if (response.success) {
        return { message: 'No error' }
    }

    // If we have a specific error code, use localized message
    if (response.code) {
        const localizedMessage = getErrorMessage(
            response.code as any,
            locale,
            response.error
        )

        return {
            message: localizedMessage,
            code: response.code,
            details: response.details
        }
    }

    // Fallback to the error message from response
    return {
        message: response.error || 'An unexpected error occurred',
        details: response.details
    }
}

/**
 * Handles fetch errors and converts them to ErrorInfo
 */
export async function handleFetchError(
    error: unknown,
    locale: Locale = 'fr'
): Promise<ErrorInfo> {
    // Network or fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
            message: getErrorMessage('NETWORK_ERROR', locale),
            code: 'NETWORK_ERROR'
        }
    }

    // Response errors
    if (error instanceof Response) {
        try {
            const errorData: ApiResponse = await error.json()
            return extractErrorInfo(errorData, locale)
        } catch {
            return {
                message: getErrorMessage('UNKNOWN_ERROR', locale),
                code: 'PARSE_ERROR'
            }
        }
    }

    // Generic errors
    if (error instanceof Error) {
        return {
            message: error.message,
            code: 'GENERIC_ERROR'
        }
    }

    return {
        message: getErrorMessage('UNKNOWN_ERROR', locale),
        code: 'UNKNOWN_ERROR'
    }
}

/**
 * Creates a user-friendly error message for display
 */
export function formatErrorForDisplay(
    errorInfo: ErrorInfo,
    includeDetails: boolean = false
): string {
    let message = errorInfo.message

    if (includeDetails && errorInfo.details && errorInfo.details.length > 0) {
        const fieldErrors = errorInfo.details
            .map(detail => `${detail.field}: ${detail.message}`)
            .join(', ')

        message += ` (${fieldErrors})`
    }

    return message
}

/**
 * Gets field-specific error message from validation details
 */
export function getFieldError(
    errorInfo: ErrorInfo,
    fieldName: string
): string | null {
    if (!errorInfo.details) return null

    const fieldError = errorInfo.details.find(detail => detail.field === fieldName)
    return fieldError?.message || null
}

/**
 * Checks if error is a specific type
 */
export function isErrorType(errorInfo: ErrorInfo, errorCode: string): boolean {
    return errorInfo.code === errorCode
}

/**
 * Checks if error is a validation error
 */
export function isValidationError(errorInfo: ErrorInfo): boolean {
    return errorInfo.code === 'VALIDATION_ERROR' ||
        Boolean(errorInfo.details && errorInfo.details.length > 0)
}

/**
 * Checks if error is an authorization error
 */
export function isAuthError(errorInfo: ErrorInfo): boolean {
    return errorInfo.code === 'UNAUTHORIZED' || errorInfo.code === 'FORBIDDEN'
}

/**
 * Checks if error is a business logic error
 */
export function isBusinessLogicError(errorInfo: ErrorInfo): boolean {
    const businessLogicCodes = [
        'INVALID_STATUS_TRANSITION',
        'HAS_ACTIVE_EVENTS',
        'HAS_EVENTS',
        'INACTIVE_TARGET',
        'FUTURE_EVENT_NOT_ALLOWED',
        'ALREADY_DEAD',
        'ALREADY_SOLD',
        'CANNOT_SELL_DEAD',
        'SALE_REQUIRES_COST',
        'BIRTH_NOT_FOR_LOTS',
        'BIRTH_EVENT_EXISTS',
        'DEATH_EVENT_EXISTS',
        'INSUFFICIENT_BALANCE',
        'ALREADY_REIMBURSED',
        'EXCEEDS_REMAINING_DEBT',
        'LAST_OWNER_REMOVAL',
        'LAST_OWNER_ROLE_CHANGE',
        'NOT_A_LOT',
        'INSUFFICIENT_LOT_COUNT',
        'LOT_COUNT_ZERO'
    ]

    return businessLogicCodes.includes(errorInfo.code || '')
}

/**
 * Creates error toast configuration for UI libraries
 */
export function createErrorToast(
    errorInfo: ErrorInfo,
    options: {
        title?: string
        duration?: number
        includeDetails?: boolean
    } = {}
) {
    return {
        title: options.title || 'Error',
        description: formatErrorForDisplay(errorInfo, options.includeDetails),
        variant: 'destructive' as const,
        duration: options.duration || 5000
    }
}

/**
 * Retry utility for failed operations
 */
export async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: unknown

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation()
        } catch (error) {
            lastError = error

            // Don't retry on validation or business logic errors
            if (error instanceof Response) {
                const status = error.status
                if (status >= 400 && status < 500) {
                    throw error
                }
            }

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt))
            }
        }
    }

    throw lastError
}

/**
 * Form error handling utilities
 */
export class FormErrorHandler {
    private errors: Map<string, string> = new Map()

    setError(field: string, message: string) {
        this.errors.set(field, message)
    }

    setErrors(errorInfo: ErrorInfo) {
        this.clearErrors()

        if (errorInfo.details) {
            errorInfo.details.forEach(detail => {
                this.errors.set(detail.field, detail.message)
            })
        } else if (errorInfo.field) {
            this.errors.set(errorInfo.field, errorInfo.message)
        }
    }

    getError(field: string): string | undefined {
        return this.errors.get(field)
    }

    hasError(field: string): boolean {
        return this.errors.has(field)
    }

    hasErrors(): boolean {
        return this.errors.size > 0
    }

    clearError(field: string) {
        this.errors.delete(field)
    }

    clearErrors() {
        this.errors.clear()
    }

    getAllErrors(): Record<string, string> {
        return Object.fromEntries(this.errors)
    }
}

/**
 * Error boundary utility for React components
 */
export function createErrorBoundaryInfo(error: Error, errorInfo: any) {
    return {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
    }
}

/**
 * Development error logging
 */
export function logClientError(
    error: unknown,
    context?: Record<string, any>
) {
    if (process.env.NODE_ENV === 'development') {
        console.group('🚨 Client Error')
        console.error('Error:', error)
        if (context) {
            console.log('Context:', context)
        }
        console.groupEnd()
    }

    // In production, this would send to error tracking service
    // Example: Sentry.captureException(error, { extra: context })
}