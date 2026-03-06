import { MediaFolder, MediaItem, MediaUploadResult } from '../types';
import { api } from './api';

const IMAGE_EXTENSIONS = [
  'avif',
  'bmp',
  'gif',
  'heic',
  'heif',
  'ico',
  'jpeg',
  'jpg',
  'jxl',
  'png',
  'svg',
  'tif',
  'tiff',
  'webp',
];

const VIDEO_EXTENSIONS = ['avi', 'mkv', 'mov', 'mp4', 'webm'];
const AUDIO_EXTENSIONS = ['m4a', 'mp3', 'ogg', 'wav'];
const DOCUMENT_EXTENSIONS = ['csv', 'doc', 'docx', 'json', 'pdf', 'ppt', 'pptx', 'rar', 'txt', 'xls', 'xlsx', 'zip'];

const ALL_MEDIA_EXTENSIONS = [
  ...IMAGE_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
  ...AUDIO_EXTENSIONS,
  ...DOCUMENT_EXTENSIONS,
];

const IMAGE_EXTENSION_SET = new Set(IMAGE_EXTENSIONS);
const ALL_MEDIA_EXTENSION_SET = new Set(ALL_MEDIA_EXTENSIONS);

export const IMAGE_FILE_ACCEPT = `image/*,${IMAGE_EXTENSIONS.map((extension) => `.${extension}`).join(',')}`;
export const MEDIA_FILE_ACCEPT = `${IMAGE_FILE_ACCEPT},video/*,audio/*,${[...DOCUMENT_EXTENSIONS].map((extension) => `.${extension}`).join(',')}`;

function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

function isSupportedByExtension(file: File, allowedExtensions: Set<string>): boolean {
  return allowedExtensions.has(getFileExtension(file.name));
}

function isSupportedImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) {
    return true;
  }

  return isSupportedByExtension(file, IMAGE_EXTENSION_SET);
}

function isSupportedMediaFile(file: File): boolean {
  if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
    return true;
  }

  return isSupportedByExtension(file, ALL_MEDIA_EXTENSION_SET);
}

export function inferMediaKind(fileType?: string, mimeType?: string): 'image' | 'video' | 'audio' | 'file' {
  if (fileType === 'image' || fileType === 'video' || fileType === 'audio') {
    return fileType;
  }

  const normalizedMimeType = String(mimeType || '').toLowerCase();
  if (normalizedMimeType.startsWith('image/')) return 'image';
  if (normalizedMimeType.startsWith('video/')) return 'video';
  if (normalizedMimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

export const mediaService = {
  getImages: async (folderId?: string, category?: string): Promise<MediaItem[]> => {
    try {
      return await api.getMedia(folderId, category);
    } catch (error) {
      console.error('Failed to fetch media:', error);
      return [];
    }
  },

  getMedia: async (folderId?: string, category?: string): Promise<MediaItem[]> => {
    return mediaService.getImages(folderId, category);
  },

  searchImages: async (searchTerm: string): Promise<MediaItem[]> => {
    try {
      return await api.searchMedia(searchTerm);
    } catch (error) {
      console.error('Failed to search media:', error);
      return [];
    }
  },

  searchMedia: async (searchTerm: string): Promise<MediaItem[]> => {
    return mediaService.searchImages(searchTerm);
  },

  getFolders: async (): Promise<MediaFolder[]> => {
    try {
      return await api.getMediaFolders();
    } catch (error) {
      console.error('Failed to fetch media folders:', error);
      return [];
    }
  },

  validateImageFile: (file: File, maxSizeMb = 10): void => {
    if (!isSupportedImageFile(file)) {
      throw new Error(`الملف "${file.name}" ليس صورة مدعومة.`);
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      throw new Error(`حجم "${file.name}" أكبر من ${maxSizeMb}MB.`);
    }
  },

  validateMediaFile: (file: File, maxSizeMb = 10): void => {
    if (!isSupportedMediaFile(file)) {
      throw new Error(`الملف "${file.name}" غير مدعوم.`);
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      throw new Error(`حجم "${file.name}" أكبر من ${maxSizeMb}MB.`);
    }
  },

  uploadFile: async (file: File, category?: string): Promise<MediaUploadResult> => {
    return api.uploadMediaFile(file, category);
  },

  uploadProjectImage: async (file: File, category = 'general'): Promise<string> => {
    const uploaded = await mediaService.uploadFile(file, category);
    return uploaded.url;
  },

  uploadProjectMedia: async (file: File, category = 'general'): Promise<string> => {
    const uploaded = await mediaService.uploadFile(file, category);
    return uploaded.url;
  },

  uploadImage: async (file: File, folderId?: string, category?: string): Promise<MediaItem> => {
    const uploaded = await mediaService.uploadFile(file, category);
    const newImage: MediaItem = {
      id: `img-${Date.now()}`,
      url: uploaded.url,
      name: uploaded.name,
      size: uploaded.size,
      fileType: uploaded.fileType,
      mimeType: uploaded.mimeType,
      date: new Date().toLocaleDateString('ar-SY'),
      folderId,
      category,
    };
    return api.uploadMedia(newImage);
  },

  uploadMediaItem: async (file: File, folderId?: string, category?: string): Promise<MediaItem> => {
    const uploaded = await mediaService.uploadFile(file, category);
    const newItem: MediaItem = {
      id: `media-${Date.now()}`,
      url: uploaded.url,
      name: uploaded.name,
      size: uploaded.size,
      fileType: uploaded.fileType,
      mimeType: uploaded.mimeType,
      date: new Date().toLocaleDateString('ar-SY'),
      folderId,
      category,
    };
    return api.uploadMedia(newItem);
  },

  updateImage: async (id: string, updates: Partial<MediaItem>): Promise<MediaItem> => {
    return await api.updateMedia(id, updates);
  },

  updateMediaItem: async (id: string, updates: Partial<MediaItem>): Promise<MediaItem> => {
    return await api.updateMedia(id, updates);
  },

  deleteImage: async (id: string): Promise<void> => {
    await api.deleteMedia(id);
  },

  deleteMediaItem: async (id: string): Promise<void> => {
    await api.deleteMedia(id);
  },

  bulkDeleteImages: async (ids: string[]): Promise<number> => {
    const result = await api.bulkDeleteMedia(ids);
    return result.deleted;
  },

  bulkDeleteMediaItems: async (ids: string[]): Promise<number> => {
    const result = await api.bulkDeleteMedia(ids);
    return result.deleted;
  }
};
