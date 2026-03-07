import React, { useEffect, useMemo, useState } from 'react';
import { Page } from '../App';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useDatabase } from '../contexts/DatabaseContext';
import { api } from '../services/api';
import { IMAGE_FILE_ACCEPT, mediaService } from '../services/media';
import { Order, ShamCashConfig } from '../types';

interface CheckoutPageProps {
  setPage: (page: Page) => void;
  setLastOrderId: (id: string) => void;
}

type ShippingForm = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
};

const createInitialShippingForm = (userName?: string | null): ShippingForm => {
  const fullName = String(userName || '').trim();
  const nameParts = fullName ? fullName.split(/\s+/) : [];

  return {
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' '),
    phone: '',
    address: '',
    city: '',
    country: 'Lebanon',
  };
};

const CheckoutPage: React.FC<CheckoutPageProps> = ({ setPage, setLastOrderId }) => {
  const { cart, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const { createOrder } = useDatabase();
  const total = getCartTotal();

  const [shippingForm, setShippingForm] = useState<ShippingForm>(() => createInitialShippingForm(user?.name));
  const [paymentImage, setPaymentImage] = useState('');
  const [paidAmount, setPaidAmount] = useState(() => total.toFixed(2));
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadingPaymentImage, setIsUploadingPaymentImage] = useState(false);
  const [shamCashConfig, setShamCashConfig] = useState<ShamCashConfig | null>(null);

  useEffect(() => {
    setShippingForm((current) => {
      if (current.firstName || current.lastName) {
        return current;
      }

      return createInitialShippingForm(user?.name);
    });
  }, [user?.name]);

  useEffect(() => {
    api.getShamCashConfig().then(setShamCashConfig).catch(() => setShamCashConfig(null));
  }, []);

  useEffect(() => {
    setPaidAmount(total.toFixed(2));
  }, [total]);

  const customerName = useMemo(
    () => [shippingForm.firstName, shippingForm.lastName].map((value) => value.trim()).filter(Boolean).join(' '),
    [shippingForm.firstName, shippingForm.lastName],
  );

  const updateField = (field: keyof ShippingForm, value: string) => {
    setShippingForm((current) => ({ ...current, [field]: value }));
  };

  const handlePlaceOrder = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      alert('يرجى تسجيل الدخول قبل إتمام الطلب.');
      setPage('login');
      return;
    }

    if (!paymentImage) {
      alert('يرجى رفع صورة تأكيد الدفع.');
      return;
    }

    if (isUploadingPaymentImage) {
      alert('انتظر حتى يكتمل رفع صورة الدفع أولًا.');
      return;
    }

    if (!customerName || !shippingForm.phone.trim() || !shippingForm.address.trim() || !shippingForm.city.trim() || !shippingForm.country.trim()) {
      alert('يرجى استكمال بيانات الشحن قبل إرسال الطلب.');
      return;
    }

    const normalizedPaidAmount = Number.parseFloat(paidAmount);
    if (!Number.isFinite(normalizedPaidAmount) || normalizedPaidAmount <= 0) {
      alert('يرجى إدخال قيمة صحيحة للمبلغ المدفوع قبل إرسال الطلب.');
      return;
    }

    setIsProcessing(true);

    try {
      const newOrderId = `RH-${Date.now()}`;
      const order: Order = {
        id: newOrderId,
        date: new Date().toISOString().split('T')[0],
        status: 'قيد المعالجة',
        total,
        paidAmount: normalizedPaidAmount,
        customerId: user.id,
        customerName,
        customerEmail: user.email,
        customerPhone: shippingForm.phone.trim(),
        shippingAddress: shippingForm.address.trim(),
        shippingCity: shippingForm.city.trim(),
        shippingCountry: shippingForm.country.trim(),
        items: cart.map((item) => ({
          reptileId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.imageUrl,
        })),
        paymentConfirmationImage: paymentImage,
        paymentMethod: 'shamcash',
        paymentVerificationStatus: 'قيد المراجعة',
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      mediaService.validateImageFile(file);
      setIsUploadingPaymentImage(true);
      const imageUrl = await mediaService.uploadProjectImage(file, 'payment-proofs');
      setPaymentImage(imageUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'تعذر رفع صورة الدفع.');
    } finally {
      setIsUploadingPaymentImage(false);
      event.target.value = '';
    }
  };

  if (!user) {
    return (
      <div className="animate-fade-in py-20 text-center">
        <h2 className="mb-4 text-3xl font-black">تسجيل الدخول مطلوب لإتمام الطلب</h2>
        <p className="mb-8 text-gray-400">يجب تسجيل الدخول أولًا لحفظ الطلب وربطه بحسابك ومتابعته لاحقًا.</p>
        <button
          onClick={() => setPage('login')}
          className="rounded-2xl bg-amber-500 px-8 py-4 font-black text-gray-900 transition-all hover:bg-amber-400"
        >
          الذهاب إلى تسجيل الدخول
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="animate-fade-in py-20 text-center">
        <h2 className="mb-4 text-3xl font-black">سلتك فارغة</h2>
        <button onClick={() => setPage('showcase')} className="font-bold text-amber-500 hover:underline">
          العودة للتسوق
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-12 text-center text-4xl font-black">إتمام الطلب</h1>

      <form onSubmit={handlePlaceOrder} className="flex flex-col gap-8 lg:flex-row-reverse">
        <div className="lg:w-1/3">
          <div className="sticky top-24 space-y-6 rounded-[2rem] border border-white/10 p-8 shadow-2xl glass-dark">
            <h2 className="text-2xl font-black">ملخص طلبك</h2>
            <div className="max-h-[400px] space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="group flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-14 w-14 rounded-xl border border-white/10 object-cover transition-transform group-hover:scale-105"
                      />
                      <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-gray-900 shadow-lg">
                        x{item.quantity}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-tight">{item.name}</p>
                      <p className="font-poppins text-[10px] text-gray-500">${item.price}</p>
                    </div>
                  </div>
                  <span className="font-poppins font-black text-amber-500">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between text-2xl font-black">
                <span>الإجمالي</span>
                <span className="font-poppins text-amber-500">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10 rounded-[2rem] border border-white/10 p-8 shadow-xl glass-medium md:p-12 lg:w-2/3">
          <section>
            <h2 className="mb-6 flex items-center gap-3 text-2xl font-black">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-sm text-gray-900">1</span>
              معلومات الشحن
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <input
                id="shipping-first-name"
                name="shippingFirstName"
                type="text"
                placeholder="الاسم الأول"
                required
                value={shippingForm.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 px-5 outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
              />
              <input
                id="shipping-last-name"
                name="shippingLastName"
                type="text"
                placeholder="الاسم الأخير"
                required
                value={shippingForm.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 px-5 outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
              />
              <input
                id="shipping-phone"
                name="shippingPhone"
                type="tel"
                placeholder="رقم الهاتف"
                required
                value={shippingForm.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 px-5 font-poppins outline-none transition-all focus:ring-2 focus:ring-amber-500/50 md:col-span-2"
                dir="ltr"
              />
              <input
                id="shipping-address"
                name="shippingAddress"
                type="text"
                placeholder="العنوان بالتفصيل"
                required
                value={shippingForm.address}
                onChange={(event) => updateField('address', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 px-5 outline-none transition-all focus:ring-2 focus:ring-amber-500/50 md:col-span-2"
              />
              <input
                id="shipping-city"
                name="shippingCity"
                type="text"
                placeholder="المدينة"
                required
                value={shippingForm.city}
                onChange={(event) => updateField('city', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 px-5 outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
              />
              <input
                id="shipping-country"
                name="shippingCountry"
                type="text"
                placeholder="الدولة"
                required
                value={shippingForm.country}
                onChange={(event) => updateField('country', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 px-5 outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-3 text-2xl font-black">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-sm text-gray-900">2</span>
              الدفع عبر شام كاش
            </h2>
            <div className="space-y-6">
              {shamCashConfig && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                  <img
                    src={shamCashConfig.barcodeImageUrl}
                    alt="ShamCash Barcode"
                    className="mx-auto h-48 w-48 rounded-lg bg-white p-2 object-contain"
                  />
                  <p className="mt-4 text-lg font-bold text-amber-500">امسح الباركود للدفع</p>
                </div>
              )}

              {shamCashConfig && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                  <p className="mb-2 text-sm text-gray-400">أو أدخل الكود يدويًا</p>
                  <p className="font-poppins text-2xl font-black text-amber-500">{shamCashConfig.accountCode}</p>
                </div>
              )}

              {shamCashConfig?.accountHolderName && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <p className="mb-2 text-sm text-gray-400">اسم الحساب</p>
                  <p className="text-xl font-black text-white">{shamCashConfig.accountHolderName}</p>
                </div>
              )}

              {shamCashConfig?.phoneNumber && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <p className="mb-2 text-sm text-gray-400">رقم الهاتف</p>
                  <p className="font-poppins text-xl font-black text-white" dir="ltr">{shamCashConfig.phoneNumber}</p>
                </div>
              )}

              {shamCashConfig?.paymentInstructions && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6">
                  <h4 className="mb-3 flex items-center gap-2 font-bold text-blue-400">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    تعليمات الدفع
                  </h4>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                    {shamCashConfig.paymentInstructions}
                  </p>
                </div>
              )}

              <div>
                <label className="mb-3 block text-sm font-bold">المبلغ المدفوع</label>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-4 flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-400">إجمالي الطلب الحالي</span>
                    <span className="font-poppins text-lg font-black text-amber-500">${total.toFixed(2)}</span>
                  </div>
                  <input
                    id="paid-amount-checkout"
                    name="paidAmountCheckout"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    required
                    value={paidAmount}
                    onChange={(event) => setPaidAmount(event.target.value)}
                    placeholder="أدخل المبلغ الذي تم دفعه فعليًا"
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 px-5 font-poppins text-white outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
                    dir="ltr"
                  />
                  <p className="mt-3 text-xs leading-relaxed text-gray-400">
                    يجب إدخال المبلغ المرفوع في التحويل ليظهر للمدير عند مراجعة إثبات الدفع.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-bold">ارفع صورة تأكيد الدفع</label>
                <input
                  id="payment-proof-upload"
                  name="paymentProofUpload"
                  type="file"
                  accept={IMAGE_FILE_ACCEPT}
                  required={!paymentImage}
                  onChange={handleImageUpload}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 px-5 text-white transition-all file:ml-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:font-bold file:text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {isUploadingPaymentImage && (
                  <p className="mt-3 text-sm font-bold text-amber-400">جاري رفع صورة الدفع...</p>
                )}
                {paymentImage && (
                  <div className="mt-4 rounded-xl border border-amber-500/50 bg-white/5 p-4">
                    <p className="mb-3 text-sm text-gray-400">معاينة صورة الدفع:</p>
                    <img
                      src={paymentImage}
                      alt="Payment Preview"
                      className="mx-auto w-full max-w-xs rounded-lg border-2 border-amber-500 object-cover shadow-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={isProcessing || isUploadingPaymentImage}
            className={`relative w-full overflow-hidden rounded-2xl py-5 px-6 font-black transition-all shadow-2xl group ${
              isProcessing || isUploadingPaymentImage
                ? 'cursor-not-allowed bg-gray-700'
                : 'bg-amber-500 text-gray-900 hover:bg-amber-400'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                جاري معالجة الطلب...
              </span>
            ) : (
              <>
                <span className="relative z-10 text-xl">تأكيد الطلب وإرسال إثبات الدفع</span>
                <div className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-500 group-hover:translate-y-0" />
              </>
            )}
          </button>
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
            بعد إرسال الطلب سيظهر في لوحة الإدارة بانتظار مراجعة الدفع والمبلغ المدفوع، ثم يتم تحويله لمراحل التنفيذ والشحن.
          </p>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
