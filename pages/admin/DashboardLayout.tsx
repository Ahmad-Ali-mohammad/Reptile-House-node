
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
import { MenuIcon } from '../../components/icons';
import { Page } from '../../App';
import { ApiError, api } from '../../services/api';
import type { DatabaseStatus } from '../../types';

export type DashboardPage = 'dashboard' | 'analytics' | 'reports' | 'products' | 'supplies_mgmt' | 'services' | 'inventory' | 'orders' | 'shipping' | 'users' | 'customers' | 'media' | 'blog_mgmt' | 'hero_mgmt' | 'offers' | 'policies' | 'filters' | 'company_info' | 'contact_info' | 'page_content' | 'seo' | 'settings' | 'apikeys' | 'backup' | 'shamcash_settings' | 'database_status';

interface DashboardLayoutProps {
    setAppMode: (mode: AppMode) => void;
    setPage: (page: Page) => void;
    initialPage: DashboardPage;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ setAppMode, setPage, initialPage }) => {
    const [activePage, setActivePage] = useState<DashboardPage>(initialPage || 'dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
    const [isDbStatusLoading, setIsDbStatusLoading] = useState(true);
    const [dbStatusError, setDbStatusError] = useState('');

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

            <div className={`fixed inset-y-0 right-0 z-[70] transform transition-transform duration-500 ease-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <Sidebar activePage={activePage} setActivePage={(p) => { setActivePage(p); setIsSidebarOpen(false); }} setAppMode={setAppMode} setPage={setPage} />
            </div>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="flex items-center justify-between p-6 bg-gray-900/40 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-3 bg-white/5 rounded-xl text-amber-500"
                            aria-label="فتح القائمة الجانبية"
                        >
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        <div className="hidden lg:block">
                            <h1 className="text-xl font-black text-white">{getPageTitle()}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleOpenDbStatus}
                            title={dbStatusError || 'عرض حالة قاعدة البيانات'}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black transition-colors ${dbStatusBadge.className}`}
                        >
                            <span className={`w-2.5 h-2.5 rounded-full ${isDbStatusLoading ? 'bg-amber-300 animate-pulse' : dbStatus?.connected ? 'bg-emerald-300' : 'bg-red-300'}`} />
                            <span>{dbStatusBadge.text}</span>
                        </button>
                        <div className="text-sm font-bold text-gray-500 font-poppins">{new Date().toLocaleDateString('ar-SY')}</div>
                    </div>
                </header>

                <main className="flex-1 p-6 md:p-10 overflow-y-auto scrollbar-hide bg-gradient-to-b from-transparent to-gray-900/20">
                    <div className="max-w-6xl mx-auto animate-fade-in">{renderContent()}</div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
