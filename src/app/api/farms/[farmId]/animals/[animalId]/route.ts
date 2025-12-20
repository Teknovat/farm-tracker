import { NextRequest, NextResponse } from 'next/server'
import { AnimalRepository, type UpdateAnimalData } from '@/lib/repositories/animal'
import { getCurrentUser } from '@/lib/auth/server'
import { checkFarmAccess } from '@/lib/auth/permissions'

const animalRepository = new AnimalRepository()

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; animalId: string }> }
) {
    const { farmId, animalId } = await params
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

        const animal = await animalRepository.findById(animalId)
        if (!animal) {
            return NextResponse.json(
                { success: false, error: 'Animal not found' },
                { status: 404 }
            )
        }

        // Verify animal belongs to the specified farm
        if (animal.farmId !== farmId) {
            return NextResponse.json(
                { success: false, error: 'Animal not found in this farm' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: animal
        })
    } catch (error) {
        console.error('Error fetching animal:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; animalId: string }> }
) {
    const { farmId, animalId } = await params
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if user has edit permission for this farm
        const hasPermission = await checkFarmAccess(user.id, farmId, 'UPDATE')
        if (!hasPermission) {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Verify animal exists and belongs to farm
        const existingAnimal = await animalRepository.findById(animalId)
        if (!existingAnimal || existingAnimal.farmId !== farmId) {
            return NextResponse.json(
                { success: false, error: 'Animal not found' },
                { status: 404 }
            )
        }

        const body = await request.json()

        const updateData: UpdateAnimalData = {
            updatedBy: user.id
        }

        // Only update provided fields
        if (body.species !== undefined) {
            if (!body.species?.trim()) {
                return NextResponse.json(
                    { success: false, error: 'Species cannot be empty' },
                    { status: 400 }
                )
            }
            updateData.species = body.species.trim()
        }

        if (body.sex !== undefined) {
            updateData.sex = body.sex
        }

        if (body.birthDate !== undefined) {
            updateData.birthDate = body.birthDate ? new Date(body.birthDate) : undefined
        }

        if (body.estimatedAge !== undefined) {
            updateData.estimatedAge = body.estimatedAge
        }

        if (body.status !== undefined) {
            updateData.status = body.status
        }

        if (body.photoUrl !== undefined) {
            updateData.photoUrl = body.photoUrl
        }

        if (body.lotCount !== undefined) {
            updateData.lotCount = body.lotCount
        }

        const updatedAnimal = await animalRepository.update(animalId, updateData)

        return NextResponse.json({
            success: true,
            data: updatedAnimal,
            message: 'Animal updated successfully'
        })
    } catch (error) {
        console.error('Error updating animal:', error)

        if (error instanceof Error) {
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string; animalId: string }> }
) {
    const { farmId, animalId } = await params
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if user has delete permission for this farm
        const hasPermission = await checkFarmAccess(user.id, farmId, 'DELETE')
        if (!hasPermission) {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Verify animal exists and belongs to farm
        const existingAnimal = await animalRepository.findById(animalId)
        if (!existingAnimal || existingAnimal.farmId !== farmId) {
            return NextResponse.json(
                { success: false, error: 'Animal not found' },
                { status: 404 }
            )
        }

        const deleted = await animalRepository.softDelete(animalId)
        if (!deleted) {
            return NextResponse.json(
                { success: false, error: 'Failed to delete animal' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Animal deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting animal:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}