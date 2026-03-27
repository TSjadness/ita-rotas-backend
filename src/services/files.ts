import { promises as fs } from "fs";
import path from "path";

const configuredUploadsDir = process.env.UPLOADS_DIR?.trim();

export const uploadsDir = configuredUploadsDir
  ? path.resolve(configuredUploadsDir)
  : path.resolve(process.cwd(), "uploads");

export async function ensureUploadsDir() {
  await fs.mkdir(uploadsDir, { recursive: true });
}

export function isLocalUploadUrl(value?: string | null) {
  return typeof value === "string" && value.startsWith("/uploads/");
}

export function getUploadFilenameFromUrl(value?: string | null) {
  if (!isLocalUploadUrl(value)) return null;

  const relative = value.replace("/uploads/", "").trim();
  if (!relative) return null;

  return path.basename(relative);
}

export function getUploadFullPath(value?: string | null) {
  const safeName = getUploadFilenameFromUrl(value);
  if (!safeName) return null;

  return path.join(uploadsDir, safeName);
}

export async function localUploadExists(value?: string | null) {
  const fullPath = getUploadFullPath(value);
  if (!fullPath) return false;

  try {
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

export async function removeLocalUploadIfExists(value?: string | null) {
  const fullPath = getUploadFullPath(value);
  if (!fullPath) return;

  try {
    await fs.unlink(fullPath);
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      console.error("Erro ao remover arquivo local:", error);
    }
  }
}