import React from 'react';
import { useCart } from '../hooks/useCart';
import { Page } from '../App';
import { TrashIcon, PlusIcon, MinusIcon } from '../components/icons';

interface CartPageProps {
    setPage: (page: Page) => void;
}

const CartPage: React.FC<CartPageProps> = ({ setPage }) => {
    const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
    const total = getCartTotal();

    return (
        <div className="mx-auto max-w-6xl pb-20 md:pb-0">
            <h1 className="mb-8 text-center text-3xl font-bold sm:text-4xl">سلة التسوق</h1>

            {cart.length > 0 ? (
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    <div className="space-y-4 rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-lg sm:p-6 lg:w-2/3">
                        {cart.map(item => (
                            <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                    <img src={item.imageUrl} alt={item.name} className="h-36 w-full rounded-xl object-cover sm:h-24 sm:w-24 sm:shrink-0" />

                                    <div className="min-w-0 flex-1 text-right">
                                        <h3 className="truncate text-lg font-bold sm:text-xl">{item.name}</h3>
                                        <p className="font-poppins text-sm text-gray-300">{item.species}</p>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
                                        <div className="flex items-center rounded-full bg-white/10">
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:text-amber-400"><PlusIcon className="h-4 w-4" /></button>
                                            <span className="px-3 font-bold font-poppins">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 hover:text-amber-400"><MinusIcon className="h-4 w-4" /></button>
                                        </div>

                                        <p className="min-w-[84px] text-center font-poppins text-lg font-bold text-amber-400">${(item.price * item.quantity).toFixed(2)}</p>

                                        <button onClick={() => removeFromCart(item.id)} className="rounded-lg border border-white/10 p-2 text-gray-400 transition-colors hover:border-red-500/40 hover:text-red-400"><TrashIcon className="h-5 w-5" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="lg:w-1/3">
                        <div className="space-y-4 rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-lg lg:sticky lg:top-24">
                            <h2 className="text-2xl font-bold">ملخص الطلب</h2>
                            <div className="flex justify-between">
                                <span className="text-gray-300">المجموع الفرعي</span>
                                <span className="font-bold font-poppins">${total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">الشحن</span>
                                <span className="font-bold">مجاني</span>
                            </div>
                            <div className="border-t border-white/20" />
                            <div className="flex justify-between text-xl">
                                <span className="font-bold">الإجمالي</span>
                                <span className="font-poppins font-black text-amber-400">${total.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={() => setPage('checkout')}
                                className="w-full rounded-lg bg-amber-500 px-4 py-3 font-bold text-gray-900 transition-all duration-300 hover:bg-amber-400"
                            >
                                المتابعة لإتمام الطلب
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-white/20 bg-white/5 py-20 text-center backdrop-blur-lg">
                    <h2 className="text-2xl font-bold">سلة التسوق فارغة.</h2>
                    <button onClick={() => setPage('showcase')} className="mt-4 font-bold text-amber-400">
                        ابدأ التسوق
                    </button>
                </div>
            )}
        </div>
    );
};

export default CartPage;
