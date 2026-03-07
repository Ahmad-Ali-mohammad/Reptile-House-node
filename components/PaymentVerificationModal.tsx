import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { getCustomerDisplayName, getPaymentStatusClasses, getPaymentStatusIcon, getShippingSummary, normalizePaymentStatus } from '../utils/orderWorkflow';

interface PaymentVerificationModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onVerify: (orderId: string, status: Order['paymentVerificationStatus'], reason?: string, paidAmount?: number) => void;
}

const PaymentVerificationModal: React.FC<PaymentVerificationModalProps> = ({ isOpen, order, onClose, onVerify }) => {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [paidAmountInput, setPaidAmountInput] = useState('');

  useEffect(() => {
    if (!order || !isOpen) {
      return;
    }

    const nextValue = typeof order.paidAmount === 'number' && order.paidAmount > 0 ? order.paidAmount : order.total;
    setPaidAmountInput(nextValue.toFixed(2));
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const normalizedPaymentStatus = normalizePaymentStatus(order.paymentVerificationStatus);
  const parsedPaidAmount = Number.parseFloat(paidAmountInput);

  const handleAccept = () => {
    if (!Number.isFinite(parsedPaidAmount) || parsedPaidAmount <= 0) {
      alert('يرجى تأكيد المبلغ المدفوع قبل قبول الطلب.');
      return;
    }

    onVerify(order.id, 'مقبول', undefined, parsedPaidAmount);
    setShowRejectInput(false);
    setRejectionReason('');
  };

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (!rejectionReason.trim()) {
      alert('يرجى إدخال سبب الرفض قبل الحفظ.');
      return;
    }

    onVerify(order.id, 'مرفوض', rejectionReason.trim(), Number.isFinite(parsedPaidAmount) && parsedPaidAmount > 0 ? parsedPaidAmount : undefined);
    setShowRejectInput(false);
    setRejectionReason('');
  };

  const handleClose = () => {
    setShowRejectInput(false);
    setRejectionReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
        onClick={handleClose}
        aria-label="إغلاق نافذة التحقق من الدفع"
      />

      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto glass-heavy rounded-[2.5rem] p-8 border border-white/10 shadow-2xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-amber-500 font-black mb-3">مراجعة إثبات الدفع</p>
            <h2 className="text-3xl font-black text-white">الطلب #{order.id}</h2>
            <p className="text-gray-400 mt-2">راجع صورة التحويل وبيانات العميل قبل قبول الطلب أو رفضه.</p>
          </div>
          <button
            onClick={handleClose}
            aria-label="إغلاق"
            className="p-3 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-2">حالة التحقق</p>
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border ${getPaymentStatusClasses(normalizedPaymentStatus)}`}>
              <span>{getPaymentStatusIcon(normalizedPaymentStatus)}</span>
              {normalizedPaymentStatus}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-2">طريقة الدفع</p>
            <p className="text-white font-bold text-lg">{order.paymentMethod === 'shamcash' ? 'شام كاش' : 'بطاقة'}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-2">قيمة الطلب</p>
            <p className="text-amber-500 font-poppins font-black text-2xl">${order.total.toFixed(2)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-2">المبلغ المرفوع</p>
            <p className="text-emerald-400 font-poppins font-black text-2xl">
              ${typeof order.paidAmount === 'number' ? order.paidAmount.toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-2">تاريخ الطلب</p>
            <p className="text-white font-bold text-lg">{order.date}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h3 className="text-lg font-black text-white">بيانات العميل</h3>
            <p className="text-gray-300"><span className="text-gray-500">الاسم:</span> {getCustomerDisplayName(order)}</p>
            <p className="text-gray-300"><span className="text-gray-500">البريد:</span> {order.customerEmail || 'غير متوفر'}</p>
            <p className="text-gray-300"><span className="text-gray-500">الهاتف:</span> {order.customerPhone || 'غير متوفر'}</p>
            <p className="text-gray-300 leading-relaxed"><span className="text-gray-500">عنوان الشحن:</span> {getShippingSummary(order)}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h3 className="text-lg font-black text-white">محتويات الطلب</h3>
            <div className="space-y-3 max-h-52 overflow-y-auto pr-2">
              {order.items.map((item) => (
                <div key={`${item.reptileId}-${item.name}`} className="flex items-center gap-3 bg-black/20 rounded-xl p-3">
                  <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-xl object-cover border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{item.name}</p>
                    <p className="text-sm text-gray-400">الكمية: {item.quantity}</p>
                  </div>
                  <p className="font-poppins font-black text-amber-500">${item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {order.rejectionReason && normalizedPaymentStatus === 'مرفوض' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
            <h4 className="font-bold text-red-400 mb-2">سبب الرفض المسجل</h4>
            <p className="text-gray-300 leading-relaxed">{order.rejectionReason}</p>
          </div>
        )}

        {order.paymentConfirmationImage ? (
          <div className="space-y-4">
            <h4 className="font-bold text-white text-lg">صورة إثبات الدفع</h4>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 overflow-hidden">
              <img
                src={order.paymentConfirmationImage}
                alt="إثبات الدفع"
                className="w-full h-auto rounded-xl object-contain max-h-[500px] mx-auto"
              />
            </div>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-red-300">
            لا توجد صورة مرفوعة لإثبات الدفع لهذا الطلب.
          </div>
        )}

        {showRejectInput && (
          <div className="space-y-3 animate-fade-in">
            <label htmlFor="rejection-reason" className="block text-white font-bold">سبب رفض التحويل</label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="اكتب سببًا واضحًا ليتمكن العميل من إعادة الدفع أو تصحيح الخطأ."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
            />
          </div>
        )}

        <div className="space-y-3">
          <label htmlFor="paid-amount" className="block text-white font-bold">المبلغ المدفوع المعتمد</label>
          <input
            id="paid-amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={paidAmountInput}
            onChange={(event) => setPaidAmountInput(event.target.value)}
            placeholder="أدخل المبلغ المؤكد من إثبات الدفع"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-4 px-5 font-poppins text-white outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
            dir="ltr"
          />
          <p className="text-xs leading-relaxed text-gray-400">
            يستخدم هذا المبلغ في التقارير وفي متابعة الطلب، ويمكن تعديله هنا إذا اختلف عن إجمالي الطلب أو عن المبلغ الذي أدخله العميل.
          </p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={handleAccept}
            disabled={normalizedPaymentStatus === 'مقبول'}
            className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
              normalizedPaymentStatus === 'مقبول'
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-400'
            }`}
          >
            قبول الدفع وتأكيد الطلب
          </button>

          <button
            onClick={handleReject}
            className="flex-1 min-w-[200px] py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-400"
          >
            {showRejectInput ? 'حفظ سبب الرفض' : 'رفض إثبات الدفع'}
          </button>

          <button
            onClick={handleClose}
            className="flex-1 min-w-[180px] py-4 px-6 rounded-xl font-bold text-lg transition-all bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerificationModal;
