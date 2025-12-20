import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/types'
import { getErrorMessage, getLocaleFromRequest, type Locale } from '@/lib/utils/i18n-errors'

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string,
        public details?: Array<{ field: string; message: string }>,
        public params?: Record<string, string | number>
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

export class ValidationError extends ApiError {
    constructor(
        message: string,
        details: Array<{ field: string; message: string }>,
        code?: string,
        params?: Record<string, string | number>
    ) {
        super(400, message, code, details, params)
        this.name = 'ValidationError'
    }
}

export class BusinessLogicError extends ApiError {
    constructor(
        message: string,
        code?: string,
        params?: Record<string, string | number>
    ) {
        super(422, message, code, undefined, params)
        this.name = 'BusinessLogicError'
    }
}

export class AuthorizationError extends ApiError {
    constructor(
        message: string = 'Access denied',
        code?: string,
        params?: Record<string, string | number>
    ) {
        super(403, message, code, undefined, params)
        this.name = 'AuthorizationError'
    }
}

export class NotFoundError extends ApiError {
    constructor(
        resource: string = 'Resource',
        code?: string,
        params?: Record<string, string | number>
    ) {
        super(404, `${resource} not found`, code, undefined, params)
        this.name = 'NotFoundError'
    }
}

// Error logging utility
export function logError(error: unknown, context?: Record<string, any>) {
    const timestamp = new Date().toISOString()
    const errorInfo = {
        timestamp,
        error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : error,
        context
    }

    // In production, this would integrate with monitoring services like Sentry, DataDog, etc.
    console.error('Application Error:', JSON.stringify(errorInfo, null, 2))

    // TODO: Integrate with external monitoring service
    // Example: Sentry.captureException(error, { extra: context })
}

export async function handleApiError(
    error: unknown,
    context?: Record<string, any>,
    locale: Locale = 'fr'
): Promise<NextResponse> {
    // Log the error with context
    logError(error, context)

    if (error instanceof ValidationError) {
        const translatedMessage = error.code
            ? await getErrorMessage(error.code, locale, error.params)
            : error.message

        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: translatedMessage,
                code: error.code,
                details: error.details
            },
            { status: error.statusCode }
        )
    }

    if (error instanceof ApiError) {
        const translatedMessage = error.code
            ? await getErrorMessage(error.code, locale, error.params)
            : error.message

        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: translatedMessage,
                code: error.code,
                details: error.details
            },
            { status: error.statusCode }
        )
    }

    if (error instanceof Error) {
        // Handle specific database constraint errors
        if (error.message.includes('UNIQUE constraint failed')) {
            const field = extractFieldFromConstraintError(error.message)
            const translatedMessage = await getErrorMessage('DUPLICATE_RESOURCE', locale)
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: translatedMessage,
                    code: 'DUPLICATE_RESOURCE',
                    details: field ? [{ field, message: 'This value already exists' }] : undefined
                },
                { status: 409 }
            )
        }

        if (error.message.includes('FOREIGN KEY constraint failed')) {
            const translatedMessage = await getErrorMessage('INVALID_REFERENCE', locale)
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: translatedMessage,
                    code: 'INVALID_REFERENCE'
                },
                { status: 400 }
            )
        }

        if (error.message.includes('NOT NULL constraint failed')) {
            const field = extractFieldFromConstraintError(error.message)
            const translatedMessage = await getErrorMessage('MISSING_REQUIRED_FIELD', locale)
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: translatedMessage,
                    code: 'MISSING_REQUIRED_FIELD',
                    details: field ? [{ field, message: 'This field is required' }] : undefined
                },
                { status: 400 }
            )
        }

        // Check constraint violations
        if (error.message.includes('CHECK constraint failed')) {
            const translatedMessage = await getErrorMessage('CHECK_CONSTRAINT_VIOLATION', locale)
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: translatedMessage,
                    code: 'CHECK_CONSTRAINT_VIOLATION'
                },
                { status: 400 }
            )
        }

        // Generic error
        const genericMessage = await getErrorMessage('INTERNAL_ERROR', locale)
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: genericMessage,
                code: 'INTERNAL_ERROR'
            },
            { status: 500 }
        )
    }

    // Unknown error
    const unknownMessage = await getErrorMessage('UNKNOWN_ERROR', locale)
    return NextResponse.json<ApiResponse>(
        {
            success: false,
            error: unknownMessage,
            code: 'UNKNOWN_ERROR'
        },
        { status: 500 }
    )
}

// Helper function to extract field name from constraint error messages
function extractFieldFromConstraintError(message: string): string | null {
    // Try to extract field name from SQLite constraint error messages
    const patterns = [
        /UNIQUE constraint failed: \w+\.(\w+)/,
        /NOT NULL constraint failed: \w+\.(\w+)/,
        /CHECK constraint failed: (\w+)/
    ]

    for (const pattern of patterns) {
        const match = message.match(pattern)
        if (match) {
            return match[1]
        }
    }

    return null
}

// Common error responses with enhanced error codes (deprecated - use ApiError classes instead)
export const ErrorResponses = {
    unauthorized: async (code = 'UNAUTHORIZED', locale: Locale = 'fr') => {
        const message = await getErrorMessage(code, locale)
        return NextResponse.json<ApiResponse>(
            { success: false, error: message, code },
            { status: 401 }
        )
    },

    forbidden: async (message = 'Access denied', code = 'FORBIDDEN', locale: Locale = 'fr') => {
        const translatedMessage = await getErrorMessage(code, locale)
        return NextResponse.json<ApiResponse>(
            { success: false, error: translatedMessage, code },
            { status: 403 }
        )
    },

    notFound: async (resource = 'Resource', code = 'NOT_FOUND', locale: Locale = 'fr') => {
        const translatedMessage = await getErrorMessage(code, locale)
        return NextResponse.json<ApiResponse>(
            { success: false, error: translatedMessage, code },
            { status: 404 }
        )
    },

    badRequest: async (message = 'Bad request', code = 'BAD_REQUEST', locale: Locale = 'fr', details?: Array<{ field: string; message: string }>) => {
        const translatedMessage = await getErrorMessage(code, locale)
        return NextResponse.json<ApiResponse>(
            { success: false, error: translatedMessage, code, details },
            { status: 400 }
        )
    },

    conflict: async (message = 'Resource already exists', code = 'CONFLICT', locale: Locale = 'fr') => {
        const translatedMessage = await getErrorMessage(code, locale)
        return NextResponse.json<ApiResponse>(
            { success: false, error: translatedMessage, code },
            { status: 409 }
        )
    },

    unprocessableEntity: async (message = 'Business logic validation failed', code = 'UNPROCESSABLE_ENTITY', locale: Locale = 'fr', details?: Array<{ field: string; message: string }>) => {
        const translatedMessage = await getErrorMessage(code, locale)
        return NextResponse.json<ApiResponse>(
            { success: false, error: translatedMessage, code, details },
            { status: 422 }
        )
    },

    internalError: async (message = 'Internal server error', code = 'INTERNAL_ERROR', locale: Locale = 'fr') => {
        const translatedMessage = await getErrorMessage(code, locale)
        return NextResponse.json<ApiResponse>(
            { success: false, error: translatedMessage, code },
            { status: 500 }
        )
    }
}

// Async error wrapper for API routes with context support
export function withErrorHandler<T extends any[], R>(
    handler: (...args: T) => Promise<R>,
    context?: Record<string, any>
) {
    return async (...args: T): Promise<R | NextResponse> => {
        try {
            return await handler(...args)
        } catch (error) {
            // Extract locale from request if available
            const request = args.find(arg => arg && typeof arg === 'object' && 'nextUrl' in arg) as NextRequest | undefined
            const locale = request ? getLocaleFromRequest(request) : 'fr'

            return await handleApiError(error, context, locale)
        }
    }
}