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

        // Convert file to Base64 data URL for Vercel compatibility
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        const dataUrl = `data:${file.type};base64,${base64}`

        return {
            success: true,
            url: dataUrl
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