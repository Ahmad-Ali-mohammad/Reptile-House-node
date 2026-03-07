
import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsSystemProps {
  tabs: TabItem[];
  activeTabId: string;
  onChange: (id: string) => void;
}

const TabsSystem: React.FC<TabsSystemProps> = ({ tabs, activeTabId, onChange }) => {
  const desktopGridStyle = tabs.length > 0
    ? { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }
    : undefined;

  return (
    <div className="w-full mb-8">
      <div
        className="glass-light flex items-center gap-2 overflow-x-auto rounded-[2rem] border border-white/10 p-2 shadow-2xl scrollbar-hide xl:grid xl:gap-0"
        style={desktopGridStyle}
      >
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`group relative flex flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3 text-right transition-all duration-500 sm:px-6 xl:min-w-0 xl:px-5 ${
                isActive 
                  ? 'bg-amber-500 text-gray-900 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-100 z-10' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10 scale-95 opacity-80'
              }`}
            >
              {tab.icon && <span className="text-xl transition-transform duration-300 group-hover:scale-125 sm:text-2xl">{tab.icon}</span>}
              <span className="whitespace-nowrap text-sm font-black tracking-wide">{tab.label}</span>
              
              {tab.badge !== undefined && (
                <span className={`ms-3 px-2.5 py-1 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-gray-900 text-amber-500' : 'bg-amber-500/30 text-amber-400'
                }`}>
                  {tab.badge}
                </span>
              )}

              {isActive && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
              )}
              
              {/* Hover Glow Effect */}
              {!isActive && (
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabsSystem;
