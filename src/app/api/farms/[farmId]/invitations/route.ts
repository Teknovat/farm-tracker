import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { checkFarmAccess } from '@/lib/auth/permissions'
import { farmInvitationRepository } from '@/lib/repositories/farm-invitation'
import { userRepository } from '@/lib/repositories/user'
import { farmMemberRepository } from '@/lib/repositories/farm-member'
import {
    handleApiError,
    withErrorHandler,
    ValidationError,
    AuthorizationError,
    BusinessLogicError
} from '@/lib/middleware/error-handler'
import { z } from 'zod'
import type { ApiResponse } from '@/lib/types'

const createInvitationSchema = z.object({
    email: z.string().email('Invalid email format'),
    role: z.enum(['OWNER', 'ASSOCIATE', 'WORKER'], {
        errorMap: () => ({ message: 'Role must be OWNER, ASSOCIATE, or WORKER' })
    })
})

export const GET = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) => {
    const { farmId } = await params

    const user = await getCurrentUser()
    if (!user) {
        throw new AuthorizationError('Authentication required', 'UNAUTHORIZED')
    }

    // Check if user has read permission for this farm
    const hasPermission = await checkFarmAccess(user.id, farmId, 'READ')
    if (!hasPermission) {
        throw new AuthorizationError('Insufficient permissions to view farm invitations', 'FORBIDDEN')
    }

    const invitations = await farmInvitationRepository.findByFarmId(farmId)

    return NextResponse.json<ApiResponse>({
        success: true,
        data: { invitations },
        message: 'Invitations retrieved successfully'
    })
}, { operation: 'LIST_FARM_INVITATIONS', farmId: 'farmId' })

export const POST = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) => {
    const { farmId } = await params

    const user = await getCurrentUser()
    if (!user) {
        throw new AuthorizationError('Authentication required', 'UNAUTHORIZED')
    }

    // Only owners can send invitations
    const hasPermission = await checkFarmAccess(user.id, farmId, 'CREATE')
    if (!hasPermission) {
        throw new AuthorizationError('Only farm owners can send invitations', 'FORBIDDEN')
    }

    const body = await request.json()
    const validatedData = createInvitationSchema.parse(body)

    // Check if user already exists and is a member
    const existingUser = await userRepository.findByEmail(validatedData.email)
    if (existingUser) {
        const existingMember = await farmMemberRepository.findByUserAndFarm(existingUser.id, farmId)
        if (existingMember) {
            throw new BusinessLogicError('User is already a member of this farm', 'ALREADY_MEMBER')
        }
    }

    // Check if there's already a pending invitation
    const existingInvitation = await farmInvitationRepository.findPendingByEmail(validatedData.email, farmId)
    if (existingInvitation) {
        throw new BusinessLogicError('An invitation is already pending for this email', 'INVITATION_PENDING')
    }

    // Create the invitation
    const invitation = await farmInvitationRepository.create({
        farmId,
        email: validatedData.email,
        role: validatedData.role,
        invitedBy: user.id
    })

    // TODO: Send email with invitation link
    // const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invitation/${invitation.token}`
    // await sendInvitationEmail(invitation.email, invitation.farmName, invitationLink)

    return NextResponse.json<ApiResponse>({
        success: true,
        data: {
            invitation,
            // For now, return the token so you can test manually
            invitationLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/invitation/${invitation.token}`
        },
        message: 'Invitation sent successfully'
    }, { status: 201 })
}, { operation: 'SEND_FARM_INVITATION', farmId: 'farmId' })