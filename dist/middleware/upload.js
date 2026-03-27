import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { env } from '../config/env.js';
import { ensureUploadsDir, uploadsDir } from '../services/files.js';
const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
]);
const allowedExtensions = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif'
]);
const storage = multer.diskStorage({
    destination: async (_req, _file, cb) => {
        try {
            await ensureUploadsDir();
            cb(null, uploadsDir);
        }
        catch (error) {
            cb(error, uploadsDir);
        }
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        cb(null, `${Date.now()}-${uuid()}${ext}`);
    }
});
function fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(ext)) {
        return cb(new Error('Apenas imagens JPG, PNG, WEBP e GIF são permitidas.'));
    }
    cb(null, true);
}
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: env.maxUploadSizeMb * 1024 * 1024,
        files: 10
    }
});
export const uploadSingleImage = upload.single('image');
export const uploadMultipleImages = upload.array('images', 10);
