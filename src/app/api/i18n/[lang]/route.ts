import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/types'
import { locales, type Locale } from '@/i18n/request'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ lang: string }> }
) {
    const { lang } = await params

    // Validate locale against whitelist
    if (!locales.includes(lang as Locale)) {
        return NextResponse.json<ApiResponse>({
            success: false,
            error: `Unsupported locale: ${lang}. Supported locales: ${locales.join(', ')}`,
            code: 'INVALID_LOCALE'
        }, { status: 400 })
    }

    try {
        // Load translation file using dynamic import
        const translations = await import(`../../../../../messages/${lang}.json`)

        return NextResponse.json<ApiResponse>({
            success: true,
            data: translations.default,
            message: `Translations loaded successfully for locale: ${lang}`
        }, {
            headers: {
                'Cache-Control': 'public, max-age=3600, s-maxage=86400'
            }
        })
    } catch (error) {
        return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Translation file not found',
            code: 'TRANSLATION_NOT_FOUND'
        }, { status: 404 })
    }
}