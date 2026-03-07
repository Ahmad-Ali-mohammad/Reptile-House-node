import React, { useRef, useState } from 'react';
import { useDatabase } from '../../contexts/DatabaseContext';
import { HeroSlide } from '../../types';
import { PlusIcon, EditIcon, TrashIcon } from '../../components/icons';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { helpContent } from '../../constants/helpContent';
import { IMAGE_FILE_ACCEPT, mediaService } from '../../services/media';

const HeroManagementPage: React.FC = () => {
    const { heroSlides, saveHeroSlide, deleteHeroSlide } = useDatabase();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOpenModal = (slide?: HeroSlide) => {
        if (slide) {
            setEditingSlide({ ...slide });
        } else {
            setEditingSlide({
                id: '',
                title: '',
                subtitle: '',
                image: '',
                buttonText: 'اكتشف المزيد',
                link: 'showcase',
                active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSlide) return;

        if (isImageUploading) {
            alert('انتظر حتى يكتمل رفع الصورة أولاً');
            return;
        }

        if (!editingSlide.image) {
            alert('يرجى رفع صورة الشريحة أو إدخال رابط صحيح');
            return;
        }

        saveHeroSlide(editingSlide as HeroSlide);
        setIsModalOpen(false);
        setEditingSlide(null);
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            mediaService.validateImageFile(file);
            setIsImageUploading(true);
            const image = await mediaService.uploadProjectImage(file, 'hero');
            setEditingSlide(prev => prev ? { ...prev, image } : prev);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'تعذر رفع صورة الشريحة');
        } finally {
            setIsImageUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="animate-fade-in space-y-10 text-right pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black mb-2">إدارة واجهة الموقع</h1>
                    <p className="text-gray-400">تحكم في صور وعناوين الشرائح الظاهرة في الواجهة الرئيسية.</p>
                </div>
                <div className="flex gap-3">
                    <HelpButton onClick={() => setIsHelpOpen(true)} />
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-amber-500 text-gray-900 font-black px-10 py-4 rounded-2xl hover:bg-amber-400 transition-all flex items-center gap-3 shadow-xl shadow-amber-500/20 active:scale-95"
                    >
                        <PlusIcon className="w-6 h-6" />
                        شريحة عرض جديدة
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {heroSlides.map(slide => (
                    <div key={slide.id} className="glass-medium rounded-[3rem] overflow-hidden border border-white/10 group transition-all duration-500 hover:border-amber-500/30 flex flex-col">
                        <div className="relative aspect-video">
                            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                            <div className="absolute top-6 right-6 flex gap-2">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${slide.active ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                                    {slide.active ? 'نشط الآن' : 'غير مفعل'}
                                </span>
                            </div>
                        </div>
                        <div className="p-10 flex-1 space-y-6">
                            <h3 className="text-3xl font-black text-white leading-tight">{slide.title}</h3>
                            <p className="text-gray-400 font-bold leading-relaxed">{slide.subtitle}</p>
                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                <div className="text-xs font-black text-amber-500 uppercase tracking-widest bg-amber-500/5 px-4 py-2 rounded-xl">
                                    {slide.buttonText} → {slide.link}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => handleOpenModal(slide)} className="p-3 bg-white/5 text-amber-500 rounded-xl hover:bg-white/10 transition-all" aria-label="تعديل الشريحة"><EditIcon className="w-5 h-5" /></button>
                                    <button onClick={() => deleteHeroSlide(slide.id)} className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all" aria-label="حذف الشريحة"><TrashIcon className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/95 backdrop-blur-2xl cursor-default"
                        onClick={() => setIsModalOpen(false)}
                        aria-label="إغلاق النافذة"
                    />
                    <form onSubmit={handleSave} className="relative w-full max-w-4xl glass-dark border border-white/10 rounded-[3.5rem] p-12 space-y-8 animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <h2 className="text-4xl font-black tracking-tighter">{editingSlide?.id ? 'تعديل الشريحة' : 'شريحة عرض جديدة'}</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="hero-slide-title" className="text-[10px] font-black text-amber-500 uppercase mb-2 block">عنوان الشريحة</label>
                                    <input id="hero-slide-title" required className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl p-4 text-white font-bold" value={editingSlide?.title || ''} onChange={e => setEditingSlide({ ...editingSlide, title: e.target.value })} />
                                </div>
                                <div>
                                    <label htmlFor="hero-slide-subtitle" className="text-[10px] font-black text-amber-500 uppercase mb-2 block">النص الوصفي</label>
                                    <textarea id="hero-slide-subtitle" rows={3} required className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl p-4 text-white font-bold resize-none" value={editingSlide?.subtitle || ''} onChange={e => setEditingSlide({ ...editingSlide, subtitle: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-amber-500 uppercase mb-2 block">رفع صورة الشريحة</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                fileInputRef.current?.click();
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        aria-label="رفع صورة الشريحة"
                                        className="relative aspect-video w-full rounded-[2rem] border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center cursor-pointer hover:border-amber-500 transition-all overflow-hidden"
                                    >
                                        {editingSlide?.image ? (
                                            <img src={editingSlide.image} alt={editingSlide.title || 'صورة الشريحة'} className="w-full h-full object-cover" />
                                        ) : (
                                            <PlusIcon className="w-12 h-12 text-gray-600" />
                                        )}
                                        {isImageUploading ? (
                                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-sm font-black text-amber-400">
                                                جاري رفع الصورة...
                                            </div>
                                        ) : null}
                                    </div>
                                    <input id="hero-slide-upload" name="heroSlideUpload" ref={fileInputRef} type="file" accept={IMAGE_FILE_ACCEPT} className="hidden" onChange={handleImageChange} />
                                </div>
                                <div>
                                    <label htmlFor="hero-slide-image" className="text-[10px] font-black text-amber-500 uppercase mb-2 block">رابط الصورة</label>
                                    <input id="hero-slide-image" required className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl p-4 text-white font-bold" value={editingSlide?.image || ''} onChange={e => setEditingSlide({ ...editingSlide, image: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="hero-slide-button-text" className="text-[10px] font-black text-amber-500 uppercase mb-2 block">نص الزر</label>
                                    <input id="hero-slide-button-text" required className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl p-4 text-white font-bold" value={editingSlide?.buttonText || ''} onChange={e => setEditingSlide({ ...editingSlide, buttonText: e.target.value })} />
                                </div>
                                <div>
                                    <label htmlFor="hero-slide-link" className="text-[10px] font-black text-amber-500 uppercase mb-2 block">الرابط</label>
                                    <select id="hero-slide-link" className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl p-4 text-white font-bold" value={editingSlide?.link || 'showcase'} onChange={e => setEditingSlide({ ...editingSlide, link: e.target.value })}>
                                        <option value="showcase">المعرض</option>
                                        <option value="services">الخدمات</option>
                                        <option value="blog">المدونة</option>
                                        <option value="contact">اتصل بنا</option>
                                    </select>
                                </div>
                                <label className="flex items-center gap-4 cursor-pointer p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <input id="hero-slide-active" name="heroSlideActive" type="checkbox" className="w-6 h-6 rounded-lg accent-amber-500" checked={editingSlide?.active || false} onChange={e => setEditingSlide({ ...editingSlide, active: e.target.checked })} />
                                    <span className="text-sm font-black text-gray-300">تفعيل في الصفحة الرئيسية</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-8">
                            <button type="submit" disabled={isImageUploading} className="flex-1 bg-amber-500 text-gray-900 font-black py-5 rounded-2xl hover:bg-amber-400 transition-all text-xl disabled:opacity-60 disabled:cursor-not-allowed">حفظ التغييرات</button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 bg-white/5 text-gray-400 font-bold rounded-2xl border border-white/10">إلغاء</button>
                        </div>
                    </form>
                </div>
            )}

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={helpContent.hero_mgmt.title}
                sections={helpContent.hero_mgmt.sections}
            />
        </div>
    );
};

export default HeroManagementPage;
