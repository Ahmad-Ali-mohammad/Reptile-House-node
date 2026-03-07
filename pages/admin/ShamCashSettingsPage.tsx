import React, { useState, useEffect } from 'react';
import { ShamCashConfig } from '../../types';
import { api } from '../../services/api';
import { IMAGE_FILE_ACCEPT, mediaService } from '../../services/media';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { helpContent } from '../../constants/helpContent';

interface Props {
    setPage: (page: string) => void;
}

const ShamCashSettingsPage: React.FC<Props> = ({ setPage }) => {
    const [config, setConfig] = useState<ShamCashConfig>({
        barcodeImageUrl: '',
        accountCode: '',
        isActive: true,
        accountHolderName: '',
        phoneNumber: '',
        paymentInstructions: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingBarcode, setIsUploadingBarcode] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    useEffect(() => {
        api.getShamCashConfig().then(setConfig).catch(() => {});
    }, []);

    const handleBarcodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            mediaService.validateImageFile(file);
            setIsUploadingBarcode(true);
            const barcodeImageUrl = await mediaService.uploadProjectImage(file, 'shamcash');
            setConfig(prev => ({ ...prev, barcodeImageUrl }));
        } catch (error) {
            alert(error instanceof Error ? error.message : 'تعذر رفع صورة الباركود');
        } finally {
            setIsUploadingBarcode(false);
            e.target.value = '';
        }
    };

    const handleAccountCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfig(prev => ({ ...prev, accountCode: e.target.value }));
    };

    const handleToggleActive = () => {
        setConfig(prev => ({ ...prev, isActive: !prev.isActive }));
    };

    const handleSave = async () => {
        if (isUploadingBarcode) {
            alert('انتظر حتى يكتمل رفع صورة الباركود أولاً');
            return;
        }

        setIsSaving(true);
        setSuccessMessage('');

        try {
            const savedConfig = await api.saveShamCashConfig(config);
            setConfig(savedConfig);
            setSuccessMessage('تم حفظ الإعدادات بنجاح!');
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch {
            alert('تعذر حفظ إعدادات شام كاش. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 text-white sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => setPage('admin')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        العودة إلى لوحة التحكم
                    </button>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-black mb-2">إعدادات شام كاش</h1>
                            <p className="text-gray-400">إدارة إعدادات الدفع عبر شام كاش</p>
                        </div>
                        <HelpButton onClick={() => setIsHelpOpen(true)} />
                    </div>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 bg-green-500/20 border border-green-500 text-green-400 px-6 py-4 rounded-xl flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {successMessage}
                    </div>
                )}

                {/* Settings Form */}
                <div className="glass-medium border border-white/10 rounded-2xl p-5 space-y-6 sm:p-8 sm:space-y-8">
                    {/* Active Status Toggle */}
                    <div className="flex flex-col gap-4 rounded-xl bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div>
                            <h3 className="text-lg font-bold mb-1">تفعيل الدفع عبر شام كاش</h3>
                            <p className="text-sm text-gray-400">تمكين أو تعطيل نظام الدفع في الموقع</p>
                        </div>
                        <button
                            onClick={handleToggleActive}
                            aria-label={config.isActive ? 'تعطيل الدفع عبر شام كاش' : 'تفعيل الدفع عبر شام كاش'}
                            className={`relative w-16 h-8 rounded-full transition-colors ${config.isActive ? 'bg-amber-500' : 'bg-gray-600'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${config.isActive ? 'right-1' : 'right-9'}`}></div>
                        </button>
                    </div>

                    {/* Barcode Image Upload */}
                    <div>
                        <label htmlFor="barcode-upload" className="block text-lg font-bold mb-4">صورة الباركود</label>
                        <p className="text-sm text-gray-400 mb-4">قم برفع صورة الباركود الخاص بحساب شام كاش</p>
                        
                        <input
                            id="barcode-upload"
                            type="file"
                            accept={IMAGE_FILE_ACCEPT}
                            onChange={handleBarcodeUpload}
                            className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-white transition-all file:ml-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:font-bold file:text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        
                        {config.barcodeImageUrl && (
                            <div className="mt-4 p-6 bg-white/5 border border-amber-500/50 rounded-xl text-center">
                                <p className="text-sm text-gray-400 mb-4">معاينة الباركود:</p>
                                <img
                                    src={config.barcodeImageUrl}
                                    alt="Barcode Preview"
                                    className="mx-auto h-48 w-full max-w-xs rounded-lg border-2 border-amber-500 bg-white p-4 object-contain shadow-lg sm:h-64"
                                />
                            </div>
                        )}
                    </div>

                    {/* Account Code Input */}
                    <div>
                        <label htmlFor="account-code" className="block text-lg font-bold mb-4">كود الحساب</label>
                        <p className="text-sm text-gray-400 mb-4">أدخل كود حساب شام كاش</p>
                        
                        <input
                            id="account-code"
                            type="text"
                            value={config.accountCode}
                            onChange={handleAccountCodeChange}
                            placeholder="000000000000"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center text-lg text-white transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 sm:text-xl"
                        />
                        
                        {config.accountCode && (
                            <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                                <p className="text-sm text-gray-400 mb-2">الكود الحالي:</p>
                                <p className="text-2xl font-black font-poppins text-amber-500">{config.accountCode}</p>
                            </div>
                        )}
                    </div>

                    {/* Account Holder Name Input */}
                    <div>
                        <label htmlFor="account-holder" className="block text-lg font-bold mb-4">اسم صاحب الحساب</label>
                        <p className="text-sm text-gray-400 mb-4">الاسم الكامل المرتبط بحساب شام كاش</p>
                        <input
                            id="account-holder"
                            type="text"
                            value={config.accountHolderName}
                            onChange={(e) => setConfig(prev => ({ ...prev, accountHolderName: e.target.value }))}
                            placeholder="محمد أحمد..."
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    {/* Phone Number Input */}
                    <div>
                        <label htmlFor="phone-number" className="block text-lg font-bold mb-4">رقم الهاتف المرتبط بالحساب</label>
                        <p className="text-sm text-gray-400 mb-4">رقم الهاتف المسجل في شام كاش</p>
                        <input
                            id="phone-number"
                            type="tel"
                            value={config.phoneNumber}
                            onChange={(e) => setConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            placeholder="+963 XXX XXX XXX"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center text-lg text-white transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 sm:text-xl"
                        />
                    </div>

                    {/* Payment Instructions Textarea */}
                    <div>
                        <label htmlFor="payment-instructions" className="block text-lg font-bold mb-4">تعليمات الدفع للعملاء</label>
                        <p className="text-sm text-gray-400 mb-4">إرشادات تظهر للعملاء عند إتمام الطلب</p>
                        <textarea
                            id="payment-instructions"
                            rows={6}
                            value={config.paymentInstructions}
                            onChange={(e) => setConfig(prev => ({ ...prev, paymentInstructions: e.target.value }))}
                            placeholder="أدخل التعليمات التي ستظهر للعملاء..."
                            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-5 py-4 leading-relaxed text-white transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        {config.paymentInstructions && (
                            <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                                <p className="text-sm text-gray-400 mb-2">معاينة:</p>
                                <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{config.paymentInstructions}</p>
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <div className="pt-6 border-t border-white/10">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isUploadingBarcode || !config.accountCode || !config.barcodeImageUrl || !config.accountHolderName || !config.phoneNumber}
                            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                                isSaving || isUploadingBarcode || !config.accountCode || !config.barcodeImageUrl || !config.accountHolderName || !config.phoneNumber
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-amber-500 text-gray-900 hover:bg-amber-400 shadow-lg hover:shadow-xl'
                            }`}
                        >
                            {isSaving ? (
                                <span className="flex items-center justify-center gap-3">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    جاري الحفظ...
                                </span>
                            ) : isUploadingBarcode ? (
                                'جاري رفع الباركود...'
                            ) : (
                                'حفظ الإعدادات'
                            )}
                        </button>
                    </div>

                    {/* Instructions */}
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 sm:p-6">
                        <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            تعليمات مهمة
                        </h4>
                        <ul className="text-sm text-gray-300 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500">•</span>
                                <span>قم برفع صورة واضحة للباركود الخاص بحساب شام كاش</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500">•</span>
                                <span>تأكد من صحة كود الحساب قبل الحفظ</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500">•</span>
                                <span>سيظهر الباركود والكود في صفحة إتمام الشراء للعملاء</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500">•</span>
                                <span>يمكن تعطيل النظام مؤقتاً باستخدام زر التفعيل في الأعلى</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Help Modal */}
                <HelpModal
                    isOpen={isHelpOpen}
                    onClose={() => setIsHelpOpen(false)}
                    title={helpContent.shamcash_settings.title}
                    sections={helpContent.shamcash_settings.sections}
                />
            </div>
        </div>
    );
};

export default ShamCashSettingsPage;

