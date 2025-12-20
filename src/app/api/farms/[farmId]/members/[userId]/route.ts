import { NextRequest, NextResponse } from 'next/server'
import { FarmRepository } from '@/lib/repositories/farm'
import { getServerAuth } from '@/lib/auth/server'
import { ApiResponse } from '@/lib/types'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; userId: string }> }
) {
    try {
        const { farmId, userId } = await params
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

        // Only OWNER can update member roles
        if (member.role !== 'OWNER') {
            return NextResponse.json(
                { success: false, error: 'Only farm owners can update member roles' } as ApiResponse,
                { status: 403 }
            )
        }

        const body = await request.json()
        const { role } = body

        if (!role || !['OWNER', 'ASSOCIATE', 'WORKER'].includes(role)) {
            return NextResponse.json(
                { success: false, error: 'Valid role is required (OWNER, ASSOCIATE, WORKER)' } as ApiResponse,
                { status: 400 }
            )
        }

        // Verify target user is a member
        const targetMember = await farmRepo.findFarmMember(farmId, userId)
        if (!targetMember) {
            return NextResponse.json(
                { success: false, error: 'Member not found' } as ApiResponse,
                { status: 404 }
            )
        }

        const updatedMember = await farmRepo.updateMemberRole(farmId, userId, role, auth.user.id)

        return NextResponse.json({
            success: true,
            data: updatedMember,
            message: 'Member role updated successfully'
        } as ApiResponse)
    } catch (error) {
        console.error('Error updating member role:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' } as ApiResponse,
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; userId: string }> }
) {
    try {
        const { farmId, userId } = await params
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

        // Only OWNER can remove members, or users can remove themselves
        if (member.role !== 'OWNER' && auth.user.id !== userId) {
            return NextResponse.json(
                { success: false, error: 'Only farm owners can remove members' } as ApiResponse,
                { status: 403 }
            )
        }

        // Verify target user is a member
        const targetMember = await farmRepo.findFarmMember(farmId, userId)
        if (!targetMember) {
            return NextResponse.json(
                { success: false, error: 'Member not found' } as ApiResponse,
                { status: 404 }
            )
        }

        // Prevent removing the last owner
        if (targetMember.role === 'OWNER') {
            const allMembers = await farmRepo.findFarmMembers(farmId)
            const ownerCount = allMembers.filter(m => m.role === 'OWNER').length

            if (ownerCount <= 1) {
                return NextResponse.json(
                    { success: false, error: 'Cannot remove the last owner of the farm' } as ApiResponse,
                    { status: 400 }
                )
            }
        }

        const removed = await farmRepo.removeMember(farmId, userId)

        if (!removed) {
            return NextResponse.json(
                { success: false, error: 'Failed to remove member' } as ApiResponse,
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Member removed successfully'
        } as ApiResponse)
    } catch (error) {
        console.error('Error removing member:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' } as ApiResponse,
            { status: 500 }
        )
    }
}