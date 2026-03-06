import React from 'react';
import PolicyPage from '../components/PolicyPage';
import PageNotAvailable from '../components/PageNotAvailable';
import { usePageContent } from '../hooks/usePageContent';
import { PageContent } from '../types';

const fallback: PageContent = {
  id: 'fallback-warranty',
  slug: 'warranty',
  title: 'سياسة الضمان والصحة',
  excerpt: '',
  content: '',
  seoTitle: 'سياسة الضمان - بيت الزواحف',
  seoDescription: '',
  isActive: true,
  updatedAt: new Date().toISOString().slice(0, 10),
};

const WarrantyPage: React.FC = () => {
  const { pageContent, loading, isActive } = usePageContent('warranty', fallback);

  if (loading) {
    return <div className="animate-fade-in text-center py-20">جاري التحميل...</div>;
  }

  if (!isActive) {
    return <PageNotAvailable title={pageContent.title || 'سياسة الضمان غير متاحة حالياً'} />;
  }

  return <PolicyPage title={pageContent.title} contentHtml={pageContent.content} />;
};

export default WarrantyPage;
