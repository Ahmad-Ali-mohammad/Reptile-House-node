import React, { useEffect, useMemo, useState } from 'react';
import { CompanyInfo, TeamMember, PageContent } from '../types';
import { api } from '../services/api';
import { usePageContent } from '../hooks/usePageContent';
import PageNotAvailable from '../components/PageNotAvailable';
import { pickMeaningfulText, looksCorruptedText } from '../utils/contentText';

const aboutFallback: PageContent = {
  id: 'fallback-about',
  slug: 'about',
  title: 'عن Reptile House',
  excerpt: 'نحن أكثر من مجرد متجر؛ نحن مجتمع يجمعه الشغف بعالم الزواحف المذهل، ويؤمن بأن التربية المسؤولة تبدأ بالمعرفة والثقة والرعاية الصحيحة.',
  content:
    '<h2>قصتنا وكيف بدأت</h2><p>انطلقت رحلة Reptile House عام 2020 بقيادة سيمون من شغف حقيقي بهذه المخلوقات الفريدة. ومع الوقت، تحول الشغف إلى خبرة عملية وخدمة متخصصة تهدف إلى بناء تجربة أفضل للمربين في المنطقة.</p><p>نحن لا نركز على البيع فقط، بل على توفير انتقال آمن، وتجهيز صحيح، وإرشاد مستمر يضمن استقرار الحيوان وراحة المربي.</p><h2>ما الذي يميزنا؟</h2><ul><li>اختيار دقيق للحيوانات والمستلزمات.</li><li>فهم عملي للسلوك والبيئة والتغذية.</li><li>خدمة شخصية مبنية على الثقة والوضوح.</li></ul>',
  seoTitle: 'عن Reptile House',
  seoDescription: 'تعرف على قصة Reptile House ورؤية سيمون وخبرة المتجر في عالم الزواحف.',
  isActive: true,
  updatedAt: new Date().toISOString().slice(0, 10),
};

const defaultCompanyInfo: CompanyInfo = {
  name: 'Reptile House',
  nameEnglish: 'Reptile House',
  description:
    'نحن أكثر من مجرد متجر؛ نحن مجتمع يجمعه الشغف بعالم الزواحف المذهل. نعمل على تقديم زواحف منتقاة بعناية، ومستلزمات موثوقة، وخبرة عملية تجعل بداية كل مربٍ أكثر أمانًا وثقة.',
  foundedYear: 2020,
  mission:
    'توفير زواحف صحية، سعيدة، ومنتجة محليًا، مع دعم المربين بالمعرفة العلمية والمعدات اللازمة لخلق بيئة مثالية لرفاقهم بدم بارد.',
  vision:
    'أن نكون المركز الإقليمي الأول في الشرق الأوسط بقيادة سيمون للتوعية والتربية المسؤولة للزواحف، مع توفير الحلول المتخصصة والمستلزمات العالمية تحت سقف واحد.',
  story:
    'تأسس Reptile House عام 2020 بقيادة سيمون انطلاقًا من شغف عميق بهذه المخلوقات الفريدة التي غالبًا ما يساء فهمها. بدأت الرحلة من اهتمام حقيقي بتربية الثعابين وتطوير بيئاتها المناسبة، ثم تطورت لتصبح وجهة موثوقة لعشاق الزواحف والبرمائيات النادرة.\n\nنحن لا نبيع الزواحف فحسب، بل نضمن انتقالها إلى بيئة جديدة آمنة ومجهزة بالكامل، مع تقديم استشارات مجانية طويلة الأمد لكل مربٍ يثق بخبرتنا.',
  logoUrl: '',
  mascotUrl: '',
};

const defaultTeamMember: TeamMember = {
  id: 'team-simon',
  name: 'سيمون',
  role: 'المؤسس وخبير الزواحف',
  imageUrl: '/assets/photo_2026-02-04_07-13-35.jpg',
  bio: 'يقود رؤية Reptile House بخبرة عملية متراكمة في اختيار الأنواع المناسبة وبناء بيئات تربية مستقرة وآمنة.',
  isActive: true,
};

const AboutPage: React.FC = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [companyLoading, setCompanyLoading] = useState(true);
  const { pageContent: aboutContent, isActive } = usePageContent('about', aboutFallback);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      api.getCompanyInfo({ signal: controller.signal }),
      api.getTeamMembers({ signal: controller.signal }),
    ])
      .then(([info, members]) => {
        if (controller.signal.aborted) return;
        setCompanyInfo(info);
        setTeamMembers(members.filter((member) => member.isActive));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setCompanyInfo(null);
        setTeamMembers([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCompanyLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const safeCompanyInfo = useMemo<CompanyInfo>(() => {
    const source = companyInfo || defaultCompanyInfo;
    return {
      ...defaultCompanyInfo,
      ...source,
      name: pickMeaningfulText(source.name, defaultCompanyInfo.name),
      nameEnglish: pickMeaningfulText(source.nameEnglish, defaultCompanyInfo.nameEnglish),
      description: pickMeaningfulText(source.description, defaultCompanyInfo.description),
      mission: pickMeaningfulText(source.mission, defaultCompanyInfo.mission),
      vision: pickMeaningfulText(source.vision, defaultCompanyInfo.vision),
      story: pickMeaningfulText(source.story, defaultCompanyInfo.story),
      logoUrl: pickMeaningfulText(source.logoUrl, defaultCompanyInfo.logoUrl),
      mascotUrl: pickMeaningfulText(source.mascotUrl, defaultCompanyInfo.mascotUrl),
    };
  }, [companyInfo]);

  const safeAboutContent = useMemo<PageContent>(() => ({
    ...aboutFallback,
    ...aboutContent,
    title: pickMeaningfulText(aboutContent.title, aboutFallback.title),
    excerpt: pickMeaningfulText(aboutContent.excerpt, aboutFallback.excerpt),
    content: pickMeaningfulText(aboutContent.content, aboutFallback.content),
    seoTitle: pickMeaningfulText(aboutContent.seoTitle, aboutFallback.seoTitle),
    seoDescription: pickMeaningfulText(aboutContent.seoDescription, aboutFallback.seoDescription),
  }), [aboutContent]);

  const safeTeamMembers = useMemo<TeamMember[]>(() => {
    const usableMembers = teamMembers
      .filter((member) => member.isActive)
      .map((member) => ({
        ...member,
        name: pickMeaningfulText(member.name, defaultTeamMember.name),
        role: pickMeaningfulText(member.role, defaultTeamMember.role),
        bio: pickMeaningfulText(member.bio, defaultTeamMember.bio || ''),
        imageUrl: pickMeaningfulText(member.imageUrl, defaultTeamMember.imageUrl),
      }))
      .filter((member) => !looksCorruptedText(member.name) && !looksCorruptedText(member.role));

    return usableMembers.length ? usableMembers.slice(0, 1) : [defaultTeamMember];
  }, [teamMembers]);

  if (companyLoading) {
    return <div className="animate-fade-in py-20 text-center">جاري التحميل...</div>;
  }

  if (!isActive) {
    return <PageNotAvailable title={safeAboutContent.title || 'صفحة من نحن غير متاحة حالياً'} />;
  }

  const hasSingleTeamMember = safeTeamMembers.length === 1;
  const teamSectionTitle = hasSingleTeamMember ? 'الخبير الرئيسي' : 'فريق العمل';
  const teamSectionSubtitle = hasSingleTeamMember
    ? 'سيمون يقود الخبرة العملية ورؤية Reptile House من التأسيس حتى متابعة المربين.'
    : 'أشخاص يقودون رؤية Reptile House كل يوم.';

  return (
    <div className="space-y-16 animate-fade-in">
      <section className="text-center">
        <h1 className="mb-6 text-4xl font-black tracking-tighter md:text-6xl">
          {safeAboutContent.title || `عن ${safeCompanyInfo.name}`}
        </h1>
        <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-400">
          {safeAboutContent.excerpt || safeCompanyInfo.description}
        </p>
      </section>

      {safeAboutContent.content?.trim() && (
        <section className="rounded-[2rem] border border-white/10 p-8 text-right leading-loose text-gray-300 glass-medium">
          <div dangerouslySetInnerHTML={{ __html: safeAboutContent.content }} />
        </section>
      )}

      <section className="relative overflow-hidden rounded-[3rem] border border-white/10 p-10 shadow-2xl glass-medium md:p-16">
        <div className="absolute -z-10 h-64 w-64 bg-amber-500/10 blur-[100px] top-0 right-0" />
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 shadow-2xl group">
            <img
              src={safeCompanyInfo.mascotUrl || safeCompanyInfo.logoUrl || defaultTeamMember.imageUrl}
              alt="Reptile House Mascot"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="text-right">
            <h2 className="mb-6 text-3xl font-black text-amber-400">قصة شغفنا</h2>
            <p className="whitespace-pre-wrap text-lg leading-loose text-gray-300">{safeCompanyInfo.story}</p>
          </div>
        </div>
      </section>

      <section className="space-y-12 text-center">
        <div className="space-y-4">
          <h2 className="text-4xl font-black">{teamSectionTitle}</h2>
          <p className="font-bold text-gray-500">{teamSectionSubtitle}</p>
        </div>
        <div className={`grid gap-10 ${hasSingleTeamMember ? 'mx-auto max-w-xl grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
          {safeTeamMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-[2.5rem] border border-white/10 p-8 transition-all duration-500 group glass-light hover:-translate-y-4 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10"
            >
              <div className="relative mx-auto mb-6 h-40 w-40">
                <div className="absolute inset-0 rounded-full bg-amber-500 blur-2xl opacity-0 transition-opacity group-hover:opacity-20" />
                <img src={member.imageUrl} alt={member.name} className="relative z-10 h-full w-full rounded-full border-4 border-white/10 object-cover shadow-2xl" />
              </div>
              <h3 className="mb-1 text-2xl font-black">{member.name}</h3>
              <p className="text-sm font-bold tracking-widest text-amber-500 uppercase">{member.role}</p>
              {member.bio && <p className="mt-4 text-sm leading-relaxed text-gray-400">{member.bio}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[3rem] border border-white/10 p-10 shadow-2xl glass-dark md:p-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="order-2 space-y-8 text-right md:order-1">
            {safeCompanyInfo.vision && (
              <div>
                <h2 className="mb-4 text-3xl font-black text-amber-400">رؤيتنا</h2>
                <p className="whitespace-pre-wrap text-lg leading-loose text-gray-300">{safeCompanyInfo.vision}</p>
              </div>
            )}
            {safeCompanyInfo.mission && (
              <div>
                <h2 className="mb-4 text-3xl font-black text-amber-400">رسالتنا</h2>
                <p className="whitespace-pre-wrap text-lg leading-loose text-gray-300">{safeCompanyInfo.mission}</p>
              </div>
            )}
          </div>
          <div className="order-1 aspect-square overflow-hidden rounded-[3rem] border border-white/10 shadow-2xl group md:order-2">
            <img
              src={safeCompanyInfo.mascotUrl || safeCompanyInfo.logoUrl || defaultTeamMember.imageUrl}
              alt="Our Vision Mascot"
              className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
