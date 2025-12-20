import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { UPLOAD_CONFIG } from '@/lib/upload/config'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: pathSegments } = await params
        const filePath = path.join(UPLOAD_CONFIG.uploadDir, ...pathSegments)

        // Security check: ensure the file is within the upload directory
        const resolvedPath = path.resolve(filePath)
        const resolvedUploadDir = path.resolve(UPLOAD_CONFIG.uploadDir)

        if (!resolvedPath.startsWith(resolvedUploadDir)) {
            return new NextResponse('Forbidden', { status: 403 })
        }

        // Check if file exists
        if (!existsSync(filePath)) {
            return new NextResponse('File not found', { status: 404 })
        }

        // Read and serve the file
        const fileBuffer = await readFile(filePath)
        const extension = path.extname(filePath).toLowerCase()

        // Set appropriate content type
        let contentType = 'application/octet-stream'
        switch (extension) {
            case '.jpg':
            case '.jpeg':
                contentType = 'image/jpeg'
                break
            case '.png':
                contentType = 'image/png'
                break
            case '.webp':
                contentType = 'image/webp'
                break
            case '.pdf':
                contentType = 'application/pdf'
                break
            case '.txt':
                contentType = 'text/plain'
                break
        }

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
            },
        })
    } catch (error) {
        console.error('File serve error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}