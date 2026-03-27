import multer from "multer";
import path from "path";
import { env } from "../config/env.js";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function normalizeExtension(originalname?: string | null) {
  const ext = path.extname(originalname || "").toLowerCase();
  return allowedExtensions.has(ext) ? ext : null;
}

const storage = multer.memoryStorage();

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
