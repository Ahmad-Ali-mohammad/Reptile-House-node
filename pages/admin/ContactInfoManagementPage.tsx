
import React, { useState, useEffect } from 'react';
import { ContactInfo } from '../../types';
import { api } from '../../services/api';
import { EditIcon, CheckCircleIcon } from '../../components/icons';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { helpContent } from '../../constants/helpContent';

const emptyContactInfo: ContactInfo = {
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    workingHours: '',
    socialMedia: {}
};

const normalizeSocialMedia = (value: unknown): ContactInfo['socialMedia'] => {
    if (!value) {
        return {};
    }

    let source = value;
    if (typeof value === 'string') {
        try {
            source = JSON.parse(value);
        } catch {
            return {};
        }
    }

    if (!source || typeof source !== 'object') {
        return {};
    }

    const socialMedia = source as Record<string, unknown>;
    return {
        facebook: typeof socialMedia.facebook === 'string' ? socialMedia.facebook : '',
        instagram: typeof socialMedia.instagram === 'string' ? socialMedia.instagram : '',
        whatsapp: typeof socialMedia.whatsapp === 'string' ? socialMedia.whatsapp : '',
        telegram: typeof socialMedia.telegram === 'string' ? socialMedia.telegram : ''
    };
};

const normalizeContactInfo = (value?: Partial<ContactInfo> | null): ContactInfo => ({
    phone: typeof value?.phone === 'string' ? value.phone : '',
    email: typeof value?.email === 'string' ? value.email : '',
    address: typeof value?.address === 'string' ? value.address : '',
    city: typeof value?.city === 'string' ? value.city : '',
    country: typeof value?.country === 'string' ? value.country : '',
    workingHours: typeof value?.workingHours === 'string' ? value.workingHours : '',
    socialMedia: normalizeSocialMedia(value?.socialMedia)
});

const ContactInfoManagementPage: React.FC = () => {
    const [contactInfo, setContactInfo] = useState<ContactInfo>(emptyContactInfo);
    const [isEditing, setIsEditing] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [editedInfo, setEditedInfo] = useState<ContactInfo>(emptyContactInfo);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        api.getContactInfo().then((info) => {
            const normalizedInfo = normalizeContactInfo(info);
            setContactInfo(normalizedInfo);
            setEditedInfo(normalizedInfo);
        }).catch(() => {});
    }, []);

    const handleSave = async () => {
        if (!editedInfo.phone || !editedInfo.email) {
            alert('يرجى ملء الحقول المطلوبة (الهاتف والبريد الإلكتروني)');
            return;
        }

        setIsSaving(true);
        try {
            const payload = normalizeContactInfo(editedInfo);
            const savedInfo = normalizeContactInfo(await api.saveContactInfo(payload));
            setContactInfo(savedInfo);
            setEditedInfo(savedInfo);
            setIsEditing(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'تعذر حفظ معلومات التواصل. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditedInfo(contactInfo);
        setIsEditing(false);
    };

    if (!isEditing) {
        return (
            <div className="animate-fade-in relative space-y-8 text-right">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black mb-2">معلومات التواصل</h1>
                        <p className="text-gray-400">إدارة معلومات الاتصال ووسائل التواصل الاجتماعي</p>
                    </div>
                    <div className="flex gap-3">
                        <HelpButton onClick={() => setIsHelpOpen(true)} />
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-3 bg-amber-500 text-gray-900 font-black py-3.5 px-8 rounded-2xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                        >
                            <EditIcon className="w-5 h-5" />
                            <span>تعديل المعلومات</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-dark border border-white/10 rounded-[2rem] p-8">
                        <h3 className="text-xl font-black mb-6 text-amber-400">معلومات الاتصال</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">رقم الهاتف</p>
                                <p className="text-white font-bold text-lg font-poppins" dir="ltr">{contactInfo.phone}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm mb-1">البريد الإلكتروني</p>
                                <p className="text-white font-bold text-lg">{contactInfo.email}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm mb-1">ساعات العمل</p>
                                <p className="text-white font-bold">{contactInfo.workingHours}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-dark border border-white/10 rounded-[2rem] p-8">
                        <h3 className="text-xl font-black mb-6 text-amber-400">الموقع</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">العنوان</p>
                                <p className="text-white font-bold">{contactInfo.address}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm mb-1">المدينة</p>
                                <p className="text-white font-bold">{contactInfo.city}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm mb-1">الدولة</p>
                                <p className="text-white font-bold">{contactInfo.country}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-dark border border-white/10 rounded-[2rem] p-8">
                    <h3 className="text-xl font-black mb-6 text-amber-400">وسائل التواصل الاجتماعي</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contactInfo.socialMedia?.facebook && (
                            <div>
                                <p className="text-gray-500 text-sm mb-1">فيسبوك</p>
                                <a href={contactInfo.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                                    {contactInfo.socialMedia.facebook}
                                </a>
                            </div>
                        )}
                        {contactInfo.socialMedia?.instagram && (
                            <div>
                                <p className="text-gray-500 text-sm mb-1">إنستغرام</p>
                                <a href={contactInfo.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline break-all">
                                    {contactInfo.socialMedia.instagram}
                                </a>
                            </div>
                        )}
                        {contactInfo.socialMedia?.whatsapp && (
                            <div>
                                <p className="text-gray-500 text-sm mb-1">واتساب</p>
                                <p className="text-green-400 font-poppins" dir="ltr">{contactInfo.socialMedia.whatsapp}</p>
                            </div>
                        )}
                        {contactInfo.socialMedia?.telegram && (
                            <div>
                                <p className="text-gray-500 text-sm mb-1">تيليجرام</p>
                                <a href={contactInfo.socialMedia.telegram} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline break-all">
                                    {contactInfo.socialMedia.telegram}
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Help Modal */}
                <HelpModal
                    isOpen={isHelpOpen}
                    onClose={() => setIsHelpOpen(false)}
                    title={helpContent.contact_info.title}
                    sections={helpContent.contact_info.sections}
                />
            </div>
        );
    }

    return (
        <div className="animate-fade-in relative space-y-8 text-right">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black mb-2">تعديل معلومات التواصل</h1>
                    <p className="text-gray-400">قم بتحديث معلومات الاتصال وحفظ التغييرات</p>
                </div>
                <HelpButton onClick={() => setIsHelpOpen(true)} />
            </div>

            {showSuccess && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl animate-fade-in z-50">
                    <div className="flex items-center gap-3">
                        <CheckCircleIcon className="w-6 h-6" />
                        <p className="font-bold">تم حفظ المعلومات بنجاح!</p>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {/* Contact Info */}
                <div className="glass-dark border border-white/10 rounded-[2rem] p-8">
                    <h3 className="text-xl font-black mb-6 text-amber-400">معلومات الاتصال</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase mb-2 block">
                                رقم الهاتف <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold font-poppins"
                                value={editedInfo.phone}
                                onChange={e => setEditedInfo({ ...editedInfo, phone: e.target.value })}
                                placeholder="+963 XXX XXX XXX"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase mb-2 block">
                                البريد الإلكتروني <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                                value={editedInfo.email}
                                onChange={e => setEditedInfo({ ...editedInfo, email: e.target.value })}
                                placeholder="info@example.com"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-black text-gray-400 uppercase mb-2 block">
                                ساعات العمل
                            </label>
                            <input
                                type="text"
                                className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                                value={editedInfo.workingHours}
                                onChange={e => setEditedInfo({ ...editedInfo, workingHours: e.target.value })}
                                placeholder="السبت - الخميس: 9:00 صباحاً - 8:00 مساءً"
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="glass-dark border border-white/10 rounded-[2rem] p-8">
                    <h3 className="text-xl font-black mb-6 text-amber-400">الموقع</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-xs font-black text-gray-400 uppercase mb-2 block">
                                العنوان
                            </label>
                            <input
                                type="text"
                                className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                                value={editedInfo.address}
                                onChange={e => setEditedInfo({ ...editedInfo, address: e.target.value })}
                                placeholder="دمشق، سوريا"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase mb-2 block">
                                المدينة
                            </label>
                            <input
                                type="text"
                                className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                                value={editedInfo.city}
                                onChange={e => setEditedInfo({ ...editedInfo, city: e.target.value })}
                                placeholder="دمشق"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase mb-2 block">
                                الدولة
                            </label>
                            <input
                                type="text"
                                className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                                value={editedInfo.country}
                                onChange={e => setEditedInfo({ ...editedInfo, country: e.target.value })}
                                placeholder="سوريا"
                            />
                        </div>
                    </div>
                </div>

                {/* Social Media */}
                <div className="glass-dark border border-white/10 rounded-[2rem] p-8">
                    <h3 className="text-xl font-black mb-6 text-amber-400">وسائل التواصل الاجتماعي</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase mb-2 block">
                                فيسبوك (URL)
                            </label>
                            <input
                                type="url"
                                className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                                value={editedInfo.socialMedia?.facebook || ''}
                                onChange={e => setEditedInfo({
                                    ...editedInfo,
                                    socialMedia: { ...editedInfo.socialMedia, facebook: e.target.value }
                                })}
                                placeholder="https://facebook.com/..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase mb-2 block">
                                إنستغرام (URL)
                            </label>
                            <input
                                type="url"
                                className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                                value={editedInfo.socialMedia?.instagram || ''}
                                onChange={e => setEditedInfo({
                                    ...editedInfo,
                                    socialMedia: { ...editedInfo.socialMedia, instagram: e.target.value }
                                })}
                                placeholder="https://instagram.com/..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase mb-2 block">
                                واتساب (رقم الهاتف مع رمز الدولة)
                            </label>
                            <input
                                type="tel"
                                className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold font-poppins"
                                value={editedInfo.socialMedia?.whatsapp || ''}
                                onChange={e => setEditedInfo({
                                    ...editedInfo,
                                    socialMedia: { ...editedInfo.socialMedia, whatsapp: e.target.value }
                                })}
                                placeholder="963993595766"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase mb-2 block">
                                تيليجرام (URL)
                            </label>
                            <input
                                type="url"
                                className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold"
                                value={editedInfo.socialMedia?.telegram || ''}
                                onChange={e => setEditedInfo({
                                    ...editedInfo,
                                    socialMedia: { ...editedInfo.socialMedia, telegram: e.target.value }
                                })}
                                placeholder="https://t.me/..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-6 sticky bottom-6 bg-gradient-to-t from-[#0a0c10] pt-8 pb-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-amber-500 text-gray-900 font-black py-5 rounded-[1.5rem] hover:bg-amber-400 shadow-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
                <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-10 bg-white/5 text-gray-400 font-black rounded-[1.5rem] border border-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    إلغاء
                </button>
            </div>

            {/* Help Modal */}
            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={helpContent.contact_info.title}
                sections={helpContent.contact_info.sections}
            />
        </div>
    );
};

export default ContactInfoManagementPage;

