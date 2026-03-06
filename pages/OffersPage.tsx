import React, { useEffect, useMemo, useState } from 'react';
import { Page } from '../App';
import { api } from '../services/api';
import { PageContent, PromotionalCard } from '../types';
import { usePageContent } from '../hooks/usePageContent';
import PageNotAvailable from '../components/PageNotAvailable';

interface OffersPageProps {
  setPage?: (page: Page | string) => void;
}

const offersFallback: PageContent = {
  id: 'fallback-offers',
  slug: 'offers',
  title: 'العروض',
  excerpt: '',
  content: '',
  seoTitle: 'العروض - بيت الزواحف',
  seoDescription: '',
  isActive: true,
  updatedAt: new Date().toISOString().slice(0, 10),
};

const toInternalPage = (raw?: string): string | null => {
  if (!raw) return null;
  const clean = raw.trim().replace(/^\/+/, '');
  if (!clean) return null;
  if (clean === 'shipping-policy') return 'shippingPolicy';
  if (clean === 'return-policy') return 'returnPolicy';
  if (clean === 'offers') return 'offers';
  if (clean === 'services') return 'services';
  if (clean === 'showcase') return 'showcase';
  if (clean === 'supplies') return 'supplies';
  return clean;
};

const isCurrentlyActive = (offer: PromotionalCard): boolean => {
  if (!offer.isActive) return false;
  const now = new Date();
  const start = new Date(offer.startDate);
  const end = new Date(offer.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return now >= start && now <= end;
};

const OffersPage: React.FC<OffersPageProps> = ({ setPage }) => {
  const { pageContent, isActive } = usePageContent('offers', offersFallback);
  const [offers, setOffers] = useState<PromotionalCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const rows = await api.getOffers();
        if (!cancelled) setOffers(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setOffers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeOffers = useMemo(
    () => offers.filter(isCurrentlyActive).sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0)),
    [offers],
  );

  if (!isActive) {
    return <PageNotAvailable title={pageContent.title || 'صفحة العروض غير متاحة حالياً'} />;
  }

  const handleOfferAction = (offer: PromotionalCard) => {
    const link = offer.buttonLink?.trim();
    if (!link) return;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank', 'noopener,noreferrer');
      return;
    }
    const internal = toInternalPage(link);
    if (internal && setPage) setPage(internal);
  };

  return (
    <div className="space-y-10 animate-fade-in text-right">
      <section className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-black mb-5">{pageContent.title || 'العروض'}</h1>
        {pageContent.excerpt && <p className="text-gray-300 text-lg leading-relaxed">{pageContent.excerpt}</p>}
        {pageContent.content?.trim() && (
          <div
            className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6 text-gray-300 leading-loose text-right"
            dangerouslySetInnerHTML={{ __html: pageContent.content }}
          />
        )}
      </section>

      {loading ? (
        <div className="text-center py-20 text-gray-400 font-bold">جاري تحميل العروض...</div>
      ) : activeOffers.length === 0 ? (
        <div className="text-center py-20 glass-medium border border-white/10 rounded-[2rem] text-gray-400 font-bold">
          لا توجد عروض مفعلة حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {activeOffers.map((offer) => (
            <article
              key={offer.id}
              className="glass-medium border border-white/10 rounded-[2rem] overflow-hidden hover:border-amber-500/40 transition-all"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-black">{offer.title}</h2>
                  {offer.discountPercentage ? (
                    <span className="bg-red-500/15 text-red-300 border border-red-500/30 px-3 py-1 rounded-lg text-xs font-black">
                      خصم {offer.discountPercentage}%
                    </span>
                  ) : null}
                </div>

                {offer.description && <p className="text-gray-300 leading-relaxed">{offer.description}</p>}

                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-white/10 pt-4">
                  <span>من: {offer.startDate}</span>
                  <span>إلى: {offer.endDate}</span>
                </div>

                {offer.buttonText && offer.buttonLink ? (
                  <button
                    type="button"
                    onClick={() => handleOfferAction(offer)}
                    className="w-full bg-amber-500 text-gray-900 font-black py-3 rounded-xl hover:bg-amber-400 transition-all"
                  >
                    {offer.buttonText}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default OffersPage;
