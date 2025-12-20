import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from './session'
import { UserRepository } from '@/lib/repositories/user'
import { FarmRepository } from '@/lib/repositories/farm'
import { getPermissions, Role } from './permissions'

export interface AuthContext {
    user: {
        id: string
        email: string
        name: string
    }
    farm?: {
        id: string
        name: string
        role: Role
    }
    permissions: ReturnType<typeof getPermissions>
}

export async function requireAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
    const session = await verifySession()

    if (!session) {
        return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
        )
    }

    const userRepo = new UserRepository()
    const user = await userRepo.findById(session.userId)

    if (!user) {
        return NextResponse.json(
            { success: false, error: 'User not found' },
            { status: 404 }
        )
    }

    let farm: AuthContext['farm'] | undefined
    let permissions = getPermissions('WORKER') // Default to most restrictive

    if (session.farmId && session.role) {
        const farmRepo = new FarmRepository()
        const farmData = await farmRepo.findById(session.farmId)

        if (farmData) {
            // Verify user is still a member of this farm
            const member = await farmRepo.findFarmMember(session.farmId, session.userId)
            if (member && member.status === 'ACTIVE') {
                farm = {
                    id: farmData.id,
                    name: farmData.name,
                    role: member.role as Role
                }
                permissions = getPermissions(member.role as Role)
            }
        }
    }

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name
        },
        farm,
        permissions
    }
}

export async function requireFarmAccess(
    request: NextRequest,
    farmId: string,
    requiredPermission?: keyof ReturnType<typeof getPermissions>
): Promise<AuthContext | NextResponse> {
    const authResult = await requireAuth(request)

    if (authResult instanceof NextResponse) {
        return authResult
    }

    if (!authResult.farm || authResult.farm.id !== farmId) {
        return NextResponse.json(
            { success: false, error: 'Farm access denied' },
            { status: 403 }
        )
    }

    if (requiredPermission && !authResult.permissions[requiredPermission]) {
        return NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 403 }
        )
    }

    return authResult
}

export function withAuth(
    handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
    return async (request: NextRequest) => {
        const authResult = await requireAuth(request)

        if (authResult instanceof NextResponse) {
            return authResult
        }

        return handler(request, authResult)
    }
}

export function withFarmAuth(
    handler: (request: NextRequest, context: AuthContext, farmId: string) => Promise<NextResponse>,
    requiredPermission?: keyof ReturnType<typeof getPermissions>
) {
    return async (request: NextRequest, { params }: { params: { farmId: string } }) => {
        const farmId = params.farmId
        const authResult = await requireFarmAccess(request, farmId, requiredPermission)

        if (authResult instanceof NextResponse) {
            return authResult
        }

        return handler(request, authResult, farmId)
    }
}