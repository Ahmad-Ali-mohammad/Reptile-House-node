import React, { useEffect, useState } from 'react';
import { CompanyInfo, TeamMember, PageContent } from '../types';
import { api } from '../services/api';
import { usePageContent } from '../hooks/usePageContent';
import PageNotAvailable from '../components/PageNotAvailable';

const aboutFallback: PageContent = {
  id: 'fallback-about',
  slug: 'about',
  title: 'من نحن',
  excerpt: 'تعرف على قصة الفريق ورسالة المتجر.',
  content: '',
  seoTitle: 'من نحن - بيت الزواحف',
  seoDescription: 'تعرف على فريق بيت الزواحف.',
  isActive: true,
  updatedAt: new Date().toISOString().slice(0, 10),
};

const AboutPage: React.FC = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [companyLoading, setCompanyLoading] = useState(true);
  const { pageContent: aboutContent, isActive } = usePageContent('about', aboutFallback);

  useEffect(() => {
    Promise.all([api.getCompanyInfo(), api.getTeamMembers()])
      .then(([info, members]) => {
        setCompanyInfo(info);
        setTeamMembers(members.filter((m) => m.isActive));
      })
      .catch(() => {
        setCompanyInfo(null);
        setTeamMembers([]);
      })
      .finally(() => setCompanyLoading(false));
  }, []);

  if (companyLoading) {
    return <div className="animate-fade-in text-center py-20">جاري التحميل...</div>;
  }

  if (!isActive) {
    return <PageNotAvailable title={aboutContent.title || 'صفحة من نحن غير متاحة حالياً'} />;
  }

  if (!companyInfo) {
    return <div className="animate-fade-in text-center py-20 text-gray-400">تعذر تحميل بيانات الصفحة.</div>;
  }

  return (
    <div className="space-y-16 animate-fade-in">
      <section className="text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">
          {aboutContent.title || `عن ${companyInfo.name}`}
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          {aboutContent.excerpt || companyInfo.description}
        </p>
      </section>

      {aboutContent.content?.trim() && (
        <section className="glass-medium rounded-[2rem] border border-white/10 p-8 text-gray-300 leading-loose text-right">
          <div dangerouslySetInnerHTML={{ __html: aboutContent.content }} />
        </section>
      )}

      <section className="glass-medium rounded-[3rem] border border-white/10 p-10 md:p-16 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] -z-10" />
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
            <img
              src={companyInfo.mascotUrl || companyInfo.logoUrl || '/assets/photo_2026-02-04_07-13-35.jpg'}
              alt="Reptile House Mascot"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black mb-6 text-amber-400">قصة شغفنا</h2>
            <p className="text-gray-300 leading-loose text-lg whitespace-pre-wrap">{companyInfo.story}</p>
          </div>
        </div>
      </section>

      {teamMembers.length > 0 && (
        <section className="text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-black">فريق العمل</h2>
            <p className="text-gray-500 font-bold">أشخاص يقودون رؤية Reptile House كل يوم.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="glass-light p-8 rounded-[2.5rem] border border-white/10 transition-all duration-500 hover:-translate-y-4 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 group"
              >
                <div className="relative w-40 h-40 mx-auto mb-6">
                  <div className="absolute inset-0 bg-amber-500 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity" />
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-full h-full rounded-full border-4 border-white/10 object-cover shadow-2xl relative z-10"
                  />
                </div>
                <h3 className="text-2xl font-black mb-1">{member.name}</h3>
                <p className="text-amber-500 font-bold tracking-widest text-sm uppercase">{member.role}</p>
                {member.bio && <p className="text-gray-400 text-sm mt-4 leading-relaxed">{member.bio}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass-dark rounded-[3rem] border border-white/10 p-10 md:p-16 shadow-2xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 text-right space-y-8">
            {companyInfo.vision && (
              <div>
                <h2 className="text-3xl font-black mb-4 text-amber-400">رؤيتنا</h2>
                <p className="text-gray-300 leading-loose text-lg whitespace-pre-wrap">{companyInfo.vision}</p>
              </div>
            )}
            {companyInfo.mission && (
              <div>
                <h2 className="text-3xl font-black mb-4 text-amber-400">رسالتنا</h2>
                <p className="text-gray-300 leading-loose text-lg whitespace-pre-wrap">{companyInfo.mission}</p>
              </div>
            )}
          </div>
          <div className="order-1 md:order-2 aspect-square rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 group">
            <img
              src={companyInfo.mascotUrl || companyInfo.logoUrl || '/assets/photo_2026-02-04_07-13-35.jpg'}
              alt="Our Vision Mascot"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
