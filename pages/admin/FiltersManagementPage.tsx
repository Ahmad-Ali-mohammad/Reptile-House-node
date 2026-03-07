
import React, { useEffect, useState } from 'react';
import { FilterGroup, FilterOption } from '../../types';
import { PlusIcon, EditIcon, TrashIcon, FilterIcon, CheckCircleIcon } from '../../components/icons';
import ConfirmationModal from '../../components/ConfirmationModal';
import HelpModal from '../../components/HelpModal';
import { api } from '../../services/api';
import { helpContent } from '../../constants/helpContent';

const FiltersManagementPage: React.FC = () => {
    const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Partial<FilterGroup> | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    const refreshGroups = async () => {
        try {
            const rows = await api.getFilterGroups();
            setFilterGroups(Array.isArray(rows) ? rows : []);
        } catch {
            setFilterGroups([]);
        }
    };

    useEffect(() => {
        refreshGroups();
    }, []);

    const handleOpenModal = (group?: FilterGroup) => {
        if (group) {
            setEditingGroup({ ...group });
        } else {
            setEditingGroup({
                id: `filter-${Date.now()}`,
                name: '',
                type: 'custom',
                options: [],
                isActive: true,
                appliesTo: 'both'
            });
        }
        setIsModalOpen(true);
    };

    const handleAddOption = () => {
        if (!editingGroup) return;
        const newOption: FilterOption = {
            id: `opt-${Date.now()}`,
            name: '',
            value: '',
            isActive: true,
            order: editingGroup.options?.length || 0
        };
        setEditingGroup({
            ...editingGroup,
            options: [...(editingGroup.options || []), newOption]
        });
    };

    const handleUpdateOption = (index: number, field: keyof FilterOption, value: any) => {
        if (!editingGroup || !editingGroup.options) return;
        const newOptions = [...editingGroup.options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setEditingGroup({ ...editingGroup, options: newOptions });
    };

    const handleDeleteOption = (index: number) => {
        if (!editingGroup || !editingGroup.options) return;
        const newOptions = editingGroup.options.filter((_, i) => i !== index);
        setEditingGroup({ ...editingGroup, options: newOptions });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingGroup) {
            if (!editingGroup.name || !editingGroup.options || editingGroup.options.length === 0) {
                globalThis.alert('يرجى ملء جميع الحقول المطلوبة وإضافة خيار واحد على الأقل');
                return;
            }

            const groupToSave: FilterGroup = {
                id: editingGroup.id || `filter-${Date.now()}`,
                name: editingGroup.name,
                type: editingGroup.type || 'custom',
                options: editingGroup.options,
                isActive: editingGroup.isActive !== undefined ? editingGroup.isActive : true,
                appliesTo: editingGroup.appliesTo || 'both'
            };

            try {
                await api.saveFilterGroup(groupToSave);
                await refreshGroups();
                setIsModalOpen(false);
                setEditingGroup(null);
            } catch {
                globalThis.alert('تعذر حفظ مجموعة الفلاتر. يرجى المحاولة مرة أخرى.');
            }
        }
    };

    const handleDeleteClick = (id: string) => {
        setConfirmDelete({ isOpen: true, id });
    };

    const handleConfirmDelete = async () => {
        if (confirmDelete.id) {
            try {
                await api.deleteFilterGroup(confirmDelete.id);
                await refreshGroups();
            } catch {
                globalThis.alert('تعذر حذف مجموعة الفلاتر. يرجى المحاولة مرة أخرى.');
            }
        }
        setConfirmDelete({ isOpen: false, id: null });
    };

    const toggleGroupStatus = async (id: string) => {
        const group = filterGroups.find(g => g.id === id);
        if (group) {
            try {
                await api.saveFilterGroup({ ...group, isActive: !group.isActive });
                await refreshGroups();
            } catch {
                globalThis.alert('تعذر تحديث حالة المجموعة.');
            }
        }
    };

    const activeGroups = filterGroups.filter(g => g.isActive);

    const getFilterTypeLabel = (type: string): string => {
        if (type === 'category') return 'فئة';
        if (type === 'price') return 'سعر';
        if (type === 'availability') return 'توفر';
        return 'مخصص';
    };

    const getAppliesToLabel = (appliesTo: string): string => {
        if (appliesTo === 'products') return 'المنتجات';
        if (appliesTo === 'supplies') return 'المستلزمات';
        return 'كلاهما';
    };

    return (
        <div className="animate-fade-in relative space-y-8 text-right">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black mb-2">إدارة الفلاتر الديناميكية</h1>
                    <p className="text-gray-400">تحكم في خيارات الفلترة في المتجر</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsHelpOpen(true)}
                        className="flex items-center gap-3 bg-blue-500/10 text-blue-400 border border-blue-500/30 font-black py-3.5 px-6 rounded-2xl hover:bg-blue-500/20 transition-all shadow-xl active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>تعليمات الاستخدام</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-3 bg-amber-500 text-gray-900 font-black py-3.5 px-8 rounded-2xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>إضافة مجموعة فلاتر</span>
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm font-bold mb-1">إجمالي المجموعات</p>
                            <p className="text-3xl font-black text-amber-400 font-poppins">{filterGroups.length}</p>
                        </div>
                        <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl">
                            <FilterIcon className="w-8 h-8" />
                        </div>
                    </div>
                </div>
                <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm font-bold mb-1">المجموعات النشطة</p>
                            <p className="text-3xl font-black text-green-400 font-poppins">{activeGroups.length}</p>
                        </div>
                        <div className="p-4 bg-green-500/10 text-green-400 rounded-2xl">
                            <CheckCircleIcon className="w-8 h-8" />
                        </div>
                    </div>
                </div>
                <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm font-bold mb-1">إجمالي الخيارات</p>
                            <p className="text-3xl font-black text-blue-400 font-poppins">
                                {filterGroups.reduce((sum, g) => sum + g.options.length, 0)}
                            </p>
                        </div>
                        <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl">
                            <FilterIcon className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Groups Grid */}
            <div className="grid grid-cols-1 gap-6">
                {filterGroups.map(group => (
                    <div
                        key={group.id}
                        className={`glass-dark border rounded-[2rem] p-6 group hover:border-amber-500/30 transition-all shadow-xl ${
                            group.isActive ? 'border-white/10' : 'border-gray-500/30 opacity-60'
                        }`}
                    >
                        <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black mb-2 group-hover:text-amber-400 transition-colors">
                                        {group.name}
                                    </h3>
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="px-3 py-1 bg-white/5 text-gray-300 border border-white/5 rounded-lg text-xs font-bold">
                                            النوع: {getFilterTypeLabel(group.type)}
                                        </span>
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg text-xs font-bold">
                                            يظهر في: {getAppliesToLabel(group.appliesTo)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(group)}
                                        className="p-2 bg-white/5 text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all border border-white/5"
                                        aria-label={`تعديل ${group.name}`}
                                    >
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(group.id)}
                                        className="p-2 bg-red-500/5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all border border-red-500/10"
                                        aria-label={`حذف ${group.name}`}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                <p className="text-sm text-gray-400 mb-3 font-bold">الخيارات ({group.options.length}):</p>
                                <div className="flex flex-wrap gap-2">
                                    {group.options.map(option => (
                                        <span
                                            key={option.id}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                                option.isActive
                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                    : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                            }`}
                                        >
                                            {option.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end pt-4 border-t border-white/10">
                                <button
                                    onClick={() => toggleGroupStatus(group.id)}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                                        group.isActive
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20'
                                    }`}
                                >
                                    {group.isActive ? '✓ نشط' : '✗ معطل'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filterGroups.length === 0 && (
                <div className="text-center py-20 text-gray-600 font-bold border-2 border-dashed border-white/5 rounded-[2rem] glass-medium">
                    <FilterIcon className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                    <p>لا توجد مجموعات فلاتر. ابدأ بإضافة مجموعة جديدة!</p>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                title="تأكيد الحذف"
                message="هل أنت متأكد من حذف هذه المجموعة؟ لا يمكن التراجع عن هذه العملية."
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
            />

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        onClick={() => setIsModalOpen(false)}
                        role="presentation"
                        aria-hidden="true"
                    ></div>
                    <form
                        onSubmit={handleSave}
                        className="relative w-full max-w-4xl glass-dark border border-white/10 rounded-[3rem] p-8 md:p-14 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0f1117]"
                    >
                        <h2 className="text-4xl font-black mb-10 text-white tracking-tighter">
                            {editingGroup?.id && filterGroups.find(g => g.id === editingGroup.id)
                                ? 'تحديث المجموعة'
                                : 'إضافة مجموعة فلاتر'}
                        </h2>

                        <div className="space-y-6 text-right">
                            {/* Name */}
                            <div>
                                <label className="text-xs font-black text-amber-500 uppercase mb-2 block">
                                    اسم المجموعة <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="filter-group-name"
                                    name="filterGroupName"
                                    required
                                    className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                                    value={editingGroup?.name || ''}
                                    onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                    placeholder="مثلاً: النوع، الحجم، اللون"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label htmlFor="filter-group-type" className="text-xs font-black text-amber-500 uppercase mb-2 block">
                                    نوع الفلتر
                                </label>
                                <select
                                    id="filter-group-type"
                                    className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                                    value={editingGroup?.type || 'custom'}
                                    onChange={e => setEditingGroup({ ...editingGroup, type: e.target.value as any })}
                                >
                                    <option value="custom">مخصص</option>
                                    <option value="category">فئة</option>
                                    <option value="price">سعر</option>
                                    <option value="availability">توفر</option>
                                </select>
                            </div>

                            {/* Applies To */}
                            <div>
                                <label htmlFor="filter-group-applies-to" className="text-xs font-black text-amber-500 uppercase mb-2 block">
                                    يظهر في
                                </label>
                                <select
                                    id="filter-group-applies-to"
                                    className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                                    value={editingGroup?.appliesTo || 'both'}
                                    onChange={e => setEditingGroup({ ...editingGroup, appliesTo: e.target.value as any })}
                                >
                                    <option value="both">المنتجات والمستلزمات</option>
                                    <option value="products">المنتجات فقط</option>
                                    <option value="supplies">المستلزمات فقط</option>
                                </select>
                            </div>

                            {/* Options */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-xs font-black text-amber-500 uppercase">
                                        الخيارات <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddOption}
                                        className="flex items-center gap-2 bg-white/5 text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-all text-sm font-bold"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        إضافة خيار
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {editingGroup?.options?.map((option, index) => (
                                        <div key={option.id} className="flex gap-3 items-start bg-[#1a1c23] p-4 rounded-xl border border-white/10">
                                            <div className="flex-1 space-y-3">
                                                <input
                                                    id={`filter-option-name-${option.id || index}`}
                                                    name={`filterOptionName-${option.id || index}`}
                                                    type="text"
                                                    placeholder="اسم الخيار"
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white text-sm"
                                                    value={option.name}
                                                    onChange={e => handleUpdateOption(index, 'name', e.target.value)}
                                                />
                                                <input
                                                    id={`filter-option-value-${option.id || index}`}
                                                    name={`filterOptionValue-${option.id || index}`}
                                                    type="text"
                                                    placeholder="القيمة (value)"
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white text-sm"
                                                    value={option.value}
                                                    onChange={e => handleUpdateOption(index, 'value', e.target.value)}
                                                />
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        id={`filter-option-active-${option.id || index}`}
                                                        name={`filterOptionActive-${option.id || index}`}
                                                        type="checkbox"
                                                        checked={option.isActive}
                                                        onChange={e => handleUpdateOption(index, 'isActive', e.target.checked)}
                                                        className="w-4 h-4 rounded border-white/20 bg-transparent text-amber-500"
                                                    />
                                                    <span className="text-gray-400 text-sm">نشط</span>
                                                </label>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteOption(index)}
                                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                aria-label={`حذف الخيار ${option.name || index + 1}`}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        id="filter-group-active"
                                        name="filterGroupActive"
                                        type="checkbox"
                                        checked={editingGroup?.isActive !== false}
                                        onChange={e => setEditingGroup({ ...editingGroup, isActive: e.target.checked })}
                                        className="w-5 h-5 rounded border-white/20 bg-transparent text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-white font-bold">تفعيل المجموعة</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-6 mt-12">
                            <button
                                type="submit"
                                className="flex-1 bg-amber-500 text-gray-900 font-black py-5 rounded-[1.5rem] hover:bg-amber-400 shadow-2xl text-lg"
                            >
                                حفظ المجموعة
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-10 bg-white/5 text-gray-400 font-black rounded-[1.5rem] border border-white/5"
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Help Modal */}
            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={helpContent.filters.title}
                sections={helpContent.filters.sections}
            />
        </div>
    );
};

export default FiltersManagementPage;

