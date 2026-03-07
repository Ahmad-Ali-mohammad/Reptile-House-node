import React, { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import QuickCart from './components/QuickCart';
import BottomNavigation from './components/BottomNavigation';
import { AuthProvider } from './contexts/AuthContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { CartProvider } from './contexts/CartContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { useAuth } from './hooks/useAuth';
import { useSeoManager } from './hooks/useSeoManager';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const ShowcasePage = lazy(() => import('./pages/ShowcasePage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));
const OrdersHistoryPage = lazy(() => import('./pages/OrdersHistoryPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ShippingPolicyPage = lazy(() => import('./pages/ShippingPolicyPage'));
const ReturnPolicyPage = lazy(() => import('./pages/ReturnPolicyPage'));
const WarrantyPage = lazy(() => import('./pages/WarrantyPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const ArticleDetailsPage = lazy(() => import('./pages/ArticleDetailsPage'));
const OffersPage = lazy(() => import('./pages/OffersPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const SuppliesPage = lazy(() => import('./pages/SuppliesPage'));
const DashboardLayout = lazy(() => import('./pages/admin/DashboardLayout'));

export type Page = 'home' | 'login' | 'register' | 'profile' | 'wishlist' | 'showcase' | 'orders' | 'cart' | 'checkout' | 'orderConfirmation' | 'orderTracking' | 'forgotPassword' | 'resetPassword' | 'about' | 'contact' | 'shippingPolicy' | 'returnPolicy' | 'warranty' | 'privacy' | 'terms' | 'dashboard' | 'blog' | 'services' | 'offers' | 'supplies' | string;
export type AppMode = 'user' | 'dashboard';

const pathToPage = (pathname: string): string => {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return 'home';
  if (clean.startsWith('/product/')) return `product/${clean.split('/')[2]}`;
  if (clean.startsWith('/article/')) return `article/${clean.split('/')[2]}`;
  if (clean === '/shipping-policy') return 'shippingPolicy';
  if (clean === '/return-policy') return 'returnPolicy';
  if (clean === '/forgot-password') return 'forgotPassword';
  if (clean === '/reset-password') return 'resetPassword';
  if (clean === '/order-confirmation') return 'orderConfirmation';
  if (clean.startsWith('/order-tracking/')) return `orderTracking/${clean.split('/')[2] || ''}`;
  if (clean === '/order-tracking') return 'orderTracking';
  if (clean.startsWith('/dashboard/')) return `dashboard/${clean.replace('/dashboard/', '')}`;
  if (clean === '/dashboard') return 'dashboard';

  const map: Record<string, string> = {
    '/login': 'login',
    '/register': 'register',
    '/profile': 'profile',
    '/wishlist': 'wishlist',
    '/showcase': 'showcase',
    '/orders': 'orders',
    '/cart': 'cart',
    '/checkout': 'checkout',
    '/about': 'about',
    '/contact': 'contact',
    '/privacy': 'privacy',
    '/terms': 'terms',
    '/warranty': 'warranty',
    '/blog': 'blog',
    '/services': 'services',
    '/offers': 'offers',
    '/supplies': 'supplies',
  };
  return map[clean] || 'home';
};

const pageToPath = (page: string): string => {
  if (page.startsWith('product/')) return `/product/${page.split('/')[1] || ''}`;
  if (page.startsWith('article/')) return `/article/${page.split('/')[1] || ''}`;
  if (page.startsWith('dashboard/')) return `/dashboard/${page.replace('dashboard/', '')}`;
  if (page === 'dashboard') return '/dashboard';
  if (page === 'shippingPolicy') return '/shipping-policy';
  if (page === 'returnPolicy') return '/return-policy';
  if (page === 'forgotPassword') return '/forgot-password';
  if (page === 'resetPassword') return '/reset-password';
  if (page === 'orderConfirmation') return '/order-confirmation';
  if (page.startsWith('orderTracking/')) return `/order-tracking/${page.split('/')[1] || ''}`;
  if (page === 'orderTracking') return '/order-tracking';
  if (page === 'home') return '/';
  return `/${page}`;
};

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>(() => pathToPage(window.location.pathname));
  const [appMode, setAppMode] = useState<AppMode>('user');
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const { user } = useAuth();
  useSeoManager(currentPage, appMode);

  const dashboardInitialPage = currentPage.startsWith('dashboard/') ? currentPage.replace('dashboard/', '') : 'dashboard';

  const setPage = (page: string) => {
    setCurrentPage(page);
    const nextPath = pageToPath(page);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onPopState = () => setCurrentPage(pathToPage(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const isAdminRoute = currentPage.startsWith('dashboard');
    if (isAdminRoute) {
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        setPage('home');
        setAppMode('user');
      } else {
        setAppMode('dashboard');
      }
    } else {
      setAppMode('user');
    }
  }, [currentPage, user]);

  const renderPage = () => {
    if (currentPage.startsWith('product/')) {
      const id = parseInt(currentPage.split('/')[1], 10);
      return <ProductDetailsPage productId={id} setPage={setPage} />;
    }
    if (currentPage.startsWith('article/')) {
      const id = parseInt(currentPage.split('/')[1], 10);
      return <ArticleDetailsPage articleId={id} setPage={setPage} />;
    }
    if (currentPage.startsWith('orderTracking/')) {
      const id = currentPage.split('/')[1] || '';
      return <OrderTrackingPage setPage={setPage as any} orderId={id} />;
    }

    switch (currentPage) {
      case 'login': return <LoginPage setPage={setPage as any} />;
      case 'register': return <RegisterPage setPage={setPage as any} />;
      case 'profile': return <ProfilePage setPage={setPage as any} />;
      case 'wishlist': return <WishlistPage setPage={setPage as any} />;
      case 'showcase': return <ShowcasePage setPage={setPage as any} />;
      case 'orders': return <OrdersHistoryPage setPage={setPage as any} />;
      case 'cart': return <CartPage setPage={setPage as any} />;
      case 'checkout': return <CheckoutPage setPage={setPage as any} setLastOrderId={setLastOrderId} />;
      case 'orderConfirmation': return <OrderConfirmationPage setPage={setPage as any} orderId={lastOrderId} />;
      case 'orderTracking': return <OrderTrackingPage setPage={setPage as any} orderId={lastOrderId || ''} />;
      case 'forgotPassword': return <ForgotPasswordPage setPage={setPage as any} />;
      case 'resetPassword': return <ResetPasswordPage setPage={setPage as any} />;
      case 'about': return <AboutPage />;
      case 'contact': return <ContactPage />;
      case 'shippingPolicy': return <ShippingPolicyPage />;
      case 'returnPolicy': return <ReturnPolicyPage />;
      case 'warranty': return <WarrantyPage />;
      case 'privacy': return <PrivacyPage />;
      case 'terms': return <TermsPage />;
      case 'blog': return <BlogPage setPage={setPage as any} />;
      case 'services': return <ServicesPage />;
      case 'offers': return <OffersPage setPage={setPage as any} />;
      case 'supplies': return <SuppliesPage setPage={setPage as any} />;
      case 'home':
      default: return <HomePage setPage={setPage as any} />;
    }
  };

  const loadingFallback = (
    <div className="flex min-h-[40vh] items-center justify-center text-gray-300">جارٍ التحميل...</div>
  );

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-gray-900 pb-[5.25rem] text-white md:pb-0">
      <div className="absolute inset-0 bg-cover bg-center bg-fixed opacity-40 -z-10" style={{ backgroundImage: "url('/assets/photo_2026-02-04_07-13-35.jpg')", filter: 'blur(10px) brightness(0.3)' }} />

      {appMode === 'dashboard' ? (
        <Suspense fallback={loadingFallback}>
          <DashboardLayout setAppMode={setAppMode} setPage={setPage as any} initialPage={dashboardInitialPage as any} />
        </Suspense>
      ) : (
        <>
          <Header setPage={setPage as any} setAppMode={setAppMode} />
          <main className="container relative z-10 mx-auto flex-grow px-3 py-5 sm:px-4 sm:py-8 md:px-6 md:py-10">
            <Suspense fallback={loadingFallback}>
              {renderPage()}
            </Suspense>
          </main>
          <Footer setPage={setPage as any} />
          <QuickCart setPage={setPage as any} currentPage={currentPage} />
          <BottomNavigation currentPage={currentPage} setPage={setPage} user={user} />
        </>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <PreferencesProvider>
      <DatabaseProvider>
        <WishlistProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </WishlistProvider>
      </DatabaseProvider>
    </PreferencesProvider>
  </AuthProvider>
);

export default App;
