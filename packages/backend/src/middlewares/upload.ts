import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const IMAGES_DIR = path.join(env.uploads.absolutePath, "images");
const FILES_DIR = path.join(env.uploads.absolutePath, "files");

for (const dir of [IMAGES_DIR, FILES_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_PRODUCT_FILE_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/pdf",
  "application/octet-stream",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PRODUCT_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

function buildFilename(file: Express.Multer.File): string {
  const uniqueSuffix = crypto.randomBytes(16).toString("hex");
  const extension = path.extname(file.originalname);
  return `${Date.now()}-${uniqueSuffix}${extension}`;
}

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMAGES_DIR),
  filename: (_req, file, cb) => cb(null, buildFilename(file)),
});

const productFileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, FILES_DIR),
  filename: (_req, file, cb) => cb(null, buildFilename(file)),
});

function imageFileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    cb(new AppError("Formato de imagen no permitido. Usa JPG, PNG, WEBP o GIF", 400));
    return;
  }
  cb(null, true);
}

function productFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  if (!ALLOWED_PRODUCT_FILE_TYPES.has(file.mimetype)) {
    cb(new AppError("Formato de archivo no permitido. Usa ZIP o PDF", 400));
    return;
  }
  cb(null, true);
}

export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});

export const uploadProductFile = multer({
  storage: productFileStorage,
  fileFilter: productFileFilter,
  limits: { fileSize: MAX_PRODUCT_FILE_SIZE },
});

export function relativeUploadPath(file: Express.Multer.File, kind: "images" | "files"): string {
  return `/uploads/${kind}/${file.filename}`;
}

export function absoluteUploadPath(relativePath: string): string {
  const relative = relativePath.replace(/^\/uploads\//, "");
  return path.join(env.uploads.absolutePath, relative);
}
