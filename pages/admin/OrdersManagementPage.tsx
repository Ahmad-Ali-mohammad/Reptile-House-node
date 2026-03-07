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

const OrdersManagementPage: React.FC = () => {
  const { deleteOrder, orders, updateOrder, updateOrderPaymentStatus } = useDatabase();
  const [activeTab, setActiveTab] = useState('review');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const normalizedOrders = useMemo(
    () =>
      [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((order) => ({
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

  const handleVerifyPayment = (orderId: string, status: Order['paymentVerificationStatus'], reason?: string, paidAmount?: number) => {
    updateOrderPaymentStatus(orderId, status, reason, status === 'مقبول' ? 'تم التأكيد' : 'قيد المعالجة', paidAmount);
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 text-4xl font-black">إدارة الطلبات</h1>
          <p className="text-gray-400">مراجعة الدفع، تأكيد التنفيذ، ثم تمرير الطلب إلى الشحن والتسليم.</p>
        </div>
        <HelpButton onClick={() => setIsHelpOpen(true)} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[1.75rem] border border-amber-500/20 bg-amber-500/10 p-5">
          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-amber-300">1. مراجعة الطلب الجديد</p>
          <p className="text-sm leading-relaxed text-gray-200">
            عند وصول طلب جديد سيظهر في تبويب <span className="font-black text-white">مراجعة الدفع</span> مع صورة التحويل والمبلغ المدفوع.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-emerald-300">2. قبول أو رفض الدفع</p>
          <p className="text-sm leading-relaxed text-gray-200">
            قبول الدفع ينقل الطلب تلقائيًا إلى <span className="font-black text-white">تم التأكيد</span>، ورفضه يبقيه في المعالجة مع سبب الرفض.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-indigo-500/20 bg-indigo-500/10 p-5">
          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-indigo-300">3. التنفيذ والشحن</p>
          <p className="text-sm leading-relaxed text-gray-200">
            بعد القبول يحدّث المدير الحالة إلى <span className="font-black text-white">تم الشحن</span> ثم <span className="font-black text-white">تم التوصيل</span>.
          </p>
        </div>
      </div>

      <TabsSystem tabs={tabs} activeTabId={activeTab} onChange={setActiveTab} />

      <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#11141b]/60 p-6 shadow-2xl glass-medium">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
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
                  <tr key={order.id} className="group transition-all hover:bg-white/5">
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
                      <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${getPaymentStatusClasses(paymentStatus)}`}>
                        <span>{getPaymentStatusIcon(paymentStatus)}</span>
                        {paymentStatus}
                      </div>
                      <p className="mt-3 text-sm font-poppins font-black text-emerald-400">
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
                        <p className={`mt-2 text-xs font-bold ${Math.abs(order.total - order.paidAmount) < 0.01 ? 'text-emerald-300' : 'text-yellow-300'}`}>
                          {Math.abs(order.total - order.paidAmount) < 0.01
                            ? 'المبلغ مطابق للإجمالي'
                            : `فرق الدفع: $${Math.abs(order.total - order.paidAmount).toFixed(2)}`}
                        </p>
                      )}
                    </td>
                    <td className="w-56 p-6 text-center">
                      <select
                        value={status}
                        onChange={(event) => handleStatusChange(order, event.target.value as Order['status'])}
                        className={`w-full appearance-none rounded-xl border p-3 text-center text-[11px] font-black transition-all focus:ring-2 focus:ring-amber-500/50 ${getOrderStatusClasses(status)}`}
                        aria-label={`تغيير حالة الطلب ${order.id}`}
                      >
                        <option value="قيد المعالجة">قيد المعالجة</option>
                        <option value="تم التأكيد">تم التأكيد</option>
                        <option value="تم الشحن">تم الشحن</option>
                        <option value="تم التوصيل">تم التوصيل</option>
                      </select>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-start gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        {order.paymentConfirmationImage && (
                          <button
                            onClick={() => handleOpenPaymentModal(order)}
                            className="rounded-xl border border-blue-500/10 bg-blue-500/10 p-3 text-blue-400 transition-all hover:bg-blue-500 hover:text-white"
                            title="مراجعة الدفع"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="rounded-xl border border-red-500/10 bg-red-500/10 p-3 text-red-400 transition-all hover:bg-red-500 hover:text-white"
                          title="حذف الطلب"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="p-20 text-center">
              <PackageIcon className="mx-auto mb-4 h-16 w-16 text-gray-700 opacity-20" />
              <p className="font-bold text-gray-500">لا توجد طلبات في هذه المرحلة حاليًا.</p>
            </div>
          )}
        </div>
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
