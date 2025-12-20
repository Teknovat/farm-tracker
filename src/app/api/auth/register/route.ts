import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { UserRepository } from '@/lib/repositories/user'
import { hashPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'

const registerSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    password: z.string().min(8),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, name, password } = registerSchema.parse(body)

        const userRepo = new UserRepository()

        // Check if user already exists
        const existingUser = await userRepo.findByEmail(email)
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Email already registered' },
                { status: 400 }
            )
        }

        // Hash password and create user
        const passwordHash = await hashPassword(password)
        const user = await userRepo.createUser({
            email,
            name,
            passwordHash,
        })

        // Create session
        await createSession(user.id)

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            },
        })
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { success: false, error: 'Invalid request' },
            { status: 400 }
        )
    }
}