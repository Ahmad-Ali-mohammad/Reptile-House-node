
import React, { useState } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { Address } from '../types';
import { MapPinIcon, EditIcon, TrashIcon, PlusIcon } from './icons';

const Addresses: React.FC = () => {
    const { addresses, addAddress, removeAddress } = useDatabase();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Partial<Address> | null>(null);

    const handleOpenModal = (address?: Address) => {
        if (address) {
            setEditingAddress({ ...address });
        } else {
            setEditingAddress({
                label: '',
                street: '',
                city: 'دمشق',
                country: 'سوريا',
                isDefault: false
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAddress) {
            const address: Address = {
                ...editingAddress as Address,
                id: editingAddress.id || Date.now(),
            };
            addAddress(address);
            setIsModalOpen(false);
            setEditingAddress(null);
        }
    };

    const handleDelete = (id: number) => {
        if (window.confirm('🗑️ هل أنت متأكد من حذف هذا العنوان من حسابك؟')) {
            removeAddress(id);
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-3xl font-black text-white">عناويني المسجلة</h2>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex w-full items-center justify-center rounded-2xl bg-amber-500 px-6 py-3 font-black text-gray-900 shadow-xl transition-all hover:bg-amber-400 active:scale-95 sm:w-auto"
                >
                    <PlusIcon className="w-5 h-5 me-2" />
                    إضافة عنوان جديد
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {addresses.map(address => (
                    <div key={address.id} className="group rounded-[1.5rem] border border-white/10 bg-[#11141b] p-4 shadow-lg transition-all hover:border-amber-500/30 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4 sm:gap-5">
                            <div className={`p-4 rounded-2xl ${address.isDefault ? 'bg-amber-500 text-gray-900' : 'bg-white/5 text-gray-400'} shadow-inner`}>
                                <MapPinIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <p className="font-black text-xl text-white">{address.label}</p>
                                    {address.isDefault && (
                                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 uppercase font-black tracking-widest">افتراضي</span>
                                    )}
                                </div>
                                <p className="text-gray-400 mt-1 font-bold text-sm">{address.street}, {address.city}, {address.country}</p>
                                {!address.isDefault && (
                                    <button 
                                        onClick={() => addAddress({...address, isDefault: true})}
                                        className="text-[10px] text-amber-500 font-black uppercase tracking-widest hover:underline mt-2"
                                    >
                                        تعيين كعنوان افتراضي
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                            <button 
                                onClick={() => handleOpenModal(address)}
                                className="p-3 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/5"
                                title="تعديل"
                            >
                                <EditIcon className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => handleDelete(address.id)}
                                className="p-3 bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all border border-red-500/10"
                                title="حذف"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                        </div>
                    </div>
                ))}

                {addresses.length === 0 && (
                    <div className="text-center py-20 bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center">
                        <MapPinIcon className="w-12 h-12 text-gray-700 mb-4 opacity-20" />
                        <p className="text-gray-500 font-black">لم تقم بإضافة أي عناوين شحن بعد</p>
                    </div>
                )}
            </div>

            {/* Address Modal (Add/Edit) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <form 
                        onSubmit={handleSave}
                        className="relative w-full max-w-lg animate-scale-in rounded-[2.5rem] border border-white/10 bg-[#0f1117] p-5 shadow-[0_0_100px_rgba(0,0,0,0.5)] glass-dark sm:p-10"
                    >
                        <h3 className="text-3xl font-black mb-8 text-white">{editingAddress?.id ? 'تعديل بيانات العنوان' : 'إضافة عنوان شحن جديد'}</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 block">اسم العنوان (مثلاً: المنزل، العمل)</label>
                                <input 
                                    id="address-label"
                                    name="addressLabel"
                                    required
                                    type="text" 
                                    className="w-full bg-[#1a1c23] border border-white/10 rounded-xl py-4 px-6 focus:ring-2 focus:ring-amber-500/50 outline-none text-white font-bold shadow-inner"
                                    value={editingAddress?.label || ''}
                                    onChange={e => setEditingAddress({...editingAddress, label: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 block">العنوان التفصيلي</label>
                                <input 
                                    id="address-street"
                                    name="addressStreet"
                                    required
                                    type="text" 
                                    className="w-full bg-[#1a1c23] border border-white/10 rounded-xl py-4 px-6 focus:ring-2 focus:ring-amber-500/50 outline-none text-white font-bold shadow-inner"
                                    value={editingAddress?.street || ''}
                                    onChange={e => setEditingAddress({...editingAddress, street: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 block">المدينة</label>
                                    <input 
                                        id="address-city"
                                        name="addressCity"
                                        required
                                        type="text" 
                                        className="w-full bg-[#1a1c23] border border-white/10 rounded-xl py-4 px-6 focus:ring-2 focus:ring-amber-500/50 outline-none text-white font-bold shadow-inner"
                                        value={editingAddress?.city || ''}
                                        onChange={e => setEditingAddress({...editingAddress, city: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 block">البلد</label>
                                    <input 
                                        id="address-country"
                                        name="addressCountry"
                                        required
                                        type="text" 
                                        className="w-full bg-[#1a1c23] border border-white/10 rounded-xl py-4 px-6 focus:ring-2 focus:ring-amber-500/50 outline-none text-white font-bold shadow-inner"
                                        value={editingAddress?.country || ''}
                                        onChange={e => setEditingAddress({...editingAddress, country: e.target.value})}
                                    />
                                </div>
                            </div>
                            <label className="flex items-center gap-4 cursor-pointer p-2 hover:bg-white/5 rounded-xl transition-colors">
                                <input 
                                    id="address-default"
                                    name="addressDefault"
                                    type="checkbox" 
                                    className="w-6 h-6 rounded-lg border-white/10 bg-transparent text-amber-500 focus:ring-amber-500/50 cursor-pointer"
                                    checked={editingAddress?.isDefault || false}
                                    onChange={e => setEditingAddress({...editingAddress, isDefault: e.target.checked})}
                                />
                                <span className="text-sm font-black text-gray-300">تعيين كعنوان افتراضي للشحن</span>
                            </label>
                        </div>
                        <div className="flex gap-4 mt-10">
                            <button type="submit" className="flex-1 bg-amber-500 text-gray-900 font-black py-5 rounded-2xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95">حفظ العنوان</button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 bg-white/5 text-gray-400 font-black rounded-2xl border border-white/5">إلغاء</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Addresses;
