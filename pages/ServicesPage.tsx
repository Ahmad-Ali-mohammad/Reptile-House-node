import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PageContent, ServiceItem } from '../types';
import { usePageContent } from '../hooks/usePageContent';
import PageNotAvailable from '../components/PageNotAvailable';

const servicesFallback: PageContent = {
  id: 'fallback-services',
  slug: 'services',
  title: 'الخدمات',
  excerpt: '',
  content: '',
  seoTitle: 'الخدمات - بيت الزواحف',
  seoDescription: '',
  isActive: true,
  updatedAt: new Date().toISOString().slice(0, 10),
};

const ServicesPage: React.FC = () => {
  const { pageContent, isActive } = usePageContent('services', servicesFallback);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const rows = await api.getServices(true);
        if (!cancelled) setServices(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setServices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isActive) {
    return <PageNotAvailable title={pageContent.title || 'صفحة الخدمات غير متاحة حالياً'} />;
  }

  return (
    <div className="space-y-10 animate-fade-in text-right">
      <section className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-black mb-5">{pageContent.title || 'الخدمات'}</h1>
        {pageContent.excerpt && <p className="text-gray-300 text-lg leading-relaxed">{pageContent.excerpt}</p>}
        {pageContent.content?.trim() && (
          <div
            className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6 text-gray-300 leading-loose text-right"
            dangerouslySetInnerHTML={{ __html: pageContent.content }}
          />
        )}
      </section>

      {loading ? (
        <div className="text-center py-20 text-gray-400 font-bold">جاري تحميل الخدمات...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 glass-medium border border-white/10 rounded-[2rem] text-gray-400 font-bold">
          لا توجد خدمات منشورة حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service) => (
            <article
              key={service.id}
              className="glass-medium border border-white/10 rounded-[2rem] p-8 hover:border-amber-500/40 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-2xl font-black mb-2">{service.title}</h2>
                  {service.price ? (
                    <p className="text-amber-400 font-black">{service.price} ل.س</p>
                  ) : (
                    <p className="text-gray-400 font-bold">السعر حسب الطلب</p>
                  )}
                </div>
                <div className="text-4xl">{service.icon || '🦎'}</div>
              </div>

              {service.imageUrl && (
                <div className="aspect-[16/9] overflow-hidden rounded-xl border border-white/10 mb-5">
                  <img src={service.imageUrl} alt={service.title} className="w-full h-full object-cover" />
                </div>
              )}

              {service.description && <p className="text-gray-300 leading-loose">{service.description}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
