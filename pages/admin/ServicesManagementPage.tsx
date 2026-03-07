import React, { useEffect, useMemo, useRef, useState } from 'react';
import ConfirmationModal from '../../components/ConfirmationModal';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import TabsSystem, { TabItem } from '../../components/TabSystem';
import { ChevronDownIcon, ChevronUpIcon, EditIcon, PlusIcon, SearchIcon, TrashIcon } from '../../components/icons';
import { helpContent } from '../../constants/helpContent';
import { api } from '../../services/api';
import { IMAGE_FILE_ACCEPT, mediaService } from '../../services/media';
import { ServiceItem } from '../../types';

const ICON_OPTIONS = [
  { emoji: '🏠', label: 'الإيواء' },
  { emoji: '🔥', label: 'التدفئة' },
  { emoji: '🌡️', label: 'التحكم الحراري' },
  { emoji: '💡', label: 'الإضاءة' },
  { emoji: '🍖', label: 'التغذية' },
  { emoji: '🦎', label: 'الزواحف' },
  { emoji: '⚕️', label: 'الرعاية الصحية' },
  { emoji: '📦', label: 'التوصيل' },
  { emoji: '🎓', label: 'التدريب' },
  { emoji: '📞', label: 'الاستشارات' },
  { emoji: '🛠️', label: 'الصيانة' },
  { emoji: '📊', label: 'المتابعة' },
];

const createEmptyService = (sortOrder: number): ServiceItem => ({
  id: '',
  title: '',
  description: '',
  imageUrl: '',
  icon: '🦎',
  price: undefined,
  sortOrder,
  isPublished: true,
});

const formatPriceLabel = (price?: number) => {
  if (price == null) {
    return 'حسب الاتفاق';
  }

  if (price === 0) {
    return 'مجاني';
  }

  return `${price} ل.س`;
};

export default function ServicesManagementPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  const canReorder = activeTab === 'all' && !searchQuery.trim();

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)),
    [services],
  );

  const stats = useMemo(
    () => ({
      total: services.length,
      published: services.filter((service) => service.isPublished).length,
      draft: services.filter((service) => !service.isPublished).length,
      priced: services.filter((service) => service.price != null && service.price > 0).length,
    }),
    [services],
  );

  const tabs: TabItem[] = [
    { id: 'all', label: 'جميع الخدمات', icon: '📋', badge: stats.total },
    { id: 'published', label: 'المنشورة', icon: '✅', badge: stats.published },
    { id: 'draft', label: 'المسودات', icon: '📝', badge: stats.draft },
  ];

  const filteredServices = useMemo(() => {
    let list = sortedServices;

    if (activeTab === 'published') {
      list = list.filter((service) => service.isPublished);
    }

    if (activeTab === 'draft') {
      list = list.filter((service) => !service.isPublished);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter(
        (service) =>
          service.title.toLowerCase().includes(query) ||
          service.description?.toLowerCase().includes(query),
      );
    }

    return list;
  }, [activeTab, searchQuery, sortedServices]);

  const loadServices = async () => {
    if (isMountedRef.current) {
      setIsLoading(true);
    }

    try {
      const data = await api.getServices();
      if (isMountedRef.current) {
        setServices(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Failed to load services:', error);
        setServices([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadServices();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getNextSortOrder = () => {
    const maxSortOrder = services.reduce((maxValue, service) => Math.max(maxValue, service.sortOrder || 0), 0);
    return maxSortOrder + 1;
  };

  const closeModal = () => {
    if (isSaving || isImageUploading) {
      return;
    }

    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleOpenModal = (service?: ServiceItem) => {
    setEditingService(service ? { ...service } : createEmptyService(getNextSortOrder()));
    setIsModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingService) {
      return;
    }

    const payload: Partial<ServiceItem> = {
      title: editingService.title.trim(),
      description: editingService.description?.trim() || '',
      imageUrl: editingService.imageUrl,
      icon: editingService.icon || '🦎',
      price: editingService.price,
      sortOrder: editingService.sortOrder,
      isPublished: editingService.isPublished,
    };

    if (!payload.title || !payload.imageUrl) {
      alert('يرجى إدخال عنوان الخدمة ورفع صورة قبل الحفظ.');
      return;
    }

    if (isImageUploading) {
      alert('انتظر حتى يكتمل رفع الصورة أولًا.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingService.id && services.some((service) => service.id === editingService.id)) {
        await api.updateService(editingService.id, payload);
      } else {
        await api.createService(payload);
      }

      await loadServices();
      closeModal();
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('تعذر حفظ الخدمة. تحقق من البيانات ثم حاول مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.id) {
      return;
    }

    try {
      await api.deleteService(confirmDelete.id);
      await loadServices();
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('تعذر حذف الخدمة حاليًا.');
    } finally {
      setConfirmDelete({ isOpen: false, id: null });
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      mediaService.validateImageFile(file);
      setIsImageUploading(true);
      const imageUrl = await mediaService.uploadProjectImage(file, 'services');
      setEditingService((current) => (current ? { ...current, imageUrl } : current));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'تعذر رفع صورة الخدمة.');
    } finally {
      setIsImageUploading(false);
      event.target.value = '';
    }
  };

  const handleTogglePublish = async (service: ServiceItem) => {
    try {
      await api.updateService(service.id, {
        title: service.title,
        description: service.description,
        imageUrl: service.imageUrl,
        icon: service.icon,
        price: service.price,
        sortOrder: service.sortOrder,
        isPublished: !service.isPublished,
      });
      await loadServices();
    } catch (error) {
      console.error('Failed to toggle service publish state:', error);
      alert('تعذر تحديث حالة النشر.');
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (!canReorder || toIndex < 0 || toIndex >= filteredServices.length) {
      return;
    }

    const reordered = [...filteredServices];
    const [movedItem] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedItem);

    const items = reordered.map((service, index) => ({
      id: service.id,
      sortOrder: index + 1,
    }));

    try {
      await api.reorderServices(items);
      await loadServices();
    } catch (error) {
      console.error('Failed to reorder services:', error);
      alert('تعذر حفظ الترتيب الجديد.');
    }
  };

  return (
    <div className="min-h-screen px-4 pb-24 sm:px-6 sm:pb-32">
      <div className="mb-10 flex flex-col gap-4 sm:mb-12 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl lg:text-5xl">إدارة الخدمات</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-400 sm:text-base lg:text-lg">
            أي خدمة تُنشر هنا تظهر مباشرة في صفحة الخدمات بالواجهة الأمامية حسب ترتيبها.
          </p>
        </div>
        <HelpButton onClick={() => setIsHelpOpen(true)} />
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-[2rem] border border-white/10 p-6 glass-medium">
          <p className="mb-1 text-sm font-bold text-gray-400">إجمالي الخدمات</p>
          <p className="text-3xl font-black text-amber-400">{stats.total}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 p-6 glass-medium">
          <p className="mb-1 text-sm font-bold text-gray-400">المنشورة</p>
          <p className="text-3xl font-black text-green-400">{stats.published}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 p-6 glass-medium">
          <p className="mb-1 text-sm font-bold text-gray-400">المسودات</p>
          <p className="text-3xl font-black text-gray-300">{stats.draft}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 p-6 glass-medium">
          <p className="mb-1 text-sm font-bold text-gray-400">خدمات مدفوعة</p>
          <p className="text-3xl font-black text-blue-400">{stats.priced}</p>
        </div>
      </div>

      <TabsSystem tabs={tabs} activeTabId={activeTab} onChange={setActiveTab} />

      <div className="mt-8 mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:min-w-[260px]">
          <input
            id="service-search"
            name="serviceSearch"
            type="text"
            placeholder="ابحث عن خدمة..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] py-3.5 px-6 ps-14 text-white"
          />
          <SearchIcon className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-3 rounded-2xl bg-amber-500 px-8 py-3.5 font-black text-gray-900 transition-all hover:bg-amber-400"
        >
          <PlusIcon className="h-5 w-5" />
          إضافة خدمة جديدة
        </button>

        {!canReorder && (
          <p className="text-xs font-bold text-amber-400">
            عد إلى تبويب جميع الخدمات وامسح البحث قبل تغيير الترتيب العام.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl glass-medium">
        {isLoading ? (
          <div className="py-16 text-center font-bold text-gray-400">جاري تحميل الخدمات...</div>
        ) : filteredServices.length === 0 ? (
          <div className="py-16 text-center font-bold text-gray-400">
            لا توجد خدمات تطابق الفلتر الحالي.
          </div>
        ) : (
          <>
          <div className="space-y-4 p-4 lg:hidden">
            {filteredServices.map((service, index) => (
              <article key={service.id} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={service.imageUrl || '/placeholder.svg'}
                    alt={service.title}
                    className="h-20 w-20 rounded-2xl border border-white/10 object-cover shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-black text-white truncate">{service.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-400">{service.description}</p>
                      </div>
                      <span className="text-3xl shrink-0">{service.icon || '🦎'}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">السعر</p>
                        <p className="mt-1 font-black text-amber-400">{formatPriceLabel(service.price)}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">الترتيب</p>
                        <p className="mt-1 font-black text-white">{service.sortOrder}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleTogglePublish(service)}
                    className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all ${
                      service.isPublished
                        ? 'border-green-500/20 bg-green-500/10 text-green-400'
                        : 'border-gray-500/20 bg-gray-500/10 text-gray-400'
                    }`}
                  >
                    {service.isPublished ? 'منشورة' : 'مسودة'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReorder(index, index - 1)}
                      disabled={!canReorder || index === 0}
                      className="rounded-lg bg-white/5 p-2 text-gray-400 transition-all hover:bg-amber-400/10 hover:text-amber-400 disabled:opacity-30"
                      aria-label={`نقل ${service.title} للأعلى`}
                    >
                      <ChevronUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleReorder(index, index + 1)}
                      disabled={!canReorder || index === filteredServices.length - 1}
                      className="rounded-lg bg-white/5 p-2 text-gray-400 transition-all hover:bg-amber-400/10 hover:text-amber-400 disabled:opacity-30"
                      aria-label={`نقل ${service.title} للأسفل`}
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleOpenModal(service)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-gray-300 transition-all hover:bg-amber-400/10 hover:text-amber-400"
                  >
                    <EditIcon className="h-4 w-4" />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/5 px-4 py-3 text-sm font-bold text-red-300 transition-all hover:bg-red-500 hover:text-white"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>حذف</span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto custom-scrollbar lg:block">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-black/20 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-white/10">
                  <th className="p-6">الخدمة</th>
                  <th className="p-6 text-center">الأيقونة</th>
                  <th className="p-6 text-center">السعر</th>
                  <th className="p-6 text-center">الترتيب</th>
                  <th className="p-6 text-center">الحالة</th>
                  <th className="p-6 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredServices.map((service, index) => (
                  <tr key={service.id} className="group transition-all hover:bg-white/5">
                    <td className="p-6">
                      <div className="flex items-center gap-5">
                        <img
                          src={service.imageUrl || '/placeholder.svg'}
                          alt={service.title}
                          className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
                          loading="lazy"
                        />
                        <div>
                          <p className="text-lg font-black transition-colors group-hover:text-amber-400">
                            {service.title}
                          </p>
                          <p className="mt-1 line-clamp-1 text-sm text-gray-400">{service.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-3xl">{service.icon || '🦎'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="font-black text-amber-400">{formatPriceLabel(service.price)}</span>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleReorder(index, index - 1)}
                          disabled={!canReorder || index === 0}
                          className="rounded-lg bg-white/5 p-2 text-gray-400 transition-all hover:bg-amber-400/10 hover:text-amber-400 disabled:opacity-30"
                        >
                          <ChevronUpIcon className="h-4 w-4" />
                        </button>
                        <span className="font-bold text-gray-400">{service.sortOrder}</span>
                        <button
                          onClick={() => handleReorder(index, index + 1)}
                          disabled={!canReorder || index === filteredServices.length - 1}
                          className="rounded-lg bg-white/5 p-2 text-gray-400 transition-all hover:bg-amber-400/10 hover:text-amber-400 disabled:opacity-30"
                        >
                          <ChevronDownIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <button
                        onClick={() => handleTogglePublish(service)}
                        className={`rounded-xl border px-6 py-2 text-sm font-bold transition-all ${
                          service.isPublished
                            ? 'border-green-500/20 bg-green-500/10 text-green-400'
                            : 'border-gray-500/20 bg-gray-500/10 text-gray-400'
                        }`}
                      >
                        {service.isPublished ? 'منشورة' : 'مسودة'}
                      </button>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-start gap-3 opacity-60 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => handleOpenModal(service)}
                          className="rounded-xl bg-white/5 p-3 text-gray-400 transition-all hover:bg-amber-400/10 hover:text-amber-400"
                        >
                          <EditIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="rounded-xl bg-red-500/5 p-3 text-red-400 transition-all hover:bg-red-500 hover:text-white"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {isModalOpen && editingService && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button className="absolute inset-0 cursor-default bg-black/90 backdrop-blur-md" onClick={closeModal} />
          <form
            onSubmit={handleSave}
            className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[3rem] border border-white/10 p-8 shadow-2xl animate-scale-in glass-dark md:p-14"
          >
            <h2 className="mb-10 text-4xl font-black">
              {editingService.id ? 'تحديث الخدمة' : 'إضافة خدمة جديدة'}
            </h2>

            <div className="grid grid-cols-1 gap-10 text-right md:grid-cols-3">
              <div className="space-y-6 md:col-span-1">
                <label className="mb-2 block text-xs font-black uppercase text-amber-500">الصورة *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-[2.5rem] border-2 border-dashed border-white/10 bg-white/5 transition-all hover:border-amber-500/30"
                >
                  {editingService.imageUrl ? (
                    <img src={editingService.imageUrl} alt="معاينة الخدمة" className="h-full w-full object-cover" />
                  ) : (
                    <PlusIcon className="h-12 w-12 text-gray-600" />
                  )}

                  {isImageUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm font-black text-amber-400">
                      جاري رفع الصورة...
                    </div>
                  )}
                </div>

                <input
                  id="service-image-upload"
                  name="serviceImageUpload"
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_FILE_ACCEPT}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:col-span-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase text-amber-500">عنوان الخدمة *</label>
                  <input
                    id="service-title"
                    name="serviceTitle"
                    required
                    value={editingService.title}
                    onChange={(event) =>
                      setEditingService((current) => (current ? { ...current, title: event.target.value } : current))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase text-amber-500">وصف الخدمة</label>
                  <textarea
                    id="service-description"
                    name="serviceDescription"
                    rows={4}
                    value={editingService.description}
                    onChange={(event) =>
                      setEditingService((current) =>
                        current ? { ...current, description: event.target.value } : current,
                      )
                    }
                    className="w-full resize-none rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase text-amber-500">الأيقونة</label>
                  <div className="grid grid-cols-6 gap-2">
                    {ICON_OPTIONS.map((option) => (
                      <button
                        key={option.emoji}
                        type="button"
                        onClick={() =>
                          setEditingService((current) => (current ? { ...current, icon: option.emoji } : current))
                        }
                        className={`rounded-xl border p-3 transition-all ${
                          editingService.icon === option.emoji
                            ? 'border-amber-500 bg-amber-500/20'
                            : 'border-white/10 bg-white/5 hover:border-amber-500/50'
                        }`}
                        title={option.label}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase text-amber-500">السعر</label>
                  <input
                    id="service-price"
                    name="servicePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingService.price ?? ''}
                    onChange={(event) =>
                      setEditingService((current) =>
                        current
                          ? {
                              ...current,
                              price: event.target.value === '' ? undefined : Number(event.target.value),
                            }
                          : current,
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 text-white"
                    placeholder="اتركه فارغًا إذا كانت الخدمة حسب الاتفاق"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase text-amber-500">ترتيب العرض</label>
                  <input
                    id="service-sort-order"
                    name="serviceSortOrder"
                    type="number"
                    min="1"
                    value={editingService.sortOrder}
                    onChange={(event) =>
                      setEditingService((current) =>
                        current
                          ? {
                              ...current,
                              sortOrder: Math.max(1, Number(event.target.value) || 1),
                            }
                          : current,
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 text-white"
                  />
                </div>

                <div>
                  <label className="mt-8 flex cursor-pointer items-center gap-3">
                    <input
                      id="service-published"
                      name="servicePublished"
                      type="checkbox"
                      checked={editingService.isPublished}
                      onChange={(event) =>
                        setEditingService((current) =>
                          current ? { ...current, isPublished: event.target.checked } : current,
                        )
                      }
                      className="h-5 w-5"
                    />
                    <span className="font-bold text-white">نشر الخدمة مباشرة</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-12 flex gap-6">
              <button
                type="submit"
                disabled={isSaving || isImageUploading}
                className="flex-1 rounded-[1.5rem] bg-amber-500 py-5 font-black text-gray-900 transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'جارٍ حفظ الخدمة...' : 'حفظ التغييرات'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-[1.5rem] bg-white/5 px-10 py-5 font-black text-gray-400 transition-all hover:bg-white/10"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        title="تأكيد حذف الخدمة"
        message="هل أنت متأكد من رغبتك في حذف هذه الخدمة نهائيًا؟"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
        type="danger"
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={helpContent.services?.title || 'إدارة الخدمات'}
        sections={helpContent.services?.sections || []}
      />
    </div>
  );
}
