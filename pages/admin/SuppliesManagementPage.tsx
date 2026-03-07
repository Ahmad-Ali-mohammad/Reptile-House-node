
import React, { useState, useMemo, useRef } from 'react';
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

    // Confirmation Modal State
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null }>({
        isOpen: false,
        id: null
    });

    const [isNewCategory, setIsNewCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState('');

    const supplyTabs: TabItem[] = [
      { id: 'all_supplies', label: 'جميع المستلزمات', icon: '📦' },
      { id: 'featured', label: 'المميزة', icon: '✨' },
      { id: 'out_of_stock', label: 'نفذت من المخزون', icon: '❌', badge: supplies.filter(s => !s.isAvailable).length }
    ];

    const filteredSupplies = useMemo(() => {
        let list = supplies;
        if (activeTab === 'featured') list = supplies.filter(s => s.rating >= 4.9);
        if (activeTab === 'out_of_stock') list = supplies.filter(s => !s.isAvailable);
        
        if (searchQuery) {
            list = list.filter(s => 
                s.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return list;
    }, [activeTab, supplies, searchQuery]);

    const handleOpenModal = (supply?: Reptile) => {
        setIsNewCategory(false);
        setCustomCategory('');
        
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
            setEditingSupply(prev => ({ ...prev, imageUrl }));
        } catch (error) {
            alert(error instanceof Error ? error.message : 'تعذر رفع صورة المستلزم');
        } finally {
            setIsImageUploading(false);
            e.target.value = '';
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSupply) {
            if (isImageUploading) {
                alert('انتظر حتى يكتمل رفع الصورة أولاً');
                return;
            }
            const finalCategory = isNewCategory ? customCategory : (editingSupply.category || 'food');

            if (!finalCategory || !editingSupply.imageUrl) {
                alert('يرجى ملء جميع الحقول ورفع صورة');
                return;
            }

            const supplyToSave: Reptile = {
                ...editingSupply as Reptile,
                category: finalCategory as any,
                species: 'مستلزمات',
                price: Number(editingSupply.price) || 0,
                id: Number(editingSupply.id) || 0
            };
            
            addSupply(supplyToSave);
            setIsModalOpen(false);
            setEditingSupply(null);
        }
    };

    const handleDeleteClick = (id: number) => {
        setConfirmDelete({ isOpen: true, id });
    };

    const handleConfirmDelete = () => {
        if (confirmDelete.id !== null) {
            deleteSupply(confirmDelete.id);
        }
        setConfirmDelete({ isOpen: false, id: null });
    };

    return (
        <div className="animate-fade-in relative space-y-8 text-right">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                <div>
                    <h1 className="text-4xl font-black mb-2">إدارة المستلزمات</h1>
                    <p className="text-gray-400">إدارة مستلزمات رعاية الزواحف</p>
                </div>
                <HelpButton onClick={() => setIsHelpOpen(true)} />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="relative flex-1 w-full max-w-md">
                    <input
                        id="supply-search"
                        name="supplySearch"
                        type="text"
                        placeholder="ابحث في المستلزمات..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-3.5 px-6 ps-14 outline-none focus:ring-2 focus:ring-amber-500/50 text-white transition-all shadow-inner"
                    />
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-3 bg-amber-500 text-gray-900 font-black py-3.5 px-8 rounded-2xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>إضافة مستلزم جديد</span>
                </button>
            </div>

            <TabsSystem tabs={supplyTabs} activeTabId={activeTab} onChange={setActiveTab} />

            <div className="glass-medium rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden bg-[#11141b]/40">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest bg-black/20">
                                <th className="p-6">المنتج</th>
                                <th className="p-6 text-center">الفئة</th>
                                <th className="p-6">السعر</th>
                                <th className="p-6 text-center">الحالة</th>
                                <th className="p-6 text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSupplies.map(supply => (
                                <tr key={supply.id} className="hover:bg-white/5 transition-all group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-gray-800 rounded-2xl overflow-hidden border border-white/10 shadow-lg shrink-0">
                                                <img src={supply.imageUrl} alt={supply.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black group-hover:text-amber-400 transition-colors text-lg truncate">{supply.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className="text-gray-300 font-bold bg-white/5 px-4 py-1.5 rounded-xl border border-white/5 text-xs">
                                            {supplyCategories.find(c => c.value === supply.category)?.label || supply.category}
                                        </span>
                                    </td>
                                    <td className="p-6 font-poppins font-black text-amber-500 text-xl">{supply.price.toLocaleString('ar-SY')} ل.س</td>
                                    <td className="p-6 text-center">
                                        <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase border ${
                                            supply.isAvailable 
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                            {supply.status}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex justify-start gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleOpenModal(supply)} 
                                                className="p-3 bg-white/5 text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-all border border-white/5"
                                                title="تعديل"
                                            >
                                                <EditIcon className="w-5 h-5"/>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteClick(supply.id)} 
                                                className="p-3 bg-red-500/5 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all border border-red-500/10"
                                                title="حذف"
                                            >
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Custom Confirmation Modal */}
            <ConfirmationModal 
                isOpen={confirmDelete.isOpen}
                title="تأكيد الحذف النهائي"
                message="هل أنت متأكد تماماً من رغبتك في حذف هذا المستلزم من المتجر؟ هذه العملية نهائية ولا يمكن التراجع عنها."
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
            />

            {/* Edit/Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-default"
                        onClick={() => setIsModalOpen(false)}
                        aria-label="إغلاق النافذة"
                    />
                    <form 
                        onSubmit={handleSave}
                        className="relative w-full max-w-4xl glass-dark border border-white/10 rounded-[3rem] p-8 md:p-14 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0f1117]"
                    >
                        <h2 className="text-4xl font-black mb-10 text-white tracking-tighter">
                            {editingSupply?.id ? 'تحديث بيانات المستلزم' : 'إضافة مستلزم جديد'}
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-right">
                            <div className="md:col-span-1 space-y-6">
                                <label htmlFor="supply-image-upload" className="block text-xs font-black text-amber-500 uppercase tracking-widest">الصورة التعريفية</label>
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
                                    className="relative aspect-square w-full rounded-[2.5rem] border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-all overflow-hidden group"
                                >
                                    {editingSupply?.imageUrl ? (
                                        <img src={editingSupply.imageUrl} alt={editingSupply.name || 'صورة المنتج'} className="w-full h-full object-cover" />
                                    ) : (
                                        <PlusIcon className="w-12 h-12 text-gray-600" />
                                    )}
                                    {isImageUploading ? (
                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-sm font-black text-amber-400">
                                            جاري رفع الصورة...
                                        </div>
                                    ) : null}
                                </div>
                                <input id="supply-image-upload" type="file" ref={fileInputRef} className="hidden" accept={IMAGE_FILE_ACCEPT} onChange={handleImageChange} aria-label="اختيار صورة المنتج" />
                            </div>

                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label htmlFor="supply-name" className="text-xs font-black text-amber-500 uppercase mb-2 block">اسم المستلزم</label>
                                    <input id="supply-name" required className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold" value={editingSupply?.name || ''} onChange={e => setEditingSupply({...editingSupply, name: e.target.value})} />
                                </div>
                                <div>
                                    <label htmlFor="supply-category" className="text-xs font-black text-amber-500 uppercase mb-2 block">الفئة</label>
                                    <select id="supply-category" className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white" value={editingSupply?.category} onChange={e => setEditingSupply({...editingSupply, category: e.target.value as Reptile['category']})}>
                                        {supplyCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="supply-price" className="text-xs font-black text-amber-500 uppercase mb-2 block">السعر (ل.س)</label>
                                    <input id="supply-price" type="number" className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold font-poppins" value={editingSupply?.price || 0} onChange={e => setEditingSupply({...editingSupply, price: Number(e.target.value)})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-black text-amber-500 uppercase mb-2 block">الحالة</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="availability" 
                                                checked={editingSupply?.isAvailable === true}
                                                onChange={() => setEditingSupply({...editingSupply, isAvailable: true, status: 'متوفر'})}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-white">متوفر</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="availability" 
                                                checked={editingSupply?.isAvailable === false}
                                                onChange={() => setEditingSupply({...editingSupply, isAvailable: false, status: 'غير متوفر'})}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-white">غير متوفر</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label htmlFor="supply-description" className="text-xs font-black text-amber-500 uppercase mb-2 block">الوصف</label>
                                    <textarea id="supply-description" rows={4} className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white resize-none" value={editingSupply?.description || ''} onChange={e => setEditingSupply({...editingSupply, description: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 mt-12">
                            <button type="submit" disabled={isImageUploading} className="flex-1 bg-amber-500 text-gray-900 font-black py-5 rounded-[1.5rem] hover:bg-amber-400 shadow-2xl text-lg disabled:opacity-60 disabled:cursor-not-allowed">حفظ التغييرات</button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 bg-white/5 text-gray-400 font-black rounded-[1.5rem] border border-white/5">إلغاء</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Help Modal */}
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
