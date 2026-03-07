import React, { useState, useRef, useEffect } from 'react';
import { UserIcon, LogoutIcon, ShoppingCartIcon, DashboardIcon, ChevronDownIcon } from './icons';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { Page, AppMode } from '../App';

interface HeaderProps {
  setPage: (page: Page) => void;
  setAppMode: (mode: AppMode) => void;
}

const Header: React.FC<HeaderProps> = ({ setPage, setAppMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: 'الرئيسية', page: 'home' as Page },
    { name: 'المعرض', page: 'showcase' as Page },
    { name: 'المستلزمات', page: 'supplies' as Page },
    { name: 'الخدمات', page: 'services' as Page },
    { name: 'العروض', page: 'offers' as Page },
    { name: 'المدونة', page: 'blog' as Page },
    { name: 'من نحن', page: 'about' as Page },
    { name: 'اتصل بنا', page: 'contact' as Page }
  ];

  const handleLinkClick = (e: React.MouseEvent, page: Page) => {
    e.preventDefault();
    setPage(page);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:h-20 sm:px-4">
          <a href="#" onClick={(e) => handleLinkClick(e, 'home')} className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg sm:h-10 sm:w-10">
              <img src="/assets/photo_2026-02-04_07-13-35.jpg" alt="بيت الزواحف" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black leading-none text-amber-400 sm:text-xl">بيت</span>
              <span className="mt-1 text-xs font-bold leading-none text-white sm:text-sm">الزواحف</span>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a key={link.name} href="#" onClick={(e) => handleLinkClick(e, link.page)} className="text-gray-300 hover:text-white font-black text-sm transition-colors">
                {link.name}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={(e) => handleLinkClick(e, 'cart')} className="relative p-1.5 text-gray-300 hover:text-white sm:p-2" aria-label="السلة">
              <ShoppingCartIcon className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-gray-900">
                  {cart.length}
                </span>
              )}
            </button>
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5" aria-label="قائمة المستخدم">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-xs font-black text-gray-900">{user.name.charAt(0)}</div>
                  <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute start-0 mt-2 w-52 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
                    <a href="#" onClick={(e) => { handleLinkClick(e, 'profile'); setIsUserMenuOpen(false); }} className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5"><UserIcon className="w-4 h-4 me-3 text-amber-500" /> الملف الشخصي</a>
                    {(user.role === 'admin' || user.role === 'manager') && (
                      <a href="#" onClick={(e) => { handleLinkClick(e, 'dashboard'); setIsUserMenuOpen(false); }} className="flex items-center px-4 py-2 text-sm text-amber-400 font-black hover:bg-amber-500/10"><DashboardIcon className="w-4 h-4 me-3" /> لوحة الإدارة</a>
                    )}
                    <button onClick={(e) => { e.preventDefault(); logout(); setPage('home'); setIsUserMenuOpen(false); }} className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/5"><LogoutIcon className="w-4 h-4 me-3" /> تسجيل الخروج</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={(e) => handleLinkClick(e, 'login')} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-gray-900 sm:px-6 sm:text-sm">تسجيل الدخول</button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
