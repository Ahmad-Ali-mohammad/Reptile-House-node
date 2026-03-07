import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import {
  getCustomerDisplayName,
  getPaymentStatusClasses,
  getPaymentStatusIcon,
  getShippingSummary,
  normalizePaymentStatus,
} from '../utils/orderWorkflow';

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

  if (!isOpen || !order) {
    return null;
  }

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

    onVerify(
      order.id,
      'مرفوض',
      rejectionReason.trim(),
      Number.isFinite(parsedPaidAmount) && parsedPaidAmount > 0 ? parsedPaidAmount : undefined,
    );
    setShowRejectInput(false);
    setRejectionReason('');
  };

  const handleClose = () => {
    setShowRejectInput(false);
    setRejectionReason('');
    onClose();
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" dir="rtl">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="إغلاق نافذة التحقق من الدفع"
      />

      <div className="glass-heavy relative max-h-[92vh] w-full max-w-5xl space-y-6 overflow-y-auto rounded-[2rem] border border-white/10 p-4 shadow-2xl sm:space-y-8 sm:p-6 lg:rounded-[2.5rem] lg:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.35em] text-amber-500">مراجعة إثبات الدفع</p>
            <h2 className="text-2xl font-black text-white sm:text-3xl">الطلب #{order.id}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
              راجع صورة التحويل وبيانات العميل قبل قبول الطلب أو رفضه، مع اعتماد المبلغ الصحيح الذي سيظهر في المتابعة
              والتقارير.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="إغلاق"
            className="rounded-xl p-3 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <p className="mb-2 text-sm text-gray-400">حالة التحقق</p>
            <div
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${getPaymentStatusClasses(normalizedPaymentStatus)}`}
            >
              <span>{getPaymentStatusIcon(normalizedPaymentStatus)}</span>
              {normalizedPaymentStatus}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <p className="mb-2 text-sm text-gray-400">طريقة الدفع</p>
            <p className="text-lg font-bold text-white">{order.paymentMethod === 'shamcash' ? 'شام كاش' : 'بطاقة'}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <p className="mb-2 text-sm text-gray-400">قيمة الطلب</p>
            <p className="font-poppins text-2xl font-black text-amber-500">${order.total.toFixed(2)}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <p className="mb-2 text-sm text-gray-400">المبلغ المرفوع</p>
            <p className="font-poppins text-2xl font-black text-emerald-400">
              ${typeof order.paidAmount === 'number' ? order.paidAmount.toFixed(2) : '0.00'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <p className="mb-2 text-sm text-gray-400">تاريخ الطلب</p>
            <p className="text-lg font-bold text-white">{order.date}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h3 className="text-lg font-black text-white">بيانات العميل</h3>
            <div className="mt-4 space-y-3 text-sm text-gray-300 sm:text-base">
              <p>
                <span className="text-gray-500">الاسم:</span> {getCustomerDisplayName(order)}
              </p>
              <p>
                <span className="text-gray-500">البريد:</span> {order.customerEmail || 'غير متوفر'}
              </p>
              <p>
                <span className="text-gray-500">الهاتف:</span> {order.customerPhone || 'غير متوفر'}
              </p>
              <p className="leading-relaxed">
                <span className="text-gray-500">عنوان الشحن:</span> {getShippingSummary(order)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h3 className="text-lg font-black text-white">محتويات الطلب</h3>
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pl-1">
              {order.items.map((item) => (
                <div
                  key={`${item.reptileId}-${item.name}`}
                  className="flex items-center gap-3 rounded-xl bg-black/20 p-3"
                >
                  <img src={item.imageUrl} alt={item.name} className="h-14 w-14 rounded-xl border border-white/10 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{item.name}</p>
                    <p className="text-sm text-gray-400">الكمية: {item.quantity}</p>
                  </div>
                  <p className="font-poppins font-black text-amber-500">${item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {order.rejectionReason && normalizedPaymentStatus === 'مرفوض' && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 sm:p-6">
            <h4 className="mb-2 font-bold text-red-400">سبب الرفض المسجل</h4>
            <p className="leading-relaxed text-gray-300">{order.rejectionReason}</p>
          </div>
        )}

        {order.paymentConfirmationImage ? (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white">صورة إثبات الدفع</h4>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
              <img
                src={order.paymentConfirmationImage}
                alt="إثبات الدفع"
                className="mx-auto max-h-[50vh] w-full rounded-xl object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-300">
            لا توجد صورة مرفوعة لإثبات الدفع لهذا الطلب.
          </div>
        )}

        {showRejectInput && (
          <div className="animate-fade-in space-y-3">
            <label htmlFor="rejection-reason" className="block font-bold text-white">
              سبب رفض التحويل
            </label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="اكتب سببًا واضحًا ليتمكن العميل من إعادة الدفع أو تصحيح الخطأ."
              rows={4}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-4 leading-relaxed text-white transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        )}

        <div className="space-y-3">
          <label htmlFor="paid-amount" className="block font-bold text-white">
            المبلغ المدفوع المعتمد
          </label>
          <input
            id="paid-amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={paidAmountInput}
            onChange={(event) => setPaidAmountInput(event.target.value)}
            placeholder="أدخل المبلغ المؤكد من إثبات الدفع"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 font-poppins text-white outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
            dir="ltr"
          />
          <p className="text-xs leading-relaxed text-gray-400 sm:text-sm">
            هذا المبلغ يستخدم في التقارير وفي متابعة الطلب، ويمكن تعديله هنا إذا اختلف عن إجمالي الطلب أو عن الرقم الذي
            أدخله العميل.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={normalizedPaymentStatus === 'مقبول'}
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-4 py-4 text-base font-bold transition-all shadow-lg hover:shadow-xl ${
              normalizedPaymentStatus === 'مقبول'
                ? 'cursor-not-allowed bg-gray-600 text-gray-400'
                : 'bg-green-500 text-white hover:bg-green-400'
            }`}
          >
            قبول الدفع وتأكيد الطلب
          </button>

          <button
            type="button"
            onClick={handleReject}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-red-500 px-4 py-4 text-base font-bold text-white transition-all shadow-lg hover:bg-red-400 hover:shadow-xl"
          >
            {showRejectInput ? 'حفظ سبب الرفض' : 'رفض إثبات الدفع'}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-base font-bold text-gray-300 transition-all hover:bg-white/10"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerificationModal;
