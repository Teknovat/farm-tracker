export const UPLOAD_CONFIG = {
    maxFileSize: 2 * 1024 * 1024, // 2MB (reduced for Base64 storage)
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'text/plain', 'application/msword'],
    // For Vercel deployment, we'll use Base64 encoding instead of file system
    useBase64Storage: process.env.NODE_ENV === 'production' || process.env.USE_BASE64_STORAGE === 'true',
}

export function isValidImageType(mimeType: string): boolean {
    return UPLOAD_CONFIG.allowedImageTypes.includes(mimeType)
}

export function isValidDocumentType(mimeType: string): boolean {
    return UPLOAD_CONFIG.allowedDocumentTypes.includes(mimeType)
}

export function isValidFileSize(size: number): boolean {
    return size <= UPLOAD_CONFIG.maxFileSize
}