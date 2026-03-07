import React, { useState } from 'react';
import { Page } from '../App';
import { Order } from '../types';
import { ChevronDownIcon } from './icons';
import { getCustomerDisplayName, getOrderStatusClasses, getPaymentStatusClasses, getPaymentStatusIcon, getShippingSummary, normalizeOrderStatus, normalizePaymentStatus } from '../utils/orderWorkflow';

interface OrderCardProps {
  order: Order;
  setPage: (page: Page) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, setPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const status = normalizeOrderStatus(order.status);
  const paymentStatus = normalizePaymentStatus(order.paymentVerificationStatus);

  return (
    <div className="bg-white/10 backdrop-filter backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6 transition-all duration-300">
      <button
        type="button"
        className="w-full flex flex-col md:flex-row justify-between items-center gap-4 text-right"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex-1 text-center md:text-right">
          <p className="font-bold text-lg">طلب #{order.id}</p>
          <p className="text-sm text-gray-300">{order.date} • {getCustomerDisplayName(order)}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className={`px-3 py-1 text-sm font-bold rounded-full border ${getOrderStatusClasses(status)}`}>{status}</span>
          <span className={`px-3 py-1 text-sm font-bold rounded-full border inline-flex items-center gap-2 ${getPaymentStatusClasses(paymentStatus)}`}>
            <span>{getPaymentStatusIcon(paymentStatus)}</span>
            {paymentStatus}
          </span>
        </div>
        <div className="flex-1 text-center md:text-left font-bold text-lg font-poppins">${order.total.toFixed(2)}</div>
        <div className="ps-4">
          <ChevronDownIcon className={`w-6 h-6 text-gray-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="mt-6 pt-6 border-t border-white/20 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-black/20 rounded-xl p-4 text-gray-300">
              <p className="text-gray-500 mb-2">بيانات الشحن</p>
              <p className="leading-relaxed">{getShippingSummary(order)}</p>
              {order.customerPhone && <p className="mt-2">الهاتف: {order.customerPhone}</p>}
            </div>
            <div className="bg-black/20 rounded-xl p-4 text-gray-300">
              <p className="text-gray-500 mb-2">الدفع</p>
              <p>{order.paymentMethod === 'shamcash' ? 'شام كاش' : 'بطاقة'}</p>
              <p className="mt-2 font-poppins text-emerald-300">
                المبلغ المدفوع: ${typeof order.paidAmount === 'number' ? order.paidAmount.toFixed(2) : order.total.toFixed(2)}
              </p>
              {order.rejectionReason && paymentStatus === 'مرفوض' && <p className="mt-2 text-red-300">سبب الرفض: {order.rejectionReason}</p>}
            </div>
          </div>

          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={`${item.reptileId}-${item.name}`} className="flex items-center space-x-4 space-x-reverse">
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm text-gray-400">الكمية: {item.quantity}</p>
                </div>
                <p className="font-bold font-poppins">${item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="text-left mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPage(`orderTracking/${order.id}` as Page);
              }}
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
