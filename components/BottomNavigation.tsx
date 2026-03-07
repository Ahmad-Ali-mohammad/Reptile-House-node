import React from 'react';
import { DashboardIcon, ShoppingCartIcon, HeartIconOutline, UserIcon, SnakeIcon } from './icons';
import { useCart } from '../hooks/useCart';

interface BottomNavigationProps {
  currentPage: string;
  setPage: (page: string) => void;
  user: any;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentPage, setPage, user }) => {
  const { cart } = useCart();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: <DashboardIcon className="w-6 h-6" /> },
    { id: 'showcase', label: 'المعرض', icon: <SnakeIcon className="w-6 h-6" /> },
    { id: 'offers', label: 'العروض', icon: <DashboardIcon className="w-6 h-6" /> },
    { id: 'cart', label: 'السلة', icon: <ShoppingCartIcon className="w-6 h-6" />, badge: cartCount },
    { id: 'wishlist', label: 'المفضلة', icon: <HeartIconOutline className="w-6 h-6" /> },
    { id: user ? 'profile' : 'login', label: user ? 'حسابي' : 'تسجيل الدخول', icon: <UserIcon className="w-6 h-6" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-gray-900/90 px-2 pb-1 pt-1 backdrop-blur-lg md:hidden">
      <div className="flex h-[4.25rem] items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentPage === item.id || (item.id === 'home' && currentPage === '');
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`relative flex w-full min-w-0 flex-col items-center justify-center transition-all duration-300 ${isActive ? 'text-amber-400 -translate-y-1' : 'text-gray-400'}`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-gray-900">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mt-1 truncate text-[10px] font-bold">{item.label}</span>
              {isActive && <div className="absolute -bottom-1 h-1 w-1 rounded-full bg-amber-400 animate-pulse"></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
