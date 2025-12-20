import { NextRequest, NextResponse } from 'next/server'
import { dashboardRepository } from '@/lib/repositories/dashboard'
import { getCurrentUser } from '@/lib/auth/server'
import { checkFarmAccess } from '@/lib/auth/permissions'
import type { ApiResponse } from '@/lib/types'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) {
    const { farmId } = await params
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check farm access
        const hasAccess = await checkFarmAccess(user.id, farmId, 'READ')
        if (!hasAccess) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Access denied' },
                { status: 403 }
            )
        }

        // Get dashboard statistics
        const stats = await dashboardRepository.getDashboardStats(farmId)

        return NextResponse.json<ApiResponse>({
            success: true,
            data: stats
        })

    } catch (error) {
        console.error('Error fetching dashboard data:', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}