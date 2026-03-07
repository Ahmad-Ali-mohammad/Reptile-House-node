import React, { useMemo, useState } from 'react';
import { SearchIcon, EditIcon, TrashIcon, MailIcon } from '../../components/icons';
import { useDatabase } from '../../contexts/DatabaseContext';
import { User, UserRole } from '../../types';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { helpContent } from '../../constants/helpContent';
import { api, ApiError } from '../../services/api';

const CustomersManagementPage: React.FC = () => {
  const { users, orders, refreshData } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const filteredUsers = useMemo(() => users.filter((user) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = !normalizedSearch
      || user.name.toLowerCase().includes(normalizedSearch)
      || user.email.toLowerCase().includes(normalizedSearch);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  }), [filterRole, searchTerm, users]);

  const getCustomerStats = (userId: string) => {
    const customerOrders = orders
      .filter((order) => order.customerId === userId)
      .sort((left, right) => new Date(right.createdAt || right.date).getTime() - new Date(left.createdAt || left.date).getTime());
    const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);
    return {
      totalSpent,
      orderCount: customerOrders.length,
      lastOrder: customerOrders[0],
      recentOrders: customerOrders.slice(0, 5),
    };
  };

  const handleDeleteCustomer = async (userId: string) => {
    if (!globalThis.confirm('هل أنت متأكد من حذف هذا العميل؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }

    setBusyUserId(userId);
    setError('');
    try {
      await api.deleteUser(userId);
      refreshData();
      if (selectedCustomer?.id === userId) {
        setSelectedCustomer(null);
        setShowDetails(false);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر حذف العميل.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRoleChange = async (user: User, newRole: UserRole) => {
    setBusyUserId(user.id);
    setError('');
    try {
      await api.saveUser({ ...user, role: newRole });
      refreshData();
      if (selectedCustomer?.id === user.id) {
        setSelectedCustomer({ ...selectedCustomer, role: newRole });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تحديث دور العميل.');
    } finally {
      setBusyUserId(null);
    }
  };

  const getRoleBadgeClass = (role: string): string => {
    if (role === 'admin') return 'bg-red-500/20 text-red-300';
    if (role === 'manager') return 'bg-amber-500/20 text-amber-300';
    if (role === 'editor') return 'bg-blue-500/20 text-blue-300';
    return 'bg-green-500/20 text-green-300';
  };

  const getRoleLabel = (role: string): string => {
    if (role === 'admin') return 'مدير';
    if (role === 'manager') return 'مشرف';
    if (role === 'editor') return 'محرر';
    return 'عميل';
  };

  const averageSpent = users.length > 0
    ? Math.round(users.reduce((sum, user) => sum + getCustomerStats(user.id).totalSpent, 0) / users.length)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in text-right">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">إدارة العملاء</h1>
            <p className="text-gray-400">استعراض العملاء الحقيقيين، تعديل الأدوار، وحذف الحسابات من خلال واجهة مرتبطة مباشرة بالـ API.</p>
          </div>
          <HelpButton onClick={() => setIsHelpOpen(true)} />
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
          <div className="relative flex-1 sm:min-w-[260px]">
            <SearchIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="customer-search"
              name="customerSearch"
              type="search"
              placeholder="البحث عن عميل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-12 pl-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            id="customer-role-filter"
            name="customerRoleFilter"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">جميع الأدوار</option>
            <option value="user">عملاء</option>
            <option value="editor">محررون</option>
            <option value="manager">مشرفون</option>
            <option value="admin">مديرون</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-medium rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-gray-400">إجمالي العملاء</p>
          <p className="mt-2 text-2xl font-black text-white">{users.length}</p>
        </div>
        <div className="glass-medium rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-gray-400">العملاء النشطون</p>
          <p className="mt-2 text-2xl font-black text-green-300">{users.filter((user) => getCustomerStats(user.id).orderCount > 0).length}</p>
        </div>
        <div className="glass-medium rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-gray-400">عملاء جدد</p>
          <p className="mt-2 text-2xl font-black text-blue-300">{users.filter((user) => getCustomerStats(user.id).orderCount === 0).length}</p>
        </div>
        <div className="glass-medium rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-gray-400">متوسط الإنفاق</p>
          <p className="mt-2 text-2xl font-black text-amber-300">${averageSpent}</p>
        </div>
      </div>

      <div className="glass-medium rounded-2xl border border-white/10 overflow-hidden">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-right">
            <thead className="bg-white/5 text-xs uppercase tracking-widest text-gray-400">
              <tr>
                <th className="p-4">العميل</th>
                <th className="p-4">الدور</th>
                <th className="p-4">الطلبات</th>
                <th className="p-4">إجمالي الإنفاق</th>
                <th className="p-4">آخر طلب</th>
                <th className="p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const stats = getCustomerStats(user.id);
                return (
                  <tr key={user.id} className="border-t border-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-black text-white">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-white">{user.name}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${getRoleBadgeClass(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="p-4 text-white">{stats.orderCount}</td>
                    <td className="p-4 font-black text-amber-300">${stats.totalSpent.toFixed(2)}</td>
                    <td className="p-4 text-gray-300">{stats.lastOrder ? new Date(stats.lastOrder.createdAt || stats.lastOrder.date).toLocaleDateString('ar-SY') : 'لا يوجد'}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button onClick={() => { setSelectedCustomer(user); setShowDetails(true); }} className="rounded-lg bg-white/10 px-3 py-2 text-sm font-black text-white hover:bg-white/20">تفاصيل</button>
                        <select
                          id={`customer-role-${user.id}`}
                          name={`customerRole-${user.id}`}
                          value={user.role}
                          disabled={busyUserId === user.id}
                          onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="user">عميل</option>
                          <option value="editor">محرر</option>
                          <option value="manager">مشرف</option>
                          <option value="admin">مدير</option>
                        </select>
                        {user.role !== 'admin' && (
                          <button onClick={() => handleDeleteCustomer(user.id)} disabled={busyUserId === user.id} className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-black text-red-300 hover:bg-red-500/20">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 p-4 lg:hidden">
          {filteredUsers.map((user) => {
            const stats = getCustomerStats(user.id);
            return (
              <div key={user.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-white">{user.name}</h3>
                    <p className="mt-1 text-sm text-gray-400 break-all">{user.email}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${getRoleBadgeClass(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-300">
                  <p>عدد الطلبات: <span className="font-black text-white">{stats.orderCount}</span></p>
                  <p>إجمالي الإنفاق: <span className="font-black text-amber-300">${stats.totalSpent.toFixed(2)}</span></p>
                  <p>آخر طلب: {stats.lastOrder ? new Date(stats.lastOrder.createdAt || stats.lastOrder.date).toLocaleDateString('ar-SY') : 'لا يوجد'}</p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button onClick={() => { setSelectedCustomer(user); setShowDetails(true); }} className="rounded-lg bg-white/10 px-3 py-2 text-sm font-black text-white">تفاصيل</button>
                  <select
                    id={`customer-role-mobile-${user.id}`}
                    name={`customerRoleMobile-${user.id}`}
                    value={user.role}
                    disabled={busyUserId === user.id}
                    onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="user">عميل</option>
                    <option value="editor">محرر</option>
                    <option value="manager">مشرف</option>
                    <option value="admin">مدير</option>
                  </select>
                  {user.role !== 'admin' && (
                    <button onClick={() => handleDeleteCustomer(user.id)} disabled={busyUserId === user.id} className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-black text-red-300 sm:col-span-2">
                      حذف العميل
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showDetails && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDetails(false)} aria-hidden="true" />
          <div className="relative w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#11141b] p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-2xl font-black text-white">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedCustomer.name}</h2>
                  <p className="text-gray-400">{selectedCustomer.email}</p>
                </div>
              </div>
              <button onClick={() => setShowDetails(false)} className="self-end rounded-lg bg-white/10 px-3 py-2 text-sm font-black text-white sm:self-auto">إغلاق</button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-lg font-black text-amber-300">معلومات الحساب</h3>
                <div className="mt-4 space-y-3 text-sm text-gray-300">
                  <p>الدور: <span className="font-black text-white">{getRoleLabel(selectedCustomer.role)}</span></p>
                  <p>تاريخ الإنشاء: <span className="font-black text-white">{selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString('ar-SY') : 'غير متوفر'}</span></p>
                  <p>الحالة: <span className="font-black text-green-300">نشط</span></p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-lg font-black text-amber-300">إحصائيات الشراء</h3>
                <div className="mt-4 space-y-3 text-sm text-gray-300">
                  <p>عدد الطلبات: <span className="font-black text-white">{getCustomerStats(selectedCustomer.id).orderCount}</span></p>
                  <p>إجمالي الإنفاق: <span className="font-black text-amber-300">${getCustomerStats(selectedCustomer.id).totalSpent.toFixed(2)}</span></p>
                  <p>متوسط الطلب: <span className="font-black text-white">
                    {getCustomerStats(selectedCustomer.id).orderCount > 0
                      ? `$${(getCustomerStats(selectedCustomer.id).totalSpent / getCustomerStats(selectedCustomer.id).orderCount).toFixed(2)}`
                      : '$0.00'}
                  </span></p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-black text-amber-300">آخر الطلبات</h3>
              <div className="mt-4 space-y-3">
                {getCustomerStats(selectedCustomer.id).recentOrders.length > 0 ? (
                  getCustomerStats(selectedCustomer.id).recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between gap-4 rounded-xl bg-black/20 p-3">
                      <div>
                        <p className="font-black text-white">طلب #{order.id}</p>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt || order.date).toLocaleDateString('ar-SY')}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-black text-amber-300">${order.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{order.status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">لا توجد طلبات لهذا العميل بعد.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => globalThis.open(`mailto:${selectedCustomer.email}`)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-black text-gray-900 hover:bg-amber-400"
              >
                <MailIcon className="h-4 w-4" />
                إرسال بريد
              </button>
            </div>
          </div>
        </div>
      )}

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        content={helpContent.customers}
      />
    </div>
  );
};

export default CustomersManagementPage;
