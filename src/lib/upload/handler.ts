import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { UPLOAD_CONFIG, isValidImageType, isValidDocumentType, isValidFileSize } from './config'

export interface UploadResult {
    success: boolean
    url?: string
    error?: string
}

export async function uploadFile(
    file: File,
    type: 'image' | 'document',
    farmId: string
): Promise<UploadResult> {
    try {
        // Validate file size
        if (!isValidFileSize(file.size)) {
            return {
                success: false,
                error: `File size exceeds ${UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB limit`
            }
        }

        // Validate file type
        const isValidType = type === 'image'
            ? isValidImageType(file.type)
            : isValidDocumentType(file.type)

        if (!isValidType) {
            return {
                success: false,
                error: `Invalid file type: ${file.type}`
            }
        }

        // Create upload directory if it doesn't exist
        const uploadDir = path.join(UPLOAD_CONFIG.uploadDir, farmId, type + 's')
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        // Generate unique filename
        const timestamp = Date.now()
        const extension = path.extname(file.name)
        const filename = `${timestamp}-${crypto.randomUUID()}${extension}`
        const filepath = path.join(uploadDir, filename)

        // Convert File to Buffer and write to disk
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filepath, buffer)

        // Return public URL
        const publicUrl = `${UPLOAD_CONFIG.publicPath}/${farmId}/${type}s/${filename}`

        return {
            success: true,
            url: publicUrl
        }
    } catch (error) {
        console.error('Upload error:', error)
        return {
            success: false,
            error: 'Failed to upload file'
        }
    }
}

export async function uploadAnimalPhoto(file: File, farmId: string): Promise<UploadResult> {
    return uploadFile(file, 'image', farmId)
}

export async function uploadEventAttachment(file: File, farmId: string): Promise<UploadResult> {
    return uploadFile(file, 'document', farmId)
}