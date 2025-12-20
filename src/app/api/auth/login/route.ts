import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { UserRepository } from '@/lib/repositories/user'
import { FarmRepository } from '@/lib/repositories/farm'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password } = loginSchema.parse(body)

        const userRepo = new UserRepository()
        const user = await userRepo.findByEmail(email)

        if (!user || !(await verifyPassword(password, user.passwordHash))) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // Get user's farms to set default farm context
        const farmRepo = new FarmRepository()
        const farms = await farmRepo.findUserFarms(user.id)
        const defaultFarm = farms[0]

        let farmId: string | undefined
        let role: string | undefined

        if (defaultFarm) {
            const member = await farmRepo.findFarmMember(defaultFarm.id, user.id)
            farmId = defaultFarm.id
            role = member?.role
        }

        await createSession(user.id, farmId, role)

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                farm: defaultFarm ? {
                    id: defaultFarm.id,
                    name: defaultFarm.name,
                    role: role,
                } : null,
            },
        })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { success: false, error: 'Invalid request' },
            { status: 400 }
        )
    }
}