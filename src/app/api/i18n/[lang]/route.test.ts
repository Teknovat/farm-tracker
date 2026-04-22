import { describe, it, expect, vi } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'

// Mock the translation files
vi.mock('../../../../../../../messages/fr.json', () => ({
    default: {
        common: { loading: 'Chargement...' },
        animals: { title: 'Animaux' }
    }
}))

vi.mock('../../../../../../../messages/en.json', () => ({
    default: {
        common: { loading: 'Loading...' },
        animals: { title: 'Animals' }
    }
}))

vi.mock('../../../../../../../messages/ar.json', () => ({
    default: {
        common: { loading: 'جاري التحميل...' },
        animals: { title: 'الحيوانات' }
    }
}))

describe('GET /api/i18n/[lang]', () => {
    it('should return French translations for valid locale', async () => {
        const request = new NextRequest(new URL('http://localhost:3000/api/i18n/fr'))
        const response = await GET(request, { params: Promise.resolve({ lang: 'fr' }) })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toBeDefined()
        expect(data.data.common.loading).toBe('Chargement...')
        expect(data.data.animals.title).toBe('Animaux')
        expect(data.message).toContain('fr')
        expect(response.headers.get('Cache-Control')).toContain('public')
    })

    it('should return English translations for valid locale', async () => {
        const request = new NextRequest(new URL('http://localhost:3000/api/i18n/en'))
        const response = await GET(request, { params: Promise.resolve({ lang: 'en' }) })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toBeDefined()
        expect(data.data.common.loading).toBe('Loading...')
        expect(data.data.animals.title).toBe('Animals')
        expect(data.message).toContain('en')
    })

    it('should return Arabic translations for valid locale', async () => {
        const request = new NextRequest(new URL('http://localhost:3000/api/i18n/ar'))
        const response = await GET(request, { params: Promise.resolve({ lang: 'ar' }) })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toBeDefined()
        expect(data.data.common.loading).toBe('جاري التحميل...')
        expect(data.data.animals.title).toBe('الحيوانات')
        expect(data.message).toContain('ar')
    })

    it('should return 400 error for unsupported locale', async () => {
        const request = new NextRequest(new URL('http://localhost:3000/api/i18n/de'))
        const response = await GET(request, { params: Promise.resolve({ lang: 'de' }) })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.code).toBe('INVALID_LOCALE')
        expect(data.error).toContain('Unsupported locale')
        expect(data.error).toContain('de')
        expect(data.error).toContain('fr, en, ar')
    })

    it('should return 400 error for invalid locale format', async () => {
        const request = new NextRequest(new URL('http://localhost:3000/api/i18n/xyz123'))
        const response = await GET(request, { params: Promise.resolve({ lang: 'xyz123' }) })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.code).toBe('INVALID_LOCALE')
        expect(data.error).toContain('Unsupported locale')
        expect(data.error).toContain('xyz123')
    })

    it('should set proper cache headers', async () => {
        const request = new NextRequest(new URL('http://localhost:3000/api/i18n/fr'))
        const response = await GET(request, { params: Promise.resolve({ lang: 'fr' }) })

        const cacheControl = response.headers.get('Cache-Control')
        expect(cacheControl).toBeDefined()
        expect(cacheControl).toContain('public')
        expect(cacheControl).toContain('max-age=3600')
        expect(cacheControl).toContain('s-maxage=86400')
    })

    it('should return ApiResponse format for all responses', async () => {
        const validRequest = new NextRequest(new URL('http://localhost:3000/api/i18n/fr'))
        const validResponse = await GET(validRequest, { params: Promise.resolve({ lang: 'fr' }) })
        const validData = await validResponse.json()

        expect(validData).toHaveProperty('success')
        expect(validData).toHaveProperty('data')
        expect(validData).toHaveProperty('message')

        const invalidRequest = new NextRequest(new URL('http://localhost:3000/api/i18n/de'))
        const invalidResponse = await GET(invalidRequest, { params: Promise.resolve({ lang: 'de' }) })
        const invalidData = await invalidResponse.json()

        expect(invalidData).toHaveProperty('success')
        expect(invalidData).toHaveProperty('error')
        expect(invalidData).toHaveProperty('code')
    })
})