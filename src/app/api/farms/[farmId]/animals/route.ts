import { NextRequest, NextResponse } from 'next/server'
import { AnimalRepository, type AnimalFilters, type CreateAnimalData } from '@/lib/repositories/animal'
import { getCurrentUser } from '@/lib/auth/server'
import { checkFarmAccess } from '@/lib/auth/permissions'

const animalRepository = new AnimalRepository()

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) {
    const { farmId } = await params
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if user has access to this farm
        const hasPermission = await checkFarmAccess(user.id, farmId, 'READ')
        if (!hasPermission) {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Parse query parameters for filtering
        const { searchParams } = new URL(request.url)
        const filters: AnimalFilters = {}

        if (searchParams.get('species')) {
            filters.species = searchParams.get('species')!
        }
        if (searchParams.get('type')) {
            filters.type = searchParams.get('type') as 'INDIVIDUAL' | 'LOT'
        }
        if (searchParams.get('status')) {
            filters.status = searchParams.get('status') as 'ACTIVE' | 'SOLD' | 'DEAD'
        }
        if (searchParams.get('sex')) {
            filters.sex = searchParams.get('sex') as 'MALE' | 'FEMALE'
        }

        const animals = await animalRepository.findByFarmId(farmId, filters)

        return NextResponse.json({
            success: true,
            data: animals
        })
    } catch (error) {
        console.error('Error fetching animals:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) {
    const { farmId } = await params
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if user has create permission for this farm
        const hasPermission = await checkFarmAccess(user.id, farmId, 'CREATE')
        if (!hasPermission) {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            )
        }

        const body = await request.json()

        // Validate required fields
        if (!body.species?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Species is required' },
                { status: 400 }
            )
        }

        if (!body.type || !['INDIVIDUAL', 'LOT'].includes(body.type)) {
            return NextResponse.json(
                { success: false, error: 'Type must be INDIVIDUAL or LOT' },
                { status: 400 }
            )
        }

        const animalData: CreateAnimalData = {
            farmId: farmId,
            type: body.type,
            species: body.species.trim(),
            sex: body.sex,
            birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
            estimatedAge: body.estimatedAge,
            status: body.status || 'ACTIVE',
            photoUrl: body.photoUrl,
            lotCount: body.lotCount,
            createdBy: user.id
        }

        const animal = await animalRepository.create(animalData)

        return NextResponse.json({
            success: true,
            data: animal,
            message: 'Animal created successfully'
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating animal:', error)

        if (error instanceof Error && error.message.includes('Validation failed')) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}