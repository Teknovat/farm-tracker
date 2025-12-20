import { NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/types'

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

export function handleApiError(error: unknown): NextResponse {
    console.error('API Error:', error)

    if (error instanceof ApiError) {
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: error.message,
                code: error.code
            },
            { status: error.statusCode }
        )
    }

    if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('UNIQUE constraint failed')) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Resource already exists'
                },
                { status: 409 }
            )
        }

        if (error.message.includes('FOREIGN KEY constraint failed')) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Invalid reference to related resource'
                },
                { status: 400 }
            )
        }

        if (error.message.includes('NOT NULL constraint failed')) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Required field is missing'
                },
                { status: 400 }
            )
        }

        // Generic error
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Internal server error'
            },
            { status: 500 }
        )
    }

    // Unknown error
    return NextResponse.json<ApiResponse>(
        {
            success: false,
            error: 'An unexpected error occurred'
        },
        { status: 500 }
    )
}

// Common error responses
export const ErrorResponses = {
    unauthorized: () => NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
    ),

    forbidden: (message = 'Access denied') => NextResponse.json<ApiResponse>(
        { success: false, error: message },
        { status: 403 }
    ),

    notFound: (resource = 'Resource') => NextResponse.json<ApiResponse>(
        { success: false, error: `${resource} not found` },
        { status: 404 }
    ),

    badRequest: (message = 'Bad request') => NextResponse.json<ApiResponse>(
        { success: false, error: message },
        { status: 400 }
    ),

    conflict: (message = 'Resource already exists') => NextResponse.json<ApiResponse>(
        { success: false, error: message },
        { status: 409 }
    ),

    internalError: (message = 'Internal server error') => NextResponse.json<ApiResponse>(
        { success: false, error: message },
        { status: 500 }
    )
}

// Async error wrapper for API routes
export function withErrorHandler<T extends any[], R>(
    handler: (...args: T) => Promise<R>
) {
    return async (...args: T): Promise<R | NextResponse> => {
        try {
            return await handler(...args)
        } catch (error) {
            return handleApiError(error)
        }
    }
}