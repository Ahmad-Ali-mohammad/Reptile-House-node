import React, { useEffect, useState } from 'react';
import { PhoneIcon, MailIcon, FacebookIcon } from '../components/icons';
import { ContactInfo, PageContent } from '../types';
import { api } from '../services/api';
import { usePageContent } from '../hooks/usePageContent';
import PageNotAvailable from '../components/PageNotAvailable';

const contactFallback: PageContent = {
  id: 'fallback-contact',
  slug: 'contact',
  title: 'اتصل بنا',
  excerpt: 'يسعدنا سماعك في أي وقت.',
  content: '',
  seoTitle: 'اتصل بنا - بيت الزواحف',
  seoDescription: 'تواصل معنا لأي استفسار أو طلب.',
  isActive: true,
  updatedAt: new Date().toISOString().slice(0, 10),
};

const ContactPage: React.FC = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [contactLoading, setContactLoading] = useState(true);
  const { pageContent: contactContent, isActive } = usePageContent('contact', contactFallback);

  useEffect(() => {
    api
      .getContactInfo()
      .then(setContactInfo)
      .catch(() => setContactInfo(null))
      .finally(() => setContactLoading(false));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('تم استلام رسالتك! سنعود إليك بأقرب وقت ممكن.');
    (e.target as HTMLFormElement).reset();
  };

  if (contactLoading) {
    return <div className="animate-fade-in text-center py-20">جاري التحميل...</div>;
  }

  if (!isActive) {
    return <PageNotAvailable title={contactContent.title || 'صفحة التواصل غير متاحة حالياً'} />;
  }

  if (!contactInfo) {
    return <div className="animate-fade-in text-center py-20 text-gray-400">تعذر تحميل بيانات التواصل.</div>;
  }

  return (
    <div>
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4">{contactContent.title || 'اتصل بنا'}</h1>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
          {contactContent.excerpt || 'يسعدنا سماعك في أي وقت. اترك لنا بياناتك وسنرد عليك بكل التفاصيل.'}
        </p>
      </section>

      {contactContent.content?.trim() && (
        <section className="mb-8 bg-white/5 backdrop-filter backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-gray-300 leading-loose text-right">
          <div dangerouslySetInnerHTML={{ __html: contactContent.content }} />
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {contactInfo.phone && (
            <div className="bg-white/5 backdrop-filter backdrop-blur-lg border border-white/20 rounded-2xl p-6 flex items-center space-x-4 space-x-reverse">
              <PhoneIcon className="w-8 h-8 text-amber-400" />
              <div>
                <h3 className="font-bold text-lg">رقم الهاتف</h3>
                <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="text-gray-300 hover:text-white" dir="ltr">
                  {contactInfo.phone}
                </a>
              </div>
            </div>
          )}

          {contactInfo.email && (
            <div className="bg-white/5 backdrop-filter backdrop-blur-lg border border-white/20 rounded-2xl p-6 flex items-center space-x-4 space-x-reverse">
              <MailIcon className="w-8 h-8 text-amber-400" />
              <div>
                <h3 className="font-bold text-lg">البريد الإلكتروني</h3>
                <a href={`mailto:${contactInfo.email}`} className="text-gray-300 hover:text-white">
                  {contactInfo.email}
                </a>
              </div>
            </div>
          )}

          {contactInfo.address && (
            <div className="bg-white/5 backdrop-filter backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-3">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                العنوان
              </h3>
              <p className="text-gray-300">{contactInfo.address}</p>
              {contactInfo.city && contactInfo.country && (
                <p className="text-gray-400 text-sm mt-1">{contactInfo.city}, {contactInfo.country}</p>
              )}
            </div>
          )}

          {contactInfo.workingHours && (
            <div className="bg-white/5 backdrop-filter backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-3">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ساعات العمل
              </h3>
              <p className="text-gray-300">{contactInfo.workingHours}</p>
            </div>
          )}

          {contactInfo.socialMedia && Object.keys(contactInfo.socialMedia).length > 0 && (
            <div className="bg-white/5 backdrop-filter backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <FacebookIcon className="w-8 h-8 text-amber-400" />
                <h3 className="font-bold text-lg">وسائل التواصل</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {contactInfo.socialMedia.facebook && (
                  <a href={contactInfo.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                    فيسبوك
                  </a>
                )}
                {contactInfo.socialMedia.instagram && (
                  <a href={contactInfo.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                    إنستغرام
                  </a>
                )}
                {contactInfo.socialMedia.whatsapp && (
                  <a href={`https://wa.me/${contactInfo.socialMedia.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                    واتساب
                  </a>
                )}
                {contactInfo.socialMedia.telegram && (
                  <a href={contactInfo.socialMedia.telegram} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                    تيليجرام
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/5 backdrop-filter backdrop-blur-lg border border-white/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">راسلنا مباشرة</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input id="contact-full-name" name="contactFullName" type="text" placeholder="الاسم الكامل" required className="w-full bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <input id="contact-email" name="contactEmail" type="email" placeholder="البريد الإلكتروني" required className="w-full bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <input id="contact-phone" name="contactPhone" type="tel" placeholder="رقم الهاتف (اختياري)" className="w-full bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <input id="contact-subject" name="contactSubject" type="text" placeholder="الموضوع" className="w-full bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <textarea id="contact-message" name="contactMessage" placeholder="اكتب رسالتك هنا..." required rows={4} className="w-full bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <button type="submit" className="w-full bg-amber-500 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-400 transition-colors">
              إرسال الرسالة
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
