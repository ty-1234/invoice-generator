import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const UPLOAD_DIR = config.storage.localPath;

function ensureUploadDir(): string {
  const dir = path.resolve(UPLOAD_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export const saveFile = async (
  file: Express.Multer.File,
  invoiceId: string
): Promise<{ storageKey: string; fileName: string; fileSize: number; mimeType: string }> => {
  const dir = ensureUploadDir();
  const ext = path.extname(file.originalname) || '';
  const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '-');
  const storageKey = `invoices/${invoiceId}/${Date.now()}-${baseName}${ext}`;
  const fullPath = path.join(dir, storageKey);

  const fullDir = path.dirname(fullPath);
  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
  }

  fs.writeFileSync(fullPath, file.buffer);

  return {
    storageKey,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
  };
};

export const getFileStream = (storageKey: string): fs.ReadStream => {
  const fullPath = path.resolve(UPLOAD_DIR, storageKey);
  if (!fs.existsSync(fullPath)) {
    throw new AppError('File not found', 404);
  }
  return fs.createReadStream(fullPath);
};
