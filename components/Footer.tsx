import React, { useEffect, useState } from 'react';
import { Page } from '../App';
import { ContactInfo } from '../types';
import { api } from '../services/api';

interface FooterProps {
  setPage: (page: Page) => void;
}

const QUICK_LINKS: Array<{ label: string; page: Page }> = [
  { label: 'الرئيسية', page: 'home' },
  { label: 'معرض الزواحف', page: 'showcase' },
  { label: 'المستلزمات', page: 'supplies' },
  { label: 'المدونة التعليمية', page: 'blog' },
  { label: 'من نحن', page: 'about' },
  { label: 'اتصل بنا', page: 'contact' },
  { label: 'العروض والباقات', page: 'offers' },
];

const POLICY_LINKS: Array<{ label: string; page: Page }> = [
  { label: 'سياسة الشحن والتوصيل', page: 'shippingPolicy' },
  { label: 'سياسة الإرجاع', page: 'returnPolicy' },
  { label: 'الضمان والصحة', page: 'warranty' },
  { label: 'سياسة الخصوصية', page: 'privacy' },
  { label: 'الشروط والأحكام', page: 'terms' },
];

const DEVELOPER_INSTAGRAM_URL =
  'https://www.instagram.com/ahmad_el_mohammad?igsh=a21pdXRnbWF5eTMy&utm_source=qr';

const Footer: React.FC<FooterProps> = ({ setPage }) => {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  useEffect(() => {
    api.getContactInfo().then(setContactInfo).catch(() => setContactInfo(null));
  }, []);

  const handleNav = (event: React.MouseEvent, page: Page) => {
    event.preventDefault();
    setPage(page);
  };

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-white/10 bg-gradient-to-b from-black/20 via-black/50 to-black/85 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-8 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -left-24 bottom-8 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl lg:col-span-4">
            <h3 className="text-2xl font-black tracking-tight text-amber-400">Reptile House</h3>
            <p className="mt-4 text-sm leading-relaxed text-gray-300">
              بإدارة سيمون. متجرك الأول للزواحف الفريدة في دمشق. نقدم جودة ورعاية لا مثيل لهما لجميع عشاق هذه
              المخلوقات المذهلة.
            </p>
            {contactInfo?.phone && (
              <a
                href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm font-bold text-amber-300 transition-colors hover:bg-amber-500/20"
                dir="ltr"
              >
                {contactInfo.phone}
              </a>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl lg:col-span-2">
            <h4 className="mb-4 text-lg font-black text-white">روابط سريعة</h4>
            <ul className="space-y-2.5 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link.page}>
                  <a
                    href="#"
                    onClick={(event) => handleNav(event, link.page)}
                    className="text-gray-300 transition-colors hover:text-amber-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl lg:col-span-3">
            <h4 className="mb-4 text-lg font-black text-white">السياسات والضمان</h4>
            <ul className="space-y-2.5 text-sm">
              {POLICY_LINKS.map((link) => (
                <li key={link.page}>
                  <a
                    href="#"
                    onClick={(event) => handleNav(event, link.page)}
                    className="text-gray-300 transition-colors hover:text-amber-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl lg:col-span-3">
            <h4 className="mb-4 text-lg font-black text-white">تواصل معنا</h4>
            <div className="space-y-3">
              {contactInfo?.socialMedia?.facebook && (
                <a
                  href={contactInfo.socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 transition-colors hover:bg-blue-500/15"
                >
                  <span className="text-sm font-bold text-white">فيسبوك</span>
                  <span className="text-xs text-gray-300">Reptile House</span>
                </a>
              )}

              {contactInfo?.socialMedia?.instagram && (
                <a
                  href={contactInfo.socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-pink-500/20 bg-pink-500/10 px-4 py-3 transition-colors hover:bg-pink-500/15"
                >
                  <span className="text-sm font-bold text-white">إنستغرام</span>
                  <span className="text-xs text-gray-300">@reptile_hou</span>
                </a>
              )}

              {contactInfo?.socialMedia?.whatsapp && (
                <a
                  href={`https://wa.me/${contactInfo.socialMedia.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 transition-colors hover:bg-green-500/15"
                >
                  <span className="text-sm font-bold text-white">واتساب</span>
                  <span className="text-xs text-gray-300 font-poppins" dir="ltr">
                    {contactInfo.socialMedia.whatsapp}
                  </span>
                </a>
              )}

              {contactInfo?.socialMedia?.telegram && (
                <a
                  href={contactInfo.socialMedia.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 transition-colors hover:bg-cyan-500/15"
                >
                  <span className="text-sm font-bold text-white">تيليجرام</span>
                  <span className="text-xs text-gray-300">Reptile House</span>
                </a>
              )}
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl lg:col-span-3">
            <h4 className="text-lg font-black text-white">رسالة المتجر</h4>
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              نعمل على تقديم تجربة احترافية، واضحة، وسريعة في عرض المنتجات وإدارة الطلبات، مع تحسين مستمر للجودة
              والتفاصيل التي تهم العميل.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl lg:col-span-2">
            <h4 className="text-lg font-black text-white">تواصل مع مطوّر المتجر</h4>
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              لأي تطويرات تقنية، تحسينات تجربة المستخدم، أو توسعة وظائف المتجر يمكنك التواصل مباشرة عبر إنستغرام.
            </p>
            <a
              href={DEVELOPER_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-dev-cta mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-black text-white"
            >
              تواصل مع مطوّر المتجر على إنستغرام
            </a>
          </section>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Reptile House Damascus. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
