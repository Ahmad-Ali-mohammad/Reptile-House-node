
import React, { useState, useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { Page } from '../App';
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../contexts/DatabaseContext';
import { Order, ShamCashConfig } from '../types';
import { api } from '../services/api';
import { IMAGE_FILE_ACCEPT, mediaService } from '../services/media';

interface CheckoutPageProps {
    setPage: (page: Page) => void;
    setLastOrderId: (id: string) => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ setPage, setLastOrderId }) => {
    const { cart, getCartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const { createOrder } = useDatabase();
    const total = getCartTotal();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentImage, setPaymentImage] = useState<string>('');
    const [isUploadingPaymentImage, setIsUploadingPaymentImage] = useState(false);
    const [shamCashConfig, setShamCashConfig] = useState<ShamCashConfig | null>(null);

    useEffect(() => {
        api.getShamCashConfig().then(setShamCashConfig).catch(() => setShamCashConfig(null));
    }, []);

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!paymentImage) {
            alert('يرجى رفع صورة تأكيد الدفع');
            return;
        }

        if (isUploadingPaymentImage) {
            alert('انتظر حتى يكتمل رفع صورة الدفع أولاً');
            return;
        }
        
        setIsProcessing(true);

        try {
            const newOrderId = `RH-${Math.floor(1000 + Math.random() * 9000)}`;
            const order: Order = {
                id: newOrderId,
                date: new Date().toISOString().split('T')[0],
                status: 'تم التأكيد',
                total: total,
                items: cart.map(item => ({
                    reptileId: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    imageUrl: item.imageUrl
                })),
                paymentConfirmationImage: paymentImage,
                paymentMethod: 'shamcash',
                paymentVerificationStatus: 'قيد المراجعة'
            };

            const savedOrder = await createOrder(order);
            if (!savedOrder) {
                alert('تعذر إرسال الطلب. يرجى المحاولة مرة أخرى.');
                return;
            }

            setLastOrderId(savedOrder.id || newOrderId);
            clearCart();
            setPage('orderConfirmation');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            mediaService.validateImageFile(file);
            setIsUploadingPaymentImage(true);
            const imageUrl = await mediaService.uploadProjectImage(file, 'payment-proofs');
            setPaymentImage(imageUrl);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'تعذر رفع صورة الدفع');
        } finally {
            setIsUploadingPaymentImage(false);
            e.target.value = '';
        }
    };

    if (cart.length === 0) {
        return (
            <div className="text-center py-20 animate-fade-in">
                <h2 className="text-3xl font-black mb-4">Ø³Ù„ØªÙƒ ÙØ§Ø±ØºØ©</h2>
                <button onClick={() => setPage('showcase')} className="text-amber-500 font-bold hover:underline">Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„ØªØ³ÙˆÙ‚</button>
            </div>
        );
    }
    
    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-black text-center mb-12">Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø·Ù„Ø¨</h1>
            <form onSubmit={handlePlaceOrder} className="flex flex-col lg:flex-row-reverse gap-8">
                {/* Order Summary */}
                <div className="lg:w-1/3">
                    <div className="glass-dark border border-white/10 rounded-[2rem] p-8 sticky top-24 space-y-6 shadow-2xl">
                        <h2 className="text-2xl font-black">Ù…Ù„Ø®Øµ Ø·Ù„Ø¨Ùƒ</h2>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                             {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform"/>
                                            <span className="absolute -top-2 -right-2 bg-amber-500 text-gray-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">x{item.quantity}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm leading-tight">{item.name}</p>
                                            <p className="text-[10px] text-gray-500 font-poppins">${item.price}</p>
                                        </div>
                                    </div>
                                    <span className="font-poppins font-black text-amber-500">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                             ))}
                        </div>
                        <div className="border-t border-white/10 pt-4">
                            <div className="flex justify-between text-2xl font-black">
                                <span>Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ</span>
                                <span className="text-amber-500 font-poppins">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shipping & Payment Info */}
                <div className="lg:w-2/3 glass-medium border border-white/10 rounded-[2rem] p-8 md:p-12 space-y-10 shadow-xl">
                    <section>
                        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-amber-500 text-gray-900 flex items-center justify-center text-sm">1</span>
                            Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø´Ø­Ù†
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <input type="text" placeholder="Ø§Ù„Ø§Ø³Ù… Ø§Ù„Ø£ÙˆÙ„" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" />
                             <input type="text" placeholder="Ø§Ù„Ø§Ø³Ù… Ø§Ù„Ø£Ø®ÙŠØ±" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" />
                            <input type="tel" placeholder="Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ" required className="md:col-span-2 w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-poppins" dir="ltr" />
                            <input type="text" placeholder="Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø¨Ø§Ù„ØªÙØµÙŠÙ„ (Ø´Ø§Ø±Ø¹ØŒ Ø¨Ù†Ø§ÙŠØ©ØŒ Ø·Ø§Ø¨Ù‚)" required className="md:col-span-2 w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" />
                        </div>
                    </section>

                     <section>
                        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-amber-500 text-gray-900 flex items-center justify-center text-sm">2</span>
                            Ø§Ù„Ø¯ÙØ¹ Ø¹Ø¨Ø± Ø´Ø§Ù… ÙƒØ§Ø´
                        </h2>
                        <div className="space-y-6">
                            {/* Barcode display */}
                            {shamCashConfig && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                                    <img 
                                        src={shamCashConfig.barcodeImageUrl} 
                                        alt="ShamCash Barcode" 
                                        className="mx-auto w-48 h-48 object-contain bg-white rounded-lg p-2"
                                    />
                                    <p className="text-amber-500 font-bold mt-4 text-lg">Ø§Ù…Ø³Ø­ Ø§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯ Ù„Ù„Ø¯ÙØ¹</p>
                                </div>
                            )}
                            
                            {/* Account code display */}
                            {shamCashConfig && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                                    <p className="text-gray-400 text-sm mb-2">Ø£Ùˆ Ø£Ø¯Ø®Ù„ Ø§Ù„ÙƒÙˆØ¯ ÙŠØ¯ÙˆÙŠØ§Ù‹</p>
                                    <p className="text-2xl font-black font-poppins text-amber-500">{shamCashConfig.accountCode}</p>
                                </div>
                            )}

                            {/* Account holder name */}
                            {shamCashConfig?.accountHolderName && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                    <p className="text-gray-400 text-sm mb-2">Ø§Ù„Ø­Ø³Ø§Ø¨ Ø¨Ø§Ø³Ù…:</p>
                                    <p className="text-xl font-black text-white">{shamCashConfig.accountHolderName}</p>
                                </div>
                            )}

                            {/* Phone number */}
                            {shamCashConfig?.phoneNumber && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                    <p className="text-gray-400 text-sm mb-2">Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ:</p>
                                    <p className="text-xl font-black font-poppins text-white" dir="ltr">{shamCashConfig.phoneNumber}</p>
                                </div>
                            )}

                            {/* Payment instructions */}
                            {shamCashConfig?.paymentInstructions && (
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                                    <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        ØªØ¹Ù„ÙŠÙ…Ø§Øª Ø§Ù„Ø¯ÙØ¹
                                    </h4>
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{shamCashConfig.paymentInstructions}</p>
                                </div>
                            )}

                            {/* Payment confirmation upload */}
                            <div>
                                <label className="block text-sm font-bold mb-3">Ù‚Ù… Ø¨Ø±ÙØ¹ ØµÙˆØ±Ø© ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¯ÙØ¹</label>
                                <input 
                                    type="file" 
                                    accept={IMAGE_FILE_ACCEPT} 
                                    required 
                                    onChange={handleImageUpload}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all file:bg-amber-500 file:text-gray-900 file:font-bold file:border-0 file:rounded-lg file:px-4 file:py-2 file:ml-4 file:cursor-pointer"
                                />
                                {isUploadingPaymentImage ? (
                                    <p className="mt-3 text-sm font-bold text-amber-400">جاري رفع صورة الدفع...</p>
                                ) : null}
                                {paymentImage && (
                                    <div className="mt-4 p-4 bg-white/5 border border-amber-500/50 rounded-xl">
                                        <p className="text-sm text-gray-400 mb-3">Ù…Ø¹Ø§ÙŠÙ†Ø© ØµÙˆØ±Ø© Ø§Ù„Ø¯ÙØ¹:</p>
                                        <img 
                                            src={paymentImage} 
                                            alt="Payment Preview" 
                                            className="w-full max-w-xs mx-auto rounded-lg object-cover border-2 border-amber-500 shadow-lg"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <button 
                        type="submit"
                        disabled={isProcessing || isUploadingPaymentImage}
                        className={`w-full font-black py-5 px-6 rounded-2xl transition-all shadow-2xl relative overflow-hidden group ${(isProcessing || isUploadingPaymentImage) ? 'bg-gray-700 cursor-not-allowed' : 'bg-amber-500 text-gray-900 hover:bg-amber-400'}`}
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center gap-3">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Ø¬Ø§Ø±ÙŠ Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø·Ù„Ø¨...
                            </span>
                        ) : (
                            <>
                                <span className="relative z-10 text-xl">ØªØ£ÙƒÙŠØ¯ ÙˆØ¯ÙØ¹ ${total.toFixed(2)}</span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            </>
                        )}
                    </button>
                    <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø§Øª Ù…Ø´ÙØ±Ø© ÙˆØ¢Ù…Ù†Ø© ØªÙ…Ø§Ù…Ø§Ù‹</p>
                </div>
            </form>
        </div>
    );
};

export default CheckoutPage;


