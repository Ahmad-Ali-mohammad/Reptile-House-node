
import React, { useState } from 'react';
import { useDatabase } from '../../contexts/DatabaseContext';
import { EditIcon, TrashIcon, PlusIcon, SearchIcon } from '../../components/icons';
import ConfirmationModal from '../../components/ConfirmationModal';
import { Reptile } from '../../types';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { helpContent } from '../../constants/helpContent';

const InventoryPage: React.FC = () => {
    const { products, deleteProduct, addProduct } = useDatabase();
    const [searchTerm, setSearchTerm] = useState('');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null }>({
        isOpen: false,
        id: null
    });

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.species.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteClick = (id: number) => {
        setConfirmDelete({ isOpen: true, id });
    };

    const handleConfirmDelete = () => {
        if (confirmDelete.id !== null) {
            deleteProduct(confirmDelete.id);
        }
        setConfirmDelete({ isOpen: false, id: null });
    };

    const toggleAvailability = (product: Reptile) => {
        const updated = { 
            ...product, 
            isAvailable: !product.isAvailable,
            status: !product.isAvailable ? 'متوفر' : 'غير متوفر' 
        } as Reptile;
        addProduct(updated);
    };

    return (
        <div className="space-y-8 animate-fade-in text-right">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-black">إدارة المخزون</h1>
                    <HelpButton onClick={() => setIsHelpOpen(true)} />
                </div>
                <div className="relative w-full md:w-80">
                    <input 
                        id="inventory-search"
                        name="inventorySearch"
                        type="text" 
                        placeholder="بحث سريع في المخزون..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#1a1c23] border border-white/10 rounded-xl py-3 px-5 ps-12 outline-none focus:ring-2 focus:ring-amber-500/50 text-white"
                    />
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-medium p-6 rounded-3xl border border-white/10">
                    <p className="text-gray-400 text-sm font-bold">إجمالي المخلوقات</p>
                    <p className="text-3xl font-black font-poppins">{products.length}</p>
                </div>
                <div className="glass-medium p-6 rounded-3xl border border-white/10 border-green-500/20">
                    <p className="text-green-400 text-sm font-bold">متاحة حالياً</p>
                    <p className="text-3xl font-black font-poppins text-green-400">{products.filter(p => p.isAvailable).length}</p>
                </div>
                <div className="glass-medium p-6 rounded-3xl border border-white/10 border-amber-500/20">
                    <p className="text-amber-400 text-sm font-bold">قيد الحجز</p>
                    <p className="text-3xl font-black font-poppins text-amber-400">{products.filter(p => p.status === 'قيد الحجز').length}</p>
                </div>
                <div className="glass-medium p-6 rounded-3xl border border-white/10 border-red-500/20">
                    <p className="text-red-400 text-sm font-bold">غير متوفرة</p>
                    <p className="text-3xl font-black font-poppins text-red-400">{products.filter(p => p.status === 'غير متوفر').length}</p>
                </div>
            </div>

            <div className="glass-dark rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl bg-[#11141b]/60">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <th className="p-6">المنتج</th>
                                <th className="p-6">الفصيلة</th>
                                <th className="p-6">حالة المخزون</th>
                                <th className="p-6">السعر</th>
                                <th className="p-6 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredProducts.map(product => (
                                <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="font-bold">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-gray-400 text-sm font-poppins">
                                        {product.species}
                                    </td>
                                    <td className="p-6">
                                        <button 
                                            onClick={() => toggleAvailability(product)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                                                product.status === 'متوفر' ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20' :
                                                product.status === 'قيد الحجز' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' : 
                                                'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                            }`}
                                        >
                                            {product.status}
                                        </button>
                                    </td>
                                    <td className="p-6 font-black font-poppins text-amber-500">${product.price}</td>
                                    <td className="p-6 text-center">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleDeleteClick(product.id)}
                                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                title="حذف سريع"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                        <div className="p-12 text-center text-gray-500 italic">لا توجد منتجات مطابقة للبحث</div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                title="حذف من المخزون"
                message="هل أنت متأكد من حذف هذا العنصر من المخزون نهائياً؟"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
            />

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                content={helpContent.inventory}
            />
        </div>
    );
};

export default InventoryPage;
