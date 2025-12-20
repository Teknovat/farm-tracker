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

        // Default to 30 days from now if not specified
        const daysAhead = parseInt(searchParams.get('days') || '30')
        const beforeDate = new Date()
        beforeDate.setDate(beforeDate.getDate() + daysAhead)

        // Optional start date (default to now)
        const afterDate = searchParams.get('after') ? new Date(searchParams.get('after')!) : new Date()

        const upcomingEvents = await eventRepository.findUpcomingEvents(farmId, beforeDate, afterDate)

        // Group events by urgency
        const now = new Date()
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(now.getDate() + 7)

        const urgent = upcomingEvents.filter(event =>
            event.nextDueDate && event.nextDueDate <= sevenDaysFromNow
        )

        const upcoming = upcomingEvents.filter(event =>
            event.nextDueDate && event.nextDueDate > sevenDaysFromNow
        )

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                urgent: urgent,
                upcoming: upcoming,
                total: upcomingEvents.length
            }
        })

    } catch (error) {
        console.error('Error fetching upcoming events:', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}