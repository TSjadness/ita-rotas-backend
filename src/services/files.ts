import type { Express } from "express";

export function isLocalUploadUrl(value?: string | null) {
  return typeof value === "string" && value.startsWith("/uploads/");
}

export async function removeLocalUploadIfExists(_value?: string | null) {
  return;
}

export function fileToDataUrl(file?: Express.Multer.File | null) {
  if (!file) return undefined;

  const mimeType = file.mimetype || "application/octet-stream";
  const base64 = file.buffer.toString("base64");

  return `data:${mimeType};base64,${base64}`;
}

export function filesToDataUrls(files?: Express.Multer.File[] | null) {
  if (!files || !Array.isArray(files)) return [];
  return files.map((file) => fileToDataUrl(file)).filter(Boolean) as string[];
}
