export const UPLOAD_CONFIG = {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'text/plain', 'application/msword'],
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    publicPath: '/uploads',
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