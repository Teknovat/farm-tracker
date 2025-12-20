import { NextRequest, NextResponse } from 'next/server'
import { FarmRepository } from '@/lib/repositories/farm'
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

        const farm = await farmRepo.findById(farmId)
        if (!farm) {
            return NextResponse.json(
                { success: false, error: 'Farm not found' } as ApiResponse,
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: farm
        } as ApiResponse)
    } catch (error) {
        console.error('Error fetching farm:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' } as ApiResponse,
            { status: 500 }
        )
    }
}

export async function PUT(
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

        // Only OWNER can update farm settings
        if (member.role !== 'OWNER') {
            return NextResponse.json(
                { success: false, error: 'Only farm owners can update farm settings' } as ApiResponse,
                { status: 403 }
            )
        }

        const body = await request.json()
        const { name, currency, timezone } = body

        const updateData: any = {}
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Invalid farm name' } as ApiResponse,
                    { status: 400 }
                )
            }
            updateData.name = name.trim()
        }
        if (currency !== undefined) updateData.currency = currency
        if (timezone !== undefined) updateData.timezone = timezone

        const updatedFarm = await farmRepo.updateFarm(farmId, updateData, auth.user.id)

        if (!updatedFarm) {
            return NextResponse.json(
                { success: false, error: 'Farm not found' } as ApiResponse,
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: updatedFarm,
            message: 'Farm updated successfully'
        } as ApiResponse)
    } catch (error) {
        console.error('Error updating farm:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' } as ApiResponse,
            { status: 500 }
        )
    }
}

export async function DELETE(
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

        // Only OWNER can delete farm
        if (member.role !== 'OWNER') {
            return NextResponse.json(
                { success: false, error: 'Only farm owners can delete farms' } as ApiResponse,
                { status: 403 }
            )
        }

        const deleted = await farmRepo.softDelete(farmId)

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: 'Farm not found' } as ApiResponse,
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Farm deleted successfully'
        } as ApiResponse)
    } catch (error) {
        console.error('Error deleting farm:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' } as ApiResponse,
            { status: 500 }
        )
    }
}
