import { NextRequest, NextResponse } from 'next/server'
import { FarmRepository } from '@/lib/repositories/farm'
import { getServerAuth } from '@/lib/auth/server'
import { createSession } from '@/lib/auth/session'
import { ApiResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
    try {
        const auth = await getServerAuth()
        if (!auth) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' } as ApiResponse,
                { status: 401 }
            )
        }

        const farmRepo = new FarmRepository()
        const farms = await farmRepo.findUserFarms(auth.user.id)

        return NextResponse.json({
            success: true,
            data: farms
        } as ApiResponse)
    } catch (error) {
        console.error('Error fetching farms:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' } as ApiResponse,
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getServerAuth()
        if (!auth) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' } as ApiResponse,
                { status: 401 }
            )
        }

        const body = await request.json()
        const { name, currency, timezone } = body

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Farm name is required' } as ApiResponse,
                { status: 400 }
            )
        }

        const farmRepo = new FarmRepository()
        const result = await farmRepo.createFarmWithOwner({
            name: name.trim(),
            currency: currency || 'TND',
            timezone: timezone || 'Africa/Tunis',
            createdBy: auth.user.id
        })

        // Update session with new farm
        await createSession(auth.user.id, result.farm.id, 'OWNER')

        return NextResponse.json({
            success: true,
            data: result,
            message: 'Farm created successfully'
        } as ApiResponse, { status: 201 })
    } catch (error) {
        console.error('Error creating farm:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' } as ApiResponse,
            { status: 500 }
        )
    }
}