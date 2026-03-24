import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const uploadsDir = path.resolve(__dirname, '../uploads');

export async function ensureUploadsDir() {
  await fs.mkdir(uploadsDir, { recursive: true });
}

export function isLocalUploadUrl(value?: string | null) {
  return typeof value === 'string' && value.startsWith('/uploads/');
}

export async function removeLocalUploadIfExists(value?: string | null) {
  if (!isLocalUploadUrl(value)) return;
  const filename = (value || '').replace('/uploads/', '');
  const safeName = path.basename(filename);
  const fullPath = path.join(uploadsDir, safeName);
  try {
    await fs.unlink(fullPath);
  } catch {
    // ignore if file no longer exists
  }
}
