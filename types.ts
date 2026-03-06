
import React from 'react';

export type UserRole = 'admin' | 'manager' | 'editor' | 'user';

export interface ReptileSpecification {
  label: string;
  value: string;
}

export interface ReptileReview {
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Reptile {
  id: number;
  name: string;
  species: string;
  description?: string;
  price: number;
  imageUrl: string;
  rating: number;
  isAvailable: boolean;
  status: 'متوفر' | 'قيد الحجز' | 'غير متوفر';
  category: 'snake' | 'lizard' | 'turtle';
  specifications?: ReptileSpecification[];
  reviews?: ReptileReview[];
  careInstructions?: string;
}

export interface Supply {
  id: number;
  name: string;
  category: 'food' | 'housing' | 'heating' | 'decoration' | 'cleaning' | 'health' | 'accessories';
  description?: string;
  price: number;
  imageUrl: string;
  rating: number;
  isAvailable: boolean;
  status: 'متوفر' | 'غير متوفر';
}

export interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
  link: string;
  active: boolean;
}

export interface Article {
  id: number;
  title: string;
  excerpt: string;
  content?: string;
  category: 'تعليمي' | 'أخبار' | 'نصائح طبية';
  date: string;
  author: string;
  image: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  icon?: string;
  price?: number;
  sortOrder: number;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  size: string;
  fileType?: string;
  mimeType?: string;
  altText?: string;
  description?: string;
  category?: string;
  folderId?: string;
  date: string;
  createdAt?: string;
}

export interface MediaUploadResult {
  url: string;
  name: string;
  size: string;
  bytes: number;
  mimeType: string;
  fileType: string;
  storedName: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface UserPreferences {
  id?: number;
  userId?: string;
  theme: 'dark' | 'light';
  language: 'ar' | 'en';
  notificationsEnabled: boolean;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  icon: React.ReactNode;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  passwordHash?: string;
  passwordSalt?: string;
}

export interface OrderItem {
  reptileId: number;
  name: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  date: string;
  status: 'قيد المعالجة' | 'تم الشحن' | 'تم التوصيل' | 'تم التأكيد';
  total: number;
  items: OrderItem[];
  paymentConfirmationImage?: string;
  paymentMethod?: 'card' | 'shamcash';
  paymentVerificationStatus: 'قيد المراجعة' | 'مقبول' | 'مرفوض';
  rejectionReason?: string;
}

export interface ShamCashConfig {
  barcodeImageUrl: string;
  accountCode: string;
  isActive: boolean;
  accountHolderName: string;
  phoneNumber: string;
  paymentInstructions: string;
}

export interface CartItem extends Reptile {
  quantity: number;
}

export interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  country: string;
  isDefault: boolean;
}

export interface NotificationSettings {
  orders: boolean;
  promotions: boolean;
  system: boolean;
  messages: boolean;
}

export interface PromotionalCard {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  discountPercentage?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  targetCategory?: 'snake' | 'lizard' | 'turtle' | 'all';
  buttonText?: string;
  buttonLink?: string;
}

export interface PolicyDocument {
  id: string;
  type: 'privacy' | 'returns' | 'warranty' | 'terms' | 'shipping' | 'custom';
  title: string;
  content: string;
  lastUpdated: string;
  isActive: boolean;
  icon?: string;
}

export interface PageContent {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
  updatedAt: string;
}

export interface SeoSettings {
  siteName: string;
  defaultTitle: string;
  titleSeparator: string;
  defaultDescription: string;
  defaultKeywords: string;
  canonicalBaseUrl: string;
  defaultOgImage: string;
  twitterHandle: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  googleVerification: string;
  bingVerification: string;
  yandexVerification: string;
  locale: string;
  themeColor: string;
  organizationName: string;
  organizationLogo: string;
  organizationDescription: string;
  sitemapEnabled: boolean;
  excludedPaths: string;
  customRobotsTxt: string;
}

export interface FilterOption {
  id: string;
  name: string;
  value: string;
  isActive: boolean;
  order: number;
}

export interface FilterGroup {
  id: string;
  name: string;
  type: 'category' | 'price' | 'availability' | 'custom';
  options: FilterOption[];
  isActive: boolean;
  appliesTo: 'products' | 'supplies' | 'both';
}

export interface CompanyInfo {
  name: string;
  nameEnglish: string;
  description: string;
  foundedYear: number;
  mission: string;
  vision: string;
  story: string;
  logoUrl?: string;
  mascotUrl?: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  workingHours: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    telegram?: string;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  bio?: string;
  isActive: boolean;
}

export interface DatabaseStatusError {
  message: string;
  code?: string | null;
  errno?: number | null;
  sqlState?: string | null;
  syscall?: string | null;
}

export interface DatabaseStatus {
  connected: boolean;
  checkedAt: string;
  latencyMs: number | null;
  dbType: string;
  connectionMethod: string;
  configured: boolean;
  host: string;
  port: number;
  database: string;
  user: string;
  passwordConfigured: boolean;
  sslEnabled: boolean;
  pool: {
    waitForConnections: boolean;
    connectionLimit: number;
    queueLimit: number;
    charset: string;
  };
  server?: {
    version?: string;
    versionComment?: string;
    currentDatabase?: string;
    serverHost?: string;
    serverPort?: number;
    characterSet?: string;
    collation?: string;
    currentUser?: string;
  };
  runtime?: {
    nodeVersion: string;
    pid: number;
    uptimeSeconds: number;
  };
  tableSummary?: {
    count: number;
    totalApproxRows: number;
    totalSizeMb: number;
  };
  tables?: Array<{
    tableName: string;
    engine: string;
    approxRows: number;
    sizeMb: number;
    collation: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
  error?: DatabaseStatusError | null;
}
