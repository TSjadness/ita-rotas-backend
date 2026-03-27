import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import { env } from "../config/env.js";
import { ensureUploadsDir, uploadsDir } from "../services/files.js";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
]);

function normalizeExtension(originalname?: string | null) {
  const ext = path.extname(originalname || "").toLowerCase();

  if (allowedExtensions.has(ext)) {
    return ext;
  }

  return null;
}

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await ensureUploadsDir();
      cb(null, uploadsDir);
    } catch (error) {
      cb(error as Error, uploadsDir);
    }
  },

  filename: (_req, file, cb) => {
    const ext = normalizeExtension(file.originalname);

    if (!ext) {
      return cb(new Error("Extensão de arquivo inválida."), "");
    }

    cb(null, `${Date.now()}-${uuid()}${ext}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  const ext = normalizeExtension(file.originalname);
  const mime = (file.mimetype || "").toLowerCase();

  if (!ext || !allowedMimeTypes.has(mime)) {
    return cb(
      new Error("Apenas imagens JPG, JPEG, PNG, WEBP e GIF são permitidas."),
    );
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxUploadSizeMb * 1024 * 1024,
    files: 10,
  },
});

export const uploadSingleImage = upload.single("image");
export const uploadMultipleImages = upload.array("images", 10);