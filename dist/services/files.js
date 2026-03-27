import { promises as fs } from 'fs';
import path from 'path';
export const uploadsDir = path.resolve(process.cwd(), 'uploads');
export async function ensureUploadsDir() {
    await fs.mkdir(uploadsDir, { recursive: true });
}
export function isLocalUploadUrl(value) {
    return typeof value === 'string' && value.startsWith('/uploads/');
}
export async function removeLocalUploadIfExists(value) {
    if (!isLocalUploadUrl(value))
        return;
    const filename = (value || '').replace('/uploads/', '');
    const safeName = path.basename(filename);
    const fullPath = path.join(uploadsDir, safeName);
    try {
        await fs.unlink(fullPath);
    }
    catch {
        // ignora se o arquivo não existir
    }
}
