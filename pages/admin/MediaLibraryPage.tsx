import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MEDIA_FILE_ACCEPT, inferMediaKind, mediaService } from '../../services/media';
import { MediaFolder, MediaItem } from '../../types';
import { CloudUploadIcon, TrashIcon, SearchIcon, ImageIcon, CheckCircleIcon, DocumentIcon } from '../../components/icons';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { helpContent } from '../../constants/helpContent';

type MediaKindFilter = 'all' | 'image' | 'video' | 'audio' | 'file';

function getMediaKind(item: MediaItem): MediaKindFilter {
  return inferMediaKind(item.fileType, item.mimeType);
}

function getFileExtension(name: string): string {
  const parts = String(name || '').split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : '';
}

function renderMediaPreview(item: MediaItem) {
  const mediaKind = getMediaKind(item);

  if (mediaKind === 'image') {
    return <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />;
  }

  if (mediaKind === 'video') {
    return (
      <video
        src={item.url}
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  if (mediaKind === 'audio') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 text-emerald-300 gap-4">
        <div className="text-5xl font-black">AUDIO</div>
        <div className="text-xs font-bold text-slate-400">{getFileExtension(item.name) || 'AUDIO'}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black text-slate-200 gap-4">
      <DocumentIcon className="w-14 h-14 text-amber-400" />
      <div className="text-xs font-black tracking-widest text-slate-400">{getFileExtension(item.name) || 'FILE'}</div>
    </div>
  );
}

const fileTypeLabels: Record<MediaKindFilter, string> = {
  all: 'كل الأنواع',
  image: 'صور',
  video: 'فيديو',
  audio: 'صوتيات',
  file: 'مستندات',
};

const MediaLibraryPage: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFolderId, setActiveFolderId] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeFileType, setActiveFileType] = useState<MediaKindFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => {
    const values = Array.from(new Set(mediaItems.map((item) => item.category).filter(Boolean))) as string[];
    return values.sort((a, b) => a.localeCompare(b));
  }, [mediaItems]);

  const stats = useMemo(() => ({
    all: mediaItems.length,
    image: mediaItems.filter((item) => getMediaKind(item) === 'image').length,
    video: mediaItems.filter((item) => getMediaKind(item) === 'video').length,
    audio: mediaItems.filter((item) => getMediaKind(item) === 'audio').length,
    file: mediaItems.filter((item) => getMediaKind(item) === 'file').length,
  }), [mediaItems]);

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [items, foldersData] = await Promise.all([
        mediaService.getMedia(activeFolderId || undefined, activeCategory || undefined),
        mediaService.getFolders(),
      ]);
      setMediaItems(items);
      setFolders(foldersData);
    } catch (err) {
      console.error(err);
      setError('تعذر تحميل مكتبة الوسائط.');
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, activeFolderId]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        mediaService.validateMediaFile(file);
      }

      await Promise.all(
        Array.from(files).map((file) =>
          mediaService.uploadMediaItem(file, activeFolderId || undefined, activeCategory || undefined)
        )
      );
      await loadMedia();
    } catch (err) {
      console.error('Upload failed', err);
      setError(err instanceof Error ? err.message : 'فشل رفع الملفات.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => processFiles(e.target.files);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleDelete = async (id: string) => {
    if (!globalThis.confirm('هل أنت متأكد من حذف هذا الملف نهائيًا؟')) return;
    try {
      await mediaService.deleteMediaItem(id);
      setMediaItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    } catch (err) {
      console.error(err);
      setError('تعذر حذف الملف.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!globalThis.confirm(`سيتم حذف ${selectedIds.length} ملفًا نهائيًا. متابعة؟`)) return;
    try {
      await mediaService.bulkDeleteMediaItems(selectedIds);
      setMediaItems((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      setError('تعذر حذف الملفات المحددة.');
    }
  };

  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
      setError('تعذر نسخ الرابط.');
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, id]));
      return prev.filter((x) => x !== id);
    });
  };

  const filteredItems = mediaItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeFileType === 'all' || getMediaKind(item) === activeFileType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 animate-fade-in text-right pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-4xl font-black mb-2 text-white">مكتبة الوسائط</h1>
            <p className="text-gray-500 font-bold">إدارة الصور والفيديوهات والصوتيات والمستندات من مكان واحد.</p>
          </div>
          <HelpButton onClick={() => setIsHelpOpen(true)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full md:w-auto">
          {(['all', 'image', 'video', 'audio', 'file'] as MediaKindFilter[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setActiveFileType(type);
                setSelectedIds([]);
              }}
              className={`rounded-2xl border px-4 py-3 text-sm font-black transition-all ${
                activeFileType === type
                  ? 'border-amber-500 bg-amber-500 text-gray-900'
                  : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              {fileTypeLabels[type]} ({stats[type]})
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap w-full">
        <div className="relative flex-1 min-w-[220px] md:w-72">
          <input
            type="text"
            placeholder="بحث في الملفات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-3 px-6 ps-14 text-white outline-none focus:ring-2 focus:ring-amber-500"
          />
          <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
        </div>
        <select
          value={activeFolderId}
          onChange={(e) => {
            setActiveFolderId(e.target.value);
            setSelectedIds([]);
          }}
          className="bg-[#1a1c23] border border-white/10 rounded-2xl py-3 px-4 text-white"
        >
          <option value="">كل المجلدات</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>{folder.name}</option>
          ))}
        </select>
        <select
          value={activeCategory}
          onChange={(e) => {
            setActiveCategory(e.target.value);
            setSelectedIds([]);
          }}
          className="bg-[#1a1c23] border border-white/10 rounded-2xl py-3 px-4 text-white"
        >
          <option value="">كل التصنيفات</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={loadMedia}
          className="bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white hover:bg-white/10"
        >
          تحديث
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-300 rounded-2xl p-4 text-sm font-bold">
          {error}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="glass-medium border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-gray-300">تم تحديد {selectedIds.length} ملفًا.</p>
          <button
            type="button"
            onClick={handleBulkDelete}
            className="bg-red-500/20 text-red-300 border border-red-500/40 px-4 py-2 rounded-xl hover:bg-red-500/30"
          >
            حذف المحدد
          </button>
        </div>
      )}

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="منطقة رفع الملفات"
        className={`relative border-2 border-dashed rounded-[3rem] p-16 text-center transition-all duration-500 cursor-pointer group overflow-hidden ${
          isDragging ? 'border-amber-500 bg-amber-500/10 scale-[0.99]' : 'border-white/10 bg-white/5 hover:border-amber-500/30'
        }`}
      >
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className={`p-6 rounded-3xl transition-all duration-500 ${isDragging ? 'bg-amber-500 text-gray-900 scale-110 rotate-12' : 'bg-white/5 text-amber-500'}`}>
            <CloudUploadIcon className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white mb-2">اسحب الملفات هنا أو اضغط للرفع</h2>
            <p className="text-gray-500 font-bold">صور حتى 10MB، مع دعم PDF و DOCX و XLSX و PPTX و ZIP و MP4 و WEBM و MP3 و WAV و OGG</p>
            <p className="text-gray-600 text-xs font-bold mt-2">حقول الصور في بقية الصفحات ما زالت مقيدة بالصور فقط، وهذه الصفحة هي المكتبة العامة للوسائط.</p>
          </div>
          {(isUploading || isLoading) && (
            <div className="flex items-center gap-3 bg-gray-900/80 px-6 py-3 rounded-2xl border border-white/10">
              <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full" />
              <span className="text-amber-500 font-black text-sm uppercase">
                {isUploading ? 'جاري الرفع والمعالجة...' : 'جاري التحميل...'}
              </span>
            </div>
          )}
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept={MEDIA_FILE_ACCEPT} multiple onChange={handleUpload} aria-label="رفع الملفات" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
        {filteredItems.map((item) => {
          const mediaKind = getMediaKind(item);
          return (
            <div key={item.id} className="group relative aspect-square rounded-[2.5rem] overflow-hidden border border-white/5 bg-black/40 hover:border-amber-500 transition-all shadow-xl animate-scale-in">
              {renderMediaPreview(item)}

              <div className="absolute top-3 left-3 z-20 bg-black/70 rounded-full px-3 py-1 text-[9px] font-black tracking-widest text-amber-300 border border-white/10">
                {fileTypeLabels[mediaKind]}
              </div>

              <label className="absolute top-3 right-3 z-20 bg-black/70 rounded-lg px-2 py-1 flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={(e) => toggleSelect(item.id, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4"
                />
              </label>

              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center p-6 text-center space-y-4">
                <p className="text-[10px] text-white font-black truncate w-full px-2">{item.name}</p>
                <span className="text-[8px] text-gray-500 font-poppins">{item.size}</span>
                <span className="text-[8px] text-gray-600 font-poppins">{item.mimeType || 'unknown'}</span>

                {mediaKind === 'audio' ? (
                  <audio controls src={item.url} className="w-full" />
                ) : null}

                <div className="flex gap-2 w-full mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(item.url, item.id);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${copiedId === item.id ? 'bg-green-500 text-white' : 'bg-amber-500 text-gray-900 hover:bg-amber-400'}`}
                  >
                    {copiedId === item.id ? 'تم النسخ' : 'نسخ الرابط'}
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-2.5 bg-white/10 text-white rounded-xl text-[10px] font-black hover:bg-white/15"
                  >
                    فتح
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-2.5 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/10"
                    aria-label={`حذف ${item.name}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {copiedId === item.id && (
                <div className="absolute bottom-4 left-4 text-green-400 bg-black/60 p-1.5 rounded-full backdrop-blur-md">
                  <CheckCircleIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && !isUploading && !isLoading && (
        <div className="py-24 glass-medium rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
          <ImageIcon className="w-16 h-16 text-gray-500" />
          <p className="text-xl font-black">لا توجد وسائط مطابقة لخيارات البحث الحالية</p>
        </div>
      )}

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        content={helpContent.media}
      />
    </div>
  );
};

export default MediaLibraryPage;
