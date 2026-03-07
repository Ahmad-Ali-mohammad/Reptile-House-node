import React from 'react';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import FeaturedReptiles from '../components/FeaturedReptiles';
import SocialSection from '../components/SocialSection';
import ReptileCard from '../components/ReptileCard';
import PageNotAvailable from '../components/PageNotAvailable';
import { useDatabase } from '../contexts/DatabaseContext';
import { usePageContent } from '../hooks/usePageContent';
import { PageContent } from '../types';

interface HomePageProps {
  setPage: (page: string) => void;
}

const homeFallback: PageContent = {
  id: 'fallback-home',
  slug: 'home',
  title: 'الصفحة الرئيسية',
  excerpt: 'محتوى الصفحة الرئيسية كما تم ضبطه من لوحة الإدارة.',
  content: '',
  seoTitle: 'بيت الزواحف - الصفحة الرئيسية',
  seoDescription: 'أفضل متجر للزواحف والمستلزمات.',
  isActive: true,
  updatedAt: new Date().toISOString().slice(0, 10),
};

const HomePage: React.FC<HomePageProps> = ({ setPage }) => {
  const { products, articles } = useDatabase();
  const { pageContent: homeContent, loading, isActive } = usePageContent('home', homeFallback);
  const safeProducts = Array.isArray(products) ? products : [];
  const safeArticles = Array.isArray(articles) ? articles : [];
  const featured = safeProducts.find(p => p.rating >= 4.9) || safeProducts[0];
  const bestsellers = [...safeProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
  const newArrivals = [...safeProducts].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 10);
  const careSheets = [...safeArticles].slice(0, 6);
  const hasCustomHomeContent = Boolean(homeContent.content && homeContent.content.trim());

  if (loading) {
    return <div className="animate-fade-in text-center py-20">جاري التحميل...</div>;
  }

  if (!isActive) {
    return <PageNotAvailable title={homeContent.title || 'الصفحة الرئيسية غير متاحة حالياً'} />;
  }

  return (
    <>
      <section className="mb-10 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-black mb-4">{homeContent.title}</h1>
        {homeContent.excerpt && (
          <p className="text-gray-300 text-lg leading-relaxed">{homeContent.excerpt}</p>
        )}
        {hasCustomHomeContent && (
          <div
            className="mt-6 text-right bg-white/5 border border-white/10 rounded-2xl p-6 text-gray-300 leading-loose"
            dangerouslySetInnerHTML={{ __html: homeContent.content }}
          />
        )}
      </section>

      <Hero setPage={setPage as any} />
      <Categories />

      {featured && (
        <section className="mb-20">
          <h2 className="text-3xl sm:text-4xl font-black mb-8 sm:mb-10 text-center">زاحف مميز</h2>
          <ReptileCard reptile={featured} variant="featured" setPage={setPage} />
        </section>
      )}

      <section className="mb-16">
        <div className="mb-10 flex flex-col gap-4 text-right sm:flex-row sm:items-end sm:justify-between">
          <div className="text-right">
            <h2 className="text-3xl sm:text-4xl font-black">الأكثر مبيعاً</h2>
            <p className="text-gray-400 font-bold mt-2">اختيارات العملاء</p>
          </div>
          <button onClick={() => setPage('showcase')} className="w-full shrink-0 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-gray-200 transition-all hover:border-amber-500/50 hover:text-white active:scale-95 sm:w-auto">
            عرض الكل
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 md:gap-8">
          {bestsellers.map((reptile, index) => (
            <ReptileCard key={reptile.id} reptile={reptile} index={index} setPage={setPage} />
          ))}
        </div>
      </section>

      <section className="mb-16">
        <div className="mb-10 flex flex-col gap-4 text-right sm:flex-row sm:items-end sm:justify-between">
          <div className="text-right">
            <h2 className="text-3xl sm:text-4xl font-black">وصل حديثاً</h2>
            <p className="text-gray-400 font-bold mt-2">New Scales, New Tails</p>
          </div>
          <button onClick={() => setPage('showcase')} className="w-full shrink-0 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-gray-900 shadow-xl shadow-amber-500/10 transition-all hover:bg-amber-400 active:scale-95 sm:w-auto">
            اكتشف الجديد
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {newArrivals.map((reptile, index) => (
            <ReptileCard key={reptile.id} reptile={reptile} index={index} setPage={setPage} />
          ))}
        </div>
      </section>

      <section className="mb-16">
        <div className="mb-10 flex flex-col gap-4 text-right sm:flex-row sm:items-end sm:justify-between">
          <div className="text-right">
            <h2 className="text-3xl sm:text-4xl font-black">أدلة العناية</h2>
            <p className="text-gray-400 font-bold mt-2">Care Sheets</p>
          </div>
          <button onClick={() => setPage('blog')} className="w-full shrink-0 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-gray-200 transition-all hover:border-amber-500/50 hover:text-white active:scale-95 sm:w-auto">
            كل المقالات
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {careSheets.map(article => (
            <button
              key={article.id}
              onClick={() => setPage(`article/${article.id}`)}
              className="text-right glass-medium rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-amber-500/40 transition-all duration-500 shadow-2xl group active:scale-[0.99]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={article.image} alt={article.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-6 right-6 left-6">
                  <h3 className="text-2xl font-black leading-tight">{article.title}</h3>
                  <div className="mt-3 inline-flex items-center gap-2 bg-amber-500 text-gray-900 px-4 py-2 rounded-full text-xs font-black">
                    اقرأ الآن
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <FeaturedReptiles reptiles={safeProducts.slice(0, 6)} setPage={setPage} />
      <SocialSection />
    </>
  );
};

export default HomePage;
