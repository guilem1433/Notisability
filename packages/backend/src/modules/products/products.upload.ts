import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { env } from '../../config/env';

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const productId = req.params.id;
    const dir = path.join(env.files.storagePath, productId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

export const productFileUpload = multer({
  storage,
  limits: { fileSize: env.files.maxSizeMb * 1024 * 1024 },
});
