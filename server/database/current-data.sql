-- Generated from current local database state
SET NAMES utf8mb4;
USE `semo_reptile_house`;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `company_info` (`id`, `name`, `name_english`, `description`, `founded_year`, `mission`, `vision`, `story`, `logo_url`, `mascot_url`, `updated_at`) VALUES
(1, 'Reptile House', 'Reptile House', 'نحن أكثر من مجرد متجر؛ نحن مجتمع يجمعه الشغف بعالم الزواحف المذهل. نعمل على تقديم زواحف منتقاة بعناية، ومستلزمات موثوقة، وخبرة عملية تجعل بداية كل مربٍ أكثر أمانًا وثقة.', 2020, 'توفير زواحف صحية، سعيدة، ومنتجة محليًا، مع دعم المربين بالمعرفة العلمية والمعدات اللازمة لخلق بيئة مثالية لرفاقهم بدم بارد.', 'أن نكون المركز الإقليمي الأول في الشرق الأوسط بقيادة سيمون للتوعية والتربية المسؤولة للزواحف، مع توفير الحلول المتخصصة والمستلزمات العالمية تحت سقف واحد.', 'تأسس Reptile House عام 2020 بقيادة سيمون انطلاقًا من شغف عميق بهذه المخلوقات الفريدة التي غالبًا ما يساء فهمها. بدأت الرحلة من اهتمام حقيقي بتربية الثعابين وتطوير بيئاتها المناسبة، ثم تطورت لتصبح وجهة موثوقة لعشاق الزواحف والبرمائيات النادرة.\n\nنحن لا نبيع الزواحف فحسب، بل نضمن انتقالها إلى بيئة جديدة آمنة ومجهزة بالكامل، مع تقديم استشارات مجانية طويلة الأمد لكل مربٍ يثق بخبرتنا.', '', '', '2026-03-06 17:45:00')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`), `name` = VALUES(`name`), `name_english` = VALUES(`name_english`), `description` = VALUES(`description`), `founded_year` = VALUES(`founded_year`), `mission` = VALUES(`mission`), `vision` = VALUES(`vision`), `story` = VALUES(`story`), `logo_url` = VALUES(`logo_url`), `mascot_url` = VALUES(`mascot_url`), `updated_at` = VALUES(`updated_at`);

INSERT INTO `contact_info` (`id`, `phone`, `email`, `address`, `city`, `country`, `working_hours`, `social_media`, `updated_at`) VALUES
(1, '', '', '', '', '', '', '{}', '2026-03-06 13:09:32')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`), `phone` = VALUES(`phone`), `email` = VALUES(`email`), `address` = VALUES(`address`), `city` = VALUES(`city`), `country` = VALUES(`country`), `working_hours` = VALUES(`working_hours`), `social_media` = VALUES(`social_media`), `updated_at` = VALUES(`updated_at`);

INSERT INTO `page_contents` (`id`, `slug`, `title`, `excerpt`, `content`, `seo_title`, `seo_description`, `is_active`, `updated_at`, `created_at`) VALUES
('page-about', 'about', 'عن Reptile House', 'نحن أكثر من مجرد متجر؛ نحن مجتمع يجمعه الشغف بعالم الزواحف المذهل، ويؤمن بأن التربية المسؤولة تبدأ بالمعرفة والثقة والرعاية الصحيحة.', '<h2>قصتنا وكيف بدأت</h2><p>انطلقت رحلة Reptile House عام 2020 بقيادة سيمون من شغف حقيقي بهذه المخلوقات الفريدة. ومع الوقت، تحول الشغف إلى خبرة عملية وخدمة متخصصة تهدف إلى بناء تجربة أفضل للمربين في المنطقة.</p><p>نحن لا نركز على البيع فقط، بل على توفير انتقال آمن، وتجهيز صحيح، وإرشاد مستمر يضمن استقرار الحيوان وراحة المربي.</p><h2>ما الذي يميزنا؟</h2><ul><li>اختيار دقيق للحيوانات والمستلزمات.</li><li>فهم عملي للسلوك والبيئة والتغذية.</li><li>خدمة شخصية مبنية على الثقة والوضوح.</li></ul>', 'عن Reptile House', 'تعرف على قصة Reptile House ورؤية سيمون وخبرة المتجر في عالم الزواحف.', 1, '2026-03-06 17:45:00', '2026-03-06 14:09:35'),
('page-blog', 'blog', 'المدونة', 'محتوى صفحة المدونة.', '', 'المدونة - بيت الزواحف', 'مقالات ونصائح حول رعاية الزواحف.', 1, '2026-03-06 11:09:35', '2026-03-06 14:09:35'),
('page-contact', 'contact', 'اتصل بنا', 'محتوى صفحة التواصل والتعليمات.', 'حرر نصوص التواصل ونماذج الطلب.', 'اتصل بنا - بيت الزواحف', 'تواصل معنا لأي استفسار أو طلب.', 1, '2026-03-06 11:09:35', '2026-03-06 14:09:35'),
('page-home', 'home', 'الصفحة الرئيسية', 'محتوى الواجهة الرئيسية والعناوين التسويقية.', 'حرر نصوص الصفحة الرئيسية من هنا.', 'بيت الزواحف - الصفحة الرئيسية', 'أفضل متجر للزواحف والمستلزمات.', 1, '2026-03-06 11:09:35', '2026-03-06 14:09:35'),
('page-offers', 'offers', 'العروض', 'محتوى صفحة العروض الترويجية.', '', 'العروض - بيت الزواحف', 'العروض الحالية في بيت الزواحف.', 1, '2026-03-06 11:09:35', '2026-03-06 14:09:35'),
('page-privacy', 'privacy', 'سياسة الخصوصية', 'سياسة خصوصية بيانات المستخدمين.', '<h2>سياسة الخصوصية</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>', 'سياسة الخصوصية - بيت الزواحف', 'سياسة الخصوصية في متجر بيت الزواحف.', 1, '2026-03-06 11:09:35', '2026-03-06 14:09:35'),
('page-returns', 'returns', 'سياسة الإرجاع', 'الشروط المعتمدة للإرجاع والاستبدال.', '<h2>سياسة الإرجاع</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>', 'سياسة الإرجاع - بيت الزواحف', 'سياسة الإرجاع والاستبدال.', 1, '2026-03-06 11:09:35', '2026-03-06 14:09:35'),
('page-services', 'services', 'الخدمات', 'محتوى صفحة الخدمات.', '', 'الخدمات - بيت الزواحف', 'خدمات بيت الزواحف المتاحة للعملاء.', 1, '2026-03-06 11:09:35', '2026-03-06 14:09:35'),
('page-shipping', 'shipping', 'سياسة الشحن', 'مواعيد الشحن وخيارات التوصيل.', '<h2>سياسة الشحن</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>', 'سياسة الشحن - بيت الزواحف', 'سياسة الشحن والتوصيل.', 1, '2026-03-06 11:09:35', '2026-03-06 14:09:35'),
('page-showcase', 'showcase', 'المعرض', 'محتوى صفحة المعرض.', '', 'المعرض - بيت الزواحف', 'استعرض جميع الزواحف المتاحة.', 1, '2026-03-06 11:09:35', '2026-03-06 14:09:35'),
('page-supplies', 'supplies', 'مستلزمات العناية والبيئة', 'كل ما تحتاجه لبناء بيئة متوازنة وآمنة لزاحفك: تدفئة، إضاءة، تغذية، تنظيف، وإكسسوارات عملية مختبرة.', '<h2>المستلزمات الصحيحة تصنع فرقًا كبيرًا</h2><p>نوفر منتجات أساسية ومتقدمة تساعدك على ضبط الحرارة والرطوبة والنظافة والتغذية، بما ينعكس مباشرة على صحة الحيوان وسهولة العناية اليومية.</p>', 'مستلزمات الزواحف | Reptile House', 'تسوق مستلزمات الزواحف الموثوقة من Reptile House لتجهيز بيئة صحية ومستقرة.', 1, '2026-03-06 17:45:00', '2026-03-06 14:09:35'),
('page-terms', 'terms', 'الشروط والأحكام', 'الشروط العامة لاستخدام الموقع.', '<h2>الشروط والأحكام</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>', 'الشروط والأحكام - بيت الزواحف', 'شروط وأحكام الاستخدام.', 1, '2026-03-06 11:09:35', '2026-03-06 14:09:35'),
('page-warranty', 'warranty', 'الضمان والصحة', 'تفاصيل الضمان الصحي للزواحف.', '<h2>الضمان والصحة</h2><p>يمكنك تعديل محتوى هذه الصفحة من لوحة إدارة المحتوى.</p>', 'الضمان والصحة - بيت الزواحف', 'سياسة الضمان الصحي.', 1, '2026-03-06 11:09:35', '2026-03-06 14:09:35')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`), `slug` = VALUES(`slug`), `title` = VALUES(`title`), `excerpt` = VALUES(`excerpt`), `content` = VALUES(`content`), `seo_title` = VALUES(`seo_title`), `seo_description` = VALUES(`seo_description`), `is_active` = VALUES(`is_active`), `updated_at` = VALUES(`updated_at`), `created_at` = VALUES(`created_at`);

INSERT INTO `team_members` (`id`, `name`, `role`, `image_url`, `bio`, `is_active`, `created_at`) VALUES
('team-simon', 'سيمون', 'المؤسس وخبير الزواحف', '/assets/photo_2026-02-04_07-13-35.jpg', 'يقود رؤية Reptile House بخبرة عملية متراكمة في اختيار الأنواع المناسبة وبناء بيئات تربية مستقرة وآمنة.', 1, '2026-03-06 17:45:00')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`), `name` = VALUES(`name`), `role` = VALUES(`role`), `image_url` = VALUES(`image_url`), `bio` = VALUES(`bio`), `is_active` = VALUES(`is_active`), `created_at` = VALUES(`created_at`);

INSERT INTO `policies` (`id`, `type`, `title`, `content`, `last_updated`, `is_active`, `icon`, `created_at`) VALUES
('privacy', 'privacy', 'سياسة الخصوصية', 'نحن في Reptile House نحترم خصوصيتك ونلتزم بحماية معلوماتك الشخصية.', '2026-03-06', 1, '🔒', '2026-03-06 14:09:35'),
('returns', 'returns', 'سياسة الاسترجاع والاستبدال', 'يمكنك إرجاع أو استبدال المنتجات وفق الشروط المعتمدة من إدارة المتجر.', '2026-03-06', 1, '🔄', '2026-03-06 14:09:35'),
('shipping', 'shipping', 'سياسة الشحن والتوصيل', 'تُراجع مواعيد الشحن وخيارات التوصيل من لوحة الإدارة ويمكن تعديلها في أي وقت.', '2026-03-06', 1, '🚚', '2026-03-06 14:09:35'),
('terms', 'terms', 'شروط الاستخدام', 'باستخدامك لهذا الموقع، فإنك توافق على الشروط والأحكام المعتمدة من المتجر.', '2026-03-06', 1, '📋', '2026-03-06 14:09:35'),
('warranty', 'warranty', 'سياسة الضمان', 'نلتزم بضمان صحة الزواحف والمعلومات المرتبطة بها وفق السياسة المعلنة.', '2026-03-06', 1, '✅', '2026-03-06 14:09:35')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`), `type` = VALUES(`type`), `title` = VALUES(`title`), `content` = VALUES(`content`), `last_updated` = VALUES(`last_updated`), `is_active` = VALUES(`is_active`), `icon` = VALUES(`icon`), `created_at` = VALUES(`created_at`);

INSERT INTO `seo_settings` (`id`, `site_name`, `default_title`, `title_separator`, `default_description`, `default_keywords`, `canonical_base_url`, `default_og_image`, `twitter_handle`, `robots_index`, `robots_follow`, `google_verification`, `bing_verification`, `yandex_verification`, `locale`, `theme_color`, `organization_name`, `organization_logo`, `organization_description`, `sitemap_enabled`, `excluded_paths`, `custom_robots_txt`, `updated_at`) VALUES
(1, 'Reptile House', 'Reptile House', '|', '', NULL, 'https://reptile-house.com', '', '', 1, 1, '', '', '', 'ar_SY', '#0f172a', 'Reptile House', '', '', 1, NULL, NULL, '2026-03-06 13:09:32')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`), `site_name` = VALUES(`site_name`), `default_title` = VALUES(`default_title`), `title_separator` = VALUES(`title_separator`), `default_description` = VALUES(`default_description`), `default_keywords` = VALUES(`default_keywords`), `canonical_base_url` = VALUES(`canonical_base_url`), `default_og_image` = VALUES(`default_og_image`), `twitter_handle` = VALUES(`twitter_handle`), `robots_index` = VALUES(`robots_index`), `robots_follow` = VALUES(`robots_follow`), `google_verification` = VALUES(`google_verification`), `bing_verification` = VALUES(`bing_verification`), `yandex_verification` = VALUES(`yandex_verification`), `locale` = VALUES(`locale`), `theme_color` = VALUES(`theme_color`), `organization_name` = VALUES(`organization_name`), `organization_logo` = VALUES(`organization_logo`), `organization_description` = VALUES(`organization_description`), `sitemap_enabled` = VALUES(`sitemap_enabled`), `excluded_paths` = VALUES(`excluded_paths`), `custom_robots_txt` = VALUES(`custom_robots_txt`), `updated_at` = VALUES(`updated_at`);

INSERT INTO `shamcash_config` (`id`, `barcode_image_url`, `account_code`, `is_active`, `account_holder_name`, `phone_number`, `payment_instructions`, `updated_at`) VALUES
(1, '', '', 1, '', '', '', '2026-03-06 13:09:32')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`), `barcode_image_url` = VALUES(`barcode_image_url`), `account_code` = VALUES(`account_code`), `is_active` = VALUES(`is_active`), `account_holder_name` = VALUES(`account_holder_name`), `phone_number` = VALUES(`phone_number`), `payment_instructions` = VALUES(`payment_instructions`), `updated_at` = VALUES(`updated_at`);

INSERT INTO `users` (`id`, `name`, `email`, `role`, `avatar_url`, `password_hash`, `password_salt`, `created_at`) VALUES
('admin-1772773847651', 'Owner', 'owner@reptilehouse.sy', 'admin', NULL, '288ba173dc2442b1013167e5184ffb6edcad9a3db25fc4215e56b25948943082', '7f6eccc36f831a22a4fae7ee5d84a4bb', '2026-03-06 05:10:47')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`), `name` = VALUES(`name`), `email` = VALUES(`email`), `role` = VALUES(`role`), `avatar_url` = VALUES(`avatar_url`), `password_hash` = VALUES(`password_hash`), `password_salt` = VALUES(`password_salt`), `created_at` = VALUES(`created_at`);

INSERT INTO `user_preferences` (`id`, `user_id`, `theme`, `language`, `notifications_enabled`, `updated_at`) VALUES
(1, 'default', 'dark', 'ar', 1, '2026-02-17 06:35:53'),
(2, 'admin-1772773847651', 'dark', 'ar', 1, '2026-03-06 11:17:48')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`), `user_id` = VALUES(`user_id`), `theme` = VALUES(`theme`), `language` = VALUES(`language`), `notifications_enabled` = VALUES(`notifications_enabled`), `updated_at` = VALUES(`updated_at`);

SET FOREIGN_KEY_CHECKS = 1;
