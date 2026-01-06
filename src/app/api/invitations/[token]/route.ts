import { NextRequest, NextResponse } from 'next/server'
import { farmInvitationRepository } from '@/lib/repositories/farm-invitation'
import { userRepository } from '@/lib/repositories/user'
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
import bcrypt from 'bcryptjs'
import type { ApiResponse } from '@/lib/types'

const acceptInvitationSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters')
})

export const GET = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) => {
    const { token } = await params

    const invitation = await farmInvitationRepository.findByToken(token)
    if (!invitation) {
        throw new NotFoundError('Invitation not found', 'INVITATION_NOT_FOUND')
    }

    if (invitation.status !== 'PENDING') {
        throw new BusinessLogicError('Invitation is no longer valid', 'INVITATION_INVALID')
    }

    if (invitation.expiresAt < new Date()) {
        await farmInvitationRepository.expire(invitation.id)
        throw new BusinessLogicError('Invitation has expired', 'INVITATION_EXPIRED')
    }

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(invitation.email)

    return NextResponse.json<ApiResponse>({
        success: true,
        data: {
            invitation: {
                farmName: invitation.farmName,
                role: invitation.role,
                inviterName: invitation.inviterName,
                email: invitation.email
            },
            userExists: !!existingUser
        },
        message: 'Invitation details retrieved successfully'
    })
}, { operation: 'GET_INVITATION_DETAILS' })

export const POST = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) => {
    const { token } = await params

    const invitation = await farmInvitationRepository.findByToken(token)
    if (!invitation) {
        throw new NotFoundError('Invitation not found', 'INVITATION_NOT_FOUND')
    }

    if (invitation.status !== 'PENDING') {
        throw new BusinessLogicError('Invitation is no longer valid', 'INVITATION_INVALID')
    }

    if (invitation.expiresAt < new Date()) {
        await farmInvitationRepository.expire(invitation.id)
        throw new BusinessLogicError('Invitation has expired', 'INVITATION_EXPIRED')
    }

    const body = await request.json()
    const validatedData = acceptInvitationSchema.parse(body)

    // Check if user already exists
    let user = await userRepository.findByEmail(invitation.email)

    if (!user) {
        // Create new user
        const passwordHash = await bcrypt.hash(validatedData.password, 12)
        user = await userRepository.createUser({
            email: invitation.email,
            name: validatedData.name,
            passwordHash
        })
    }

    // Check if user is already a member (shouldn't happen, but safety check)
    const existingMember = await farmMemberRepository.findByUserAndFarm(user.id, invitation.farmId)
    if (existingMember) {
        throw new BusinessLogicError('User is already a member of this farm', 'ALREADY_MEMBER')
    }

    // Create farm membership
    const member = await farmMemberRepository.create({
        userId: user.id,
        farmId: invitation.farmId,
        role: invitation.role
    })

    // Accept the invitation
    await farmInvitationRepository.accept(token)

    return NextResponse.json<ApiResponse>({
        success: true,
        data: {
            member,
            message: 'You have successfully joined the farm! You can now log in with your credentials.'
        },
        message: 'Invitation accepted successfully'
    })
}, { operation: 'ACCEPT_INVITATION' })