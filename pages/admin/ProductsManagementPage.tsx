import React, { useMemo, useRef, useState } from 'react';
import { useDatabase } from '../../contexts/DatabaseContext';
import { EditIcon, TrashIcon, PlusIcon, SearchIcon } from '../../components/icons';
import TabsSystem, { TabItem } from '../../components/TabSystem';
import ConfirmationModal from '../../components/ConfirmationModal';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { Reptile } from '../../types';
import { defaultCategories } from '../../constants';
import { helpContent } from '../../constants/helpContent';
import { IMAGE_FILE_ACCEPT, mediaService } from '../../services/media';

const DEFAULT_AVAILABLE_STATUS = 'متوفر';

const normalizeAvailabilityStatus = (value?: string): string => {
    const normalized = value?.trim();
    return normalized || DEFAULT_AVAILABLE_STATUS;
};

const statusMeansAvailable = (value?: string): boolean => {
    const normalized = normalizeAvailabilityStatus(value).toLowerCase();
    return !['غير متوفر', 'نفذ من المخزون', 'نفذت من المخزون', 'out of stock', 'unavailable', 'sold out'].includes(normalized);
};

const ProductsManagementPage: React.FC = () => {
    const { products, addProduct, deleteProduct } = useDatabase();
    const [activeTab, setActiveTab] = useState('all_products');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Reptile> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null }>({
        isOpen: false,
        id: null
    });

    const existingCategories = useMemo(() => {
        const cats = new Set<string>(products.map((product) => product.category));
        const combined = [...defaultCategories];
        cats.forEach((category) => {
            if (!combined.find((defaultCategory) => defaultCategory.value === category)) {
                combined.push({ value: category as any, label: category });
            }
        });
        return combined;
    }, [products]);

    const productTabs: TabItem[] = [
        { id: 'all_products', label: 'جميع المنتجات', icon: '📦' },
        { id: 'featured', label: 'المميزة', icon: '✨' },
        { id: 'out_of_stock', label: 'نفذت من المخزون', icon: '❌', badge: products.filter((product) => !product.isAvailable).length }
    ];

    const filteredReptiles = useMemo(() => {
        let list = products;
        if (activeTab === 'featured') list = products.filter((product) => product.rating >= 4.9);
        if (activeTab === 'out_of_stock') list = products.filter((product) => !product.isAvailable);

        if (searchQuery) {
            list = list.filter((product) =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.species.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return list;
    }, [activeTab, products, searchQuery]);

    const handleOpenModal = (product?: Reptile) => {
        if (product) {
            setEditingProduct({ ...product });
        } else {
            setEditingProduct({
                id: 0,
                name: '',
                species: '',
                price: 0,
                imageUrl: '',
                category: 'snake',
                status: DEFAULT_AVAILABLE_STATUS,
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
            const imageUrl = await mediaService.uploadProjectImage(file, 'products');
            setEditingProduct((prev) => ({ ...prev, imageUrl }));
        } catch (error) {
            alert(error instanceof Error ? error.message : 'تعذر رفع صورة المنتج');
        } finally {
            setIsImageUploading(false);
            e.target.value = '';
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        if (isImageUploading) {
            alert('انتظر حتى يكتمل رفع الصورة أولاً');
            return;
        }

        if (!editingProduct.category || !editingProduct.species || !editingProduct.imageUrl) {
            alert('يرجى ملء جميع الحقول المطلوبة ورفع صورة');
            return;
        }

        const normalizedStatus = normalizeAvailabilityStatus(editingProduct.status);
        const productToSave: Reptile = {
            ...(editingProduct as Reptile),
            category: editingProduct.category as any,
            species: editingProduct.species as string,
            status: normalizedStatus as Reptile['status'],
            isAvailable: statusMeansAvailable(normalizedStatus),
            price: Number(editingProduct.price) || 0,
            id: Number(editingProduct.id) || 0
        };

        addProduct(productToSave);
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleConfirmDelete = () => {
        if (confirmDelete.id !== null) {
            deleteProduct(confirmDelete.id);
        }
        setConfirmDelete({ isOpen: false, id: null });
    };

    const renderCategoryLabel = (category: string) =>
        existingCategories.find((item) => item.value === category)?.label || category;

    return (
        <div className="animate-fade-in relative space-y-8 text-right">
            <div className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                    <h1 className="mb-2 text-3xl font-black sm:text-4xl">جميع المنتجات</h1>
                    <p className="text-gray-400">إدارة الزواحف المتوفرة في المتجر مع بطاقات مناسبة للهاتف وجداول واضحة للشاشات الأكبر.</p>
                </div>
                <HelpButton onClick={() => setIsHelpOpen(true)} />
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-md md:flex-1">
                    <input
                        id="product-search"
                        name="productSearch"
                        type="text"
                        placeholder="ابحث في المتجر..."
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
                    <span>إضافة منتج جديد</span>
                </button>
            </div>

            <TabsSystem tabs={productTabs} activeTabId={activeTab} onChange={setActiveTab} />

            <div className="glass-medium overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#11141b]/40 shadow-2xl">
                <div className="grid gap-4 p-4 md:hidden">
                    {filteredReptiles.length > 0 ? filteredReptiles.map((reptile) => (
                        <article key={reptile.id} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
                            <div className="flex items-start gap-4">
                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-gray-800 shadow-lg">
                                    <img src={reptile.imageUrl} alt={reptile.name} className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-lg font-black text-white">{reptile.name}</p>
                                    <p className="text-xs font-poppins text-gray-500">{reptile.species}</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="rounded-xl border border-white/5 bg-white/5 px-3 py-1 text-xs font-bold text-gray-300">
                                            {renderCategoryLabel(reptile.category)}
                                        </span>
                                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${
                                            reptile.isAvailable
                                                ? 'border-green-500/20 bg-green-500/10 text-green-400'
                                                : 'border-red-500/20 bg-red-500/10 text-red-400'
                                        }`}>
                                            {reptile.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-3">
                                <p className="font-poppins text-xl font-black text-amber-500">${reptile.price}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(reptile)}
                                        className="rounded-xl border border-white/10 bg-white/5 p-3 text-amber-400"
                                        aria-label={`تعديل ${reptile.name}`}
                                    >
                                        <EditIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete({ isOpen: true, id: reptile.id })}
                                        className="rounded-xl border border-red-500/10 bg-red-500/5 p-3 text-red-400"
                                        aria-label={`حذف ${reptile.name}`}
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </article>
                    )) : (
                        <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm font-bold text-gray-400">
                            لا توجد منتجات مطابقة للعرض الحالي.
                        </div>
                    )}
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[760px] text-right">
                        <thead>
                            <tr className="border-b border-white/10 bg-black/20 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <th className="p-6">المخلوق</th>
                                <th className="p-6 text-center">الفئة</th>
                                <th className="p-6">السعر</th>
                                <th className="p-6 text-center">الحالة</th>
                                <th className="p-6 text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredReptiles.map((reptile) => (
                                <tr key={reptile.id} className="group transition-all hover:bg-white/5">
                                    <td className="p-6">
                                        <div className="flex items-center gap-5">
                                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-gray-800 shadow-lg">
                                                <img src={reptile.imageUrl} alt={reptile.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-lg font-black transition-colors group-hover:text-amber-400">{reptile.name}</p>
                                                <p className="text-xs font-poppins text-gray-500">{reptile.species}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className="rounded-xl border border-white/5 bg-white/5 px-4 py-1.5 text-xs font-bold text-gray-300">
                                            {renderCategoryLabel(reptile.category)}
                                        </span>
                                    </td>
                                    <td className="p-6 text-xl font-black text-amber-500 font-poppins">${reptile.price}</td>
                                    <td className="p-6 text-center">
                                        <span className={`rounded-full border px-4 py-1.5 text-[10px] font-black uppercase ${
                                            reptile.isAvailable
                                                ? 'border-green-500/20 bg-green-500/10 text-green-400'
                                                : 'border-red-500/20 bg-red-500/10 text-red-400'
                                        }`}>
                                            {reptile.status}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex justify-start gap-3 opacity-100 transition-opacity lg:opacity-60 lg:group-hover:opacity-100">
                                            <button
                                                onClick={() => handleOpenModal(reptile)}
                                                className="rounded-xl border border-white/5 bg-white/5 p-3 text-gray-400 transition-all hover:bg-amber-400/10 hover:text-amber-400"
                                                aria-label={`تعديل ${reptile.name}`}
                                            >
                                                <EditIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete({ isOpen: true, id: reptile.id })}
                                                className="rounded-xl border border-red-500/10 bg-red-500/5 p-3 text-red-400 transition-all hover:bg-red-500 hover:text-white"
                                                aria-label={`حذف ${reptile.name}`}
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
                message="هل أنت متأكد تماماً من رغبتك في حذف هذا المخلوق من المتجر؟ هذه العملية نهائية ولا يمكن التراجع عنها."
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
                                {editingProduct?.id ? 'تحديث بيانات المنتج' : 'إضافة منتج جديد'}
                            </h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-2xl leading-none text-gray-500 hover:text-white">
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 text-right lg:grid-cols-3 lg:gap-10">
                            <div className="space-y-6 lg:col-span-1">
                                <label htmlFor="product-image-upload" className="block text-xs font-black uppercase tracking-widest text-amber-500">الصورة التعريفية</label>
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
                                    {editingProduct?.imageUrl ? (
                                        <img src={editingProduct.imageUrl} alt={editingProduct.name || 'صورة المنتج'} className="h-full w-full object-cover" />
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
                                <input id="product-image-upload" type="file" ref={fileInputRef} className="hidden" accept={IMAGE_FILE_ACCEPT} onChange={handleImageChange} aria-label="اختيار صورة المنتج" />
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-2">
                                <div className="sm:col-span-2">
                                    <label htmlFor="product-name" className="mb-2 block text-xs font-black uppercase text-amber-500">الاسم</label>
                                    <input id="product-name" required className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 font-bold text-white" value={editingProduct?.name || ''} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                                </div>
                                <div>
                                    <label htmlFor="product-species" className="mb-2 block text-xs font-black uppercase text-amber-500">الفصيلة</label>
                                    <input
                                        id="product-species"
                                        required
                                        type="text"
                                        className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 font-bold text-white"
                                        value={editingProduct?.species || ''}
                                        onChange={e => setEditingProduct({ ...editingProduct, species: e.target.value })}
                                        placeholder="مثلاً: Ball python"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="product-category" className="mb-2 block text-xs font-black uppercase text-amber-500">الفئة</label>
                                    <input
                                        id="product-category"
                                        required
                                        type="text"
                                        className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 font-bold text-white"
                                        value={editingProduct?.category || ''}
                                        onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value as Reptile['category'] })}
                                        placeholder="مثلاً: snake, lizard, turtle"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="product-price" className="mb-2 block text-xs font-black uppercase text-amber-500">السعر</label>
                                    <input id="product-price" type="number" className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 font-poppins font-bold text-white" value={editingProduct?.price || 0} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label htmlFor="product-status" className="mb-2 block text-xs font-black uppercase text-amber-500">حالة التوفر</label>
                                    <input
                                        id="product-status"
                                        required
                                        type="text"
                                        className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 font-bold text-white"
                                        value={editingProduct?.status || ''}
                                        onChange={e => setEditingProduct({
                                            ...editingProduct,
                                            status: e.target.value as any,
                                            isAvailable: statusMeansAvailable(e.target.value)
                                        })}
                                        placeholder="مثلاً: متوفر، قيد الحجز، غير متوفر"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="product-rating" className="mb-2 block text-xs font-black uppercase text-amber-500">التقييم</label>
                                    <input
                                        id="product-rating"
                                        type="number"
                                        min="1"
                                        max="5"
                                        step="0.1"
                                        className="w-full rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 font-poppins font-bold text-white"
                                        value={editingProduct?.rating || 5.0}
                                        onChange={e => setEditingProduct({ ...editingProduct, rating: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label htmlFor="product-description" className="mb-2 block text-xs font-black uppercase text-amber-500">الوصف</label>
                                    <textarea id="product-description" rows={4} className="w-full resize-none rounded-2xl border border-white/10 bg-[#1a1c23] py-4 px-6 text-white" value={editingProduct?.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} />
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
                title={helpContent.products.title}
                sections={helpContent.products.sections}
            />
        </div>
    );
};

export default ProductsManagementPage;
