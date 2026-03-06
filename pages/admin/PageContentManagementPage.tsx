import React, { useEffect, useMemo, useState } from 'react';
import { PageContent } from '../../types';
import { api } from '../../services/api';
import { PlusIcon, EditIcon, TrashIcon, DocumentIcon, CheckCircleIcon } from '../../components/icons';
import ConfirmationModal from '../../components/ConfirmationModal';

const defaultPages: PageContent[] = [
  {
    id: 'page-home',
    slug: 'home',
    title: 'الصفحة الرئيسية',
    excerpt: 'محتوى الواجهة الرئيسية والعناوين التسويقية.',
    content: 'حرر نصوص الصفحة الرئيسية من هنا.',
    seoTitle: 'بيت الزواحف - الصفحة الرئيسية',
    seoDescription: 'أفضل متجر للزواحف والمستلزمات.',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'page-about',
    slug: 'about',
    title: 'من نحن',
    excerpt: 'محتوى صفحة من نحن ورسالة المتجر.',
    content: 'حرر قصة المتجر والرؤية والقيم.',
    seoTitle: 'من نحن - بيت الزواحف',
    seoDescription: 'تعرف على فريق بيت الزواحف.',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'page-contact',
    slug: 'contact',
    title: 'اتصل بنا',
    excerpt: 'محتوى صفحة التواصل والتعليمات.',
    content: 'حرر نصوص التواصل ونماذج الطلب.',
    seoTitle: 'اتصل بنا - بيت الزواحف',
    seoDescription: 'تواصل معنا لأي استفسار أو طلب.',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'page-privacy',
    slug: 'privacy',
    title: 'سياسة الخصوصية',
    excerpt: 'سياسة خصوصية بيانات المستخدمين.',
    content: '<h2>سياسة الخصوصية</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>',
    seoTitle: 'سياسة الخصوصية - بيت الزواحف',
    seoDescription: 'سياسة الخصوصية في متجر بيت الزواحف.',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'page-terms',
    slug: 'terms',
    title: 'الشروط والأحكام',
    excerpt: 'الشروط العامة لاستخدام الموقع.',
    content: '<h2>الشروط والأحكام</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>',
    seoTitle: 'الشروط والأحكام - بيت الزواحف',
    seoDescription: 'شروط وأحكام الاستخدام.',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'page-returns',
    slug: 'returns',
    title: 'سياسة الإرجاع',
    excerpt: 'الشروط المعتمدة للإرجاع والاستبدال.',
    content: '<h2>سياسة الإرجاع</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>',
    seoTitle: 'سياسة الإرجاع - بيت الزواحف',
    seoDescription: 'سياسة الإرجاع والاستبدال.',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'page-shipping',
    slug: 'shipping',
    title: 'سياسة الشحن',
    excerpt: 'مواعيد الشحن وخيارات التوصيل.',
    content: '<h2>سياسة الشحن</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>',
    seoTitle: 'سياسة الشحن - بيت الزواحف',
    seoDescription: 'سياسة الشحن والتوصيل.',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'page-warranty',
    slug: 'warranty',
    title: 'الضمان والصحة',
    excerpt: 'تفاصيل الضمان الصحي للزواحف.',
    content: '<h2>الضمان والصحة</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>',
    seoTitle: 'الضمان والصحة - بيت الزواحف',
    seoDescription: 'سياسة الضمان الصحي.',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'page-services',
    slug: 'services',
    title: 'الخدمات',
    excerpt: 'محتوى صفحة الخدمات.',
    content: '',
    seoTitle: 'الخدمات - بيت الزواحف',
    seoDescription: 'خدمات بيت الزواحف المتاحة للعملاء.',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'page-offers',
    slug: 'offers',
    title: 'العروض',
    excerpt: 'محتوى صفحة العروض الترويجية.',
    content: '',
    seoTitle: 'العروض - بيت الزواحف',
    seoDescription: 'العروض الحالية في بيت الزواحف.',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'page-showcase',
    slug: 'showcase',
    title: 'المعرض',
    excerpt: 'محتوى صفحة المعرض.',
    content: '',
    seoTitle: 'المعرض - بيت الزواحف',
    seoDescription: 'استعرض جميع الزواحف المتاحة.',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'page-supplies',
    slug: 'supplies',
    title: 'المستلزمات',
    excerpt: 'محتوى صفحة المستلزمات.',
    content: '',
    seoTitle: 'المستلزمات - بيت الزواحف',
    seoDescription: 'كل مستلزمات الزواحف في مكان واحد.',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'page-blog',
    slug: 'blog',
    title: 'المدونة',
    excerpt: 'محتوى صفحة المدونة.',
    content: '',
    seoTitle: 'المدونة - بيت الزواحف',
    seoDescription: 'مقالات ونصائح حول رعاية الزواحف.',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
  },
];

const coreSlugs = new Set(defaultPages.map((p) => p.slug));

const mergeWithDefaultPages = (rows: PageContent[]): PageContent[] => {
  const bySlug = new Map(rows.map((row) => [row.slug, row] as const));
  const orderedCore = defaultPages.map((core) => bySlug.get(core.slug) || core);
  const extras = rows.filter((row) => !coreSlugs.has(row.slug));
  return [...orderedCore, ...extras];
};

const PageContentManagementPage: React.FC = () => {
  const [contents, setContents] = useState<PageContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PageContent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null; slug: string | null }>({
    isOpen: false,
    id: null,
    slug: null,
  });

  const loadContents = async () => {
    setIsLoading(true);
    setError('');
    try {
      let rows = await api.getPageContents();
      const missingCorePages = defaultPages.filter((core) => !rows.some((row) => row.slug === core.slug));

      if (missingCorePages.length > 0) {
        await Promise.all(missingCorePages.map((page) => api.savePageContent(page)));
        rows = await api.getPageContents();
      }

      setContents(mergeWithDefaultPages(rows));
    } catch (e) {
      setError('تعذر تحميل محتوى الصفحات');
      setContents(defaultPages);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContents();
  }, []);

  const activeCount = useMemo(() => contents.filter((item) => item.isActive).length, [contents]);

  const handleOpenCreate = () => {
    setEditingItem({
      id: '',
      slug: '',
      title: '',
      excerpt: '',
      content: '',
      seoTitle: '',
      seoDescription: '',
      isActive: true,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PageContent) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editingItem.slug.trim() || !editingItem.title.trim() || !editingItem.content.trim()) {
      setError('الرجاء تعبئة الحقول المطلوبة');
      return;
    }

    setIsSaving(true);
    setError('');
    const payload: PageContent = {
      ...editingItem,
      id: editingItem.id || '',
      slug: editingItem.slug.trim().toLowerCase(),
      title: editingItem.title.trim(),
      content: editingItem.content.trim(),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    try {
      await api.savePageContent(payload);
      await loadContents();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'تعذر حفظ محتوى الصفحة');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = confirmDelete.id;
    if (!id) return;
    if (confirmDelete.slug && coreSlugs.has(confirmDelete.slug)) {
      setError('لا يمكن حذف صفحة رئيسية. يمكنك تعطيلها أو تعديل محتواها.');
      setConfirmDelete({ isOpen: false, id: null, slug: null });
      return;
    }
    try {
      await api.deletePageContent(id);
      await loadContents();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'تعذر حذف المحتوى');
    } finally {
      setConfirmDelete({ isOpen: false, id: null, slug: null });
    }
  };

  return (
    <div className="animate-fade-in relative space-y-8 text-right">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black mb-2">إدارة محتوى الصفحات</h1>
          <p className="text-gray-400">إدارة نصوص الصفحات الثابتة، النشر، وبيانات تحسين محركات البحث من لوحة واحدة.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-3 bg-amber-500 text-gray-900 font-black py-3.5 px-8 rounded-2xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
          <span>صفحة جديدة</span>
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl p-4 font-bold text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-bold mb-1">إجمالي الصفحات</p>
              <p className="text-3xl font-black text-amber-400 font-poppins">{contents.length}</p>
            </div>
            <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl"><DocumentIcon className="w-8 h-8" /></div>
          </div>
        </div>
        <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-bold mb-1">الصفحات المنشورة</p>
              <p className="text-3xl font-black text-green-400 font-poppins">{activeCount}</p>
            </div>
            <div className="p-4 bg-green-500/10 text-green-400 rounded-2xl"><CheckCircleIcon className="w-8 h-8" /></div>
          </div>
        </div>
        <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-bold mb-1">آخر تحديث</p>
              <p className="text-lg font-black text-blue-400">{contents[0]?.updatedAt || '-'}</p>
            </div>
            <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl"><DocumentIcon className="w-8 h-8" /></div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="glass-medium rounded-[2rem] border border-white/10 p-10 text-center text-gray-400 font-bold">جاري تحميل المحتوى...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contents.map((item) => {
            const isCorePage = coreSlugs.has(item.slug);
            return (
            <div key={item.id} className={`glass-dark border rounded-[2rem] p-6 transition-all ${item.isActive ? 'border-white/10' : 'border-gray-500/30 opacity-70'}`}>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-black mb-1">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-amber-400 font-bold">/{item.slug}</p>
                      {isCorePage && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/30">
                          رئيسية
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEdit(item)} className="p-2 bg-white/5 text-gray-300 hover:text-amber-400 rounded-lg transition-all border border-white/10" aria-label="تعديل المحتوى">
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ isOpen: true, id: item.id, slug: item.slug })}
                      disabled={isCorePage}
                      title={isCorePage ? 'لا يمكن حذف صفحة رئيسية' : 'حذف المحتوى'}
                      className="p-2 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="حذف المحتوى"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-400 line-clamp-3">{item.excerpt || item.content}</p>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-xs text-gray-500">آخر تحديث: {item.updatedAt}</span>
                  <span className={`text-xs px-3 py-1 rounded-lg font-bold ${item.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                    {item.isActive ? 'منشورة' : 'مسودة'}
                  </span>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-default" onClick={() => setIsModalOpen(false)} aria-label="إغلاق" />
          <form onSubmit={handleSave} className="relative w-full max-w-4xl glass-dark border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0f1117] space-y-6">
            <h2 className="text-3xl font-black">{editingItem.id ? 'تعديل المحتوى' : 'إضافة صفحة جديدة'}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cms-page-title" className="text-xs font-black text-amber-500 uppercase mb-2 block">عنوان الصفحة *</label>
                <input
                  id="cms-page-title"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                  required
                />
              </div>
              <div>
                <label htmlFor="cms-page-slug" className="text-xs font-black text-amber-500 uppercase mb-2 block">المعرّف الرابطي للصفحة *</label>
                <input
                  id="cms-page-slug"
                  value={editingItem.slug}
                  onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value })}
                  className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                  placeholder="about, contact, shipping-policy"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="cms-page-excerpt" className="text-xs font-black text-amber-500 uppercase mb-2 block">وصف مختصر</label>
                <textarea
                  id="cms-page-excerpt"
                  rows={2}
                  value={editingItem.excerpt || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, excerpt: e.target.value })}
                  className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="cms-page-content" className="text-xs font-black text-amber-500 uppercase mb-2 block">المحتوى *</label>
                <textarea
                  id="cms-page-content"
                  rows={10}
                  value={editingItem.content}
                  onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                  className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white leading-relaxed"
                  required
                />
              </div>
              <div>
                <label htmlFor="cms-page-seo-title" className="text-xs font-black text-amber-500 uppercase mb-2 block">عنوان تحسين محركات البحث</label>
                <input
                  id="cms-page-seo-title"
                  value={editingItem.seoTitle || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, seoTitle: e.target.value })}
                  className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white"
                />
              </div>
              <div>
                <label htmlFor="cms-page-seo-description" className="text-xs font-black text-amber-500 uppercase mb-2 block">وصف تحسين محركات البحث</label>
                <input
                  id="cms-page-seo-description"
                  value={editingItem.seoDescription || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, seoDescription: e.target.value })}
                  className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isActive}
                    onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-transparent text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-white font-bold">نشر الصفحة على الموقع</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" disabled={isSaving} className="flex-1 bg-amber-500 text-gray-900 font-black py-4 rounded-2xl hover:bg-amber-400 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                {isSaving ? 'جاري الحفظ...' : 'حفظ المحتوى'}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 bg-white/5 text-gray-400 font-black rounded-2xl border border-white/10">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        title="حذف محتوى الصفحة"
        message="هل أنت متأكد من حذف هذا المحتوى؟ لا يمكن التراجع بعد الحذف."
        confirmLabel="حذف المحتوى"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, slug: null })}
      />
    </div>
  );
};

export default PageContentManagementPage;
