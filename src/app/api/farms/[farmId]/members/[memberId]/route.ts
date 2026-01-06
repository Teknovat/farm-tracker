import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { checkFarmAccess } from '@/lib/auth/permissions'
import { farmMemberRepository } from '@/lib/repositories/farm-member'
import {
    handleApiError,
    withErrorHandler,
    ValidationError,
    AuthorizationError,
    BusinessLogicError,
    NotFoundError
} from '@/lib/middleware/error-handler'
import { z } from 'zod'
import type { ApiResponse } from '@/lib/types'

const updateMemberSchema = z.object({
    role: z.enum(['OWNER', 'ASSOCIATE', 'WORKER']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional()
}).refine(data => data.role !== undefined || data.status !== undefined, {
    message: 'At least one field (role or status) must be provided'
})

export const GET = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; memberId: string }> }
) => {
    const { farmId, memberId } = await params

    const user = await getCurrentUser()
    if (!user) {
        throw new AuthorizationError('Authentication required', 'UNAUTHORIZED')
    }

    // Check if user has read permission for this farm
    const hasPermission = await checkFarmAccess(user.id, farmId, 'READ')
    if (!hasPermission) {
        throw new AuthorizationError('Insufficient permissions to view farm members', 'FORBIDDEN')
    }

    const member = await farmMemberRepository.findById(memberId)
    if (!member || member.farmId !== farmId) {
        throw new NotFoundError('Member not found', 'MEMBER_NOT_FOUND')
    }

    return NextResponse.json<ApiResponse>({
        success: true,
        data: { member },
        message: 'Member retrieved successfully'
    })
}, { operation: 'GET_FARM_MEMBER', farmId: 'farmId' })

export const PATCH = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; memberId: string }> }
) => {
    const { farmId, memberId } = await params

    const user = await getCurrentUser()
    if (!user) {
        throw new AuthorizationError('Authentication required', 'UNAUTHORIZED')
    }

    // Only owners can modify members
    const hasPermission = await checkFarmAccess(user.id, farmId, 'UPDATE')
    if (!hasPermission) {
        throw new AuthorizationError('Only farm owners can modify members', 'FORBIDDEN')
    }

    const body = await request.json()
    const validatedData = updateMemberSchema.parse(body)

    // Check if member exists and belongs to this farm
    const member = await farmMemberRepository.findById(memberId)
    if (!member || member.farmId !== farmId) {
        throw new NotFoundError('Member not found', 'MEMBER_NOT_FOUND')
    }

    // Validate the change (e.g., prevent removing last owner)
    const validationErrors = await farmMemberRepository.validateMembershipChange(
        memberId,
        validatedData.role,
        validatedData.status
    )

    if (validationErrors.length > 0) {
        throw new BusinessLogicError(validationErrors[0], 'INVALID_MEMBER_CHANGE')
    }

    // Update the member
    const updatedMember = await farmMemberRepository.update(memberId, validatedData)

    return NextResponse.json<ApiResponse>({
        success: true,
        data: { member: updatedMember },
        message: 'Member updated successfully'
    })
}, { operation: 'UPDATE_FARM_MEMBER', farmId: 'farmId' })

export const DELETE = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; memberId: string }> }
) => {
    const { farmId, memberId } = await params

    const user = await getCurrentUser()
    if (!user) {
        throw new AuthorizationError('Authentication required', 'UNAUTHORIZED')
    }

    // Only owners can remove members
    const hasPermission = await checkFarmAccess(user.id, farmId, 'DELETE')
    if (!hasPermission) {
        throw new AuthorizationError('Only farm owners can remove members', 'FORBIDDEN')
    }

    // Check if member exists and belongs to this farm
    const member = await farmMemberRepository.findById(memberId)
    if (!member || member.farmId !== farmId) {
        throw new NotFoundError('Member not found', 'MEMBER_NOT_FOUND')
    }

    // Validate the removal (e.g., prevent removing last owner)
    const validationErrors = await farmMemberRepository.validateMembershipChange(
        memberId,
        undefined,
        'INACTIVE'
    )

    if (validationErrors.length > 0) {
        throw new BusinessLogicError(validationErrors[0], 'CANNOT_REMOVE_MEMBER')
    }

    // Remove the member
    await farmMemberRepository.delete(memberId)

    return NextResponse.json<ApiResponse>({
        success: true,
        data: null,
        message: 'Member removed successfully'
    })
}, { operation: 'REMOVE_FARM_MEMBER', farmId: 'farmId' })