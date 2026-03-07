-- قاعدة بيانات بيت الحيايا - MySQL
-- تشغيل: mysql -u root -p < server/database/schema.sql
-- أو استيراد من أدوات إدارة MySQL

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS semo_reptile_house CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE semo_reptile_house;

-- المستخدمون
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role ENUM('admin','manager','editor','user') NOT NULL DEFAULT 'user',
  avatar_url VARCHAR(512) DEFAULT NULL,
  password_hash VARCHAR(128) DEFAULT NULL,
  password_salt VARCHAR(64) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- المنتجات (زواحف)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  species VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  image_url VARCHAR(1024) NOT NULL DEFAULT '',
  rating DECIMAL(3,2) NOT NULL DEFAULT 5,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  status VARCHAR(32) NOT NULL DEFAULT 'متوفر',
  category VARCHAR(32) NOT NULL,
  specifications JSON,
  reviews JSON,
  care_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- الطلبات
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) DEFAULT NULL,
  customer_name VARCHAR(255) DEFAULT NULL,
  customer_email VARCHAR(255) DEFAULT NULL,
  customer_phone VARCHAR(64) DEFAULT NULL,
  shipping_address VARCHAR(512) DEFAULT NULL,
  shipping_city VARCHAR(128) DEFAULT NULL,
  shipping_country VARCHAR(128) DEFAULT NULL,
  date VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'قيد المعالجة',
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT NULL,
  payment_confirmation_image VARCHAR(1024) DEFAULT NULL,
  payment_method VARCHAR(32) DEFAULT NULL,
  payment_verification_status VARCHAR(32) NOT NULL DEFAULT 'قيد المراجعة',
  rejection_reason TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_customer_id (customer_id)
);

-- عناصر الطلب
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  reptile_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(12,2) NOT NULL,
  image_url VARCHAR(1024) DEFAULT '',
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order (order_id)
);

-- المقالات
CREATE TABLE IF NOT EXISTS articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content LONGTEXT,
  category VARCHAR(64) NOT NULL,
  date VARCHAR(32) NOT NULL,
  author VARCHAR(255) NOT NULL,
  image VARCHAR(1024) NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- المستلزمات
CREATE TABLE IF NOT EXISTS supplies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  image_url VARCHAR(1024) NOT NULL DEFAULT '',
  rating DECIMAL(3,2) NOT NULL DEFAULT 5,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  status VARCHAR(32) NOT NULL DEFAULT 'متوفر',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- شرائح الهيرو
CREATE TABLE IF NOT EXISTS hero_slides (
  id VARCHAR(64) PRIMARY KEY,
  image VARCHAR(1024) NOT NULL DEFAULT '',
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  button_text VARCHAR(128) NOT NULL DEFAULT '',
  link VARCHAR(255) NOT NULL DEFAULT '',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- العناوين
CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(128) NOT NULL,
  street VARCHAR(512) NOT NULL,
  city VARCHAR(128) NOT NULL,
  country VARCHAR(128) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- معلومات الشركة (صف واحد)
CREATE TABLE IF NOT EXISTS company_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT '',
  name_english VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT,
  founded_year INT DEFAULT NULL,
  mission TEXT,
  vision TEXT,
  story TEXT,
  logo_url VARCHAR(1024) DEFAULT NULL,
  mascot_url VARCHAR(1024) DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- معلومات التواصل (صف واحد)
CREATE TABLE IF NOT EXISTS contact_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(64) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  address VARCHAR(512) NOT NULL DEFAULT '',
  city VARCHAR(128) NOT NULL DEFAULT '',
  country VARCHAR(128) NOT NULL DEFAULT '',
  working_hours VARCHAR(255) NOT NULL DEFAULT '',
  social_media JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- إعدادات شام كاش (صف واحد)
CREATE TABLE IF NOT EXISTS shamcash_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  barcode_image_url VARCHAR(1024) NOT NULL DEFAULT '',
  account_code VARCHAR(64) NOT NULL DEFAULT '',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  account_holder_name VARCHAR(255) NOT NULL DEFAULT '',
  phone_number VARCHAR(64) NOT NULL DEFAULT '',
  payment_instructions TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- SEO settings (single row)
CREATE TABLE IF NOT EXISTS seo_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(255) NOT NULL DEFAULT 'Reptile House',
  default_title VARCHAR(255) NOT NULL DEFAULT 'بيت الزواحف | متجر الزواحف والمستلزمات',
  title_separator VARCHAR(16) NOT NULL DEFAULT '|',
  default_description TEXT,
  default_keywords TEXT,
  canonical_base_url VARCHAR(1024) NOT NULL DEFAULT '',
  default_og_image VARCHAR(1024) DEFAULT '',
  twitter_handle VARCHAR(64) DEFAULT '',
  robots_index TINYINT(1) NOT NULL DEFAULT 1,
  robots_follow TINYINT(1) NOT NULL DEFAULT 1,
  google_verification VARCHAR(255) DEFAULT '',
  bing_verification VARCHAR(255) DEFAULT '',
  yandex_verification VARCHAR(255) DEFAULT '',
  locale VARCHAR(16) NOT NULL DEFAULT 'ar_SY',
  theme_color VARCHAR(16) NOT NULL DEFAULT '#0f172a',
  organization_name VARCHAR(255) NOT NULL DEFAULT 'Reptile House',
  organization_logo VARCHAR(1024) DEFAULT '',
  organization_description TEXT,
  sitemap_enabled TINYINT(1) NOT NULL DEFAULT 1,
  excluded_paths TEXT,
  custom_robots_txt TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Store settings (single row)
CREATE TABLE IF NOT EXISTS store_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  store_language VARCHAR(8) NOT NULL DEFAULT 'ar',
  enable_notifications TINYINT(1) NOT NULL DEFAULT 1,
  enable_email_notifications TINYINT(1) NOT NULL DEFAULT 1,
  enable_sms_notifications TINYINT(1) NOT NULL DEFAULT 0,
  maintenance_mode TINYINT(1) NOT NULL DEFAULT 0,
  allow_guest_checkout TINYINT(1) NOT NULL DEFAULT 0,
  require_email_verification TINYINT(1) NOT NULL DEFAULT 1,
  default_user_role VARCHAR(16) NOT NULL DEFAULT 'user',
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  free_shipping_threshold DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  primary_color VARCHAR(16) NOT NULL DEFAULT '#f59e0b',
  secondary_color VARCHAR(16) NOT NULL DEFAULT '#6366f1',
  dark_mode TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- أعضاء الفريق
CREATE TABLE IF NOT EXISTS team_members (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  image_url VARCHAR(1024) NOT NULL DEFAULT '',
  bio TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- مجموعات الفلاتر
CREATE TABLE IF NOT EXISTS filter_groups (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(32) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  applies_to VARCHAR(32) NOT NULL DEFAULT 'products',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- خيارات الفلتر
CREATE TABLE IF NOT EXISTS filter_options (
  id VARCHAR(64) PRIMARY KEY,
  filter_group_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (filter_group_id) REFERENCES filter_groups(id) ON DELETE CASCADE,
  INDEX idx_group (filter_group_id)
);

-- التصنيفات المخصصة
CREATE TABLE IF NOT EXISTS custom_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  value VARCHAR(64) NOT NULL,
  label VARCHAR(255) NOT NULL,
  UNIQUE KEY uq_value (value)
);

-- الأنواع المخصصة
CREATE TABLE IF NOT EXISTS custom_species (
  id INT AUTO_INCREMENT PRIMARY KEY,
  species VARCHAR(255) NOT NULL,
  UNIQUE KEY uq_species (species(191))
);

-- السياسات
CREATE TABLE IF NOT EXISTS policies (
  id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  last_updated VARCHAR(32) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  icon VARCHAR(128) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- العروض الترويجية
CREATE TABLE IF NOT EXISTS offers (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(1024) NOT NULL DEFAULT '',
  discount_percentage INT DEFAULT NULL,
  start_date VARCHAR(32) NOT NULL,
  end_date VARCHAR(32) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  target_category VARCHAR(32) DEFAULT NULL,
  button_text VARCHAR(128) DEFAULT NULL,
  button_link VARCHAR(512) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الخدمات
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(1024) NOT NULL DEFAULT '',
  icon VARCHAR(64) DEFAULT NULL,
  price DECIMAL(10, 2) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_published (is_published)
);

-- محتوى الصفحات (CMS)
CREATE TABLE IF NOT EXISTS page_contents (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(128) NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content LONGTEXT NOT NULL,
  seo_title VARCHAR(255) DEFAULT NULL,
  seo_description TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_page_contents_slug (slug)
);


-- مكتبة الوسائط مع ميزات متقدمة
CREATE TABLE IF NOT EXISTS media_items (
  id VARCHAR(64) PRIMARY KEY,
  url TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  size VARCHAR(32) NOT NULL,
  file_type VARCHAR(16) DEFAULT 'image',
  mime_type VARCHAR(64) DEFAULT NULL,
  alt_text VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  category VARCHAR(64) DEFAULT NULL,
  folder_id VARCHAR(64) DEFAULT NULL,
  date VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name(191)),
  INDEX idx_category (category),
  INDEX idx_folder (folder_id),
  INDEX idx_date (date)
);

-- مجلدات الوسائط
CREATE TABLE IF NOT EXISTS media_folders (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id VARCHAR(64) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES media_folders(id) ON DELETE CASCADE,
  INDEX idx_parent (parent_id)
);

-- تفضيلات المستخدم (UI)
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64) DEFAULT 'default',
  theme VARCHAR(16) NOT NULL DEFAULT 'dark',
  language VARCHAR(8) NOT NULL DEFAULT 'ar',
  notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_prefs (user_id)
);

-- إدراج صف افتراضي للإعدادات الأحادية
INSERT IGNORE INTO company_info (id, name, name_english) VALUES (1, 'Reptile House', 'Reptile House');
INSERT IGNORE INTO contact_info (id, phone, email, address, city, country, working_hours) VALUES (1, '+963 XXX XXX XXX', 'info@reptilehouse.sy', 'دمشق، سوريا', 'دمشق', 'سوريا', 'السبت - الخميس: 9:00 - 20:00');
INSERT IGNORE INTO shamcash_config (id, account_code, payment_instructions) VALUES (1, '000000000000', 'قم بمسح الباركود أو إدخال رقم الحساب يدوياً.');
INSERT IGNORE INTO seo_settings (id) VALUES (1);
INSERT IGNORE INTO store_settings (id) VALUES (1);
INSERT IGNORE INTO user_preferences (id, user_id, theme, language, notifications_enabled) VALUES (1, 'default', 'dark', 'ar', 1);

SET FOREIGN_KEY_CHECKS = 1;
