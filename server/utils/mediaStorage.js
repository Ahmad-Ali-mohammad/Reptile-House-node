import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadsRoot = path.resolve(__dirname, '../uploads');
export const mediaRoot = path.join(uploadsRoot, 'media');

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/png': 'png',
  'image/apng': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/x-ms-bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/jxl': 'jxl',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/json': 'json',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/zip': 'zip',
  'application/x-rar-compressed': 'rar',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/x-matroska': 'mkv',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
};
const EXTENSION_MIME_MAP = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  apng: 'image/apng',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  heic: 'image/heic',
  heif: 'image/heif',
  ico: 'image/x-icon',
  jxl: 'image/jxl',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
};

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${Math.max(bytes, 0)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function sanitizeSegment(value, fallback = 'general') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || fallback;
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) throw createError('Invalid file payload');

  const [, mimeType, encoded] = match;
  const buffer = Buffer.from(encoded, 'base64');
  if (!buffer.length) throw createError('Uploaded file is empty');
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw createError(`Uploaded file exceeds ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB limit`);
  }

  return { mimeType, buffer };
}

function ensureBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw createError('Uploaded file is empty');
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw createError(`Uploaded file exceeds ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB limit`);
  }
  return buffer;
}

function resolveExtension(fileName, mimeType) {
  const extension = path.extname(String(fileName || '')).replace(/^\./, '').toLowerCase();
  if (extension && EXTENSION_MIME_MAP[extension]) return extension;
  return MIME_EXTENSION_MAP[mimeType] || 'bin';
}

export function isAllowedUploadMimeType(mimeType) {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-rar-compressed',
    ].includes(mimeType)
  );
}

function resolveMimeType(fileName, mimeType) {
  const normalizedMimeType = String(mimeType || '').trim().toLowerCase();
  if (normalizedMimeType && isAllowedUploadMimeType(normalizedMimeType)) {
    return normalizedMimeType;
  }

  const extension = resolveExtension(fileName, normalizedMimeType);
  const inferredMimeType = EXTENSION_MIME_MAP[extension];
  if (inferredMimeType) {
    return inferredMimeType;
  }

  throw createError('Unsupported file type');
}

async function removeEmptyFolders(startDir) {
  let currentDir = startDir;

  while (currentDir.startsWith(mediaRoot) && currentDir !== mediaRoot) {
    const entries = await fs.readdir(currentDir);
    if (entries.length > 0) return;
    await fs.rmdir(currentDir);
    currentDir = path.dirname(currentDir);
  }
}

export async function ensureMediaRoot() {
  await fs.mkdir(mediaRoot, { recursive: true });
}

export async function storeUploadedBuffer({ buffer, fileName, mimeType, category }) {
  const safeBuffer = ensureBuffer(buffer);
  const detectedMimeType = resolveMimeType(fileName, mimeType);

  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const safeCategory = sanitizeSegment(category, 'general');
  const safeBaseName = sanitizeSegment(path.basename(String(fileName || 'file'), path.extname(String(fileName || ''))), 'file');
  const extension = resolveExtension(fileName, detectedMimeType);
  const targetDir = path.join(mediaRoot, safeCategory, year, month);
  const storedName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeBaseName}.${extension}`;
  const targetPath = path.join(targetDir, storedName);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetPath, safeBuffer);

  const relativePath = path.relative(uploadsRoot, targetPath).split(path.sep).join('/');
  return {
    url: `/uploads/${relativePath}`,
    name: String(fileName || storedName),
    size: formatSize(safeBuffer.length),
    bytes: safeBuffer.length,
    mimeType: detectedMimeType,
    fileType: detectedMimeType.startsWith('image/')
      ? 'image'
      : detectedMimeType.startsWith('video/')
        ? 'video'
        : detectedMimeType.startsWith('audio/')
          ? 'audio'
          : 'file',
    storedName,
  };
}

export async function storeUploadedFile({ dataUrl, fileName, mimeType, category }) {
  const parsed = parseDataUrl(dataUrl);
  return storeUploadedBuffer({
    buffer: parsed.buffer,
    fileName,
    mimeType: mimeType || parsed.mimeType,
    category,
  });
}

export function isManagedUploadUrl(url) {
  return typeof url === 'string' && url.startsWith('/uploads/media/');
}

export async function deleteManagedUpload(url) {
  if (!isManagedUploadUrl(url)) return false;

  const relativePath = url.replace(/^\/uploads\//, '').replace(/^\/+/, '');
  const fullPath = path.join(uploadsRoot, relativePath);
  if (!fullPath.startsWith(uploadsRoot)) {
    throw createError('Invalid managed upload path', 400);
  }

  try {
    await fs.unlink(fullPath);
    await removeEmptyFolders(path.dirname(fullPath));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}
