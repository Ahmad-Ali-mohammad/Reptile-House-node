
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppMode } from '../../App';
import Sidebar from './Sidebar';
import AdminDashboardPage from './AdminDashboardPage';
import ProductsManagementPage from './ProductsManagementPage';
import OrdersManagementPage from './OrdersManagementPage';
import AnalyticsPage from './AnalyticsPage';
import InventoryPage from './InventoryPage';
import ShippingPage from './ShippingPage';
import UsersManagementPage from './UsersManagementPage';
import CustomersManagementPage from './CustomersManagementPage';
import MediaLibraryPage from './MediaLibraryPage';
import BlogManagementPage from './BlogManagementPage';
import HeroManagementPage from './HeroManagementPage';
import SettingsPage from './SettingsPage';
import ReportsPage from './ReportsPage';
import BackupPage from './BackupPage';
import ApiKeysPage from './ApiKeysPage';
import SuppliesManagementPage from './SuppliesManagementPage';
import ShamCashSettingsPage from './ShamCashSettingsPage';
import OffersManagementPage from './OffersManagementPage';
import ServicesManagementPage from './ServicesManagementPage';
import PoliciesManagementPage from './PoliciesManagementPage';
import FiltersManagementPage from './FiltersManagementPage';
import CompanyInfoManagementPage from './CompanyInfoManagementPage';
import ContactInfoManagementPage from './ContactInfoManagementPage';
import PageContentManagementPage from './PageContentManagementPage';
import SeoManagementPage from './SeoManagementPage';
import DatabaseStatusPage from './DatabaseStatusPage';
import { BellIcon, MenuIcon } from '../../components/icons';
import { Page } from '../../App';
import { ApiError, api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { DatabaseStatus, Order } from '../../types';
import { normalizePaymentStatus } from '../../utils/orderWorkflow';

const ADMIN_ORDER_NOTIFICATIONS_STORAGE_KEY = 'semo_admin_seen_order_ids';

const readSeenOrderIds = (): string[] => {
    try {
        const raw = globalThis.localStorage.getItem(ADMIN_ORDER_NOTIFICATIONS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
    } catch {
        return [];
    }
};

const writeSeenOrderIds = (ids: string[]) => {
    try {
        const uniqueIds = Array.from(new Set(ids.map((value) => String(value))));
        globalThis.localStorage.setItem(ADMIN_ORDER_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(uniqueIds.slice(-250)));
    } catch {
        // ignore storage failures
    }
};

export type DashboardPage = 'dashboard' | 'analytics' | 'reports' | 'products' | 'supplies_mgmt' | 'services' | 'inventory' | 'orders' | 'shipping' | 'users' | 'customers' | 'media' | 'blog_mgmt' | 'hero_mgmt' | 'offers' | 'policies' | 'filters' | 'company_info' | 'contact_info' | 'page_content' | 'seo' | 'settings' | 'apikeys' | 'backup' | 'shamcash_settings' | 'database_status';

interface DashboardLayoutProps {
    setAppMode: (mode: AppMode) => void;
    setPage: (page: Page) => void;
    initialPage: DashboardPage;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ setAppMode, setPage, initialPage }) => {
    const { user } = useAuth();
    const [activePage, setActivePage] = useState<DashboardPage>(initialPage || 'dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
    const [isDbStatusLoading, setIsDbStatusLoading] = useState(true);
    const [dbStatusError, setDbStatusError] = useState('');
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [orderNotifications, setOrderNotifications] = useState<Order[]>([]);
    const [pendingReviewCount, setPendingReviewCount] = useState(0);
    const [notificationsInitialized, setNotificationsInitialized] = useState(false);
    const canManageOrders = user?.role === 'admin' || user?.role === 'manager';

    useEffect(() => {
        if (initialPage && initialPage !== activePage) setActivePage(initialPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPage]);

    const loadDbStatus = useCallback(async () => {
        try {
            const nextStatus = await api.getDatabaseStatus({ includeDetails: false });
            setDbStatus(nextStatus);
            setDbStatusError('');
        } catch (error) {
            setDbStatus(null);
            if (error instanceof ApiError) {
                setDbStatusError(error.message);
            } else {
                setDbStatusError('تعذر فحص اتصال قاعدة البيانات.');
            }
        } finally {
            setIsDbStatusLoading(false);
        }
    }, []);

    const loadOrderNotifications = useCallback(async () => {
        if (!canManageOrders) {
            setOrderNotifications([]);
            setPendingReviewCount(0);
            setNotificationsInitialized(false);
            return;
        }

        try {
            const orders = (await api.getOrders())
                .map((order) => ({
                    ...order,
                    paymentVerificationStatus: normalizePaymentStatus(order.paymentVerificationStatus),
                }))
                .sort((left, right) => {
                    const leftDate = new Date(left.createdAt || left.date).getTime();
                    const rightDate = new Date(right.createdAt || right.date).getTime();
                    return rightDate - leftDate;
                });

            const pendingOrders = orders.filter((order) => order.paymentVerificationStatus === 'قيد المراجعة');
            setPendingReviewCount(pendingOrders.length);

            const seenIds = readSeenOrderIds();
            const seenIdSet = new Set(seenIds);

            if (!notificationsInitialized) {
                setOrderNotifications(pendingOrders.filter((order) => !seenIdSet.has(order.id)).slice(0, 10));
                setNotificationsInitialized(true);
                return;
            }

            const nextNotifications = pendingOrders.filter((order) => !seenIdSet.has(order.id)).slice(0, 10);
            setOrderNotifications(nextNotifications);
        } catch (error) {
            console.error('Failed to load admin order notifications:', error);
        }
    }, [canManageOrders, notificationsInitialized]);

    useEffect(() => {
        let isActive = true;

        const run = async () => {
            if (!isActive) return;
            await loadDbStatus();
        };

        run();
        const intervalId = window.setInterval(run, 30000);
        return () => {
            isActive = false;
            window.clearInterval(intervalId);
        };
    }, [loadDbStatus]);

    useEffect(() => {
        let isActive = true;

        const run = async () => {
            if (!isActive) return;
            await loadOrderNotifications();
        };

        run();
        const intervalId = window.setInterval(run, 15000);
        return () => {
            isActive = false;
            window.clearInterval(intervalId);
        };
    }, [loadOrderNotifications]);

    const renderContent = () => {
        switch (activePage) {
            case 'analytics': return <AnalyticsPage />;
            case 'reports': return <ReportsPage />;
            case 'products': return <ProductsManagementPage />;
            case 'supplies_mgmt': return <SuppliesManagementPage />;
            case 'services': return <ServicesManagementPage />;
            case 'inventory': return <InventoryPage />;
            case 'orders': return <OrdersManagementPage />;
            case 'shipping': return <ShippingPage />;
            case 'users': return <UsersManagementPage />;
            case 'customers': return <CustomersManagementPage />;
            case 'media': return <MediaLibraryPage />;
            case 'blog_mgmt': return <BlogManagementPage />;
            case 'hero_mgmt': return <HeroManagementPage />;
            case 'offers': return <OffersManagementPage />;
            case 'policies': return <PoliciesManagementPage />;
            case 'filters': return <FiltersManagementPage />;
            case 'company_info': return <CompanyInfoManagementPage />;
            case 'contact_info': return <ContactInfoManagementPage />;
            case 'page_content': return <PageContentManagementPage />;
            case 'seo': return <SeoManagementPage />;
            case 'settings': return <SettingsPage />;
            case 'apikeys': return <ApiKeysPage />;
            case 'backup': return <BackupPage />;
            case 'shamcash_settings': return <ShamCashSettingsPage setPage={setActivePage as any} />;
            case 'database_status': return <DatabaseStatusPage />;
            case 'dashboard':
            default: return <AdminDashboardPage />;
        }
    };

    const getPageTitle = () => {
        switch (activePage) {
            case 'analytics': return 'الإحصائيات والتحليلات';
            case 'products': return 'إدارة المنتجات';
            case 'supplies_mgmt': return 'إدارة المستلزمات';
            case 'services': return 'إدارة الخدمات';
            case 'inventory': return 'إدارة المخزون';
            case 'orders': return 'إدارة الطلبات';
            case 'shipping': return 'الشحن والتوصيل';
            case 'users': return 'إدارة المستخدمين';
            case 'media': return 'مكتبة الوسائط';
            case 'blog_mgmt': return 'إدارة المدونة والمحتوى';
            case 'hero_mgmt': return 'إدارة واجهة الموقع الرئيسية';
            case 'offers': return 'إدارة العروض الترويجية';
            case 'policies': return 'السياسات والضمانات';
            case 'filters': return 'إدارة الفلاتر الديناميكية';
            case 'company_info': return 'معلومات الشركة';
            case 'contact_info': return 'معلومات التواصل';
            case 'page_content': return 'إدارة محتوى الصفحات';
            case 'seo': return 'لوحة تحسين محركات البحث';
            case 'shamcash_settings': return 'إعدادات شام كاش';
            case 'database_status': return 'حالة قاعدة البيانات';
            default: return 'لوحة التحكم الرئيسية';
        }
    };

    const dbStatusBadge = useMemo(() => {
        if (isDbStatusLoading) {
            return {
                text: 'فحص قاعدة البيانات...',
                className: 'bg-amber-500/15 border-amber-400/30 text-amber-300'
            };
        }
        if (dbStatus?.connected) {
            return {
                text: 'قاعدة البيانات متصلة',
                className: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
            };
        }
        return {
            text: 'قاعدة البيانات غير متصلة',
            className: 'bg-red-500/15 border-red-400/30 text-red-300'
        };
    }, [dbStatus?.connected, isDbStatusLoading]);

    const handleOpenDbStatus = () => {
        setActivePage('database_status');
        setPage('dashboard/database_status' as Page);
    };

    const markNotificationsAsRead = useCallback((ids?: string[]) => {
        const targetIds = ids && ids.length > 0 ? ids : orderNotifications.map((order) => order.id);
        if (targetIds.length === 0) return;

        const nextSeenIds = [...readSeenOrderIds(), ...targetIds];
        writeSeenOrderIds(nextSeenIds);
        setOrderNotifications((current) => current.filter((order) => !targetIds.includes(order.id)));
    }, [orderNotifications]);

    const handleOpenOrdersPage = useCallback((orderId?: string) => {
        if (orderId) {
            markNotificationsAsRead([orderId]);
        }

        setIsNotificationsOpen(false);
        setActivePage('orders');
        setPage('dashboard/orders' as Page);
    }, [markNotificationsAsRead, setPage]);

    return (
        <div className="relative z-50 flex h-screen bg-[#0a0c10] overflow-hidden text-right" dir="rtl">
            {isSidebarOpen && (
                <button
                    type="button"
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden cursor-default"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-label="إغلاق القائمة الجانبية"
                />
            )}

            <div
                className={`fixed inset-y-0 right-0 z-[70] transform transition-transform duration-500 ease-out lg:relative lg:translate-x-0 lg:pointer-events-auto ${
                    isSidebarOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
                }`}
            >
                <Sidebar activePage={activePage} setActivePage={(p) => { setActivePage(p); setIsSidebarOpen(false); }} setAppMode={setAppMode} setPage={setPage} ordersBadgeCount={pendingReviewCount} />
            </div>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-gray-900/40 p-4 backdrop-blur-md sm:p-5 lg:flex-nowrap lg:p-6">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="rounded-xl bg-white/5 p-3 text-amber-500 lg:hidden"
                            aria-label="فتح القائمة الجانبية"
                        >
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        <div className="hidden min-w-0 lg:block">
                            <h1 className="text-xl font-black text-white">{getPageTitle()}</h1>
                        </div>
                    </div>
                    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:gap-3 lg:w-auto lg:flex-nowrap">
                        {canManageOrders && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsNotificationsOpen((current) => !current)}
                                    className={`relative inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${orderNotifications.length > 0 ? 'border-amber-400/30 bg-amber-500/10 text-amber-300' : 'border-white/10 bg-white/5 text-gray-300'}`}
                                    aria-label="إشعارات الطلبات الجديدة"
                                >
                                    <BellIcon className="h-5 w-5" />
                                    {orderNotifications.length > 0 && (
                                        <span className="absolute -top-1 -left-1 min-w-[1.5rem] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                                            {orderNotifications.length}
                                        </span>
                                    )}
                                </button>

                                {isNotificationsOpen && (
                                    <div className="absolute left-0 top-14 z-30 w-[min(24rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#11141b]/95 shadow-2xl backdrop-blur-xl sm:w-96 sm:max-w-none">
                                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                                            <div>
                                                <p className="text-sm font-black text-white">إشعارات الطلبات</p>
                                                <p className="text-xs text-gray-400">طلبات جديدة بانتظار مراجعة الدفع</p>
                                            </div>
                                            {orderNotifications.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => markNotificationsAsRead()}
                                                    className="text-xs font-bold text-amber-300 transition-colors hover:text-amber-200"
                                                >
                                                    تعليم الكل كمقروء
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-96 overflow-y-auto">
                                            {orderNotifications.length > 0 ? orderNotifications.map((order) => (
                                                <button
                                                    key={order.id}
                                                    type="button"
                                                    onClick={() => handleOpenOrdersPage(order.id)}
                                                    className="flex w-full flex-col gap-2 border-b border-white/5 px-5 py-4 text-right transition-colors hover:bg-white/5"
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="font-poppins text-sm font-black text-white">#{order.id}</span>
                                                        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-black text-amber-300">
                                                            جديد
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-100">{order.customerName || 'عميل المتجر'}</p>
                                                    <div className="flex items-center justify-between gap-4 text-xs text-gray-400">
                                                        <span>{order.date}</span>
                                                        <span className="font-poppins text-emerald-300">
                                                            ${typeof order.paidAmount === 'number' ? order.paidAmount.toFixed(2) : order.total.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </button>
                                            )) : (
                                                <div className="px-5 py-8 text-center text-sm font-bold text-gray-500">
                                                    لا توجد طلبات جديدة غير مقروءة.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleOpenDbStatus}
                            title={dbStatusError || 'عرض حالة قاعدة البيانات'}
                            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition-colors ${dbStatusBadge.className}`}
                        >
                            <span className={`w-2.5 h-2.5 rounded-full ${isDbStatusLoading ? 'bg-amber-300 animate-pulse' : dbStatus?.connected ? 'bg-emerald-300' : 'bg-red-300'}`} />
                            <span className="hidden sm:inline">{dbStatusBadge.text}</span>
                            <span className="sm:hidden">قاعدة البيانات</span>
                        </button>
                        <div className="font-poppins text-xs font-bold text-gray-500 sm:text-sm">{new Date().toLocaleDateString('ar-SY')}</div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent to-gray-900/20 p-4 scrollbar-hide sm:p-6 md:p-8 xl:p-10">
                    <div className="max-w-6xl mx-auto animate-fade-in">
                        {canManageOrders && orderNotifications.length > 0 && activePage !== 'orders' && (
                            <div className="mb-6 flex flex-col gap-4 rounded-[1.75rem] border border-amber-400/20 bg-amber-500/10 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="mb-1 text-sm font-black text-amber-300">هناك {orderNotifications.length} طلبات جديدة بانتظار مراجعتك</p>
                                    <p className="text-sm leading-relaxed text-gray-200">
                                        افتح صفحة الطلبات لمراجعة إثبات الدفع، اعتماد المبلغ المدفوع، ثم قبول أو رفض الطلب.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenOrdersPage()}
                                        className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-gray-900 transition-colors hover:bg-amber-400"
                                    >
                                        فتح الطلبات
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => markNotificationsAsRead()}
                                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-gray-200 transition-colors hover:bg-white/10"
                                    >
                                        تعليم كمقروء
                                    </button>
                                </div>
                            </div>
                        )}
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
