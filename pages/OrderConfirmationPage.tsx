import React from 'react';
import { CheckCircleIcon } from '../components/icons';
import { Page } from '../App';

interface OrderConfirmationPageProps {
  setPage: (page: Page) => void;
  orderId: string | null;
}

const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ setPage, orderId }) => {
  return (
    <div className="flex items-center justify-center py-8 pb-20 sm:py-12 md:pb-0">
      <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-white/10 p-5 text-center shadow-lg backdrop-blur-lg sm:p-8">
        <div className="flex justify-center text-green-400 mb-4">
          <CheckCircleIcon className="w-24 h-24" />
        </div>
        <h1 className="text-3xl font-black text-white sm:text-4xl">تم استلام طلبك</h1>
        <p className="text-lg text-gray-300 mt-2 leading-relaxed">
          وصلنا طلبك بنجاح، وسيتم الآن مراجعة إثبات الدفع ثم تأكيد الطلب قبل بدء الشحن.
        </p>
        {orderId && (
          <div className="my-6">
            <p className="text-gray-400">رقم الطلب:</p>
            <p className="text-2xl font-bold text-amber-400 font-poppins tracking-widest bg-black/20 rounded-lg px-4 py-2 inline-block mt-2">{orderId}</p>
          </div>
        )}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-gray-300 leading-relaxed">
          ستظهر لك حالة الطلب أولًا كـ <span className="font-bold text-white">قيد المعالجة</span> حتى تتم مراجعة الدفع، ثم ينتقل تلقائيًا إلى
          <span className="font-bold text-white"> تم التأكيد</span> قبل الشحن.
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
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
