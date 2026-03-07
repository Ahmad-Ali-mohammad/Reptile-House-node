import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon } from '../../components/icons';
import { api, ApiError } from '../../services/api';
import { CompanyInfo, ContactInfo, StoreSettings, UserRole } from '../../types';

interface SettingsFormState {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  storeCurrency: 'USD' | 'EUR' | 'SYP';
  storeLanguage: 'ar' | 'en';
  enableNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  maintenanceMode: boolean;
  allowGuestCheckout: boolean;
  requireEmailVerification: boolean;
  defaultUserRole: UserRole;
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    darkMode: boolean;
  };
}

const defaultStoreSettings: StoreSettings = {
  storeCurrency: 'USD',
  storeLanguage: 'ar',
  enableNotifications: true,
  enableEmailNotifications: true,
  enableSmsNotifications: false,
  maintenanceMode: false,
  allowGuestCheckout: false,
  requireEmailVerification: true,
  defaultUserRole: 'user',
  taxRate: 10,
  shippingFee: 15,
  freeShippingThreshold: 100,
  theme: {
    primaryColor: '#f59e0b',
    secondaryColor: '#6366f1',
    darkMode: true,
  },
};

const defaultCompanyInfo: CompanyInfo = {
  name: 'Reptile House',
  nameEnglish: 'Reptile House',
  description: '',
  foundedYear: 2020,
  mission: '',
  vision: '',
  story: '',
  logoUrl: '',
  mascotUrl: '',
};

const defaultContactInfo: ContactInfo = {
  phone: '',
  email: '',
  address: '',
  city: '',
  country: '',
  workingHours: '',
  socialMedia: {},
};

const toNumber = (value: unknown, fallback: number) => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeStoreSettings = (value?: Partial<StoreSettings> | null): StoreSettings => ({
  storeCurrency: value?.storeCurrency === 'EUR' || value?.storeCurrency === 'SYP' ? value.storeCurrency : 'USD',
  storeLanguage: value?.storeLanguage === 'en' ? 'en' : 'ar',
  enableNotifications: value?.enableNotifications !== false,
  enableEmailNotifications: value?.enableEmailNotifications !== false,
  enableSmsNotifications: value?.enableSmsNotifications === true,
  maintenanceMode: value?.maintenanceMode === true,
  allowGuestCheckout: value?.allowGuestCheckout === true,
  requireEmailVerification: value?.requireEmailVerification !== false,
  defaultUserRole: value?.defaultUserRole === 'admin' || value?.defaultUserRole === 'manager' || value?.defaultUserRole === 'editor' ? value.defaultUserRole : 'user',
  taxRate: toNumber(value?.taxRate, 10),
  shippingFee: toNumber(value?.shippingFee, 15),
  freeShippingThreshold: toNumber(value?.freeShippingThreshold, 100),
  theme: {
    primaryColor: typeof value?.theme?.primaryColor === 'string' && value.theme.primaryColor.trim() ? value.theme.primaryColor : '#f59e0b',
    secondaryColor: typeof value?.theme?.secondaryColor === 'string' && value.theme.secondaryColor.trim() ? value.theme.secondaryColor : '#6366f1',
    darkMode: value?.theme?.darkMode !== false,
  },
  updatedAt: value?.updatedAt,
});

const normalizeCompanyInfo = (value?: Partial<CompanyInfo> | null): CompanyInfo => ({
  ...defaultCompanyInfo,
  ...value,
  name: typeof value?.name === 'string' && value.name.trim() ? value.name : defaultCompanyInfo.name,
  nameEnglish: typeof value?.nameEnglish === 'string' && value.nameEnglish.trim() ? value.nameEnglish : (typeof value?.name === 'string' && value.name.trim() ? value.name : defaultCompanyInfo.nameEnglish),
  description: typeof value?.description === 'string' ? value.description : '',
  foundedYear: toNumber(value?.foundedYear, 2020),
  mission: typeof value?.mission === 'string' ? value.mission : '',
  vision: typeof value?.vision === 'string' ? value.vision : '',
  story: typeof value?.story === 'string' ? value.story : '',
  logoUrl: typeof value?.logoUrl === 'string' ? value.logoUrl : '',
  mascotUrl: typeof value?.mascotUrl === 'string' ? value.mascotUrl : '',
});

const normalizeContactInfo = (value?: Partial<ContactInfo> | null): ContactInfo => ({
  phone: typeof value?.phone === 'string' ? value.phone : '',
  email: typeof value?.email === 'string' ? value.email : '',
  address: typeof value?.address === 'string' ? value.address : '',
  city: typeof value?.city === 'string' ? value.city : '',
  country: typeof value?.country === 'string' ? value.country : '',
  workingHours: typeof value?.workingHours === 'string' ? value.workingHours : '',
  socialMedia: {
    facebook: typeof value?.socialMedia?.facebook === 'string' ? value.socialMedia.facebook : '',
    instagram: typeof value?.socialMedia?.instagram === 'string' ? value.socialMedia.instagram : '',
    whatsapp: typeof value?.socialMedia?.whatsapp === 'string' ? value.socialMedia.whatsapp : '',
    telegram: typeof value?.socialMedia?.telegram === 'string' ? value.socialMedia.telegram : '',
    twitter: typeof value?.socialMedia?.twitter === 'string' ? value.socialMedia.twitter : '',
    youtube: typeof value?.socialMedia?.youtube === 'string' ? value.socialMedia.youtube : '',
  },
});

const buildFormState = (storeSettings: StoreSettings, companyInfo: CompanyInfo, contactInfo: ContactInfo): SettingsFormState => ({
  storeName: companyInfo.name || companyInfo.nameEnglish || 'Reptile House',
  storeEmail: contactInfo.email || 'info@reptilehouse.sy',
  storePhone: contactInfo.phone || '+963 993 595 766',
  storeAddress: contactInfo.address || 'Bchamoun Village 5-7, Bchamoun, Lebanon',
  storeCurrency: storeSettings.storeCurrency,
  storeLanguage: storeSettings.storeLanguage,
  enableNotifications: storeSettings.enableNotifications,
  enableEmailNotifications: storeSettings.enableEmailNotifications,
  enableSmsNotifications: storeSettings.enableSmsNotifications,
  maintenanceMode: storeSettings.maintenanceMode,
  allowGuestCheckout: storeSettings.allowGuestCheckout,
  requireEmailVerification: storeSettings.requireEmailVerification,
  defaultUserRole: storeSettings.defaultUserRole,
  taxRate: storeSettings.taxRate,
  shippingFee: storeSettings.shippingFee,
  freeShippingThreshold: storeSettings.freeShippingThreshold,
  socialLinks: {
    facebook: contactInfo.socialMedia.facebook || '',
    instagram: contactInfo.socialMedia.instagram || '',
    twitter: contactInfo.socialMedia.twitter || '',
    youtube: contactInfo.socialMedia.youtube || '',
  },
  theme: {
    primaryColor: storeSettings.theme.primaryColor,
    secondaryColor: storeSettings.theme.secondaryColor,
    darkMode: storeSettings.theme.darkMode,
  },
});

const tabs = [
  { id: 'general', label: 'إعدادات عامة', icon: '⚙️' },
  { id: 'store', label: 'المتجر', icon: '🏪' },
  { id: 'notifications', label: 'الإشعارات', icon: '🔔' },
  { id: 'security', label: 'الأمان', icon: '🔒' },
  { id: 'appearance', label: 'المظهر', icon: '🎨' },
] as const;

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('general');
  const [settings, setSettings] = useState<SettingsFormState>(() => buildFormState(defaultStoreSettings, defaultCompanyInfo, defaultContactInfo));
  const [storedSettings, setStoredSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContactInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const loadSettings = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [storeRow, companyRow, contactRow] = await Promise.all([
        api.getStoreSettings().catch(() => defaultStoreSettings),
        api.getCompanyInfo().catch(() => defaultCompanyInfo),
        api.getContactInfo().catch(() => defaultContactInfo),
      ]);

      const normalizedStore = normalizeStoreSettings(storeRow);
      const normalizedCompany = normalizeCompanyInfo(companyRow);
      const normalizedContact = normalizeContactInfo(contactRow);

      setStoredSettings(normalizedStore);
      setCompanyInfo(normalizedCompany);
      setContactInfo(normalizedContact);
      setSettings(buildFormState(normalizedStore, normalizedCompany, normalizedContact));
    } catch {
      setError('تعذر تحميل الإعدادات الحالية.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleFieldChange = <K extends keyof SettingsFormState>(key: K, value: SettingsFormState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if (!globalThis.confirm('سيتم استعادة آخر القيم المحفوظة في النظام. هل تريد المتابعة؟')) {
      return;
    }
    setSettings(buildFormState(storedSettings, companyInfo, contactInfo));
    setError('');
  };

  const handleSave = async () => {
    if (!settings.storeName.trim() || !settings.storeEmail.trim()) {
      setError('يرجى تعبئة اسم المتجر والبريد الإلكتروني على الأقل.');
      return;
    }

    setIsSaving(true);
    setError('');

    const storePayload: StoreSettings = normalizeStoreSettings({
      storeCurrency: settings.storeCurrency,
      storeLanguage: settings.storeLanguage,
      enableNotifications: settings.enableNotifications,
      enableEmailNotifications: settings.enableEmailNotifications,
      enableSmsNotifications: settings.enableSmsNotifications,
      maintenanceMode: settings.maintenanceMode,
      allowGuestCheckout: settings.allowGuestCheckout,
      requireEmailVerification: settings.requireEmailVerification,
      defaultUserRole: settings.defaultUserRole,
      taxRate: settings.taxRate,
      shippingFee: settings.shippingFee,
      freeShippingThreshold: settings.freeShippingThreshold,
      theme: settings.theme,
    });

    const companyPayload: CompanyInfo = {
      ...companyInfo,
      name: settings.storeName.trim(),
      nameEnglish: settings.storeName.trim(),
    };

    const contactPayload: ContactInfo = {
      ...contactInfo,
      email: settings.storeEmail.trim(),
      phone: settings.storePhone.trim(),
      address: settings.storeAddress.trim(),
      socialMedia: {
        ...contactInfo.socialMedia,
        facebook: settings.socialLinks.facebook.trim(),
        instagram: settings.socialLinks.instagram.trim(),
        whatsapp: contactInfo.socialMedia.whatsapp || '',
        telegram: contactInfo.socialMedia.telegram || '',
        twitter: settings.socialLinks.twitter.trim(),
        youtube: settings.socialLinks.youtube.trim(),
      },
    };

    try {
      const [savedStore, savedCompany, savedContact] = await Promise.all([
        api.saveStoreSettings(storePayload),
        api.saveCompanyInfo(companyPayload),
        api.saveContactInfo(contactPayload),
      ]);

      const normalizedStore = normalizeStoreSettings(savedStore);
      const normalizedCompany = normalizeCompanyInfo(savedCompany);
      const normalizedContact = normalizeContactInfo(savedContact);

      setStoredSettings(normalizedStore);
      setCompanyInfo(normalizedCompany);
      setContactInfo(normalizedContact);
      setSettings(buildFormState(normalizedStore, normalizedCompany, normalizedContact));
      setSaved(true);
      globalThis.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر حفظ الإعدادات.');
    } finally {
      setIsSaving(false);
    }
  };

  const summaryCards = useMemo(() => ([
    { label: 'العملة الافتراضية', value: settings.storeCurrency },
    { label: 'اللغة الافتراضية', value: settings.storeLanguage === 'ar' ? 'العربية' : 'English' },
    { label: 'وضع المظهر', value: settings.theme.darkMode ? 'داكن' : 'فاتح' },
  ]), [settings.storeCurrency, settings.storeLanguage, settings.theme.darkMode]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="store-name" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">اسم المتجر</label>
                <input id="store-name" type="text" value={settings.storeName} onChange={(e) => handleFieldChange('storeName', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label htmlFor="store-email" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">البريد الإلكتروني</label>
                <input id="store-email" type="email" value={settings.storeEmail} onChange={(e) => handleFieldChange('storeEmail', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label htmlFor="store-phone" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">رقم الهاتف</label>
                <input id="store-phone" type="tel" value={settings.storePhone} onChange={(e) => handleFieldChange('storePhone', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label htmlFor="store-address" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">العنوان</label>
                <textarea id="store-address" value={settings.storeAddress} onChange={(e) => handleFieldChange('storeAddress', e.target.value)} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label htmlFor="store-currency" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">العملة الافتراضية</label>
                <select id="store-currency" value={settings.storeCurrency} onChange={(e) => handleFieldChange('storeCurrency', e.target.value as SettingsFormState['storeCurrency'])} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="EUR">يورو (EUR)</option>
                  <option value="SYP">ليرة سورية (SYP)</option>
                </select>
              </div>
              <div>
                <label htmlFor="store-language" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">اللغة الافتراضية</label>
                <select id="store-language" value={settings.storeLanguage} onChange={(e) => handleFieldChange('storeLanguage', e.target.value as SettingsFormState['storeLanguage'])} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-sm text-amber-100 leading-relaxed">
              هذه الحقول مرتبطة فعليًا ببيانات المتجر الأساسية. حفظ اسم المتجر ينعكس على معلومات الشركة، وحفظ البريد والهاتف والعنوان ينعكس على معلومات التواصل.
            </div>
          </div>
        );

      case 'store':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tax-rate" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">معدل الضريبة (%)</label>
                <input id="tax-rate" type="number" min="0" max="100" step="0.01" value={settings.taxRate} onChange={(e) => handleFieldChange('taxRate', Number.parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label htmlFor="shipping-fee" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">رسوم الشحن</label>
                <input id="shipping-fee" type="number" min="0" step="0.01" value={settings.shippingFee} onChange={(e) => handleFieldChange('shippingFee', Number.parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label htmlFor="free-shipping" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">حد الشحن المجاني</label>
                <input id="free-shipping" type="number" min="0" step="0.01" value={settings.freeShippingThreshold} onChange={(e) => handleFieldChange('freeShippingThreshold', Number.parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label htmlFor="default-role" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">الدور الافتراضي للمستخدم الجديد</label>
                <select id="default-role" value={settings.defaultUserRole} onChange={(e) => handleFieldChange('defaultUserRole', e.target.value as UserRole)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="user">عميل</option>
                  <option value="editor">محرر</option>
                  <option value="manager">مدير فرعي</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-black text-amber-400">روابط التواصل الاجتماعي</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="facebook-url" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">فيسبوك</label>
                  <input id="facebook-url" type="url" value={settings.socialLinks.facebook} onChange={(e) => handleFieldChange('socialLinks', { ...settings.socialLinks, facebook: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label htmlFor="instagram-url" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">إنستغرام</label>
                  <input id="instagram-url" type="url" value={settings.socialLinks.instagram} onChange={(e) => handleFieldChange('socialLinks', { ...settings.socialLinks, instagram: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label htmlFor="twitter-url" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">X / تويتر</label>
                  <input id="twitter-url" type="url" value={settings.socialLinks.twitter} onChange={(e) => handleFieldChange('socialLinks', { ...settings.socialLinks, twitter: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label htmlFor="youtube-url" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">يوتيوب</label>
                  <input id="youtube-url" type="url" value={settings.socialLinks.youtube} onChange={(e) => handleFieldChange('socialLinks', { ...settings.socialLinks, youtube: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input id="enable-notifications" name="enableNotifications" type="checkbox" checked={settings.enableNotifications} onChange={(e) => handleFieldChange('enableNotifications', e.target.checked)} className="w-5 h-5" />
              <span>تفعيل الإشعارات العامة</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input id="enable-email-notifications" name="enableEmailNotifications" type="checkbox" checked={settings.enableEmailNotifications} onChange={(e) => handleFieldChange('enableEmailNotifications', e.target.checked)} className="w-5 h-5" />
              <span>إشعارات البريد الإلكتروني</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input id="enable-sms-notifications" name="enableSmsNotifications" type="checkbox" checked={settings.enableSmsNotifications} onChange={(e) => handleFieldChange('enableSmsNotifications', e.target.checked)} className="w-5 h-5" />
              <span>إشعارات الرسائل النصية</span>
            </label>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input id="require-email-verification" name="requireEmailVerification" type="checkbox" checked={settings.requireEmailVerification} onChange={(e) => handleFieldChange('requireEmailVerification', e.target.checked)} className="w-5 h-5" />
              <span>تفعيل التحقق من البريد الإلكتروني للحسابات الجديدة</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input id="allow-guest-checkout" name="allowGuestCheckout" type="checkbox" checked={settings.allowGuestCheckout} onChange={(e) => handleFieldChange('allowGuestCheckout', e.target.checked)} className="w-5 h-5" />
              <span>السماح بالشراء دون إنشاء حساب</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input id="maintenance-mode" name="maintenanceMode" type="checkbox" checked={settings.maintenanceMode} onChange={(e) => handleFieldChange('maintenanceMode', e.target.checked)} className="w-5 h-5" />
              <span>تفعيل وضع الصيانة</span>
            </label>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="primary-color" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">اللون الأساسي</label>
                <div className="flex items-center gap-3">
                  <input id="primary-color" type="color" value={settings.theme.primaryColor} onChange={(e) => handleFieldChange('theme', { ...settings.theme, primaryColor: e.target.value })} className="w-12 h-12 rounded-xl border border-white/10" />
                  <input id="primary-color-value" name="themePrimaryColor" type="text" value={settings.theme.primaryColor} onChange={(e) => handleFieldChange('theme', { ...settings.theme, primaryColor: e.target.value })} className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label htmlFor="secondary-color" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">اللون الثانوي</label>
                <div className="flex items-center gap-3">
                  <input id="secondary-color" type="color" value={settings.theme.secondaryColor} onChange={(e) => handleFieldChange('theme', { ...settings.theme, secondaryColor: e.target.value })} className="w-12 h-12 rounded-xl border border-white/10" />
                  <input id="secondary-color-value" name="themeSecondaryColor" type="text" value={settings.theme.secondaryColor} onChange={(e) => handleFieldChange('theme', { ...settings.theme, secondaryColor: e.target.value })} className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label htmlFor="theme-mode" className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">الوضع الافتراضي</label>
                <select id="theme-mode" value={settings.theme.darkMode ? 'dark' : 'light'} onChange={(e) => handleFieldChange('theme', { ...settings.theme, darkMode: e.target.value === 'dark' })} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="dark">داكن</option>
                  <option value="light">فاتح</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-400 leading-relaxed">
              يطبق المظهر واللغة الافتراضيان على الزائر غير المسجل دخوله، بينما تبقى تفضيلات المستخدم المسجل أولوية إذا كانت محفوظة في حسابه.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-right">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">الإعدادات العامة</h1>
          <p className="text-gray-400">إدارة هوية المتجر والإعدادات التشغيلية الافتراضية من مصدر بيانات حقيقي.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={handleReset} disabled={isLoading || isSaving} className="glass-light border border-white/10 text-white font-black px-6 py-3 rounded-2xl hover:bg-white/10 transition-all disabled:opacity-60">استعادة القيم المحفوظة</button>
          <button onClick={handleSave} disabled={isLoading || isSaving} className="bg-amber-500 text-gray-900 font-black px-6 py-3 rounded-2xl hover:bg-amber-400 transition-all flex items-center gap-2 disabled:opacity-60">
            <span>💾</span>
            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-300 rounded-2xl p-4 font-bold text-sm flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5" />
          تم حفظ الإعدادات وربطها بالبيانات الفعلية للمتجر بنجاح.
        </div>
      )}
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl p-4 font-bold text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="glass-medium p-6 rounded-[2rem] border border-white/10">
            <p className="text-gray-400 text-sm font-bold mb-2">{card.label}</p>
            <p className="text-2xl font-black text-amber-400">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-6 py-3 rounded-xl font-black text-sm transition-all ${activeTab === tab.id ? 'bg-amber-500 text-gray-900' : 'bg-white/5 text-gray-300 hover:text-white border border-white/10'}`}
          >
            <span className="ml-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass-medium rounded-2xl border border-white/10 p-5 sm:p-8 min-h-[420px]">
        {isLoading ? <div className="text-center text-gray-400 font-bold py-20">جاري تحميل الإعدادات...</div> : renderTabContent()}
      </div>
    </div>
  );
};

export default SettingsPage;
