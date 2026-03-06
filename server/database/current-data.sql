-- Generated from current local database state
SET NAMES utf8mb4;
USE `semo_reptile_house`;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `company_info` (`id`, `name`, `name_english`, `description`, `founded_year`, `mission`, `vision`, `story`, `logo_url`, `mascot_url`, `updated_at`) VALUES
(1, 'Reptile House', 'Reptile House', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-06 13:09:32');

INSERT INTO `contact_info` (`id`, `phone`, `email`, `address`, `city`, `country`, `working_hours`, `social_media`, `updated_at`) VALUES
(1, '', '', '', '', '', '', '{}', '2026-03-06 13:09:32');

INSERT INTO `seo_settings` (`id`, `site_name`, `default_title`, `title_separator`, `default_description`, `default_keywords`, `canonical_base_url`, `default_og_image`, `twitter_handle`, `robots_index`, `robots_follow`, `google_verification`, `bing_verification`, `yandex_verification`, `locale`, `theme_color`, `organization_name`, `organization_logo`, `organization_description`, `sitemap_enabled`, `excluded_paths`, `custom_robots_txt`, `updated_at`) VALUES
(1, 'Reptile House', 'Reptile House', '|', '', NULL, 'https://reptile-house.com', '', '', 1, 1, '', '', '', 'ar_SY', '#0f172a', 'Reptile House', '', '', 1, NULL, NULL, '2026-03-06 13:09:32');

INSERT INTO `shamcash_config` (`id`, `barcode_image_url`, `account_code`, `is_active`, `account_holder_name`, `phone_number`, `payment_instructions`, `updated_at`) VALUES
(1, '', '', 1, '', '', '', '2026-03-06 13:09:32');

INSERT INTO `users` (`id`, `name`, `email`, `role`, `avatar_url`, `password_hash`, `password_salt`, `created_at`) VALUES
('admin-1772773847651', 'Owner', 'owner@reptilehouse.sy', 'admin', NULL, '288ba173dc2442b1013167e5184ffb6edcad9a3db25fc4215e56b25948943082', '7f6eccc36f831a22a4fae7ee5d84a4bb', '2026-03-06 05:10:47');

INSERT INTO `user_preferences` (`id`, `user_id`, `theme`, `language`, `notifications_enabled`, `updated_at`) VALUES
(1, 'default', 'dark', 'ar', 1, '2026-02-17 06:35:53'),
(2, 'admin-1772773847651', 'dark', 'ar', 1, '2026-03-06 11:17:48');

SET FOREIGN_KEY_CHECKS = 1;
