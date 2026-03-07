/**
 * Database seed script with no demo data.
 * Creates only the minimum system rows required by settings screens.
 * Run: cd server && npm run db:seed
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyUtf8Session, MYSQL_COLLATION } from '../config/mysqlCharset.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8')
      .split('\n')
      .forEach((line) => {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
      });
  }
} catch (_) {}

const db = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'semo_reptile_house',
  charset: MYSQL_COLLATION,
};

const defaultPolicies = [
  {
    id: 'privacy',
    type: 'privacy',
    title: 'سياسة الخصوصية',
    content: 'نحترم خصوصيتك في Reptile House ونتعامل مع بياناتك بما يضمن الحماية والوضوح، مع استخدام المعلومات فقط لتحسين الخدمة ومعالجة الطلبات والتواصل عند الحاجة.',
    icon: '🔒',
  },
  {
    id: 'returns',
    type: 'returns',
    title: 'سياسة الاسترجاع والاستبدال',
    content: 'تُراجع طلبات الاسترجاع والاستبدال وفق حالة المنتج وطبيعته وشروط السلامة الخاصة بالزواحف والمستلزمات، مع الحرص على تقديم حل عادل وواضح لكل حالة.',
    icon: '🔄',
  },
  {
    id: 'warranty',
    type: 'warranty',
    title: 'سياسة الضمان والصحة',
    content: 'نلتزم بتقديم معلومات دقيقة حول الحالة الصحية للحيوانات المتاحة، مع توضيح آلية الضمان الصحي والمتابعة والإرشادات الأساسية بعد الاستلام.',
    icon: '✅',
  },
  {
    id: 'terms',
    type: 'terms',
    title: 'شروط الاستخدام',
    content: 'باستخدامك لموقع Reptile House فإنك توافق على الشروط المنظمة لعمليات الشراء والحجز والاستخدام، بما يحفظ حقوق العميل والمتجر ويضمن تجربة واضحة وآمنة.',
    icon: '📋',
  },
  {
    id: 'shipping',
    type: 'shipping',
    title: 'سياسة الشحن والتوصيل',
    content: 'ننسق الشحن والتوصيل بما يراعي سلامة الحيوان ودرجة الحرارة وظروف النقل، مع توضيح المواعيد المتاحة وآلية التسليم بحسب المدينة أو المحافظة.',
    icon: '🚚',
  },
];

const defaultPages = [
  ['page-home', 'home', 'Reptile House', 'وجهتك المتخصصة لعالم الزواحف والمستلزمات والخدمات الاحترافية، بخبرة عملية ورعاية مسؤولة تبدأ من أول سؤال وحتى استقرار الحيوان في بيئته الجديدة.', '<h2>أهلًا بك في بيت الزواحف</h2><p>في Reptile House نمنحك تجربة متكاملة تبدأ باختيار الزاحف المناسب، وتمر بتجهيز البيئة المثالية، وتنتهي بدعم عملي يرافقك بعد الشراء.</p><ul><li>زواحف مختارة بعناية وحالات صحية موثقة.</li><li>مستلزمات وتجهيزات موثوقة تناسب كل مرحلة من التربية.</li><li>استشارات واقعية تساعدك على اتخاذ القرار الصحيح بثقة.</li></ul>', 'Reptile House | الصفحة الرئيسية', 'اكتشف زواحف مختارة ومستلزمات موثوقة وخدمات احترافية في Reptile House.'],
  ['page-about', 'about', 'عن Reptile House', 'نحن أكثر من مجرد متجر؛ نحن مجتمع يجمعه الشغف بعالم الزواحف المذهل، ويؤمن بأن التربية المسؤولة تبدأ بالمعرفة والثقة والرعاية الصحيحة.', '<h2>قصتنا وكيف بدأت</h2><p>انطلقت رحلة Reptile House عام 2020 بقيادة سيمون من شغف حقيقي بهذه المخلوقات الفريدة. ومع الوقت، تحول الشغف إلى خبرة عملية وخدمة متخصصة تهدف إلى بناء تجربة أفضل للمربين في المنطقة.</p><p>نحن لا نركز على البيع فقط، بل على توفير انتقال آمن، وتجهيز صحيح، وإرشاد مستمر يضمن استقرار الحيوان وراحة المربي.</p><h2>ما الذي يميزنا؟</h2><ul><li>اختيار دقيق للحيوانات والمستلزمات.</li><li>فهم عملي للسلوك والبيئة والتغذية.</li><li>خدمة شخصية مبنية على الثقة والوضوح.</li></ul>', 'عن Reptile House', 'تعرف على قصة Reptile House ورؤية سيمون وخبرة المتجر في عالم الزواحف.'],
  ['page-contact', 'contact', 'تواصل مع Reptile House', 'إذا كان لديك سؤال عن نوع مناسب، أو تجهيز بيئة، أو خدمة متخصصة، فنحن جاهزون لمساعدتك بإجابات واضحة وعملية تناسب احتياجك الحقيقي.', '<h2>نحن هنا لمساعدتك</h2><p>سواء كنت تبدأ رحلتك الأولى في تربية الزواحف أو تبحث عن حل متقدم لحيوانك الحالي، يمكنك التواصل معنا للحصول على توجيه عملي وخيارات مناسبة.</p><p><strong>نصيحة:</strong> أرسل لنا تفاصيل النوع أو البيئة الحالية لنقدم لك توصية أدق وأسرع.</p>', 'تواصل مع Reptile House', 'تواصل مع فريق Reptile House للاستفسارات والطلبات والخدمات المتخصصة.'],
  ['page-privacy', 'privacy', 'سياسة الخصوصية', 'نوضح هنا كيف نجمع البيانات ونستخدمها ونحميها بما ينسجم مع طبيعة خدمات المتجر.', '<h2>سياسة الخصوصية</h2><p>يهدف هذا المستند إلى توضيح نوع المعلومات التي نجمعها وآلية استخدامها وحدود مشاركتها، مع التأكيد على احترام خصوصية العميل وحماية بياناته.</p>', 'سياسة الخصوصية | Reptile House', 'تعرف على سياسة الخصوصية وكيفية حماية بياناتك في Reptile House.'],
  ['page-terms', 'terms', 'الشروط والأحكام', 'تنظم هذه الصفحة استخدام الموقع وعمليات الطلب والحجز بما يضمن وضوح المسؤوليات والحقوق.', '<h2>الشروط والأحكام</h2><p>باستخدامك للموقع أو إتمامك لأي طلب، فإنك تقر بمراجعة الشروط المعتمدة التي تنظم آلية الشراء والحجز والتواصل وسياسة الخدمة.</p>', 'الشروط والأحكام | Reptile House', 'الشروط والأحكام المنظمة لاستخدام موقع Reptile House وخدماته.'],
  ['page-returns', 'returns', 'سياسة الإرجاع والاستبدال', 'نتعامل مع طلبات الاسترجاع والاستبدال بحساسية ومسؤولية، مع مراعاة سلامة الحيوان وطبيعة المنتج.', '<h2>سياسة الإرجاع والاستبدال</h2><p>تتم مراجعة كل طلب بحسب الحالة والسبب وطبيعة المنتج، مع الحرص على تقديم حل واضح وعادل خلال فترة معقولة.</p>', 'سياسة الإرجاع | Reptile House', 'اطلع على سياسة الإرجاع والاستبدال المعتمدة في Reptile House.'],
  ['page-shipping', 'shipping', 'سياسة الشحن والتوصيل', 'نرتب الشحن والتوصيل بما يراعي السلامة والحرارة والوقت المناسب لوصول الحيوان أو المنتج.', '<h2>سياسة الشحن والتوصيل</h2><p>نخطط الشحن بعناية بحسب نوع الحيوان أو المنتج والمنطقة المستهدفة، مع توضيح المواعيد المتاحة وآلية التسليم قبل تأكيد الطلب.</p>', 'سياسة الشحن | Reptile House', 'تعرف على آلية الشحن والتوصيل المعتمدة للحيوانات والمستلزمات.'],
  ['page-warranty', 'warranty', 'الضمان والصحة', 'نؤمن أن الثقة تبدأ من الشفافية، لذلك نوضح الحالة الصحية والمعلومات الأساسية قبل التسليم.', '<h2>الضمان والصحة</h2><p>نعرض المعلومات المرتبطة بالحالة الصحية والتغذية والرعاية الأولية، مع توضيح ما يشمله الضمان وآلية المتابعة بعد الاستلام.</p>', 'الضمان والصحة | Reptile House', 'تفاصيل الضمان الصحي والإرشادات الأساسية بعد استلام الحيوان.'],
  ['page-services', 'services', 'خدماتنا الاحترافية', 'نحن لا نبيع الزواحف فحسب، بل نبني بيئة متكاملة تضمن لك ولرفيقك الجديد حياة مستقرة وصحية بدم بارد.', '<h2>خدمات صُممت لتخدم المربي بجدية</h2><p>جمعنا أكثر الخدمات التي يحتاجها المربي في مكان واحد، من الإقامة المؤقتة والتصميم، إلى الدعم الطبي والغذائي وخيارات النقل الآمن.</p><ul><li>رعاية يومية دقيقة وإشراف موثوق.</li><li>حلول مخصصة بحسب النوع والعمر والبيئة.</li><li>متابعة عملية تساعدك على تقليل الأخطاء المكلفة.</li></ul>', 'خدمات Reptile House', 'تعرف على خدمات Reptile House من فندقة الزواحف والتيراريوم إلى الاستشارات والتوصيل الآمن.'],
  ['page-offers', 'offers', 'العروض والباقات المتكاملة', 'وفّر حتى 27% مع باقات تجمع العناصر الأساسية المتوافقة، لتبدأ أو تطور تجربة التربية بطريقة أذكى وأوفر.', '<h2>لماذا تختار باقاتنا؟</h2><ul><li><strong>توفير يصل إلى 27%</strong> عند جمع المستلزمات المناسبة ضمن باقة واحدة.</li><li><strong>مجموعات متوافقة</strong> صُممت لتعمل معًا بشكل عملي ومريح.</li><li><strong>ضمان الجودة</strong> لأن كل عنصر تم اختياره بعناية من Reptile House.</li></ul><p><strong>لا تفوت الفرصة:</strong> بعض العروض موسمي ومحدود الكمية، لذلك ننصح بالحجز المبكر.</p>', 'عروض Reptile House', 'استفد من العروض والباقات الموفرة في Reptile House وابدأ بتجهيز متكامل.'],
  ['page-showcase', 'showcase', 'معرض الزواحف', 'استعرض مجموعة مختارة من الزواحف المتاحة لدينا، مع تفاصيل تساعدك على اختيار النوع الأقرب لخبرتك واحتياجك.', '<h2>زواحف مختارة بعناية</h2><p>نحرص على عرض حالات مميزة ومتنوعة، مع إبراز المعلومات الأساسية التي يحتاجها المربي قبل اتخاذ القرار. نؤمن أن الاختيار الصحيح يبدأ بالمعلومة الصحيحة.</p>', 'معرض الزواحف | Reptile House', 'اكتشف الزواحف المتاحة لدى Reptile House مع عرض منظم وواضح للحالات المميزة.'],
  ['page-supplies', 'supplies', 'مستلزمات العناية والبيئة', 'كل ما تحتاجه لبناء بيئة متوازنة وآمنة لزاحفك: تدفئة، إضاءة، تغذية، تنظيف، وإكسسوارات عملية مختبرة.', '<h2>المستلزمات الصحيحة تصنع فرقًا كبيرًا</h2><p>نوفر منتجات أساسية ومتقدمة تساعدك على ضبط الحرارة والرطوبة والنظافة والتغذية، بما ينعكس مباشرة على صحة الحيوان وسهولة العناية اليومية.</p>', 'مستلزمات الزواحف | Reptile House', 'تسوق مستلزمات الزواحف الموثوقة من Reptile House لتجهيز بيئة صحية ومستقرة.'],
  ['page-blog', 'blog', 'المعرفة والخبرة', 'محتوى تثقيفي عملي يساعدك على فهم السلوك، التغذية، البيئة، والرعاية اليومية للزواحف بطريقة واضحة ومباشرة.', '<h2>تعلم قبل أن تقرر</h2><p>نشارك مقالات ونصائح مبنية على الخبرة اليومية في التعامل مع الزواحف، حتى يتمكن كل مربٍ من بناء قرارات أفضل وتفادي الأخطاء الشائعة.</p>', 'مدونة Reptile House', 'مقالات ونصائح عملية حول رعاية الزواحف والتغذية والبيئة المثالية.'],
];

const defaultCompanyInfo = {
  name: 'Reptile House',
  nameEnglish: 'Reptile House',
  description: 'نحن أكثر من مجرد متجر؛ نحن مجتمع يجمعه الشغف بعالم الزواحف المذهل. نعمل على تقديم زواحف منتقاة بعناية، ومستلزمات موثوقة، وخبرة عملية تجعل بداية كل مربٍ أكثر أمانًا وثقة.',
  foundedYear: 2020,
  mission: 'توفير زواحف صحية، سعيدة، ومنتجة محليًا، مع دعم المربين بالمعرفة العلمية والمعدات اللازمة لخلق بيئة مثالية لرفاقهم بدم بارد.',
  vision: 'أن نكون المركز الإقليمي الأول في الشرق الأوسط بقيادة سيمون للتوعية والتربية المسؤولة للزواحف، مع توفير الحلول المتخصصة والمستلزمات العالمية تحت سقف واحد.',
  story: 'تأسس Reptile House عام 2020 بقيادة سيمون انطلاقًا من شغف عميق بهذه المخلوقات الفريدة التي غالبًا ما يساء فهمها. بدأت الرحلة من اهتمام حقيقي بتربية الثعابين وتطوير بيئاتها المناسبة، ثم تطورت لتصبح وجهة موثوقة لعشاق الزواحف والبرمائيات النادرة.\n\nنحن لا نبيع الزواحف فحسب، بل نضمن انتقالها إلى بيئة جديدة آمنة ومجهزة بالكامل، مع تقديم استشارات مجانية طويلة الأمد لكل مربٍ يثق بخبرتنا.',
  logoUrl: '',
  mascotUrl: '',
};

const defaultTeamMembers = [
  {
    id: 'team-simon',
    name: 'سيمون',
    role: 'المؤسس وخبير الزواحف',
    imageUrl: '/assets/photo_2026-02-04_07-13-35.jpg',
    bio: 'يقود رؤية Reptile House بخبرة عملية متراكمة في اختيار الأنواع المناسبة وبناء بيئات تربية مستقرة وآمنة.',
    isActive: 1,
  },
];

const defaultContactInfo = {
  phone: '+963 993 595 766',
  email: 'info@reptilehouse.sy',
  address: 'Bchamoun Village 5-7, Bchamoun, Lebanon',
  city: 'Bchamoun',
  country: 'Lebanon',
  workingHours: 'يوميًا من 10:00 صباحًا حتى 8:00 مساءً بحسب المواعيد والحجوزات الخاصة.',
  socialMedia: {
    facebook: 'https://www.facebook.com/share/1EupNJpz48/',
    instagram: 'https://www.instagram.com/reptile_hou',
    whatsapp: '',
    telegram: '',
  },
};

const defaultSeoSettings = {
  siteName: 'Reptile House',
  defaultTitle: 'Reptile House | بيت الخبرة لعالم الزواحف',
  titleSeparator: '|',
  defaultDescription: 'متجر متخصص بالزواحف والمستلزمات والخدمات الاحترافية، مع محتوى تثقيفي وتجهيزات موثوقة للمربين الجدد والمحترفين.',
  defaultKeywords: 'Reptile House, زواحف, ثعابين, Ball Python, Corn Snake, مستلزمات زواحف, تيراريوم, رعاية الزواحف',
  canonicalBaseUrl: 'https://reptile-house.com',
  defaultOgImage: '/assets/photo_2026-02-04_07-13-35.jpg',
  twitterHandle: '',
  robotsIndex: 1,
  robotsFollow: 1,
  googleVerification: '',
  bingVerification: '',
  yandexVerification: '',
  locale: 'ar_LB',
  themeColor: '#0f172a',
  organizationName: 'Reptile House',
  organizationLogo: '/assets/photo_2026-02-04_07-13-35.jpg',
  organizationDescription: 'مجتمع متخصص في الزواحف يجمع بين الخبرة العملية والمنتجات المختارة والخدمات الاحترافية.',
  sitemapEnabled: 1,
  excludedPaths: '/dashboard',
  customRobotsTxt: '',
};

const defaultStoreSettings = {
  storeCurrency: 'USD',
  storeLanguage: 'ar',
  enableNotifications: 1,
  enableEmailNotifications: 1,
  enableSmsNotifications: 0,
  maintenanceMode: 0,
  allowGuestCheckout: 0,
  requireEmailVerification: 1,
  defaultUserRole: 'user',
  taxRate: 10,
  shippingFee: 15,
  freeShippingThreshold: 100,
  primaryColor: '#f59e0b',
  secondaryColor: '#6366f1',
  darkMode: 1,
};

async function run() {
  const conn = await mysql.createConnection(db);
  await applyUtf8Session(conn);
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  await conn.query('DELETE FROM users WHERE email IN (?, ?)', ['admin@reptilehouse.sy', 'user@reptilehouse.sy']);
  await conn.query('DELETE FROM services WHERE id IN (?, ?, ?, ?)', ['service-1', 'service-2', 'service-3', 'service-4']);
  await conn.query('DELETE FROM media_items WHERE id = ?', ['mascot-default']);
  await conn.query('DELETE FROM media_folders WHERE id = ?', ['folder-default']);
  await conn.query('DELETE FROM hero_slides WHERE id IN (?, ?)', ['1', '2']);
  await conn.query('DELETE FROM products WHERE image_url = ?', ['/assets/photo_2026-02-04_07-13-35.jpg']);
  console.log('Demo data cleanup completed.');

  await conn.query('INSERT IGNORE INTO company_info (id, name, name_english) VALUES (1, ?, ?)', ['Reptile House', 'Reptile House']);
  await conn.query('INSERT IGNORE INTO contact_info (id, phone, email, address, city, country, working_hours) VALUES (1, ?, ?, ?, ?, ?, ?)', ['', '', '', '', '', '', '']);
  await conn.query('INSERT IGNORE INTO shamcash_config (id, account_code, payment_instructions) VALUES (1, ?, ?)', ['', '']);
  await conn.query('INSERT IGNORE INTO seo_settings (id) VALUES (1)');
  await conn.query('INSERT IGNORE INTO store_settings (id) VALUES (1)');
  await conn.query('INSERT IGNORE INTO user_preferences (id, user_id, theme, language, notifications_enabled) VALUES (1, ?, ?, ?, ?)', ['default', 'dark', 'ar', 1]);
  console.log('System defaults ensured (without demo users/products/services).');

  await conn.query(
    `UPDATE company_info
     SET name = ?, name_english = ?, description = ?, founded_year = ?, mission = ?, vision = ?, story = ?, logo_url = ?, mascot_url = ?
     WHERE id = 1`,
    [
      defaultCompanyInfo.name,
      defaultCompanyInfo.nameEnglish,
      defaultCompanyInfo.description,
      defaultCompanyInfo.foundedYear,
      defaultCompanyInfo.mission,
      defaultCompanyInfo.vision,
      defaultCompanyInfo.story,
      defaultCompanyInfo.logoUrl,
      defaultCompanyInfo.mascotUrl,
    ],
  );

  await conn.query(
    `UPDATE contact_info
     SET phone = ?, email = ?, address = ?, city = ?, country = ?, working_hours = ?, social_media = ?
     WHERE id = 1`,
    [
      defaultContactInfo.phone,
      defaultContactInfo.email,
      defaultContactInfo.address,
      defaultContactInfo.city,
      defaultContactInfo.country,
      defaultContactInfo.workingHours,
      JSON.stringify(defaultContactInfo.socialMedia),
    ],
  );

  await conn.query(
    `UPDATE seo_settings
     SET site_name = ?, default_title = ?, title_separator = ?, default_description = ?, default_keywords = ?, canonical_base_url = ?, default_og_image = ?, twitter_handle = ?, robots_index = ?, robots_follow = ?, google_verification = ?, bing_verification = ?, yandex_verification = ?, locale = ?, theme_color = ?, organization_name = ?, organization_logo = ?, organization_description = ?, sitemap_enabled = ?, excluded_paths = ?, custom_robots_txt = ?
     WHERE id = 1`,
    [
      defaultSeoSettings.siteName,
      defaultSeoSettings.defaultTitle,
      defaultSeoSettings.titleSeparator,
      defaultSeoSettings.defaultDescription,
      defaultSeoSettings.defaultKeywords,
      defaultSeoSettings.canonicalBaseUrl,
      defaultSeoSettings.defaultOgImage,
      defaultSeoSettings.twitterHandle,
      defaultSeoSettings.robotsIndex,
      defaultSeoSettings.robotsFollow,
      defaultSeoSettings.googleVerification,
      defaultSeoSettings.bingVerification,
      defaultSeoSettings.yandexVerification,
      defaultSeoSettings.locale,
      defaultSeoSettings.themeColor,
      defaultSeoSettings.organizationName,
      defaultSeoSettings.organizationLogo,
      defaultSeoSettings.organizationDescription,
      defaultSeoSettings.sitemapEnabled,
      defaultSeoSettings.excludedPaths,
      defaultSeoSettings.customRobotsTxt,
    ],
  );

  await conn.query(
    `UPDATE store_settings
     SET store_currency = ?, store_language = ?, enable_notifications = ?, enable_email_notifications = ?, enable_sms_notifications = ?, maintenance_mode = ?, allow_guest_checkout = ?, require_email_verification = ?, default_user_role = ?, tax_rate = ?, shipping_fee = ?, free_shipping_threshold = ?, primary_color = ?, secondary_color = ?, dark_mode = ?
     WHERE id = 1`,
    [
      defaultStoreSettings.storeCurrency,
      defaultStoreSettings.storeLanguage,
      defaultStoreSettings.enableNotifications,
      defaultStoreSettings.enableEmailNotifications,
      defaultStoreSettings.enableSmsNotifications,
      defaultStoreSettings.maintenanceMode,
      defaultStoreSettings.allowGuestCheckout,
      defaultStoreSettings.requireEmailVerification,
      defaultStoreSettings.defaultUserRole,
      defaultStoreSettings.taxRate,
      defaultStoreSettings.shippingFee,
      defaultStoreSettings.freeShippingThreshold,
      defaultStoreSettings.primaryColor,
      defaultStoreSettings.secondaryColor,
      defaultStoreSettings.darkMode,
    ],
  );

  for (const policy of defaultPolicies) {
    await conn.query(
      `INSERT INTO policies (id, type, title, content, last_updated, is_active, icon)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE type=VALUES(type), title=VALUES(title), content=VALUES(content),
       last_updated=VALUES(last_updated), is_active=VALUES(is_active), icon=VALUES(icon)`,
      [policy.id, policy.type, policy.title, policy.content, today, 1, policy.icon]
    );
  }

  for (const [id, slug, title, excerpt, content, seoTitle, seoDescription] of defaultPages) {
    await conn.query(
      `INSERT INTO page_contents (id, slug, title, excerpt, content, seo_title, seo_description, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE slug=VALUES(slug), title=VALUES(title), excerpt=VALUES(excerpt), content=VALUES(content),
       seo_title=VALUES(seo_title), seo_description=VALUES(seo_description), is_active=VALUES(is_active), updated_at=VALUES(updated_at)`,
      [id, slug, title, excerpt, content, seoTitle, seoDescription, 1, now]
    );
  }
  console.log('Default policy and page-content rows ensured.');

  for (const member of defaultTeamMembers) {
    await conn.query(
      `INSERT INTO team_members (id, name, role, image_url, bio, is_active)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), image_url=VALUES(image_url), bio=VALUES(bio), is_active=VALUES(is_active)`,
      [member.id, member.name, member.role, member.imageUrl, member.bio, member.isActive],
    );
  }
  console.log('Default team rows ensured.');

  await conn.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
