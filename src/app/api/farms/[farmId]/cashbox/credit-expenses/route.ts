import { NextRequest, NextResponse } from 'next/server'
import { cashboxRepository } from '@/lib/repositories/cashbox'
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
        const status = searchParams.get('status') || undefined

        // Get credit expenses
        const creditExpenses = await cashboxRepository.getCreditExpenses(farmId, status)

        return NextResponse.json<ApiResponse>({
            success: true,
            data: creditExpenses
        })

    } catch (error) {
        console.error('Error fetching credit expenses:', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}