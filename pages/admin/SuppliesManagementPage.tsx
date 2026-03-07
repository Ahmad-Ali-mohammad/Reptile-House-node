import React, { useMemo, useRef, useState } from 'react';
import { useDatabase } from '../../contexts/DatabaseContext';
import { EditIcon, TrashIcon, PlusIcon, SearchIcon } from '../../components/icons';
import TabsSystem, { TabItem } from '../../components/TabSystem';
import ConfirmationModal from '../../components/ConfirmationModal';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { Reptile } from '../../types';
import { helpContent } from '../../constants/helpContent';
import { IMAGE_FILE_ACCEPT, mediaService } from '../../services/media';

const supplyCategories = [
    { value: 'food', label: 'الأطعمة والتغذية' },
    { value: 'housing', label: 'البيوت والحاويات' },
    { value: 'heating', label: 'التدفئة والإضاءة' },
    { value: 'decoration', label: 'الديكورات والزينة' },
    { value: 'cleaning', label: 'التنظيف والصيانة' },
    { value: 'health', label: 'الصحة والعناية' },
    { value: 'accessories', label: 'الإكسسوارات' }
];

const SuppliesManagementPage: React.FC = () => {
    const { supplies, addSupply, deleteSupply } = useDatabase();
    const [activeTab, setActiveTab] = useState('all_supplies');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [editingSupply, setEditingSupply] = useState<Partial<Reptile> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null }>({
        isOpen: false,
        id: null
    });

    const supplyTabs: TabItem[] = [
        { id: 'all_supplies', label: 'المستلزمات', icon: '📦' },
        { id: 'featured', label: 'المميزة', icon: '✨' },
        { id: 'out_of_stock', label: 'نفذت من المخزون', icon: '❌', badge: supplies.filter((supply) => !supply.isAvailable).length }
    ];

    const filteredSupplies = useMemo(() => {
        let list = supplies;
        if (activeTab === 'featured') list = supplies.filter((supply) => supply.rating >= 4.9);
        if (activeTab === 'out_of_stock') list = supplies.filter((supply) => !supply.isAvailable);

        if (searchQuery) {
            list = list.filter((supply) =>
                supply.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return list;
    }, [activeTab, supplies, searchQuery]);

    const handleOpenModal = (supply?: Reptile) => {
        if (supply) {
            setEditingSupply({ ...supply });
        } else {
            setEditingSupply({
                id: 0,
                name: '',
                species: 'مستلزمات',
                price: 0,
                imageUrl: '',
                category: 'food',
                status: 'متوفر',
                isAvailable: true,
                rating: 5.0,
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            mediaService.validateImageFile(file);
            setIsImageUploading(true);
            const imageUrl = await mediaService.uploadProjectImage(file, 'supplies');
            setEditingSupply((prev) => ({ ...prev, imageUrl }));
        } catch (error) {
            alert(error instanceof Error ? error.message : 'تعذر رفع صورة المستلزم');
        } finally {
            setIsImageUploading(false);
            e.target.value = '';
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSupply) return;

        if (isImageUploading) {
            alert('انتظر حتى يكتمل رفع الصورة أولاً');
            return;
        }

        if (!editingSupply.category || !editingSupply.imageUrl) {
            alert('يرجى ملء جميع الحقول ورفع صورة');
            return;
        }

        const supplyToSave: Reptile = {
            ...(editingSupply as Reptile),
            category: editingSupply.category as any,
            species: 'مستلزمات',
            price: Number(editingSupply.price) || 0,
            id: Number(editingSupply.id) || 0
        };

        addSupply(supplyToSave);
        setIsModalOpen(false);
        setEditingSupply(null);
    };

    const handleConfirmDelete = () => {
        if (confirmDelete.id !== null) {
            deleteSupply(confirmDelete.id);
        }
        setConfirmDelete({ isOpen: false, id: null });
    };

    const renderCategoryLabel = (category: string) =>
        supplyCategories.find((item) => item.value === category)?.label || category;

    return (
        <div className="animate-fade-in relative space-y-8 text-right">
            <div className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                    <h1 className="mb-2 text-3xl font-black sm:text-4xl">المستلزمات</h1>
                    <p className="text-gray-400">إدارة مستلزمات رعاية الزواحف مع عرض مريح للهاتف وتحرير مباشر من داخل الصفحة.</p>
                </div>
                <HelpButton onClick={() => setIsHelpOpen(true)} />
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-md md:flex-1">
                    <input
                        id="supply-search"
                        name="supplySearch"
                        type="text"
                        placeholder="ابحث في المستلزمات..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] py-3.5 px-6 ps-14 text-white shadow-inner outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
                    />
                    <SearchIcon className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-amber-500 px-8 py-3.5 font-black text-gray-900 shadow-xl shadow-amber-500/20 transition-all hover:bg-amber-400 md:w-auto"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>إضافة مستلزم جديد</span>
                </button>
            </div>

            <TabsSystem tabs={supplyTabs} activeTabId={activeTab} onChange={setActiveTab} />

            <div className="glass-medium overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#11141b]/40 shadow-2xl">
                <div className="grid gap-4 p-4 md:hidden">
                    {filteredSupplies.length > 0 ? filteredSupplies.map((supply) => (
                        <article key={supply.id} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
                            <div className="flex items-start gap-4">
                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-gray-800 shadow-lg">
                                    <img src={supply.imageUrl} alt={supply.name} className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-lg font-black text-white">{supply.name}</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="rounded-xl border border-white/5 bg-white/5 px-3 py-1 text-xs font-bold text-gray-300">
                                            {renderCategoryLabel(supply.category)}
                                        </span>
                                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${
                                            supply.isAvailable
                                                ? 'border-green-500/20 bg-green-500/10 text-green-400'
                                                : 'border-red-500/20 bg-red-500/10 text-red-400'
                                        }`}>
                                            {supply.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-3">
                                <p className="font-poppins text-xl font-black text-amber-500">{supply.price.toLocaleString('ar-SY')} ل.س</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(supply)}
                                        className="rounded-xl border border-white/10 bg-white/5 p-3 text-amber-400"
                                        title="تعديل"
                                    >
                                        <EditIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete({ isOpen: true, id: supply.id })}
                                        className="rounded-xl border border-red-500/10 bg-red-500/5 p-3 text-red-400"
                                        title="حذف"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </article>
                    )) : (
                        <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm font-bold text-gray-400">
                            لا توجد مستلزمات مطابقة للعرض الحالي.
                        </div>
                    )}
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[760px] text-right">
                        <thead>
                            <tr className="border-b border-white/10 bg-black/20 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <th className="p-6">المنتج</th>
                                <th className="p-6 text-center">الفئة</th>
                                <th className="p-6">السعر</th>
                                <th className="p-6 text-center">الحالة</th>
                                <th className="p-6 text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSupplies.map((supply) => (
                                <tr key={supply.id} className="group transition-all hover:bg-white/5">
                                    <td className="p-6">
                                        <div className="flex items-center gap-5">
                                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-gray-800 shadow-lg">
                                                <img src={supply.imageUrl} alt={supply.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-lg font-black transition-colors group-hover:text-amber-400">{supply.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className="rounded-xl border border-white/5 bg-white/5 px-4 py-1.5 text-xs font-bold text-gray-300">
                                            {renderCategoryLabel(supply.category)}
                                        </span>
                                    </td>
                                    <td className="p-6 text-xl font-black text-amber-500 font-poppins">{supply.price.toLocaleString('ar-SY')} ل.س</td>
                                    <td className="p-6 text-center">
                                        <span className={`rounded-full border px-4 py-1.5 text-[10px] font-black uppercase ${
                                            supply.isAvailable
                                                ? 'border-green-500/20 bg-green-500/10 text-green-400'
                                                : 'border-red-500/20 bg-red-500/10 text-red-400'
                                        }`}>
                                            {supply.status}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex justify-start gap-3 opacity-100 transition-opacity lg:opacity-60 lg:group-hover:opacity-100">
                                            <button
                                                onClick={() => handleOpenModal(supply)}
                                                className="rounded-xl border border-white/5 bg-white/5 p-3 text-gray-400 transition-all hover:bg-amber-400/10 hover:text-amber-400"
                                                title="تعديل"
                                            >
                                                <EditIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete({ isOpen: true, id: supply.id })}
                                                className="rounded-xl border border-red-500/10 bg-red-500/5 p-3 text-red-400 transition-all hover:bg-red-500 hover:text-white"
                                                title="حذف"
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
            </div>

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                title="تأكيد الحذف النهائي"
                message="هل أنت متأكد تماماً من رغبتك في حذف هذا المستلزم من المتجر؟ هذه العملية نهائية ولا يمكن التراجع عنها."
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
            />

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
                    <button
                        type="button"
                        className="absolute inset-0 cursor-default bg-black/90 backdrop-blur-md"
                        onClick={() => setIsModalOpen(false)}
                        aria-label="إغلاق النافذة"
                    />
                    <form
                        onSubmit={handleSave}
                        className="relative max-h-[100dvh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#0f1117] p-5 pb-8 shadow-2xl sm:max-h-[90vh] sm:max-w-4xl sm:rounded-[3rem] sm:p-8 lg:p-12"
                    >
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <h2 className="text-2xl font-black tracking-tighter sm:text-4xl">
                                {editingSupply?.id ? 'تحديث بيانات المستلزم' : 'إضافة مستلزم جديد'}
                            </h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-2xl leading-none text-gray-500 hover:text-white">
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 text-right lg:grid-cols-3 lg:gap-10">
                            <div className="space-y-6 lg:col-span-1">
                                <label htmlFor="supply-image-upload" className="block text-xs font-black uppercase tracking-widest text-amber-500">الصورة التعريفية</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            fileInputRef.current?.click();
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-label="رفع صورة المنتج"
                                    className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-[2.5rem] border-2 border-dashed border-white/10 bg-white/5 transition-all hover:border-amber-500"
                                >
                                    {editingSupply?.imageUrl ? (
                                        <img src={editingSupply.imageUrl} alt={editingSupply.name || 'صورة المنتج'} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <PlusIcon className="h-12 w-12 text-gray-600" />
                                        </div>
                                    )}
                                    {isImageUploading ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm font-black text-amber-400">
                                            جاري رفع الصورة...
                                        </div>
                                    ) : null}
                                </div>
                                <input id="supply-image-upload" type="file" ref={fileInputRef} className="hidden" accept={IMAGE_FILE_ACCEPT} onChange={handleImageChange} aria-label="اختيار صورة المنتج" />
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-2">
                                <div className="sm:col-span-2">
                                    <label htmlFor="supply-name" className="mb-2 block text-xs font-black uppercase text-amber-500">اسم المستلزم</label>
                                    <input id="supply-name" required className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 font-bold text-white" value={editingSupply?.name || ''} onChange={e => setEditingSupply({ ...editingSupply, name: e.target.value })} />
                                </div>
                                <div>
                                    <label htmlFor="supply-category" className="mb-2 block text-xs font-black uppercase text-amber-500">الفئة</label>
                                    <select id="supply-category" className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 text-white" value={editingSupply?.category} onChange={e => setEditingSupply({ ...editingSupply, category: e.target.value as Reptile['category'] })}>
                                        {supplyCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="supply-price" className="mb-2 block text-xs font-black uppercase text-amber-500">السعر (ل.س)</label>
                                    <input id="supply-price" type="number" className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 font-poppins font-bold text-white" value={editingSupply?.price || 0} onChange={e => setEditingSupply({ ...editingSupply, price: Number(e.target.value) })} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-xs font-black uppercase text-amber-500">الحالة</label>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white">
                                            <input
                                                type="radio"
                                                name="availability"
                                                checked={editingSupply?.isAvailable === true}
                                                onChange={() => setEditingSupply({ ...editingSupply, isAvailable: true, status: 'متوفر' })}
                                                className="h-4 w-4"
                                            />
                                            <span>متوفر</span>
                                        </label>
                                        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white">
                                            <input
                                                type="radio"
                                                name="availability"
                                                checked={editingSupply?.isAvailable === false}
                                                onChange={() => setEditingSupply({ ...editingSupply, isAvailable: false, status: 'غير متوفر' })}
                                                className="h-4 w-4"
                                            />
                                            <span>غير متوفر</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <label htmlFor="supply-description" className="mb-2 block text-xs font-black uppercase text-amber-500">الوصف</label>
                                    <textarea id="supply-description" rows={4} className="w-full resize-none rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 text-white" value={editingSupply?.description || ''} onChange={e => setEditingSupply({ ...editingSupply, description: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:gap-6">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full rounded-[1.5rem] border border-white/5 bg-white/5 px-6 py-4 font-black text-gray-400 sm:w-auto sm:px-10">
                                إلغاء
                            </button>
                            <button type="submit" disabled={isImageUploading} className="w-full flex-1 rounded-[1.5rem] bg-amber-500 py-4 text-lg font-black text-gray-900 shadow-2xl transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60">
                                حفظ التغييرات
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={helpContent.supplies_mgmt.title}
                sections={helpContent.supplies_mgmt.sections}
            />
        </div>
    );
};

export default SuppliesManagementPage;
