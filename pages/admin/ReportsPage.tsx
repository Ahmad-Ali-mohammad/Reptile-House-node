import React, { useMemo, useState } from 'react';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { PackageIcon, SearchIcon, UserIcon } from '../../components/icons';
import { helpContent } from '../../constants/helpContent';
import { useDatabase } from '../../contexts/DatabaseContext';
import { getCustomerDisplayName, normalizeOrderStatus, normalizePaymentStatus } from '../../utils/orderWorkflow';

type ReportType = 'sales' | 'orders' | 'customers' | 'inventory' | 'performance';

const reportTypes: Array<{ value: ReportType; label: string; icon: string }> = [
  { value: 'sales', label: 'تقرير المبيعات', icon: '💰' },
  { value: 'orders', label: 'تقرير الطلبات', icon: '📋' },
  { value: 'customers', label: 'تقرير العملاء', icon: '👥' },
  { value: 'inventory', label: 'تقرير المخزون', icon: '📦' },
  { value: 'performance', label: 'تقرير الأداء', icon: '⚡' },
];

const periods = [
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'الأسبوع' },
  { value: 'month', label: 'الشهر' },
  { value: 'quarter', label: 'الربع' },
  { value: 'year', label: 'السنة' },
  { value: 'custom', label: 'مخصص' },
] as const;

type PeriodValue = (typeof periods)[number]['value'];

const toDateOnly = (value: Date) => value.toISOString().split('T')[0];

const summaryGridClass = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4';

const ReportsPage: React.FC = () => {
  const { orders, products, supplies, users } = useDatabase();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodValue>('month');
  const [selectedReport, setSelectedReport] = useState<ReportType>('sales');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: toDateOnly(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    end: toDateOnly(new Date()),
  });

  const filteredOrders = useMemo(() => {
    const today = new Date();
    let rangeStart = new Date(dateRange.start);
    let rangeEnd = new Date(dateRange.end);

    if (selectedPeriod !== 'custom') {
      rangeEnd = today;
      rangeStart = new Date(today);

      if (selectedPeriod === 'today') {
        rangeStart.setHours(0, 0, 0, 0);
      } else if (selectedPeriod === 'week') {
        rangeStart.setDate(today.getDate() - 7);
      } else if (selectedPeriod === 'month') {
        rangeStart.setDate(today.getDate() - 30);
      } else if (selectedPeriod === 'quarter') {
        rangeStart.setDate(today.getDate() - 90);
      } else if (selectedPeriod === 'year') {
        rangeStart.setFullYear(today.getFullYear() - 1);
      }
    }

    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);

    return orders
      .map((order) => ({
        ...order,
        status: normalizeOrderStatus(order.status),
        paymentVerificationStatus: normalizePaymentStatus(order.paymentVerificationStatus),
      }))
      .filter((order) => {
        const orderDate = new Date(order.date);
        return orderDate >= rangeStart && orderDate <= rangeEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dateRange.end, dateRange.start, orders, selectedPeriod]);

  const salesSummary = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const acceptedPayments = filteredOrders.filter((order) => order.paymentVerificationStatus === 'مقبول');
    const acceptedRevenue = acceptedPayments.reduce(
      (sum, order) => sum + (typeof order.paidAmount === 'number' ? order.paidAmount : order.total),
      0,
    );
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const byDate = filteredOrders.reduce<Record<string, { revenue: number; orders: number }>>((accumulator, order) => {
      const key = order.date;
      if (!accumulator[key]) {
        accumulator[key] = { revenue: 0, orders: 0 };
      }

      accumulator[key].revenue += order.total;
      accumulator[key].orders += 1;
      return accumulator;
    }, {});

    const timeline = Object.entries(byDate)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, value]) => ({ date, ...value }));

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      acceptedRevenue,
      acceptedPayments: acceptedPayments.length,
      timeline,
    };
  }, [filteredOrders]);

  const customerSummary = useMemo(() => {
    const customerMap = filteredOrders.reduce<
      Record<
        string,
        {
          name: string;
          email: string;
          orders: number;
          totalSpent: number;
          lastOrder: string;
        }
      >
    >((accumulator, order) => {
      const key = order.customerId || order.customerEmail || order.id;
      if (!accumulator[key]) {
        accumulator[key] = {
          name: getCustomerDisplayName(order),
          email: order.customerEmail || 'غير متوفر',
          orders: 0,
          totalSpent: 0,
          lastOrder: order.date,
        };
      }

      accumulator[key].orders += 1;
      accumulator[key].totalSpent += order.total;
      if (new Date(order.date) > new Date(accumulator[key].lastOrder)) {
        accumulator[key].lastOrder = order.date;
      }

      return accumulator;
    }, {});

    return Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [filteredOrders]);

  const orderStatusSummary = useMemo(
    () =>
      filteredOrders.reduce<Record<string, number>>((accumulator, order) => {
        accumulator[order.status] = (accumulator[order.status] || 0) + 1;
        return accumulator;
      }, {}),
    [filteredOrders],
  );

  const paymentStatusSummary = useMemo(
    () =>
      filteredOrders.reduce<Record<string, number>>((accumulator, order) => {
        accumulator[order.paymentVerificationStatus] = (accumulator[order.paymentVerificationStatus] || 0) + 1;
        return accumulator;
      }, {}),
    [filteredOrders],
  );

  const inventorySummary = useMemo(() => {
    const availableProducts = products.filter((product) => product.status !== 'غير متوفر').length;
    const unavailableProducts = products.filter((product) => product.status === 'غير متوفر').length;
    const availableSupplies = supplies.filter((supply) => supply.isAvailable).length;
    const unavailableSupplies = supplies.filter((supply) => !supply.isAvailable).length;

    return {
      totalProducts: products.length,
      availableProducts,
      unavailableProducts,
      totalSupplies: supplies.length,
      availableSupplies,
      unavailableSupplies,
      lowStockSupplies: supplies.filter((supply) => !supply.isAvailable).slice(0, 10),
    };
  }, [products, supplies]);

  const performanceSummary = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const acceptedPayments = filteredOrders.filter((order) => order.paymentVerificationStatus === 'مقبول').length;
    const rejectedPayments = filteredOrders.filter((order) => order.paymentVerificationStatus === 'مرفوض').length;
    const deliveredOrders = filteredOrders.filter((order) => order.status === 'تم التوصيل').length;

    return {
      totalOrders,
      paymentAcceptanceRate: totalOrders > 0 ? (acceptedPayments / totalOrders) * 100 : 0,
      paymentRejectionRate: totalOrders > 0 ? (rejectedPayments / totalOrders) * 100 : 0,
      deliveryCompletionRate: totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0,
      usersCount: users.length,
    };
  }, [filteredOrders, users.length]);

  const renderSalesReport = () => (
    <div className="space-y-6">
      <div className={summaryGridClass}>
        <SummaryCard label="إجمالي المبيعات" value={`$${salesSummary.totalRevenue.toFixed(2)}`} accent="green" icon="💰" />
        <SummaryCard label="عدد الطلبات" value={String(salesSummary.totalOrders)} accent="blue" icon="📦" />
        <SummaryCard label="متوسط الطلب" value={`$${salesSummary.averageOrderValue.toFixed(2)}`} accent="amber" icon="📈" />
        <SummaryCard label="المدفوع المؤكد" value={`$${salesSummary.acceptedRevenue.toFixed(2)}`} accent="purple" icon="✅" />
      </div>

      <Card title="الحركة اليومية">
        <DataTable
          headers={['التاريخ', 'الإيراد', 'عدد الطلبات', 'متوسط الطلب']}
          rows={salesSummary.timeline.map((day) => [
            new Date(day.date).toLocaleDateString('ar-SY'),
            `$${day.revenue.toFixed(2)}`,
            String(day.orders),
            `$${(day.revenue / day.orders).toFixed(2)}`,
          ])}
          emptyLabel="لا توجد بيانات مبيعات ضمن الفترة المختارة."
        />
      </Card>
    </div>
  );

  const renderOrdersReport = () => (
    <div className="space-y-6">
      <div className={summaryGridClass}>
        <SummaryCard label="قيد المعالجة" value={String(orderStatusSummary['قيد المعالجة'] || 0)} accent="amber" icon="⏳" />
        <SummaryCard label="تم التأكيد" value={String(orderStatusSummary['تم التأكيد'] || 0)} accent="indigo" icon="📋" />
        <SummaryCard label="تم الشحن" value={String(orderStatusSummary['تم الشحن'] || 0)} accent="blue" icon="🚚" />
        <SummaryCard label="تم التوصيل" value={String(orderStatusSummary['تم التوصيل'] || 0)} accent="green" icon="✅" />
      </div>

      <Card title="الطلبات ضمن الفترة">
        <DataTable
          headers={['رقم الطلب', 'العميل', 'التاريخ', 'الإجمالي', 'المدفوع', 'حالة الدفع', 'الحالة']}
          rows={filteredOrders.map((order) => [
            order.id,
            getCustomerDisplayName(order),
            new Date(order.date).toLocaleDateString('ar-SY'),
            `$${order.total.toFixed(2)}`,
            `$${(typeof order.paidAmount === 'number' ? order.paidAmount : 0).toFixed(2)}`,
            order.paymentVerificationStatus,
            order.status,
          ])}
          emptyLabel="لا توجد طلبات ضمن الفترة المختارة."
        />
      </Card>
    </div>
  );

  const renderCustomersReport = () => (
    <div className="space-y-6">
      <div className={summaryGridClass}>
        <SummaryCard label="عدد العملاء النشطين" value={String(customerSummary.length)} accent="blue" icon={<UserIcon className="h-6 w-6" />} />
        <SummaryCard label="إجمالي المستخدمين" value={String(users.length)} accent="purple" icon="👥" />
        <SummaryCard
          label="أعلى إنفاق"
          value={customerSummary[0] ? `$${customerSummary[0].totalSpent.toFixed(2)}` : '$0.00'}
          accent="amber"
          icon="🏆"
        />
        <SummaryCard
          label="متوسط إنفاق العميل"
          value={
            customerSummary.length
              ? `$${(customerSummary.reduce((sum, customer) => sum + customer.totalSpent, 0) / customerSummary.length).toFixed(2)}`
              : '$0.00'
          }
          accent="green"
          icon="📈"
        />
      </div>

      <Card title="أفضل العملاء">
        <DataTable
          headers={['العميل', 'البريد', 'عدد الطلبات', 'إجمالي الإنفاق', 'آخر طلب']}
          rows={customerSummary.map((customer) => [
            customer.name,
            customer.email,
            String(customer.orders),
            `$${customer.totalSpent.toFixed(2)}`,
            new Date(customer.lastOrder).toLocaleDateString('ar-SY'),
          ])}
          emptyLabel="لا يوجد نشاط عملاء ضمن الفترة المختارة."
        />
      </Card>
    </div>
  );

  const renderInventoryReport = () => (
    <div className="space-y-6">
      <div className={summaryGridClass}>
        <SummaryCard label="إجمالي الزواحف" value={String(inventorySummary.totalProducts)} accent="green" icon={<PackageIcon className="h-6 w-6" />} />
        <SummaryCard label="زواحف متاحة" value={String(inventorySummary.availableProducts)} accent="blue" icon="🦎" />
        <SummaryCard label="إجمالي المستلزمات" value={String(inventorySummary.totalSupplies)} accent="amber" icon="📦" />
        <SummaryCard label="مستلزمات غير متوفرة" value={String(inventorySummary.unavailableSupplies)} accent="red" icon="⚠️" />
      </div>

      <Card title="المستلزمات التي تحتاج متابعة">
        <DataTable
          headers={['الاسم', 'الفئة', 'السعر', 'الحالة']}
          rows={inventorySummary.lowStockSupplies.map((supply) => [
            supply.name,
            supply.category,
            `$${supply.price.toFixed(2)}`,
            supply.status,
          ])}
          emptyLabel="كل المستلزمات متوفرة حاليًا."
        />
      </Card>
    </div>
  );

  const renderPerformanceReport = () => (
    <div className="space-y-6">
      <div className={summaryGridClass}>
        <SummaryCard label="نسبة قبول الدفع" value={`${performanceSummary.paymentAcceptanceRate.toFixed(1)}%`} accent="green" icon="✅" />
        <SummaryCard label="نسبة رفض الدفع" value={`${performanceSummary.paymentRejectionRate.toFixed(1)}%`} accent="red" icon="❌" />
        <SummaryCard label="نسبة إتمام التسليم" value={`${performanceSummary.deliveryCompletionRate.toFixed(1)}%`} accent="blue" icon="🚚" />
        <SummaryCard label="الطلبات في التقرير" value={String(performanceSummary.totalOrders)} accent="amber" icon="📊" />
      </div>

      <Card title="مؤشرات الأداء">
        <DataTable
          headers={['المؤشر', 'القيمة']}
          rows={[
            ['إجمالي الطلبات ضمن الفترة', String(performanceSummary.totalOrders)],
            ['المدفوعات قيد المراجعة', String(paymentStatusSummary['قيد المراجعة'] || 0)],
            ['المدفوعات المقبولة', String(paymentStatusSummary['مقبول'] || 0)],
            ['المدفوعات المرفوضة', String(paymentStatusSummary['مرفوض'] || 0)],
            ['إجمالي المقبوض المؤكد', `$${salesSummary.acceptedRevenue.toFixed(2)}`],
            ['الطلبات المكتملة', String(orderStatusSummary['تم التوصيل'] || 0)],
            ['إجمالي المستخدمين', String(performanceSummary.usersCount)],
          ]}
          emptyLabel="لا توجد مؤشرات أداء حالية."
        />
      </Card>
    </div>
  );

  const renderReport = () => {
    switch (selectedReport) {
      case 'orders':
        return renderOrdersReport();
      case 'customers':
        return renderCustomersReport();
      case 'inventory':
        return renderInventoryReport();
      case 'performance':
        return renderPerformanceReport();
      default:
        return renderSalesReport();
    }
  };

  return (
    <div className="animate-fade-in space-y-8 overflow-hidden">
      <div className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">التقارير</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400 sm:text-base">
            تقارير تشغيلية مباشرة مبنية على الطلبات والعملاء والمخزون، مع عرض مناسب للموبايل والتابلت دون إخفاء أي
            بيانات أساسية.
          </p>
        </div>
        <HelpButton onClick={() => setIsHelpOpen(true)} />
      </div>

      <div className="rounded-[2rem] border border-white/10 p-4 glass-medium sm:p-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-400">الفترة</label>
            <select
              id="report-period"
              name="reportPeriod"
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value as PeriodValue)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-400">من</label>
            <input
              id="report-start-date"
              name="reportStartDate"
              type="date"
              value={dateRange.start}
              onChange={(event) => setDateRange((current) => ({ ...current, start: event.target.value }))}
              disabled={selectedPeriod !== 'custom'}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-400">إلى</label>
            <input
              id="report-end-date"
              name="reportEndDate"
              type="date"
              value={dateRange.end}
              onChange={(event) => setDateRange((current) => ({ ...current, end: event.target.value }))}
              disabled={selectedPeriod !== 'custom'}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
            />
          </div>

          <div className="flex items-end">
            <div className="relative w-full">
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <div className="rounded-xl border border-white/10 bg-white/5 py-3 pr-4 pl-12 text-sm text-gray-400 break-words">
                {filteredOrders.length} طلب داخل التقرير الحالي
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {reportTypes.map((report) => (
          <button
            key={report.value}
            type="button"
            onClick={() => setSelectedReport(report.value)}
            className={`w-full rounded-xl px-4 py-3 text-sm font-black transition-all ${
              selectedReport === report.value
                ? 'bg-amber-500 text-gray-900'
                : 'border border-white/10 bg-white/5 text-gray-300 hover:border-amber-500/40 hover:text-white'
            }`}
          >
            <span className="ml-2">{report.icon}</span>
            {report.label}
          </button>
        ))}
      </div>

      {renderReport()}

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={helpContent.reports?.title || 'التقارير'}
        sections={helpContent.reports?.sections || []}
      />
    </div>
  );
};

type SummaryCardProps = {
  label: string;
  value: string;
  accent: 'green' | 'blue' | 'amber' | 'purple' | 'red' | 'indigo';
  icon: React.ReactNode;
};

const accentMap: Record<SummaryCardProps['accent'], string> = {
  green: 'bg-green-500/20 text-green-400',
  blue: 'bg-blue-500/20 text-blue-400',
  amber: 'bg-amber-500/20 text-amber-400',
  purple: 'bg-purple-500/20 text-purple-400',
  red: 'bg-red-500/20 text-red-400',
  indigo: 'bg-indigo-500/20 text-indigo-400',
};

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, accent, icon }) => (
  <div className="rounded-2xl border border-white/10 p-4 glass-medium sm:p-6">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="mt-2 break-words text-2xl font-black text-white">{value}</p>
      </div>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accentMap[accent]}`}>{icon}</div>
    </div>
  </div>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="overflow-hidden rounded-2xl border border-white/10 glass-medium">
    <div className="border-b border-white/10 p-4 sm:p-6">
      <h3 className="text-lg font-black text-white">{title}</h3>
    </div>
    <div>{children}</div>
  </div>
);

const DataTable: React.FC<{
  headers: string[];
  rows: string[][];
  emptyLabel: string;
}> = ({ headers, rows, emptyLabel }) => {
  if (!rows.length) {
    return <div className="p-8 text-center font-bold text-gray-500 sm:p-10">{emptyLabel}</div>;
  }

  return (
    <div>
      <div className="grid gap-3 p-4 sm:p-6 lg:hidden">
        {rows.map((row, index) => (
          <article key={index} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            {row.map((cell, cellIndex) => (
              <div
                key={`${index}-${cellIndex}`}
                className="flex items-start justify-between gap-4 border-b border-white/10 py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <span className="text-xs font-black uppercase tracking-widest text-gray-500">{headers[cellIndex]}</span>
                <span className="max-w-[65%] break-words text-left text-sm font-medium text-white">{cell}</span>
              </div>
            ))}
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-[760px] w-full">
          <thead className="bg-white/5">
            <tr>
              {headers.map((header) => (
                <th key={header} className="p-4 text-right text-sm font-black uppercase tracking-widest text-gray-400">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-white/5 transition-colors hover:bg-white/5">
                {row.map((cell, cellIndex) => (
                  <td key={`${index}-${cellIndex}`} className="p-4 align-top break-words text-white">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsPage;
