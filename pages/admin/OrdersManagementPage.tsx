import React, { useMemo, useState } from 'react';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import PaymentVerificationModal from '../../components/PaymentVerificationModal';
import TabsSystem, { TabItem } from '../../components/TabSystem';
import { PackageIcon, TrashIcon } from '../../components/icons';
import { helpContent } from '../../constants/helpContent';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Order } from '../../types';
import {
  canMoveOrderToStatus,
  getCustomerDisplayName,
  getOrderStatusClasses,
  getPaymentStatusClasses,
  getPaymentStatusIcon,
  getShippingSummary,
  normalizeOrderStatus,
  normalizePaymentStatus,
} from '../../utils/orderWorkflow';

const orderStatusOptions: Array<Order['status']> = ['قيد المعالجة', 'تم التأكيد', 'تم الشحن', 'تم التوصيل'];

const OrdersManagementPage: React.FC = () => {
  const { deleteOrder, orders, updateOrder, updateOrderPaymentStatus } = useDatabase();
  const [activeTab, setActiveTab] = useState('review');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const normalizedOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((order) => ({
          ...order,
          status: normalizeOrderStatus(order.status),
          paymentVerificationStatus: normalizePaymentStatus(order.paymentVerificationStatus),
        })),
    [orders],
  );

  const tabs: TabItem[] = [
    {
      id: 'review',
      label: 'مراجعة الدفع',
      icon: '⏳',
      badge: normalizedOrders.filter((order) => order.paymentVerificationStatus === 'قيد المراجعة').length,
    },
    {
      id: 'active',
      label: 'قيد التنفيذ',
      icon: '📦',
      badge: normalizedOrders.filter(
        (order) =>
          order.paymentVerificationStatus === 'مقبول' &&
          (order.status === 'قيد المعالجة' || order.status === 'تم التأكيد'),
      ).length,
    },
    {
      id: 'shipping',
      label: 'الشحن',
      icon: '🚚',
      badge: normalizedOrders.filter((order) => order.status === 'تم الشحن').length,
    },
    {
      id: 'delivered',
      label: 'المكتملة',
      icon: '✅',
      badge: normalizedOrders.filter((order) => order.status === 'تم التوصيل').length,
    },
    {
      id: 'rejected',
      label: 'مدفوعات مرفوضة',
      icon: '❌',
      badge: normalizedOrders.filter((order) => order.paymentVerificationStatus === 'مرفوض').length,
    },
  ];

  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'review':
        return normalizedOrders.filter((order) => order.paymentVerificationStatus === 'قيد المراجعة');
      case 'active':
        return normalizedOrders.filter(
          (order) =>
            order.paymentVerificationStatus === 'مقبول' &&
            (order.status === 'قيد المعالجة' || order.status === 'تم التأكيد'),
        );
      case 'shipping':
        return normalizedOrders.filter((order) => order.status === 'تم الشحن');
      case 'delivered':
        return normalizedOrders.filter((order) => order.status === 'تم التوصيل');
      case 'rejected':
        return normalizedOrders.filter((order) => order.paymentVerificationStatus === 'مرفوض');
      default:
        return normalizedOrders;
    }
  }, [activeTab, normalizedOrders]);

  const handleStatusChange = (order: Order, nextStatus: Order['status']) => {
    if (!canMoveOrderToStatus(order, nextStatus)) {
      alert('لا يمكن نقل الطلب إلى هذه المرحلة قبل قبول الدفع أو قبل إتمام المرحلة الحالية.');
      return;
    }

    updateOrder(order.id, nextStatus);
  };

  const handleDelete = (id: string) => {
    if (globalThis.confirm('هل أنت متأكد من حذف هذا الطلب نهائيًا؟ لا يمكن التراجع عن هذه الخطوة.')) {
      deleteOrder(id);
    }
  };

  const handleOpenPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    setIsPaymentModalOpen(true);
  };

  const handleVerifyPayment = (
    orderId: string,
    status: Order['paymentVerificationStatus'],
    reason?: string,
    paidAmount?: number,
  ) => {
    updateOrderPaymentStatus(orderId, status, reason, status === 'مقبول' ? 'تم التأكيد' : 'قيد المعالجة', paidAmount);
    setIsPaymentModalOpen(false);
  };

  const renderStatusSelect = (order: Order, status: Order['status'], compact = false) => (
    <select
      value={status}
      onChange={(event) => handleStatusChange(order, event.target.value as Order['status'])}
      className={`w-full appearance-none rounded-2xl border px-4 py-3 text-center font-black transition-all focus:ring-2 focus:ring-amber-500/50 ${
        compact ? 'text-[11px]' : 'text-sm'
      } ${getOrderStatusClasses(status)}`}
      aria-label={`تغيير حالة الطلب ${order.id}`}
    >
      {orderStatusOptions.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );

  const renderOrderActions = (order: Order, compact = false) => (
    <div className={compact ? 'flex flex-wrap justify-start gap-2' : 'grid grid-cols-1 gap-3 sm:grid-cols-2'}>
      {order.paymentConfirmationImage && (
        <button
          type="button"
          onClick={() => handleOpenPaymentModal(order)}
          className={
            compact
              ? 'inline-flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300 transition-all hover:bg-blue-500 hover:text-white'
              : 'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 transition-all hover:bg-blue-500 hover:text-white'
          }
          title="مراجعة الدفع"
          aria-label={`مراجعة دفع الطلب ${order.id}`}
        >
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {!compact && <span>مراجعة الدفع</span>}
        </button>
      )}

      <button
        type="button"
        onClick={() => handleDelete(order.id)}
        className={
          compact
            ? 'inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 transition-all hover:bg-red-500 hover:text-white'
            : 'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 transition-all hover:bg-red-500 hover:text-white'
        }
        title="حذف الطلب"
        aria-label={`حذف الطلب ${order.id}`}
      >
        <TrashIcon className="h-5 w-5 shrink-0" />
        {!compact && <span>حذف الطلب</span>}
      </button>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-black sm:text-4xl">إدارة الطلبات</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-400 sm:text-base">
            راجع المدفوعات واعتمد المبالغ ثم حدّث حالة الطلب حتى الشحن والتسليم، مع إبقاء جميع الإجراءات متاحة بوضوح على
            الشاشات الصغيرة والمتوسطة.
          </p>
        </div>
        <HelpButton onClick={() => setIsHelpOpen(true)} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-[1.75rem] border border-amber-500/20 bg-amber-500/10 p-5">
          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-amber-300">1. مراجعة الطلب الجديد</p>
          <p className="text-sm leading-relaxed text-gray-200">
            أي طلب جديد سيظهر ضمن تبويب <span className="font-black text-white">مراجعة الدفع</span> مع مبلغ التحويل
            والصورة المرفوعة حتى تبدأ المعالجة مباشرة.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-emerald-300">2. قبول أو رفض الدفع</p>
          <p className="text-sm leading-relaxed text-gray-200">
            عند قبول الدفع ينتقل الطلب تلقائيًا إلى <span className="font-black text-white">تم التأكيد</span>، وعند الرفض
            يبقى مع سبب واضح يمكن الرجوع إليه لاحقًا.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-indigo-500/20 bg-indigo-500/10 p-5">
          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-indigo-300">3. التنفيذ والشحن</p>
          <p className="text-sm leading-relaxed text-gray-200">
            بعد الاعتماد، حدّث المرحلة إلى <span className="font-black text-white">تم الشحن</span> ثم{' '}
            <span className="font-black text-white">تم التوصيل</span> مع بقاء الإجراءات الأساسية ظاهرة بوضوح على جميع
            المقاسات.
          </p>
        </div>
      </div>

      <TabsSystem tabs={tabs} activeTabId={activeTab} onChange={setActiveTab} />

      <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#11141b]/60 p-4 shadow-2xl glass-medium sm:p-6">
        {filteredOrders.length > 0 ? (
          <>
            <div className="space-y-4 xl:hidden">
              {filteredOrders.map((order) => {
                const paymentStatus = normalizePaymentStatus(order.paymentVerificationStatus);
                const status = normalizeOrderStatus(order.status);
                const paidAmount = typeof order.paidAmount === 'number' ? order.paidAmount : 0;
                const paymentDifference = typeof order.paidAmount === 'number' ? Math.abs(order.total - order.paidAmount) : null;

                return (
                  <article
                    key={order.id}
                    className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 shadow-xl shadow-black/10 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <p className="font-poppins text-lg font-black text-white sm:text-xl">#{order.id}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 sm:text-sm">
                          <span>{order.date}</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            عدد العناصر: {order.items.length}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-right">
                        <p className="text-xs font-black uppercase tracking-widest text-amber-300">الإجمالي</p>
                        <p className="mt-1 font-poppins text-2xl font-black text-amber-400">${order.total.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                        <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">بيانات العميل</p>
                        <div className="space-y-2 text-sm text-gray-200">
                          <p className="font-bold text-white">{getCustomerDisplayName(order)}</p>
                          <p>{order.customerEmail || 'بدون بريد مسجل'}</p>
                          <p>{order.customerPhone || 'بدون هاتف مسجل'}</p>
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                        <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">الشحن</p>
                        <p className="text-sm leading-relaxed text-gray-200">{getShippingSummary(order)}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)]">
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">الدفع</p>
                            <div
                              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${getPaymentStatusClasses(paymentStatus)}`}
                            >
                              <span>{getPaymentStatusIcon(paymentStatus)}</span>
                              {paymentStatus}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-poppins text-xl font-black text-emerald-400">${paidAmount.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">المبلغ المدفوع</p>
                          </div>
                        </div>

                        {paymentDifference !== null && (
                          <p
                            className={`mt-4 text-xs font-bold ${
                              paymentDifference < 0.01 ? 'text-emerald-300' : 'text-yellow-300'
                            }`}
                          >
                            {paymentDifference < 0.01
                              ? 'المبلغ مطابق للإجمالي'
                              : `فرق الدفع: $${paymentDifference.toFixed(2)}`}
                          </p>
                        )}

                        {order.rejectionReason && paymentStatus === 'مرفوض' && (
                          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                            <p className="mb-2 text-xs font-black uppercase tracking-widest text-red-300">سبب الرفض</p>
                            <p className="text-sm leading-relaxed text-red-100">{order.rejectionReason}</p>
                          </div>
                        )}
                      </div>

                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                        <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">مرحلة الطلب</p>
                        {renderStatusSelect(order, status)}
                      </div>
                    </div>

                    <div className="mt-4">{renderOrderActions(order)}</div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto xl:block">
              <table className="min-w-[1120px] w-full text-right">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <th className="p-6">الطلب</th>
                    <th className="p-6">العميل</th>
                    <th className="p-6">الشحن</th>
                    <th className="p-6">الدفع</th>
                    <th className="p-6">الإجمالي</th>
                    <th className="p-6 text-center">المرحلة</th>
                    <th className="p-6 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.map((order) => {
                    const paymentStatus = normalizePaymentStatus(order.paymentVerificationStatus);
                    const status = normalizeOrderStatus(order.status);

                    return (
                      <tr key={order.id} className="transition-all hover:bg-white/5">
                        <td className="p-6">
                          <div className="space-y-2">
                            <p className="font-poppins text-lg font-black text-white">#{order.id}</p>
                            <p className="text-sm text-gray-400">{order.date}</p>
                            <p className="text-xs text-gray-500">عدد العناصر: {order.items.length}</p>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="space-y-2">
                            <p className="font-bold text-white">{getCustomerDisplayName(order)}</p>
                            <p className="text-sm text-gray-400">{order.customerEmail || 'بدون بريد مسجل'}</p>
                            <p className="text-sm text-gray-400">{order.customerPhone || 'بدون هاتف مسجل'}</p>
                          </div>
                        </td>
                        <td className="p-6">
                          <p className="max-w-xs text-sm leading-relaxed text-gray-300">{getShippingSummary(order)}</p>
                        </td>
                        <td className="p-6">
                          <div
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${getPaymentStatusClasses(paymentStatus)}`}
                          >
                            <span>{getPaymentStatusIcon(paymentStatus)}</span>
                            {paymentStatus}
                          </div>
                          <p className="mt-3 font-poppins text-sm font-black text-emerald-400">
                            ${typeof order.paidAmount === 'number' ? order.paidAmount.toFixed(2) : '0.00'}
                          </p>
                          <p className="text-[11px] text-gray-500">المبلغ المدفوع</p>
                          {order.rejectionReason && paymentStatus === 'مرفوض' && (
                            <p className="mt-3 max-w-xs text-xs leading-relaxed text-red-300">{order.rejectionReason}</p>
                          )}
                        </td>
                        <td className="p-6">
                          <p className="font-poppins text-lg font-black text-amber-500">${order.total.toFixed(2)}</p>
                          {typeof order.paidAmount === 'number' && (
                            <p
                              className={`mt-2 text-xs font-bold ${
                                Math.abs(order.total - order.paidAmount) < 0.01 ? 'text-emerald-300' : 'text-yellow-300'
                              }`}
                            >
                              {Math.abs(order.total - order.paidAmount) < 0.01
                                ? 'المبلغ مطابق للإجمالي'
                                : `فرق الدفع: $${Math.abs(order.total - order.paidAmount).toFixed(2)}`}
                            </p>
                          )}
                        </td>
                        <td className="w-56 p-6 text-center">{renderStatusSelect(order, status, true)}</td>
                        <td className="p-6">{renderOrderActions(order, true)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-10 text-center sm:p-20">
            <PackageIcon className="mx-auto mb-4 h-16 w-16 text-gray-700 opacity-20" />
            <p className="font-bold text-gray-500">لا توجد طلبات في هذه المرحلة حاليًا.</p>
          </div>
        )}
      </div>

      <PaymentVerificationModal
        isOpen={isPaymentModalOpen}
        order={selectedOrder}
        onClose={() => setIsPaymentModalOpen(false)}
        onVerify={handleVerifyPayment}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={helpContent.orders.title}
        sections={helpContent.orders.sections}
      />
    </div>
  );
};

export default OrdersManagementPage;
