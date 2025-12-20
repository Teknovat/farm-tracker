import { NextRequest, NextResponse } from 'next/server'
import { FarmRepository } from '@/lib/repositories/farm'
import { UserRepository } from '@/lib/repositories/user'
import { getServerAuth } from '@/lib/auth/server'
import { ApiResponse } from '@/lib/types'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) {
    try {
        const { farmId } = await params
        const auth = await getServerAuth()

        if (!auth) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' } as ApiResponse,
                { status: 401 }
            )
        }

        const farmRepo = new FarmRepository()

        // Verify user has access to this farm
        const member = await farmRepo.findFarmMember(farmId, auth.user.id)
        if (!member) {
            return NextResponse.json(
                { success: false, error: 'Access denied' } as ApiResponse,
                { status: 403 }
            )
        }

        const members = await farmRepo.findFarmMembers(farmId)

        return NextResponse.json({
            success: true,
            data: members
        } as ApiResponse)
    } catch (error) {
        console.error('Error fetching farm members:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' } as ApiResponse,
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) {
    try {
        const { farmId } = await params
        const auth = await getServerAuth()

        if (!auth) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' } as ApiResponse,
                { status: 401 }
            )
        }

        const farmRepo = new FarmRepository()

        // Verify user has access and permissions
        const member = await farmRepo.findFarmMember(farmId, auth.user.id)
        if (!member) {
            return NextResponse.json(
                { success: false, error: 'Access denied' } as ApiResponse,
                { status: 403 }
            )
        }

        // Only OWNER can invite members
        if (member.role !== 'OWNER') {
            return NextResponse.json(
                { success: false, error: 'Only farm owners can invite members' } as ApiResponse,
                { status: 403 }
            )
        }

        const body = await request.json()
        const { email, role } = body

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Email is required' } as ApiResponse,
                { status: 400 }
            )
        }

        if (!role || !['OWNER', 'ASSOCIATE', 'WORKER'].includes(role)) {
            return NextResponse.json(
                { success: false, error: 'Valid role is required (OWNER, ASSOCIATE, WORKER)' } as ApiResponse,
                { status: 400 }
            )
        }

        // Find user by email
        const userRepo = new UserRepository()
        const user = await userRepo.findByEmail(email.toLowerCase().trim())

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' } as ApiResponse,
                { status: 404 }
            )
        }

        try {
            const newMember = await farmRepo.inviteMember({
                farmId,
                userId: user.id,
                role,
                invitedBy: auth.user.id
            })

            return NextResponse.json({
                success: true,
                data: newMember,
                message: 'Member invited successfully'
            } as ApiResponse, { status: 201 })
        } catch (error: any) {
            if (error.message === 'User is already a member of this farm') {
                return NextResponse.json(
                    { success: false, error: error.message } as ApiResponse,
                    { status: 409 }
                )
            }
            throw error
        }
    } catch (error) {
        console.error('Error inviting member:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' } as ApiResponse,
            { status: 500 }
        )
    }
}