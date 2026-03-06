
import React, { useEffect, useState } from 'react';
import { PolicyDocument } from '../../types';
import { PlusIcon, EditIcon, TrashIcon, DocumentIcon, CheckCircleIcon } from '../../components/icons';
import ConfirmationModal from '../../components/ConfirmationModal';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { helpContent } from '../../constants/helpContent';
import { api } from '../../services/api';

const defaultPolicies: PolicyDocument[] = [
    {
        id: 'privacy',
        type: 'privacy',
        title: 'سياسة الخصوصية',
        content: 'نحن في Reptile House نحترم خصوصيتك ونلتزم بحماية معلوماتك الشخصية...',
        lastUpdated: new Date().toISOString().split('T')[0],
        isActive: true,
        icon: '🔒'
    },
    {
        id: 'returns',
        type: 'returns',
        title: 'سياسة الاسترجاع والاستبدال',
        content: 'يمكنك إرجاع أو استبدال المنتجات خلال 7 أيام من تاريخ الشراء...',
        lastUpdated: new Date().toISOString().split('T')[0],
        isActive: true,
        icon: '🔄'
    },
    {
        id: 'warranty',
        type: 'warranty',
        title: 'سياسة الضمان',
        content: 'نضمن صحة جميع الزواحف لمدة 30 يوماً من تاريخ الشراء...',
        lastUpdated: new Date().toISOString().split('T')[0],
        isActive: true,
        icon: '✅'
    },
    {
        id: 'terms',
        type: 'terms',
        title: 'شروط الاستخدام',
        content: 'باستخدامك لهذا الموقع، فإنك توافق على الشروط والأحكام التالية...',
        lastUpdated: new Date().toISOString().split('T')[0],
        isActive: true,
        icon: '📋'
    },
    {
        id: 'shipping',
        type: 'shipping',
        title: 'سياسة الشحن والتوصيل',
        content: 'نوفر خدمة التوصيل لجميع المحافظات السورية خلال 2-5 أيام عمل...',
        lastUpdated: new Date().toISOString().split('T')[0],
        isActive: true,
        icon: '🚚'
    }
];

const policyTypeLabels = {
    privacy: 'سياسة الخصوصية',
    returns: 'الاسترجاع والاستبدال',
    warranty: 'الضمان',
    terms: 'شروط الاستخدام',
    shipping: 'الشحن والتوصيل',
    custom: 'سياسة مخصصة'
};

const PoliciesManagementPage: React.FC = () => {
    const [policies, setPolicies] = useState<PolicyDocument[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<Partial<PolicyDocument> | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const loadPolicies = async () => {
        try {
            let rows = await api.getPolicies();
            if (!rows.length) {
                await Promise.all(defaultPolicies.map((policy) => api.savePolicy(policy)));
                rows = await api.getPolicies();
            }
            setPolicies(rows);
        } catch {
            setPolicies(defaultPolicies);
        }
    };

    useEffect(() => {
        loadPolicies();
    }, []);

    const handleOpenModal = (policy?: PolicyDocument) => {
        if (policy) {
            setEditingPolicy({ ...policy });
        } else {
            setEditingPolicy({
                id: `policy-${Date.now()}`,
                type: 'custom',
                title: '',
                content: '',
                lastUpdated: new Date().toISOString().split('T')[0],
                isActive: true,
                icon: '📄'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPolicy) {
            if (!editingPolicy.title || !editingPolicy.content) {
                alert('يرجى ملء جميع الحقول المطلوبة');
                return;
            }

            const policyToSave: PolicyDocument = {
                id: editingPolicy.id || `policy-${Date.now()}`,
                type: editingPolicy.type || 'custom',
                title: editingPolicy.title,
                content: editingPolicy.content,
                lastUpdated: new Date().toISOString().split('T')[0],
                isActive: editingPolicy.isActive !== undefined ? editingPolicy.isActive : true,
                icon: editingPolicy.icon || '📄'
            };

            try {
                await api.savePolicy(policyToSave);
                await loadPolicies();
                setIsModalOpen(false);
                setEditingPolicy(null);
            } catch {
                alert('تعذر حفظ السياسة. يرجى المحاولة مرة أخرى.');
            }
        }
    };

    const handleDeleteClick = (id: string) => {
        setConfirmDelete({ isOpen: true, id });
    };

    const handleConfirmDelete = async () => {
        if (confirmDelete.id) {
            try {
                await api.deletePolicy(confirmDelete.id);
                await loadPolicies();
            } catch {
                alert('تعذر حذف السياسة. يرجى المحاولة مرة أخرى.');
            }
        }
        setConfirmDelete({ isOpen: false, id: null });
    };

    const togglePolicyStatus = async (id: string) => {
        const current = policies.find((p) => p.id === id);
        if (!current) return;
        try {
            await api.savePolicy({ ...current, isActive: !current.isActive });
            await loadPolicies();
        } catch {
            alert('تعذر تحديث حالة السياسة.');
        }
    };

    const activePolicies = policies.filter(p => p.isActive);

    return (
        <div className="animate-fade-in relative space-y-8 text-right">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black mb-2">إدارة السياسات والضمانات</h1>
                    <p className="text-gray-400">تحكم في سياسات الموقع والضمانات</p>
                </div>
                <div className="flex gap-3">
                    <HelpButton onClick={() => setIsHelpOpen(true)} />
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-3 bg-amber-500 text-gray-900 font-black py-3.5 px-8 rounded-2xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>إضافة سياسة جديدة</span>
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm font-bold mb-1">إجمالي السياسات</p>
                            <p className="text-3xl font-black text-amber-400 font-poppins">{policies.length}</p>
                        </div>
                        <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl">
                            <DocumentIcon className="w-8 h-8" />
                        </div>
                    </div>
                </div>
                <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm font-bold mb-1">السياسات النشطة</p>
                            <p className="text-3xl font-black text-green-400 font-poppins">{activePolicies.length}</p>
                        </div>
                        <div className="p-4 bg-green-500/10 text-green-400 rounded-2xl">
                            <CheckCircleIcon className="w-8 h-8" />
                        </div>
                    </div>
                </div>
                <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm font-bold mb-1">آخر تحديث</p>
                            <p className="text-lg font-black text-blue-400">
                                {policies.length > 0 ? policies[0].lastUpdated : 'N/A'}
                            </p>
                        </div>
                        <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl">
                            <DocumentIcon className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Policies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {policies.map(policy => (
                    <div
                        key={policy.id}
                        className={`glass-dark border rounded-[2rem] p-6 group hover:border-amber-500/30 transition-all shadow-xl ${
                            policy.isActive ? 'border-white/10' : 'border-gray-500/30 opacity-60'
                        }`}
                    >
                        <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="text-4xl">{policy.icon}</div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black mb-2 group-hover:text-amber-400 transition-colors">
                                            {policy.title}
                                        </h3>
                                        <span className="px-3 py-1 bg-white/5 text-gray-300 border border-white/5 rounded-lg text-xs font-bold">
                                            {policyTypeLabels[policy.type]}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(policy)}
                                        className="p-2 bg-white/5 text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all border border-white/5"
                                        aria-label={`تعديل ${policy.title}`}
                                    >
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(policy.id)}
                                        className="p-2 bg-red-500/5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all border border-red-500/10"
                                        aria-label={`حذف ${policy.title}`}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Content Preview */}
                            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                <p className="text-sm text-gray-400 line-clamp-3">
                                    {policy.content}
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <div className="text-xs text-gray-500">
                                    آخر تحديث: {policy.lastUpdated}
                                </div>
                                <button
                                    onClick={() => togglePolicyStatus(policy.id)}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                                        policy.isActive
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20'
                                    }`}
                                >
                                    {policy.isActive ? '✓ نشط' : '✗ معطل'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {policies.length === 0 && (
                <div className="text-center py-20 text-gray-600 font-bold border-2 border-dashed border-white/5 rounded-[2rem] glass-medium">
                    <DocumentIcon className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                    <p>لا توجد سياسات. ابدأ بإضافة سياسة جديدة!</p>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                title="تأكيد الحذف"
                message="هل أنت متأكد من حذف هذه السياسة؟ لا يمكن التراجع عن هذه العملية."
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
                            {editingPolicy?.id && policies.find(p => p.id === editingPolicy.id)
                                ? 'تحديث السياسة'
                                : 'إضافة سياسة جديدة'}
                        </h2>

                        <div className="space-y-6 text-right">
                            {/* Type Selection */}
                            <div>
                                <label htmlFor="policy-type" className="text-xs font-black text-amber-500 uppercase mb-2 block">
                                    نوع السياسة <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="policy-type"
                                    type="text"
                                    required
                                    className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                                    value={editingPolicy?.type || 'custom'}
                                    onChange={e => setEditingPolicy({ ...editingPolicy, type: e.target.value as any })}
                                    placeholder="privacy, returns, warranty, terms, shipping, custom"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    الأنواع المتاحة: privacy, returns, warranty, terms, shipping, custom
                                </p>
                            </div>

                            {/* Icon */}
                            <div>
                                <label htmlFor="policy-icon" className="text-xs font-black text-amber-500 uppercase mb-2 block">
                                    الأيقونة (Emoji)
                                </label>
                                <input
                                    id="policy-icon"
                                    type="text"
                                    className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold text-2xl"
                                    value={editingPolicy?.icon || '📄'}
                                    onChange={e => setEditingPolicy({ ...editingPolicy, icon: e.target.value })}
                                    placeholder="📄"
                                />
                            </div>

                            {/* Title */}
                            <div>
                                <label htmlFor="policy-title" className="text-xs font-black text-amber-500 uppercase mb-2 block">
                                    عنوان السياسة <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="policy-title"
                                    required
                                    className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                                    value={editingPolicy?.title || ''}
                                    onChange={e => setEditingPolicy({ ...editingPolicy, title: e.target.value })}
                                    placeholder="مثلاً: سياسة الخصوصية"
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label htmlFor="policy-content" className="text-xs font-black text-amber-500 uppercase mb-2 block">
                                    محتوى السياسة <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="policy-content"
                                    required
                                    rows={12}
                                    className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white leading-relaxed resize-none"
                                    value={editingPolicy?.content || ''}
                                    onChange={e => setEditingPolicy({ ...editingPolicy, content: e.target.value })}
                                    placeholder="اكتب محتوى السياسة بالتفصيل..."
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    عدد الأحرف: {editingPolicy?.content?.length || 0}
                                </p>
                            </div>

                            {/* Active Toggle */}
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingPolicy?.isActive !== false}
                                        onChange={e => setEditingPolicy({ ...editingPolicy, isActive: e.target.checked })}
                                        className="w-5 h-5 rounded border-white/20 bg-transparent text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-white font-bold">تفعيل السياسة على الموقع</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-6 mt-12">
                            <button
                                type="submit"
                                className="flex-1 bg-amber-500 text-gray-900 font-black py-5 rounded-[1.5rem] hover:bg-amber-400 shadow-2xl text-lg"
                            >
                                حفظ السياسة
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
                title={helpContent.policies.title}
                sections={helpContent.policies.sections}
            />
        </div>
    );
};

export default PoliciesManagementPage;

