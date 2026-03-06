import React from 'react';
import PolicyPage from '../components/PolicyPage';
import PageNotAvailable from '../components/PageNotAvailable';
import { usePageContent } from '../hooks/usePageContent';
import { PageContent } from '../types';

const fallback: PageContent = {
  id: 'fallback-privacy',
  slug: 'privacy',
  title: 'سياسة الخصوصية',
  excerpt: '',
  content: '',
  seoTitle: 'سياسة الخصوصية - بيت الزواحف',
  seoDescription: '',
  isActive: true,
  updatedAt: new Date().toISOString().slice(0, 10),
};

const PrivacyPage: React.FC = () => {
  const { pageContent, loading, isActive } = usePageContent('privacy', fallback);

  if (loading) {
    return <div className="animate-fade-in text-center py-20">جاري التحميل...</div>;
  }

  if (!isActive) {
    return <PageNotAvailable title={pageContent.title || 'سياسة الخصوصية غير متاحة حالياً'} />;
  }

  return <PolicyPage title={pageContent.title} contentHtml={pageContent.content} />;
};

export default PrivacyPage;
