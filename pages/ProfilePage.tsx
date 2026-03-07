
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Page } from '../App';
import { UserIcon, MapPinIcon, BellIcon } from '../components/icons';
import ProfileInfo from '../components/ProfileInfo';
import Addresses from '../components/Addresses';
import Notifications from '../components/Notifications';

type ProfileTab = 'info' | 'addresses' | 'notifications';

interface ProfilePageProps {
    setPage: (page: Page) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ setPage }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">يرجى تسجيل الدخول لعرض ملفك الشخصي.</h2>
      </div>
    );
  }
  
  const renderTabContent = () => {
      switch (activeTab) {
          case 'addresses':
              return <Addresses />;
          case 'notifications':
              return <Notifications />;
          case 'info':
          default:
              return <ProfileInfo user={user} />;
      }
  }

  const tabs: { id: ProfileTab, name: string, icon: React.ReactNode }[] = [
      { id: 'info', name: 'المعلومات الشخصية', icon: <UserIcon className="w-5 h-5 me-2"/> },
      { id: 'addresses', name: 'العناوين', icon: <MapPinIcon className="w-5 h-5 me-2"/> },
      { id: 'notifications', name: 'الإشعارات', icon: <BellIcon className="w-5 h-5 me-2"/> },
  ];

  return (
    <div className="mx-auto max-w-5xl pb-20 md:pb-0">
        <h1 className="mb-6 text-center text-3xl font-bold sm:mb-8 sm:text-4xl">إعدادات الحساب</h1>
        <div className="flex flex-col gap-5 md:flex-row md:gap-8">
            <aside className="md:w-1/4">
                <div className="sticky top-24 rounded-2xl border border-white/20 bg-white/5 p-3 backdrop-blur-lg sm:p-4">
                   <nav className="flex flex-wrap gap-2 md:flex-col">
                       {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex min-w-0 items-center text-right p-3 rounded-lg transition-colors md:w-full ${activeTab === tab.id ? 'bg-amber-500/30 text-amber-300' : 'hover:bg-white/10'}`}
                            >
                                {tab.icon}
                                <span className="truncate text-sm font-bold sm:text-base">{tab.name}</span>
                            </button>
                       ))}
                   </nav>
                </div>
            </aside>
            <main className="md:w-3/4">
                <div className="min-h-[400px] rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-lg sm:p-8">
                    {renderTabContent()}
                </div>
            </main>
        </div>
    </div>
  );
};

export default ProfilePage;
