import { NextRequest, NextResponse } from 'next/server'
import { dashboardRepository, type ReminderEvent } from '@/lib/repositories/dashboard'
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
        const daysAhead = parseInt(searchParams.get('days') || '30')

        // Get reminders
        const reminders: ReminderEvent[] = await dashboardRepository.getReminders(farmId, daysAhead)

        // Group by urgency
        const now = new Date()
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(now.getDate() + 7)

        const urgent = reminders.filter(reminder => reminder.daysUntilDue <= 7)
        const upcoming = reminders.filter(reminder => reminder.daysUntilDue > 7)

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                urgent,
                upcoming,
                total: reminders.length
            }
        })

    } catch (error) {
        console.error('Error fetching reminders:', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}