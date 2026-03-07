import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { Page } from '../App';
import { ShoppingCartIcon, TrashIcon, PlusIcon, MinusIcon, ChevronLeftIcon } from './icons';

interface QuickCartProps {
    setPage: (page: Page) => void;
    currentPage?: string;
}

const QuickCart: React.FC<QuickCartProps> = ({ setPage, currentPage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
    const total = getCartTotal();
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    const hideFloatingButton = currentPage === 'cart' || currentPage === 'checkout';

    const handleCheckout = () => {
        setIsOpen(false);
        setPage('cart');
    };

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="إغلاق السلة السريعة"
                    className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
                />
            )}

            <div
                className={`fixed top-0 right-0 z-[80] h-full w-full transform border-l border-white/20 bg-gray-900/60 shadow-2xl backdrop-blur-lg transition-transform duration-300 ease-in-out md:w-96 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-white/10 p-4">
                        <h2 className="text-xl font-bold">سلة التسوق</h2>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:text-amber-400">
                            <ChevronLeftIcon className="h-6 w-6 rotate-180" />
                        </button>
                    </div>

                    {cart.length > 0 ? (
                        <div className="flex-grow space-y-4 overflow-y-auto p-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center space-x-3 space-x-reverse">
                                    <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-md object-cover" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">{item.name}</p>
                                        <p className="font-poppins text-xs text-gray-400">${item.price.toFixed(2)}</p>
                                        <div className="mt-1 flex w-fit items-center rounded-full bg-white/10">
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-amber-400"><PlusIcon className="h-3 w-3" /></button>
                                            <span className="px-2 text-sm font-bold font-poppins">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-amber-400"><MinusIcon className="h-3 w-3" /></button>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="p-1 text-gray-500 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-grow items-center justify-center">
                            <p>سلتك فارغة.</p>
                        </div>
                    )}

                    <div className="space-y-4 border-t border-white/10 p-4">
                        <div className="flex justify-between text-lg">
                            <span className="font-bold">الإجمالي:</span>
                            <span className="font-poppins font-black text-amber-400">${total.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0}
                            className="w-full rounded-lg bg-amber-500 px-4 py-3 font-bold text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-gray-600"
                        >
                            إتمام الطلب
                        </button>
                    </div>
                </div>
            </div>

            {!hideFloatingButton && (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    aria-label="فتح السلة السريعة"
                    className="fixed bottom-[5.4rem] right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-gray-900 shadow-lg transition-transform hover:scale-110 sm:right-6 sm:h-16 sm:w-16 md:bottom-6"
                >
                    <ShoppingCartIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                    {totalItems > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white ring-2 ring-amber-500">{totalItems}</span>
                    )}
                </button>
            )}
        </>
    );
};

export default QuickCart;
