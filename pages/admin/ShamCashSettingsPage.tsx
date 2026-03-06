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
            alert(error instanceof Error ? error.message : 'ØªØ¹Ø°Ø± Ø±ÙØ¹ ØµÙˆØ±Ø© Ø§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯');
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
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
                        Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…
                    </button>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-black mb-2">Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø´Ø§Ù… ÙƒØ§Ø´</h1>
                            <p className="text-gray-400">Ø¥Ø¯Ø§Ø±Ø© Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø¯ÙØ¹ Ø¹Ø¨Ø± Ø´Ø§Ù… ÙƒØ§Ø´</p>
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
                <div className="glass-medium border border-white/10 rounded-2xl p-8 space-y-8">
                    {/* Active Status Toggle */}
                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-xl">
                        <div>
                            <h3 className="text-lg font-bold mb-1">ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¯ÙØ¹ Ø¹Ø¨Ø± Ø´Ø§Ù… ÙƒØ§Ø´</h3>
                            <p className="text-sm text-gray-400">ØªÙ…ÙƒÙŠÙ† Ø£Ùˆ ØªØ¹Ø·ÙŠÙ„ Ù†Ø¸Ø§Ù… Ø§Ù„Ø¯ÙØ¹ ÙÙŠ Ø§Ù„Ù…ÙˆÙ‚Ø¹</p>
                        </div>
                        <button
                            onClick={handleToggleActive}
                            aria-label={config.isActive ? 'ØªØ¹Ø·ÙŠÙ„ Ø§Ù„Ø¯ÙØ¹ Ø¹Ø¨Ø± Ø´Ø§Ù… ÙƒØ§Ø´' : 'ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¯ÙØ¹ Ø¹Ø¨Ø± Ø´Ø§Ù… ÙƒØ§Ø´'}
                            className={`relative w-16 h-8 rounded-full transition-colors ${config.isActive ? 'bg-amber-500' : 'bg-gray-600'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${config.isActive ? 'right-1' : 'right-9'}`}></div>
                        </button>
                    </div>

                    {/* Barcode Image Upload */}
                    <div>
                        <label htmlFor="barcode-upload" className="block text-lg font-bold mb-4">ØµÙˆØ±Ø© Ø§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯</label>
                        <p className="text-sm text-gray-400 mb-4">Ù‚Ù… Ø¨Ø±ÙØ¹ ØµÙˆØ±Ø© Ø§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯ Ø§Ù„Ø®Ø§Øµ Ø¨Ø­Ø³Ø§Ø¨ Ø´Ø§Ù… ÙƒØ§Ø´</p>
                        
                        <input
                            id="barcode-upload"
                            type="file"
                            accept={IMAGE_FILE_ACCEPT}
                            onChange={handleBarcodeUpload}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all file:bg-amber-500 file:text-gray-900 file:font-bold file:border-0 file:rounded-lg file:px-4 file:py-2 file:ml-4 file:cursor-pointer mb-4"
                        />
                        
                        {config.barcodeImageUrl && (
                            <div className="mt-4 p-6 bg-white/5 border border-amber-500/50 rounded-xl text-center">
                                <p className="text-sm text-gray-400 mb-4">Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯:</p>
                                <img
                                    src={config.barcodeImageUrl}
                                    alt="Barcode Preview"
                                    className="mx-auto w-64 h-64 object-contain bg-white rounded-lg border-2 border-amber-500 shadow-lg p-4"
                                />
                            </div>
                        )}
                    </div>

                    {/* Account Code Input */}
                    <div>
                        <label htmlFor="account-code" className="block text-lg font-bold mb-4">ÙƒÙˆØ¯ Ø§Ù„Ø­Ø³Ø§Ø¨</label>
                        <p className="text-sm text-gray-400 mb-4">Ø£Ø¯Ø®Ù„ ÙƒÙˆØ¯ Ø­Ø³Ø§Ø¨ Ø´Ø§Ù… ÙƒØ§Ø´</p>
                        
                        <input
                            id="account-code"
                            type="text"
                            value={config.accountCode}
                            onChange={handleAccountCodeChange}
                            placeholder="000000000000"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white font-poppins text-xl text-center focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        />
                        
                        {config.accountCode && (
                            <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                                <p className="text-sm text-gray-400 mb-2">Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ø­Ø§Ù„ÙŠ:</p>
                                <p className="text-2xl font-black font-poppins text-amber-500">{config.accountCode}</p>
                            </div>
                        )}
                    </div>

                    {/* Account Holder Name Input */}
                    <div>
                        <label htmlFor="account-holder" className="block text-lg font-bold mb-4">Ø§Ø³Ù… ØµØ§Ø­Ø¨ Ø§Ù„Ø­Ø³Ø§Ø¨</label>
                        <p className="text-sm text-gray-400 mb-4">Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„ Ø§Ù„Ù…Ø±ØªØ¨Ø· Ø¨Ø­Ø³Ø§Ø¨ Ø´Ø§Ù… ÙƒØ§Ø´</p>
                        <input
                            id="account-holder"
                            type="text"
                            value={config.accountHolderName}
                            onChange={(e) => setConfig(prev => ({ ...prev, accountHolderName: e.target.value }))}
                            placeholder="Ù…Ø­Ù…Ø¯ Ø£Ø­Ù…Ø¯..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        />
                    </div>

                    {/* Phone Number Input */}
                    <div>
                        <label htmlFor="phone-number" className="block text-lg font-bold mb-4">Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø§Ù„Ù…Ø±ØªØ¨Ø· Ø¨Ø§Ù„Ø­Ø³Ø§Ø¨</label>
                        <p className="text-sm text-gray-400 mb-4">Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø§Ù„Ù…Ø³Ø¬Ù„ ÙÙŠ Ø´Ø§Ù… ÙƒØ§Ø´</p>
                        <input
                            id="phone-number"
                            type="tel"
                            value={config.phoneNumber}
                            onChange={(e) => setConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            placeholder="+963 XXX XXX XXX"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white font-poppins text-xl text-center focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        />
                    </div>

                    {/* Payment Instructions Textarea */}
                    <div>
                        <label htmlFor="payment-instructions" className="block text-lg font-bold mb-4">ØªØ¹Ù„ÙŠÙ…Ø§Øª Ø§Ù„Ø¯ÙØ¹ Ù„Ù„Ø¹Ù…Ù„Ø§Ø¡</label>
                        <p className="text-sm text-gray-400 mb-4">Ø¥Ø±Ø´Ø§Ø¯Ø§Øª ØªØ¸Ù‡Ø± Ù„Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø¹Ù†Ø¯ Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø·Ù„Ø¨</p>
                        <textarea
                            id="payment-instructions"
                            rows={6}
                            value={config.paymentInstructions}
                            onChange={(e) => setConfig(prev => ({ ...prev, paymentInstructions: e.target.value }))}
                            placeholder="Ø£Ø¯Ø®Ù„ Ø§Ù„ØªØ¹Ù„ÙŠÙ…Ø§Øª Ø§Ù„ØªÙŠ Ø³ØªØ¸Ù‡Ø± Ù„Ù„Ø¹Ù…Ù„Ø§Ø¡..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                        />
                        {config.paymentInstructions && (
                            <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                                <p className="text-sm text-gray-400 mb-2">Ù…Ø¹Ø§ÙŠÙ†Ø©:</p>
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
                                    Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸...
                                </span>
                            ) : isUploadingBarcode ? (
                                'جاري رفع الباركود...'
                            ) : (
                                'Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª'
                            )}
                        </button>
                    </div>

                    {/* Instructions */}
                    <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            ØªØ¹Ù„ÙŠÙ…Ø§Øª Ù…Ù‡Ù…Ø©
                        </h4>
                        <ul className="text-sm text-gray-300 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500">â€¢</span>
                                <span>Ù‚Ù… Ø¨Ø±ÙØ¹ ØµÙˆØ±Ø© ÙˆØ§Ø¶Ø­Ø© Ù„Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯ Ø§Ù„Ø®Ø§Øµ Ø¨Ø­Ø³Ø§Ø¨ Ø´Ø§Ù… ÙƒØ§Ø´</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500">â€¢</span>
                                <span>ØªØ£ÙƒØ¯ Ù…Ù† ØµØ­Ø© ÙƒÙˆØ¯ Ø§Ù„Ø­Ø³Ø§Ø¨ Ù‚Ø¨Ù„ Ø§Ù„Ø­ÙØ¸</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500">â€¢</span>
                                <span>Ø³ÙŠØ¸Ù‡Ø± Ø§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯ ÙˆØ§Ù„ÙƒÙˆØ¯ ÙÙŠ ØµÙØ­Ø© Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø´Ø±Ø§Ø¡ Ù„Ù„Ø¹Ù…Ù„Ø§Ø¡</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500">â€¢</span>
                                <span>ÙŠÙ…ÙƒÙ† ØªØ¹Ø·ÙŠÙ„ Ø§Ù„Ù†Ø¸Ø§Ù… Ù…Ø¤Ù‚ØªØ§Ù‹ Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø²Ø± Ø§Ù„ØªÙØ¹ÙŠÙ„ ÙÙŠ Ø§Ù„Ø£Ø¹Ù„Ù‰</span>
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


