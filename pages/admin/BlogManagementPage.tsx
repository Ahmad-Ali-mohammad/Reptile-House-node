import React, { useRef, useState } from 'react';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Article } from '../../types';
import { EditIcon, TrashIcon, PlusIcon, SearchIcon } from '../../components/icons';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { helpContent } from '../../constants/helpContent';
import { IMAGE_FILE_ACCEPT, mediaService } from '../../services/media';

const BlogManagementPage: React.FC = () => {
    const { articles, addArticle, deleteArticle } = useDatabase();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredArticles = articles.filter((article) =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (article?: Article) => {
        if (article) {
            setEditingArticle({ ...article });
        } else {
            setEditingArticle({
                id: 0,
                title: '',
                excerpt: '',
                content: '',
                category: 'تعليمي',
                author: 'سيمون',
                date: new Date().toLocaleDateString('ar-SY'),
                image: 'https://i.ibb.co/Lzr9P8P/reptile-house-mascot.jpg'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingArticle) return;

        addArticle(editingArticle as Article);
        setIsModalOpen(false);
        setEditingArticle(null);
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            mediaService.validateImageFile(file);
            setIsImageUploading(true);
            const image = await mediaService.uploadProjectImage(file, 'articles');
            setEditingArticle((prev) => (prev ? { ...prev, image } : prev));
        } catch (error) {
            alert(error instanceof Error ? error.message : 'تعذر رفع صورة المقال');
        } finally {
            setIsImageUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="animate-fade-in space-y-8 text-right">
            <div className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                    <h1 className="mb-2 text-3xl font-black sm:text-4xl">إدارة المقالات</h1>
                    <p className="text-gray-400">تحكم في المقالات التعليمية والأخبار التي تظهر للعملاء مع عرض مناسب للهاتف والكمبيوتر.</p>
                </div>
                <HelpButton onClick={() => setIsHelpOpen(true)} />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative w-full flex-1 sm:max-w-md">
                    <input
                        id="blog-search"
                        name="blogSearch"
                        type="text"
                        placeholder="بحث في المقالات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#1a1c23] py-4 px-6 ps-14 text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <SearchIcon className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-4 font-black text-gray-900 shadow-xl shadow-amber-500/10 transition-colors hover:bg-amber-400 sm:w-auto"
                >
                    <PlusIcon className="h-5 w-5" />
                    إضافة مقال
                </button>
            </div>

            <div className="glass-medium overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl">
                <div className="grid gap-4 p-4 md:hidden">
                    {filteredArticles.length > 0 ? filteredArticles.map((article) => (
                        <article key={article.id} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
                            <div className="flex items-start gap-4">
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 object-cover shadow-lg"
                                />
                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-lg font-black text-white">{article.title}</h2>
                                    <p className="mt-1 text-xs font-bold uppercase text-gray-500">{article.author}</p>
                                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-300">{article.excerpt}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-amber-500/10 bg-amber-500/5 px-3 py-1 text-xs font-black text-amber-400">
                                    {article.category}
                                </span>
                                <span className="text-xs font-poppins text-gray-400">{article.date}</span>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={() => handleOpenModal(article)}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-amber-300"
                                >
                                    <EditIcon className="h-5 w-5" />
                                    تعديل
                                </button>
                                <button
                                    onClick={() => deleteArticle(article.id)}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                    حذف
                                </button>
                            </div>
                        </article>
                    )) : (
                        <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm font-bold text-gray-400">
                            لا توجد مقالات مطابقة لنتيجة البحث.
                        </div>
                    )}
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-[720px] w-full text-right">
                        <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <tr>
                                <th className="p-6">المقال</th>
                                <th className="p-6">الفئة</th>
                                <th className="p-6">التاريخ</th>
                                <th className="p-6 text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredArticles.map((article) => (
                                <tr key={article.id} className="group transition-colors hover:bg-white/5">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <img src={article.image} alt={article.title} className="h-14 w-14 rounded-2xl border border-white/10 object-cover shadow-lg" />
                                            <div className="min-w-0">
                                                <span className="block truncate text-lg font-black text-white">{article.title}</span>
                                                <span className="text-[10px] font-bold uppercase text-gray-500">{article.author}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="rounded-full border border-amber-500/10 bg-amber-500/5 px-4 py-1.5 text-xs font-black text-amber-400">{article.category}</span>
                                    </td>
                                    <td className="p-6 text-sm font-poppins text-gray-400">{article.date}</td>
                                    <td className="p-6">
                                        <div className="flex justify-start gap-2 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                                            <button onClick={() => handleOpenModal(article)} className="rounded-xl bg-white/5 p-3 transition-all hover:bg-white/10" title="تعديل">
                                                <EditIcon className="h-5 w-5 text-amber-500" />
                                            </button>
                                            <button onClick={() => deleteArticle(article.id)} className="rounded-xl bg-red-500/10 p-3 transition-all hover:bg-red-500 hover:text-white" title="حذف">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
                    <button
                        type="button"
                        className="absolute inset-0 h-full w-full cursor-default bg-black/95 backdrop-blur-xl"
                        onClick={() => setIsModalOpen(false)}
                        aria-label="إغلاق النافذة"
                    ></button>
                    <form
                        onSubmit={handleSave}
                        className="relative max-h-[100dvh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#0f1117] p-5 pb-8 shadow-2xl sm:max-h-[90vh] sm:max-w-4xl sm:rounded-[3rem] sm:p-8 lg:p-12"
                    >
                        <div className="mb-4 flex items-start justify-between gap-4 sm:mb-6">
                            <h2 className="text-2xl font-black tracking-tight sm:text-4xl">
                                {editingArticle?.id ? 'تعديل المقال' : 'إنشاء مقال جديد'}
                            </h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-2xl leading-none text-gray-500 hover:text-white">
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="article-title" className="mb-2 block text-[10px] font-black uppercase tracking-widest text-amber-500">عنوان المقال</label>
                                    <input id="article-title" required placeholder="اكتب عنواناً جذاباً..." className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] p-4 font-bold text-white outline-none focus:ring-2 focus:ring-amber-500" value={editingArticle?.title || ''} onChange={e => setEditingArticle({ ...editingArticle, title: e.target.value })} />
                                </div>
                                <div>
                                    <label htmlFor="article-category" className="mb-2 block text-[10px] font-black uppercase tracking-widest text-amber-500">فئة المقال</label>
                                    <select
                                        id="article-category"
                                        className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] p-4 text-white outline-none focus:ring-2 focus:ring-amber-500"
                                        value={editingArticle?.category}
                                        onChange={e => setEditingArticle({ ...editingArticle, category: e.target.value as Article['category'] })}
                                    >
                                        <option value="تعليمي">تعليمي</option>
                                        <option value="أخبار">أخبار</option>
                                        <option value="نصائح طبية">نصائح طبية</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-amber-500">رفع صورة المقال</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative min-h-[220px] overflow-hidden rounded-[2rem] border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center cursor-pointer transition-all hover:border-amber-500"
                                    >
                                        {editingArticle?.image ? (
                                            <img src={editingArticle.image} alt={editingArticle.title || 'صورة المقال'} className="h-full w-full object-cover" />
                                        ) : (
                                            <PlusIcon className="h-12 w-12 text-gray-600" />
                                        )}
                                        {isImageUploading ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm font-black text-amber-400">
                                                جاري رفع الصورة...
                                            </div>
                                        ) : null}
                                    </div>
                                    <input id="article-image-upload" name="articleImageUpload" ref={fileInputRef} type="file" accept={IMAGE_FILE_ACCEPT} className="hidden" onChange={handleImageChange} />
                                </div>
                                <div>
                                    <label htmlFor="article-image" className="mb-2 block text-[10px] font-black uppercase tracking-widest text-amber-500">رابط الصورة</label>
                                    <input id="article-image" required placeholder="الصق رابط الصورة هنا..." className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] p-4 text-white outline-none focus:ring-2 focus:ring-amber-500" value={editingArticle?.image || ''} onChange={e => setEditingArticle({ ...editingArticle, image: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="article-excerpt" className="mb-2 block text-[10px] font-black uppercase tracking-widest text-amber-500">ملخص قصير</label>
                                    <textarea id="article-excerpt" required rows={4} placeholder="يظهر هذا النص في عرض المقالات..." className="w-full resize-none rounded-2xl border border-white/10 bg-[#1a1c23] p-4 text-white outline-none focus:ring-2 focus:ring-amber-500" value={editingArticle?.excerpt || ''} onChange={e => setEditingArticle({ ...editingArticle, excerpt: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="article-content" className="mb-2 block text-[10px] font-black uppercase tracking-widest text-amber-500">المحتوى الكامل للمقال</label>
                                    <textarea id="article-content" required rows={12} placeholder="اكتب المقال كاملاً هنا..." className="w-full resize-none rounded-3xl border border-white/10 bg-[#1a1c23] p-5 leading-loose text-white outline-none focus:ring-2 focus:ring-amber-500 sm:p-6" value={editingArticle?.content || ''} onChange={e => setEditingArticle({ ...editingArticle, content: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold transition-colors hover:bg-white/10 sm:w-auto sm:px-10">
                                إلغاء
                            </button>
                            <button type="submit" disabled={isImageUploading} className="w-full flex-1 rounded-2xl bg-amber-500 py-4 text-lg font-black text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60">
                                حفظ ونشر المقال
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={helpContent.blog_mgmt.title}
                sections={helpContent.blog_mgmt.sections}
            />
        </div>
    );
};

export default BlogManagementPage;
