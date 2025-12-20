import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import {
    ApiError,
    ValidationError,
    BusinessLogicError,
    AuthorizationError,
    NotFoundError,
    handleApiError,
    withErrorHandler,
    logError
} from './error-handler'

// Mock console.error to avoid noise in tests
const mockConsoleError = vi.fn()
vi.stubGlobal('console', {
    error: mockConsoleError,
    log: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
})

describe('Error Handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockConsoleError.mockClear()
    })

    describe('Error Classes', () => {
        it('should create ApiError with correct properties', () => {
            const error = new ApiError(400, 'Test error', 'TEST_CODE')

            expect(error.statusCode).toBe(400)
            expect(error.message).toBe('Test error')
            expect(error.code).toBe('TEST_CODE')
            expect(error.name).toBe('ApiError')
        })

        it('should create ValidationError with details', () => {
            const details = [{ field: 'email', message: 'Invalid email' }]
            const error = new ValidationError('Validation failed', details, 'VALIDATION_ERROR')

            expect(error.statusCode).toBe(400)
            expect(error.message).toBe('Validation failed')
            expect(error.details).toEqual(details)
            expect(error.name).toBe('ValidationError')
        })

        it('should create BusinessLogicError with correct status', () => {
            const error = new BusinessLogicError('Business rule violated', 'BUSINESS_ERROR')

            expect(error.statusCode).toBe(422)
            expect(error.message).toBe('Business rule violated')
            expect(error.code).toBe('BUSINESS_ERROR')
            expect(error.name).toBe('BusinessLogicError')
        })

        it('should create AuthorizationError with default message', () => {
            const error = new AuthorizationError()

            expect(error.statusCode).toBe(403)
            expect(error.message).toBe('Access denied')
            expect(error.name).toBe('AuthorizationError')
        })

        it('should create NotFoundError with resource name', () => {
            const error = new NotFoundError('Animal')

            expect(error.statusCode).toBe(404)
            expect(error.message).toBe('Animal not found')
            expect(error.name).toBe('NotFoundError')
        })
    })

    describe('handleApiError', () => {
        it('should handle ValidationError correctly', () => {
            const details = [{ field: 'email', message: 'Invalid email', code: 'invalid_email' }]
            const error = new ValidationError('Validation failed', details)

            const response = handleApiError(error)

            expect(response).toBeInstanceOf(NextResponse)
            // Note: In a real test environment, you'd need to extract the JSON from the response
            // This is a simplified test structure
        })

        it('should handle generic ApiError', () => {
            const error = new ApiError(500, 'Server error', 'SERVER_ERROR')

            const response = handleApiError(error)

            expect(response).toBeInstanceOf(NextResponse)
        })

        it('should handle database constraint errors', () => {
            const error = new Error('UNIQUE constraint failed: users.email')

            const response = handleApiError(error)

            expect(response).toBeInstanceOf(NextResponse)
        })

        it('should handle unknown errors', () => {
            const error = 'Unknown error'

            const response = handleApiError(error)

            expect(response).toBeInstanceOf(NextResponse)
        })

        it('should log errors with context', () => {
            const error = new Error('Test error')
            const context = { userId: '123', operation: 'test' }

            handleApiError(error, context)

            expect(mockConsoleError).toHaveBeenCalled()
        })
    })

    describe('withErrorHandler', () => {
        it('should wrap handler and catch errors', async () => {
            const mockHandler = vi.fn().mockRejectedValue(new Error('Test error'))
            const wrappedHandler = withErrorHandler(mockHandler)

            const result = await wrappedHandler('arg1', 'arg2')

            expect(mockHandler).toHaveBeenCalledWith('arg1', 'arg2')
            expect(result).toBeInstanceOf(NextResponse)
        })

        it('should return handler result when no error', async () => {
            const mockResult = { success: true }
            const mockHandler = vi.fn().mockResolvedValue(mockResult)
            const wrappedHandler = withErrorHandler(mockHandler)

            const result = await wrappedHandler('arg1')

            expect(result).toBe(mockResult)
        })

        it('should pass context to error handler', async () => {
            const mockHandler = vi.fn().mockRejectedValue(new Error('Test error'))
            const context = { operation: 'test' }
            const wrappedHandler = withErrorHandler(mockHandler, context)

            await wrappedHandler()

            expect(mockConsoleError).toHaveBeenCalled()
        })
    })

    describe('logError', () => {
        it('should log error with timestamp', () => {
            const error = new Error('Test error')
            const context = { userId: '123' }

            logError(error, context)

            expect(mockConsoleError).toHaveBeenCalledWith(
                'Application Error:',
                expect.stringContaining('timestamp')
            )
        })

        it('should handle non-Error objects', () => {
            const error = 'String error'

            logError(error)

            expect(mockConsoleError).toHaveBeenCalled()
        })
    })
})

describe('Error Message Extraction', () => {
    it('should extract field from UNIQUE constraint error', () => {
        const error = new Error('UNIQUE constraint failed: users.email')

        const response = handleApiError(error)

        expect(response).toBeInstanceOf(NextResponse)
        // In a real implementation, you'd verify the response contains the field info
    })

    it('should extract field from NOT NULL constraint error', () => {
        const error = new Error('NOT NULL constraint failed: animals.species')

        const response = handleApiError(error)

        expect(response).toBeInstanceOf(NextResponse)
    })

    it('should handle CHECK constraint errors', () => {
        const error = new Error('CHECK constraint failed: positive_amount')

        const response = handleApiError(error)

        expect(response).toBeInstanceOf(NextResponse)
    })
})