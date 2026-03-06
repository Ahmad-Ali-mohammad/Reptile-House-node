import React, { useEffect, useMemo } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { ChevronRightIcon, UserIcon } from '../components/icons';

interface ArticleDetailsPageProps {
  articleId: number;
  setPage: (page: string) => void;
}

const hasHtmlMarkup = (value: string) => /<[a-z][\s\S]*>/i.test(value);

const renderArticleBody = (content?: string) => {
  const normalizedContent = String(content || '').trim();

  if (!normalizedContent) {
    return <p>سيتم تحديث هذا المقال قريباً بمحتوى تفصيلي من لوحة الإدارة.</p>;
  }

  if (hasHtmlMarkup(normalizedContent)) {
    return <div dangerouslySetInnerHTML={{ __html: normalizedContent }} />;
  }

  return normalizedContent.split(/\n{2,}/).map((paragraph, index) => (
    <p key={index}>{paragraph.trim()}</p>
  ));
};

const ArticleDetailsPage: React.FC<ArticleDetailsPageProps> = ({ articleId, setPage }) => {
  const { articles, loading } = useDatabase();
  const article = useMemo(() => articles.find((entry) => entry.id === articleId), [articleId, articles]);
  const otherArticles = useMemo(
    () =>
      articles
        .filter((entry) => entry.id !== articleId)
        .sort((left, right) => right.id - left.id)
        .slice(0, 2),
    [articleId, articles],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [articleId]);

  if (loading) {
    return (
      <div className="rounded-3xl py-32 text-center glass-medium">
        <h1 className="text-4xl font-bold">جاري تحميل المقال...</h1>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="rounded-3xl py-32 text-center glass-medium">
        <h1 className="text-4xl font-bold">عذراً، المقال غير موجود</h1>
        <button onClick={() => setPage('blog')} className="mt-8 font-bold text-amber-500 hover:underline">
          العودة للمدونة
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in text-right">
      <nav className="mb-8 flex items-center space-x-2 space-x-reverse text-sm text-gray-400">
        <button onClick={() => setPage('home')} className="transition-colors hover:text-amber-400">
          الرئيسية
        </button>
        <ChevronRightIcon className="h-4 w-4 rotate-180" />
        <button onClick={() => setPage('blog')} className="transition-colors hover:text-amber-400">
          المدونة
        </button>
        <ChevronRightIcon className="h-4 w-4 rotate-180" />
        <span className="font-black text-amber-400">{article.title}</span>
      </nav>

      <article className="overflow-hidden rounded-[3rem] border border-white/10 shadow-2xl glass-dark">
        <div className="relative aspect-video">
          <img src={article.image} alt={article.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="absolute bottom-8 right-8">
            <span className="rounded-full bg-amber-500 px-6 py-2 text-xs font-black text-gray-900 shadow-lg">
              {article.category}
            </span>
          </div>
        </div>

        <div className="space-y-8 p-10 md:p-16">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                <UserIcon className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-black text-white">{article.author}</p>
                <p className="text-[10px] text-gray-500">محتوى منشور من إدارة Reptile House</p>
              </div>
            </div>
            <span className="text-sm font-bold text-gray-500">{article.date}</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-black leading-tight text-white md:text-5xl">{article.title}</h1>
            {article.excerpt && <p className="text-xl font-bold text-amber-400/90">{article.excerpt}</p>}
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-lg leading-loose text-gray-300">
            {renderArticleBody(article.content)}
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-10 sm:flex-row">
            <button
              onClick={() => setPage('blog')}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-white transition-colors hover:border-amber-500/50 hover:text-amber-400"
            >
              العودة إلى جميع المقالات
            </button>
            <div className="text-xs font-black uppercase tracking-widest text-amber-500">
              محتوى متصل مباشرة بلوحة إدارة المقالات
            </div>
          </div>
        </div>
      </article>

      {otherArticles.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-10 text-3xl font-black">مقالات قد تهمك</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {otherArticles.map((entry) => (
              <div
                key={entry.id}
                onClick={() => setPage(`article/${entry.id}`)}
                className="flex cursor-pointer gap-6 rounded-[2rem] border border-white/10 p-6 transition-all hover:border-amber-500/50 glass-medium group"
              >
                <img src={entry.image} alt={entry.title} className="h-24 w-24 shrink-0 rounded-2xl object-cover transition-transform group-hover:scale-105" />
                <div>
                  <span className="mb-2 block text-[10px] font-black text-amber-500">{entry.category}</span>
                  <h3 className="font-black text-white transition-colors group-hover:text-amber-400">{entry.title}</h3>
                  <p className="mt-2 line-clamp-2 text-xs text-gray-400">{entry.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ArticleDetailsPage;
