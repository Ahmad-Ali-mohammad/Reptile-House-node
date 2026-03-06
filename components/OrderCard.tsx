import React, { useState } from 'react';
import { Order } from '../types';
import { ChevronDownIcon } from './icons';
import { Page } from '../App';

interface OrderCardProps {
    order: Order;
    setPage: (page: Page) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, setPage }) => {
    const [isOpen, setIsOpen] = useState(false);

    const getStatusColor = (status: Order['status']) => {
        switch (status) {
            case 'تم التوصيل': return 'bg-green-500/80';
            case 'تم الشحن': return 'bg-blue-500/80';
            case 'قيد المعالجة': return 'bg-yellow-500/80';
            case 'تم التأكيد': return 'bg-indigo-500/80';
            default: return 'bg-gray-500/80';
        }
    };

    return (
        <div className="bg-white/10 backdrop-filter backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6 transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex-1 text-center md:text-right mb-4 md:mb-0">
                    <p className="font-bold text-lg">طلب #{order.id}</p>
                    <p className="text-sm text-gray-300">{order.date}</p>
                </div>
                <div className="flex-1 text-center mb-4 md:mb-0">
                    <span className={`px-3 py-1 text-sm font-bold rounded-full text-white ${getStatusColor(order.status)}`}>
                        {order.status}
                    </span>
                </div>
                <div className="flex-1 text-center md:text-left font-bold text-lg font-poppins">
                    ${order.total}
                </div>
                <div className="ps-4">
                    <ChevronDownIcon className={`w-6 h-6 text-gray-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="mt-6 pt-6 border-t border-white/20">
                    <h4 className="font-bold mb-4">تفاصيل الطلب:</h4>
                    <div className="space-y-4">
                        {order.items.map((item) => (
                            <div key={item.reptileId} className="flex items-center space-x-4 space-x-reverse">
                                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                                <div className="flex-1">
                                    <p className="font-bold">{item.name}</p>
                                    <p className="text-sm text-gray-400">الكمية: {item.quantity}</p>
                                </div>
                                <p className="font-bold font-poppins">${item.price}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-left mt-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); setPage(`orderTracking/${order.id}` as Page); }}
                            className="bg-gray-500/50 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-gray-500/80 transition-colors"
                        >
                            تتبع الطلب
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderCard;
