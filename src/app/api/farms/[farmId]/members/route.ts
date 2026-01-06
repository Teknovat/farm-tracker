import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { checkFarmAccess } from '@/lib/auth/permissions'
import { farmMemberRepository } from '@/lib/repositories/farm-member'
import { userRepository } from '@/lib/repositories/user'
import {
    handleApiError,
    withErrorHandler,
    ValidationError,
    AuthorizationError,
    BusinessLogicError
} from '@/lib/middleware/error-handler'
import { z } from 'zod'
import type { ApiResponse } from '@/lib/types'

const createMemberSchema = z.object({
    email: z.string().email('Invalid email format'),
    role: z.enum(['OWNER', 'ASSOCIATE', 'WORKER'], {
        errorMap: () => ({ message: 'Role must be OWNER, ASSOCIATE, or WORKER' })
    })
})

const memberFiltersSchema = z.object({
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    role: z.enum(['OWNER', 'ASSOCIATE', 'WORKER']).optional()
})

export const GET = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) => {
    const { farmId } = await params
    const { searchParams } = new URL(request.url)

    const user = await getCurrentUser()
    if (!user) {
        throw new AuthorizationError('Authentication required', 'UNAUTHORIZED')
    }

    // Check if user has read permission for this farm
    const hasPermission = await checkFarmAccess(user.id, farmId, 'READ')
    if (!hasPermission) {
        throw new AuthorizationError('Insufficient permissions to view farm members', 'FORBIDDEN')
    }

    // Parse filters
    const filters = memberFiltersSchema.parse({
        status: searchParams.get('status') || undefined,
        role: searchParams.get('role') || undefined
    })

    const members = await farmMemberRepository.findByFarmId(farmId, filters)

    return NextResponse.json<ApiResponse>({
        success: true,
        data: { members },
        message: 'Members retrieved successfully'
    })
}, { operation: 'LIST_FARM_MEMBERS', farmId: 'farmId' })

export const POST = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) => {
    const { farmId } = await params

    const user = await getCurrentUser()
    if (!user) {
        throw new AuthorizationError('Authentication required', 'UNAUTHORIZED')
    }

    // Only owners can add members
    const hasPermission = await checkFarmAccess(user.id, farmId, 'CREATE')
    if (!hasPermission) {
        throw new AuthorizationError('Only farm owners can add members', 'FORBIDDEN')
    }

    const body = await request.json()
    const validatedData = createMemberSchema.parse(body)

    // Find user by email
    const targetUser = await userRepository.findByEmail(validatedData.email)
    if (!targetUser) {
        throw new ValidationError('User not found', [
            { field: 'email', message: 'No user found with this email address' }
        ])
    }

    // Check if user is already a member
    const existingMember = await farmMemberRepository.findByUserAndFarm(targetUser.id, farmId)
    if (existingMember) {
        throw new BusinessLogicError('User is already a member of this farm', 'DUPLICATE_MEMBER')
    }

    // Create the membership
    const member = await farmMemberRepository.create({
        userId: targetUser.id,
        farmId,
        role: validatedData.role
    })

    return NextResponse.json<ApiResponse>({
        success: true,
        data: { member },
        message: 'Member added successfully'
    }, { status: 201 })
}, { operation: 'ADD_FARM_MEMBER', farmId: 'farmId' })