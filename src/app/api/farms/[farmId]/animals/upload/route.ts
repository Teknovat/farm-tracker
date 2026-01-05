import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { checkFarmAccess } from '@/lib/auth/permissions'
import { uploadAnimalPhoto } from '@/lib/upload/handler'
import {
    handleApiError,
    withErrorHandler,
    ValidationError,
    AuthorizationError
} from '@/lib/middleware/error-handler'
import type { ApiResponse } from '@/lib/types'

export const POST = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) => {
    const { farmId } = await params

    const user = await getCurrentUser()
    if (!user) {
        throw new AuthorizationError('Authentication required', 'UNAUTHORIZED')
    }

    // Check if user has create permission for this farm
    const hasPermission = await checkFarmAccess(user.id, farmId, 'CREATE')
    if (!hasPermission) {
        throw new AuthorizationError('Insufficient permissions to upload animal photos', 'FORBIDDEN')
    }

    try {
        const formData = await request.formData()
        const file = formData.get('photo') as File

        if (!file) {
            throw new ValidationError('No photo file provided', [
                { field: 'photo', message: 'Photo file is required' }
            ])
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            throw new ValidationError('Invalid file type', [
                { field: 'photo', message: 'Only image files are allowed' }
            ])
        }

        // Validate file size (2MB max for Base64 storage)
        const maxSize = 2 * 1024 * 1024 // 2MB
        if (file.size > maxSize) {
            throw new ValidationError('File too large', [
                { field: 'photo', message: 'Photo must be smaller than 2MB' }
            ])
        }

        const uploadResult = await uploadAnimalPhoto(file, farmId)

        if (!uploadResult.success) {
            throw new ValidationError('Upload failed', [
                { field: 'photo', message: uploadResult.error || 'Failed to upload photo' }
            ])
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                photoUrl: uploadResult.url
            },
            message: 'Photo uploaded successfully'
        })

    } catch (error) {
        if (error instanceof ValidationError || error instanceof AuthorizationError) {
            throw error
        }

        throw new Error('Failed to process upload request')
    }
}, { operation: 'UPLOAD_ANIMAL_PHOTO', farmId: 'farmId' })