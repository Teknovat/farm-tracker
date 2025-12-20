import { NextRequest, NextResponse } from 'next/server'
import { eventRepository } from '@/lib/repositories/event'
import { animalRepository } from '@/lib/repositories/animal'
import { getCurrentUser } from '@/lib/auth/server'
import { checkFarmAccess } from '@/lib/auth/permissions'
import type { ApiResponse } from '@/lib/types'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; targetId: string }> }
) {
    const { farmId, targetId } = await params
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

        // Verify the target (animal/lot) exists and belongs to this farm
        const target = await animalRepository.findById(targetId)
        if (!target || target.farmId !== farmId) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Target animal/lot not found or does not belong to this farm' },
                { status: 404 }
            )
        }

        // Get target type from query params or infer from animal type
        const { searchParams } = new URL(request.url)
        const targetType = searchParams.get('targetType') as 'ANIMAL' | 'LOT' | undefined

        // If not specified, infer from animal type
        const inferredTargetType = target.type === 'INDIVIDUAL' ? 'ANIMAL' : 'LOT'
        const finalTargetType = targetType || inferredTargetType

        // Get events for this target in chronological order
        const events = await eventRepository.findByTarget(farmId, targetId, finalTargetType)

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                target: {
                    id: target.id,
                    type: target.type,
                    species: target.species,
                    status: target.status
                },
                events: events
            }
        })

    } catch (error) {
        console.error('Error fetching event timeline:', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}