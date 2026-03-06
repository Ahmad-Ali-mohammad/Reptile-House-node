import React from 'react';
import { Page } from '../App';
import { CheckCircleIcon } from '../components/icons';

interface OrderConfirmationPageProps {
    setPage: (page: Page) => void;
    orderId: string | null;
}

const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ setPage, orderId }) => {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="w-full max-w-2xl p-8 text-center bg-white/10 backdrop-filter backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
                <div className="flex justify-center text-green-400 mb-4">
                    <CheckCircleIcon className="w-24 h-24" />
                </div>
                <h1 className="text-4xl font-black text-white">شكراً لك!</h1>
                <p className="text-lg text-gray-300 mt-2">تم استلام طلبك بنجاح.</p>
                {orderId && (
                    <div className="my-6">
                        <p className="text-gray-400">رقم طلبك هو:</p>
                        <p className="text-2xl font-bold text-amber-400 font-poppins tracking-widest bg-black/20 rounded-lg px-4 py-2 inline-block mt-2">{orderId}</p>
                    </div>
                )}
                <div className="flex justify-center gap-4 mt-8">
                    <button
                        onClick={() => setPage('home')}
                        className="bg-white/10 text-white font-bold py-2 px-6 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        العودة للرئيسية
                    </button>
                    <button
                        onClick={() => setPage(orderId ? (`orderTracking/${orderId}` as Page) : 'orderTracking')}
                        className="bg-amber-500 text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 transition-colors"
                    >
                        تتبع طلبك
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmationPage;
