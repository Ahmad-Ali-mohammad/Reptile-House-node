import React from 'react';
import { Page } from '../App';
import { CheckCircleIcon } from '../components/icons';
import { useDatabase } from '../contexts/DatabaseContext';
import { ORDER_STATUS_FLOW, getPaymentStatusClasses, getPaymentStatusIcon, normalizeOrderStatus, normalizePaymentStatus } from '../utils/orderWorkflow';

interface OrderTrackingPageProps {
  setPage: (page: Page) => void;
  orderId: string;
}

const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ setPage, orderId }) => {
  const { orders, loading } = useDatabase();
  const order = orders.find((item) => item.id === orderId) || null;

  if (loading) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold">جارٍ تحميل حالة الطلب...</h2>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold">لم يتم العثور على الطلب.</h2>
      </div>
    );
  }

  const status = normalizeOrderStatus(order.status);
  const paymentStatus = normalizePaymentStatus(order.paymentVerificationStatus);
  const currentStatusIndex = Math.max(ORDER_STATUS_FLOW.indexOf(status), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20 md:space-y-10 md:pb-0">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">تتبع الطلب</h1>
        <p className="font-poppins text-lg font-bold text-amber-400">#{order.id}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${getPaymentStatusClasses(paymentStatus)}`}>
            <span>{getPaymentStatusIcon(paymentStatus)}</span>
            حالة الدفع: {paymentStatus}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
            <span>المبلغ المدفوع:</span>
            <span className="font-poppins">${typeof order.paidAmount === 'number' ? order.paidAmount.toFixed(2) : order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 p-4 glass-medium sm:p-8">
        <div className="relative">
          <div className="absolute left-5 top-0 h-full w-1 rounded-full bg-white/10 md:left-1/2 md:-translate-x-1/2" />

          {ORDER_STATUS_FLOW.map((step, index) => (
            <div key={step} className="relative mb-8 flex items-start ps-12 last:mb-0 md:mb-12 md:items-center md:justify-center md:ps-0">
              <div
                className={`z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 ${
                  index <= currentStatusIndex ? 'border-amber-400 bg-amber-400/20' : 'border-gray-600 bg-gray-700'
                }`}
              >
                {index <= currentStatusIndex && <CheckCircleIcon className="h-8 w-8 text-amber-300" />}
              </div>

              <div className={`absolute left-12 right-0 md:w-2/5 ${index % 2 === 0 ? 'md:left-4' : 'md:right-4 md:left-auto'}`}>
                <div
                  className={`rounded-xl p-4 text-center shadow-lg ${
                    index % 2 === 0 ? 'text-right md:text-left' : 'text-right'
                  } ${index <= currentStatusIndex ? 'border border-white/20 bg-white/10' : 'border border-transparent bg-black/20'}`}
                >
                  <h3 className={`text-base font-bold sm:text-lg ${index <= currentStatusIndex ? 'text-white' : 'text-gray-500'}`}>
                    {step}
                  </h3>
                  {index === 0 && <p className="text-sm text-gray-400">{order.date}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {paymentStatus === 'قيد المراجعة' && (
        <div className="rounded-[2rem] border border-yellow-500/20 bg-yellow-500/10 p-6 text-center text-yellow-300">
          تم استلام الطلب وإثبات الدفع، وهو الآن بانتظار مراجعة الإدارة قبل الانتقال إلى مرحلة التأكيد.
        </div>
      )}

      {paymentStatus === 'مرفوض' && (
        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-center text-red-300">
          تم رفض إثبات الدفع. راجع سبب الرفض في سجل الطلبات ثم أعد الدفع أو تواصل مع الإدارة.
        </div>
      )}

      <div className="text-center">
        <button
          onClick={() => setPage('home')}
          className="rounded-lg bg-white/10 py-2 px-6 font-bold text-white transition-colors hover:bg-white/20"
        >
          العودة للتسوق
        </button>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
