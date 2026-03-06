import React from 'react';

interface PageNotAvailableProps {
  title?: string;
}

const PageNotAvailable: React.FC<PageNotAvailableProps> = ({ title = 'الصفحة غير متاحة حالياً' }) => {
  return (
    <div className="max-w-3xl mx-auto py-20 text-center animate-fade-in">
      <div className="glass-medium border border-white/10 rounded-[2rem] p-10">
        <h1 className="text-3xl md:text-4xl font-black mb-4">{title}</h1>
        <p className="text-gray-400 font-bold">تم تعطيل هذه الصفحة من لوحة الإدارة حالياً.</p>
      </div>
    </div>
  );
};

export default PageNotAvailable;
