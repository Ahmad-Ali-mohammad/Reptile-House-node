import React, { useEffect, useState } from 'react';
import { SeoSettings } from '../../types';
import { api } from '../../services/api';
import { CheckCircleIcon, DocumentIcon } from '../../components/icons';

const canonicalFromEnv =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CANONICAL_BASE_URL
    ? String(import.meta.env.VITE_CANONICAL_BASE_URL).trim()
    : '') || '';
const canonicalFromWindow = typeof window !== 'undefined' ? window.location.origin : '';
const defaultCanonicalBaseUrl = (canonicalFromEnv || canonicalFromWindow || '').replace(/\/+$/, '');

const defaultSeo: SeoSettings = {
  siteName: 'بيت الزواحف',
  defaultTitle: 'بيت الزواحف | متجر الزواحف والمستلزمات',
  titleSeparator: '|',
  defaultDescription: 'متجر متخصص بالزواحف والمستلزمات مع محتوى تعليمي ودعم احترافي.',
  defaultKeywords: 'زواحف, متجر زواحف, مستلزمات زواحف, ثعابين, سحالي, بيت الزواحف',
  canonicalBaseUrl: defaultCanonicalBaseUrl,
  defaultOgImage: '/assets/photo_2026-02-04_07-13-35.jpg',
  twitterHandle: '',
  robotsIndex: true,
  robotsFollow: true,
  googleVerification: '',
  bingVerification: '',
  yandexVerification: '',
  locale: 'ar_SY',
  themeColor: '#0f172a',
  organizationName: 'بيت الزواحف',
  organizationLogo: '/assets/photo_2026-02-04_07-13-35.jpg',
  organizationDescription: 'متجر متخصص بالزواحف والمستلزمات مع محتوى تعليمي ودعم احترافي.',
  sitemapEnabled: true,
  excludedPaths: '/dashboard',
  customRobotsTxt: '',
};

const SeoManagementPage: React.FC = () => {
  const [settings, setSettings] = useState<SeoSettings>(defaultSeo);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const rows = await api.getSeoSettings();
        setSettings({ ...defaultSeo, ...rows });
      } catch {
        setError('تعذر تحميل إعدادات تحسين محركات البحث');
        setSettings(defaultSeo);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const payload = { ...defaultSeo, ...settings };
      const savedRow = await api.saveSeoSettings(payload);
      setSettings({ ...defaultSeo, ...savedRow });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('تعذر حفظ إعدادات تحسين محركات البحث');
    } finally {
      setIsSaving(false);
    }
  };

  const snippetTitle = `${settings.defaultTitle} ${settings.titleSeparator} ${settings.siteName}`.trim();

  const renderInput = (id: string, label: string, value: string, onChange: (value: string) => void, type = 'text') => (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-black text-gray-400">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        className="w-full rounded-xl border border-white/10 bg-[#1a1c23] px-4 py-3 text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );

  const renderTextarea = (id: string, label: string, value: string, onChange: (value: string) => void, rows: number) => (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-black text-gray-400">{label}</label>
      <textarea
        id={id}
        name={id}
        className="min-h-[90px] w-full rounded-xl border border-white/10 bg-[#1a1c23] px-4 py-3 text-white"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );

  return (
    <div className="animate-fade-in relative space-y-8 text-right">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-4xl font-black mb-2">لوحة تحسين محركات البحث</h1>
          <p className="text-gray-400">إدارة العناوين والوصف والوسوم والتحقق ومحركات البحث من مصدر بيانات حقيقي.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="rounded-2xl bg-amber-500 px-6 py-3 font-black text-gray-900 hover:bg-amber-400 disabled:opacity-60"
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl border border-green-500/40 bg-green-500/10 p-4 text-sm font-bold text-green-300">
          <CheckCircleIcon className="w-5 h-5" />
          تم حفظ إعدادات تحسين محركات البحث بنجاح.
        </div>
      )}
      {error && <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-bold text-red-300">{error}</div>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="glass-dark rounded-[2rem] border border-white/10 p-5 space-y-6 sm:p-6">
          <h2 className="text-xl font-black text-amber-400">إعدادات عامة</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {renderInput('seo-site-name', 'اسم الموقع', settings.siteName, (value) => setSettings({ ...settings, siteName: value }))}
            {renderInput('seo-default-title', 'العنوان الافتراضي', settings.defaultTitle, (value) => setSettings({ ...settings, defaultTitle: value }))}
            {renderInput('seo-title-separator', 'فاصل العنوان', settings.titleSeparator, (value) => setSettings({ ...settings, titleSeparator: value }))}
            {renderInput('seo-canonical-base-url', 'الرابط الأساسي canonical', settings.canonicalBaseUrl, (value) => setSettings({ ...settings, canonicalBaseUrl: value }), 'url')}
          </div>
          {renderTextarea('seo-default-description', 'الوصف الافتراضي', settings.defaultDescription, (value) => setSettings({ ...settings, defaultDescription: value }), 4)}
          {renderTextarea('seo-default-keywords', 'الكلمات المفتاحية', settings.defaultKeywords, (value) => setSettings({ ...settings, defaultKeywords: value }), 3)}

          <h2 className="text-xl font-black text-amber-400 pt-4">OpenGraph وX</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {renderInput('seo-default-og-image', 'صورة OG الافتراضية', settings.defaultOgImage, (value) => setSettings({ ...settings, defaultOgImage: value }), 'url')}
            {renderInput('seo-twitter-handle', 'معرّف X (@...)', settings.twitterHandle, (value) => setSettings({ ...settings, twitterHandle: value }))}
            {renderInput('seo-locale', 'اللغة المحلية', settings.locale, (value) => setSettings({ ...settings, locale: value }))}
            {renderInput('seo-theme-color', 'لون السمة', settings.themeColor, (value) => setSettings({ ...settings, themeColor: value }))}
          </div>

          <h2 className="text-xl font-black text-amber-400 pt-4">الفهرسة والتحقق</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <input id="seo-robots-index" name="seoRobotsIndex" type="checkbox" checked={settings.robotsIndex} onChange={(e) => setSettings({ ...settings, robotsIndex: e.target.checked })} />
              <span>السماح بالأرشفة</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <input id="seo-robots-follow" name="seoRobotsFollow" type="checkbox" checked={settings.robotsFollow} onChange={(e) => setSettings({ ...settings, robotsFollow: e.target.checked })} />
              <span>اتباع الروابط</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <input id="seo-sitemap-enabled" name="seoSitemapEnabled" type="checkbox" checked={settings.sitemapEnabled} onChange={(e) => setSettings({ ...settings, sitemapEnabled: e.target.checked })} />
              <span>تفعيل sitemap</span>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {renderInput('seo-google-verification', 'رمز Google', settings.googleVerification, (value) => setSettings({ ...settings, googleVerification: value }))}
            {renderInput('seo-bing-verification', 'رمز Bing', settings.bingVerification, (value) => setSettings({ ...settings, bingVerification: value }))}
            {renderInput('seo-yandex-verification', 'رمز Yandex', settings.yandexVerification, (value) => setSettings({ ...settings, yandexVerification: value }))}
          </div>
          {renderTextarea('seo-excluded-paths', 'مسارات مستثناة من الأرشفة', settings.excludedPaths, (value) => setSettings({ ...settings, excludedPaths: value }), 3)}
          {renderTextarea('seo-custom-robots', 'إضافات robots.txt مخصصة', settings.customRobotsTxt, (value) => setSettings({ ...settings, customRobotsTxt: value }), 4)}
        </div>

        <div className="glass-dark rounded-[2rem] border border-white/10 p-5 space-y-4 sm:p-6">
          <h3 className="flex items-center gap-2 text-lg font-black text-amber-400">
            <DocumentIcon className="w-5 h-5" />
            معاينة نتيجة البحث
          </h3>
          <div className="rounded-2xl border border-white/10 bg-[#11131a] p-4 space-y-2">
            <p className="text-lg leading-snug text-[#8ab4f8]">{snippetTitle}</p>
            <p className="truncate text-sm text-[#9aa0a6]">{settings.canonicalBaseUrl}</p>
            <p className="text-sm leading-relaxed text-[#bdc1c6]">{settings.defaultDescription}</p>
          </div>
          <div className="space-y-2 text-xs leading-6 text-gray-500">
            <p>الروبوتات: {settings.robotsIndex ? 'index' : 'noindex'}, {settings.robotsFollow ? 'follow' : 'nofollow'}</p>
            <p>خريطة الموقع: {settings.sitemapEnabled ? 'مفعلة' : 'معطلة'}</p>
            <p>الرابط الأساسي: {settings.canonicalBaseUrl}</p>
            <p>OG image: {settings.defaultOgImage}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoManagementPage;
