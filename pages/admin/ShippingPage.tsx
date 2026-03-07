import React, { useMemo, useState } from 'react';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { CheckCircleIcon, PackageIcon, TruckIcon } from '../../components/icons';
import { helpContent } from '../../constants/helpContent';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Order } from '../../types';
import { getCustomerDisplayName, getShippingSummary, isDeliveredToday, isShippingOrder, normalizeOrderStatus } from '../../utils/orderWorkflow';

const ShippingPage: React.FC = () => {
  const { orders, updateOrder } = useDatabase();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const normalizedOrders = useMemo(
    () =>
      [...orders].map((order) => ({
        ...order,
        status: normalizeOrderStatus(order.status),
      })),
    [orders],
  );

  const shippingOrders = useMemo(
    () => normalizedOrders.filter((order) => isShippingOrder(order)),
    [normalizedOrders],
  );

  const deliveredTodayCount = useMemo(
    () => normalizedOrders.filter((order) => isDeliveredToday(order)).length,
    [normalizedOrders],
  );

  const shippedCount = shippingOrders.filter((order) => order.status === 'تم الشحن').length;
  const readyToShipCount = shippingOrders.filter((order) => order.status === 'تم التأكيد').length;

  const handleStatusChange = (order: Order, nextStatus: Order['status']) => {
    if (nextStatus === 'قيد المعالجة') {
      alert('أعد إدارة الطلب من صفحة الطلبات إذا احتجت الرجوع لمرحلة المعالجة.');
      return;
    }

    updateOrder(order.id, nextStatus);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black">الشحن والتوصيل</h1>
          <p className="mt-2 text-gray-400">تعقب الطلبات المؤكدة حتى آخر مرحلة من التسليم.</p>
        </div>
        <HelpButton onClick={() => setIsHelpOpen(true)} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex items-center justify-between rounded-[2rem] border border-white/10 p-8 glass-medium">
          <div>
            <p className="mb-1 font-bold text-gray-400">جاهزة للشحن</p>
            <p className="font-poppins text-3xl font-black">{readyToShipCount}</p>
          </div>
          <div className="rounded-2xl bg-amber-500/10 p-4 text-amber-500">
            <PackageIcon className="h-8 w-8" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-[2rem] border border-white/10 p-8 glass-medium">
          <div>
            <p className="mb-1 font-bold text-gray-400">قيد التوصيل</p>
            <p className="font-poppins text-3xl font-black">{shippedCount}</p>
          </div>
          <div className="rounded-2xl bg-indigo-500/10 p-4 text-indigo-500">
            <TruckIcon className="h-8 w-8" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-[2rem] border border-white/10 p-8 glass-medium">
          <div>
            <p className="mb-1 font-bold text-gray-400">تم تسليمها اليوم</p>
            <p className="font-poppins text-3xl font-black">{deliveredTodayCount}</p>
          </div>
          <div className="rounded-2xl bg-green-500/10 p-4 text-green-500">
            <CheckCircleIcon className="h-8 w-8" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="px-2 text-xl font-black">الطلبات النشطة للشحن</h3>
        {shippingOrders.map((order) => (
          <div
            key={order.id}
            className="group flex flex-col gap-8 rounded-[2rem] border border-white/10 p-8 shadow-xl transition-all hover:border-amber-500/30 md:flex-row md:items-center glass-dark"
          >
            <div className="flex -space-x-4 space-x-reverse">
              {order.items.slice(0, 3).map((item, index) => (
                <img
                  key={`${item.reptileId}-${index}`}
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-16 w-16 rounded-2xl border-4 border-[#0a0c10] object-cover shadow-2xl"
                />
              ))}
            </div>

            <div className="flex-1 text-center md:text-right">
              <p className="mb-1 text-xs font-black uppercase tracking-widest text-gray-500">رقم الطلب</p>
              <h4 className="font-poppins text-2xl font-black">#{order.id}</h4>
              <p className="mt-2 text-sm text-gray-400">{order.date}</p>
            </div>

            <div className="flex-1 space-y-2 text-center md:text-right">
              <p className="font-bold text-white">{getCustomerDisplayName(order)}</p>
              <p className="max-w-md text-sm leading-relaxed text-gray-300">{getShippingSummary(order)}</p>
            </div>

            <div className="w-full md:w-64">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-amber-500/60">
                تحديث حالة التوصيل
              </label>
              <select
                id={`shipping-status-${order.id}`}
                name={`shippingStatus-${order.id}`}
                value={order.status}
                onChange={(event) => handleStatusChange(order, event.target.value as Order['status'])}
                className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 p-3 text-center text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="تم التأكيد">جاهز للشحن</option>
                <option value="تم الشحن">خرج للتوصيل</option>
                <option value="تم التوصيل">تم التوصيل</option>
              </select>
            </div>

            <div className="rounded-xl bg-amber-500 px-6 py-3 text-xs font-black text-gray-900 shadow-lg">
              ${order.total.toFixed(2)}
            </div>
          </div>
        ))}

        {shippingOrders.length === 0 && (
          <div className="rounded-[2rem] border-2 border-dashed border-white/5 py-20 text-center font-bold text-gray-600">
            لا توجد طلبات شحن نشطة حاليًا.
          </div>
        )}
      </div>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={helpContent.shipping?.title || 'الشحن والتوصيل'}
        sections={helpContent.shipping?.sections || []}
      />
    </div>
  );
};

export default ShippingPage;
