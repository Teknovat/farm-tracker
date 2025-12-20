import { NextRequest, NextResponse } from 'next/server'
import { eventRepository } from '@/lib/repositories/event'
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

        const { searchParams } = new URL(request.url)

        let startDate: Date | undefined
        let endDate: Date | undefined

        if (searchParams.get('startDate')) {
            startDate = new Date(searchParams.get('startDate')!)
        }

        if (searchParams.get('endDate')) {
            endDate = new Date(searchParams.get('endDate')!)
        }

        // If no dates provided, default to current month
        if (!startDate && !endDate) {
            const now = new Date()
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        }

        const eventCounts = await eventRepository.getEventCountsByType(farmId, startDate, endDate)

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                period: {
                    startDate: startDate?.toISOString(),
                    endDate: endDate?.toISOString()
                },
                eventCounts: eventCounts,
                totalEvents: Object.values(eventCounts).reduce((sum, count) => sum + count, 0)
            }
        })

    } catch (error) {
        console.error('Error fetching event statistics:', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}