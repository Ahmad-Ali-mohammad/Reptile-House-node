import React from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { usePageContent } from '../hooks/usePageContent';
import { PageContent } from '../types';
import PageNotAvailable from '../components/PageNotAvailable';

interface BlogPageProps {
  setPage: (page: string) => void;
}

const blogFallback: PageContent = {
  id: 'fallback-blog',
  slug: 'blog',
  title: 'المدونة',
  excerpt: '',
  content: '',
  seoTitle: 'المدونة - بيت الزواحف',
  seoDescription: '',
  isActive: true,
  updatedAt: new Date().toISOString().slice(0, 10),
};

const BlogPage: React.FC<BlogPageProps> = ({ setPage }) => {
  const { articles } = useDatabase();
  const { pageContent, loading, isActive } = usePageContent('blog', blogFallback);

  if (loading) {
    return <div className="animate-fade-in text-center py-20">جاري التحميل...</div>;
  }

  if (!isActive) {
    return <PageNotAvailable title={pageContent.title || 'المدونة غير متاحة حالياً'} />;
  }

  return (
    <div className="space-y-10 animate-fade-in text-right">
      <section className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-black mb-5">{pageContent.title || 'المدونة'}</h1>
        {pageContent.excerpt && <p className="text-gray-300 text-lg leading-relaxed">{pageContent.excerpt}</p>}
        {pageContent.content?.trim() && (
          <div
            className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6 text-gray-300 leading-loose text-right"
            dangerouslySetInnerHTML={{ __html: pageContent.content }}
          />
        )}
      </section>

      {articles.length === 0 ? (
        <div className="text-center py-20 glass-medium border border-white/10 rounded-[2rem] text-gray-400 font-bold">
          لا توجد مقالات منشورة حالياً.
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map((article) => (
            <button
              key={article.id}
              onClick={() => setPage(`article/${article.id}`)}
              className="text-right glass-medium rounded-[2rem] overflow-hidden border border-white/10 hover:border-amber-500/40 transition-all"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{article.date}</span>
                  <span>{article.author}</span>
                </div>
                <h2 className="text-2xl font-black">{article.title}</h2>
                <p className="text-gray-300 leading-relaxed line-clamp-3">{article.excerpt}</p>
              </div>
            </button>
          ))}
        </section>
      )}
    </div>
  );
};

export default BlogPage;
