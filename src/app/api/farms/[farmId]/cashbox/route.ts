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
        const limit = parseInt(searchParams.get('limit') || '10')

        // Get cashbox balance and recent movements
        const balance = await cashboxRepository.getCashboxBalance(farmId)
        const recentMovements = await cashboxRepository.getRecentMovements(farmId, limit)
        const outstandingDebt = await cashboxRepository.getOutstandingDebt(farmId)

        // Map movements to include proper format for frontend
        const mappedMovements = recentMovements.map(movement => ({
            ...movement,
            createdAt: movement.createdAt.toISOString()
        }));

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                balance: balance.balance,
                totalDeposits: balance.totalDeposits,
                totalCashExpenses: balance.totalCashExpenses,
                totalReimbursements: balance.totalReimbursements,
                outstandingDebt,
                recentMovements: mappedMovements
            }
        })

    } catch (error) {
        console.error('Error fetching cashbox data:', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}