import React, { useMemo } from 'react';
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
  const { articles, loading: databaseLoading } = useDatabase();
  const { pageContent, loading, isActive } = usePageContent('blog', blogFallback);

  const sortedArticles = useMemo(
    () =>
      [...articles].sort((left, right) => {
        const leftDate = new Date(left.date).getTime();
        const rightDate = new Date(right.date).getTime();

        if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate) && leftDate !== rightDate) {
          return rightDate - leftDate;
        }

        return right.id - left.id;
      }),
    [articles],
  );

  if (loading || databaseLoading) {
    return <div className="animate-fade-in py-20 text-center">جاري التحميل...</div>;
  }

  if (!isActive) {
    return <PageNotAvailable title={pageContent.title || 'المدونة غير متاحة حالياً'} />;
  }

  return (
    <div className="space-y-10 animate-fade-in text-right">
      <section className="mx-auto max-w-4xl text-center">
        <h1 className="mb-5 text-4xl font-black md:text-6xl">{pageContent.title || 'المدونة'}</h1>
        {pageContent.excerpt && <p className="text-lg leading-relaxed text-gray-300">{pageContent.excerpt}</p>}
        {pageContent.content?.trim() && (
          <div
            className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-right leading-loose text-gray-300"
            dangerouslySetInnerHTML={{ __html: pageContent.content }}
          />
        )}
      </section>

      {sortedArticles.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 py-20 text-center font-bold text-gray-400 glass-medium">
          لا توجد مقالات منشورة حالياً.
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {sortedArticles.map((article) => (
            <button
              key={article.id}
              onClick={() => setPage(`article/${article.id}`)}
              className="overflow-hidden rounded-[2rem] border border-white/10 text-right transition-all hover:border-amber-500/40 glass-medium"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img src={article.image} alt={article.title} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-3 p-6">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{article.date}</span>
                  <span>{article.author}</span>
                </div>
                <h2 className="text-2xl font-black">{article.title}</h2>
                <p className="line-clamp-3 leading-relaxed text-gray-300">{article.excerpt}</p>
              </div>
            </button>
          ))}
        </section>
      )}
    </div>
  );
};

export default BlogPage;
