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
import { applyUtf8Session, MYSQL_CHARSET } from '../config/mysqlCharset.js';

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
  charset: MYSQL_CHARSET,
};

const defaultPolicies = [
  {
    id: 'privacy',
    type: 'privacy',
    title: 'سياسة الخصوصية',
    content: 'نحن في Reptile House نحترم خصوصيتك ونلتزم بحماية معلوماتك الشخصية.',
    icon: '🔒',
  },
  {
    id: 'returns',
    type: 'returns',
    title: 'سياسة الاسترجاع والاستبدال',
    content: 'يمكنك إرجاع أو استبدال المنتجات وفق الشروط المعتمدة من إدارة المتجر.',
    icon: '🔄',
  },
  {
    id: 'warranty',
    type: 'warranty',
    title: 'سياسة الضمان',
    content: 'نلتزم بضمان صحة الزواحف والمعلومات المرتبطة بها وفق السياسة المعلنة.',
    icon: '✅',
  },
  {
    id: 'terms',
    type: 'terms',
    title: 'شروط الاستخدام',
    content: 'باستخدامك لهذا الموقع، فإنك توافق على الشروط والأحكام المعتمدة من المتجر.',
    icon: '📋',
  },
  {
    id: 'shipping',
    type: 'shipping',
    title: 'سياسة الشحن والتوصيل',
    content: 'تُراجع مواعيد الشحن وخيارات التوصيل من لوحة الإدارة ويمكن تعديلها في أي وقت.',
    icon: '🚚',
  },
];

const defaultPages = [
  ['page-home', 'home', 'الصفحة الرئيسية', 'محتوى الواجهة الرئيسية والعناوين التسويقية.', 'حرر نصوص الصفحة الرئيسية من هنا.', 'بيت الزواحف - الصفحة الرئيسية', 'أفضل متجر للزواحف والمستلزمات.'],
  ['page-about', 'about', 'من نحن', 'محتوى صفحة من نحن ورسالة المتجر.', 'حرر قصة المتجر والرؤية والقيم.', 'من نحن - بيت الزواحف', 'تعرف على فريق بيت الزواحف.'],
  ['page-contact', 'contact', 'اتصل بنا', 'محتوى صفحة التواصل والتعليمات.', 'حرر نصوص التواصل ونماذج الطلب.', 'اتصل بنا - بيت الزواحف', 'تواصل معنا لأي استفسار أو طلب.'],
  ['page-privacy', 'privacy', 'سياسة الخصوصية', 'سياسة خصوصية بيانات المستخدمين.', '<h2>سياسة الخصوصية</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>', 'سياسة الخصوصية - بيت الزواحف', 'سياسة الخصوصية في متجر بيت الزواحف.'],
  ['page-terms', 'terms', 'الشروط والأحكام', 'الشروط العامة لاستخدام الموقع.', '<h2>الشروط والأحكام</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>', 'الشروط والأحكام - بيت الزواحف', 'شروط وأحكام الاستخدام.'],
  ['page-returns', 'returns', 'سياسة الإرجاع', 'الشروط المعتمدة للإرجاع والاستبدال.', '<h2>سياسة الإرجاع</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>', 'سياسة الإرجاع - بيت الزواحف', 'سياسة الإرجاع والاستبدال.'],
  ['page-shipping', 'shipping', 'سياسة الشحن', 'مواعيد الشحن وخيارات التوصيل.', '<h2>سياسة الشحن</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>', 'سياسة الشحن - بيت الزواحف', 'سياسة الشحن والتوصيل.'],
  ['page-warranty', 'warranty', 'الضمان والصحة', 'تفاصيل الضمان الصحي للزواحف.', '<h2>الضمان والصحة</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>', 'الضمان والصحة - بيت الزواحف', 'سياسة الضمان الصحي.'],
  ['page-services', 'services', 'الخدمات', 'محتوى صفحة الخدمات.', '', 'الخدمات - بيت الزواحف', 'خدمات بيت الزواحف المتاحة للعملاء.'],
  ['page-offers', 'offers', 'العروض', 'محتوى صفحة العروض الترويجية.', '', 'العروض - بيت الزواحف', 'العروض الحالية في بيت الزواحف.'],
  ['page-showcase', 'showcase', 'المعرض', 'محتوى صفحة المعرض.', '', 'المعرض - بيت الزواحف', 'استعرض جميع الزواحف المتاحة.'],
  ['page-supplies', 'supplies', 'المستلزمات', 'محتوى صفحة المستلزمات.', '', 'المستلزمات - بيت الزواحف', 'كل مستلزمات الزواحف في مكان واحد.'],
  ['page-blog', 'blog', 'المدونة', 'محتوى صفحة المدونة.', '', 'المدونة - بيت الزواحف', 'مقالات ونصائح حول رعاية الزواحف.'],
];

async function run() {
  const conn = await mysql.createConnection(db);
  await applyUtf8Session(conn);
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Remove known demo accounts and content if present.
  await conn.query('DELETE FROM users WHERE email IN (?, ?)', ['admin@reptilehouse.sy', 'user@reptilehouse.sy']);
  await conn.query('DELETE FROM services WHERE id IN (?, ?, ?, ?)', ['service-1', 'service-2', 'service-3', 'service-4']);
  await conn.query('DELETE FROM media_items WHERE id = ?', ['mascot-default']);
  await conn.query('DELETE FROM media_folders WHERE id = ?', ['folder-default']);
  await conn.query('DELETE FROM hero_slides WHERE id IN (?, ?)', ['1', '2']);
  await conn.query('DELETE FROM products WHERE image_url = ?', ['/assets/photo_2026-02-04_07-13-35.jpg']);
  console.log('Demo data cleanup completed.');

  // Keep required singleton rows only.
  await conn.query('INSERT IGNORE INTO company_info (id, name, name_english) VALUES (1, ?, ?)', ['Reptile House', 'Reptile House']);
  await conn.query('INSERT IGNORE INTO contact_info (id, phone, email, address, city, country, working_hours) VALUES (1, ?, ?, ?, ?, ?, ?)', [
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  await conn.query('INSERT IGNORE INTO shamcash_config (id, account_code, payment_instructions) VALUES (1, ?, ?)', ['', '']);
  await conn.query('INSERT IGNORE INTO seo_settings (id) VALUES (1)');
  await conn.query('INSERT IGNORE INTO user_preferences (id, user_id, theme, language, notifications_enabled) VALUES (1, ?, ?, ?, ?)', [
    'default',
    'dark',
    'ar',
    1,
  ]);
  console.log('System defaults ensured (without demo users/products/services).');

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

  await conn.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
