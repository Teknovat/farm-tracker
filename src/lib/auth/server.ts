import { verifySession } from './session'
import { UserRepository } from '@/lib/repositories/user'
import { FarmRepository } from '@/lib/repositories/farm'
import { getPermissions, Role } from './permissions'
import { redirect } from 'next/navigation'

export interface ServerAuthContext {
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

export async function getServerAuth(): Promise<ServerAuthContext | null> {
    const session = await verifySession()

    if (!session) {
        return null
    }

    const userRepo = new UserRepository()
    const user = await userRepo.findById(session.userId)

    if (!user) {
        return null
    }

    let farm: ServerAuthContext['farm'] | undefined
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

export async function requireServerAuth(): Promise<ServerAuthContext> {
    const auth = await getServerAuth()

    if (!auth) {
        redirect('/login')
    }

    return auth
}

export async function requireServerFarmAuth(farmId: string): Promise<ServerAuthContext> {
    const auth = await requireServerAuth()

    if (!auth.farm || auth.farm.id !== farmId) {
        redirect('/unauthorized')
    }

    return auth
}

export async function requireServerPermission(
    permission: keyof ReturnType<typeof getPermissions>,
    farmId?: string
): Promise<ServerAuthContext> {
    const auth = farmId ? await requireServerFarmAuth(farmId) : await requireServerAuth()

    if (!auth.permissions[permission]) {
        redirect('/unauthorized')
    }

    return auth
}

// Simple function to get current user (for API routes)
export async function getCurrentUser() {
    const auth = await getServerAuth()
    return auth?.user || null
}