/**
 * API client for backend (MySQL mode only).
 */
import type { Reptile, Order, Address, User, Article, HeroSlide, Supply, ShamCashConfig, CompanyInfo, ContactInfo, TeamMember, FilterGroup, PageContent, SeoSettings, MediaItem, MediaFolder, UserPreferences, ServiceItem, DatabaseStatus, MediaUploadResult } from '../types';

const configuredBase =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL).trim()
    : '') || '';
const normalizeBase = (rawBase: string): string => {
  const trimmed = rawBase.trim();
  if (!trimmed) return '';

  const normalized = trimmed.replace(/\/+$/, '');
  if (typeof window === 'undefined') return normalized;

  // Guard against accidentally shipping localhost API URLs to non-local clients.
  try {
    const parsed = new URL(normalized, window.location.origin);
    const currentHost = window.location.hostname;
    const targetHost = parsed.hostname;
    const currentIsLocal = currentHost === 'localhost' || currentHost === '127.0.0.1';
    const targetIsLocal = targetHost === 'localhost' || targetHost === '127.0.0.1';

    if (!currentIsLocal && targetIsLocal) {
      return '';
    }
  } catch {
    // Keep raw normalized value for relative paths and unusual but valid inputs.
  }

  return normalized;
};
const BASE = normalizeBase(configuredBase);
const AUTH_TOKEN_STORAGE_KEY = 'semo_auth_token';

type AuthResponse = { user: User; token: string };

export class ApiError extends Error {
  status?: number;
  isNetworkError: boolean;

  constructor(message: string, status?: number, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE}${path}`;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (options.body !== undefined && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  try {
    const token = globalThis.localStorage?.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // ignore storage access errors
  }
  return fetch(url, {
    ...options,
    headers,
  })
    .catch((error) => {
      throw new ApiError(error?.message || 'Failed to fetch', undefined, true);
    })
    .then(async (res) => {
      if (res.status === 204) return undefined as T;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(data.error || res.statusText, res.status, false);
      return data as T;
    });
}

export const api = {
  isEnabled: () => true,
  getDatabaseStatus: (options?: { includeDetails?: boolean }): Promise<DatabaseStatus> => {
    const includeDetails = options?.includeDetails ? 'true' : 'false';
    return request<DatabaseStatus>(`/api/system/db-status?includeDetails=${includeDetails}`);
  },

  getProducts: (): Promise<Reptile[]> => request<Reptile[]>('/api/products'),
  saveProduct: (product: Reptile): Promise<Reptile> =>
    product.id ? request<Reptile>(`/api/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) }) : request<Reptile>('/api/products', { method: 'POST', body: JSON.stringify(product) }),
  deleteProduct: (id: number): Promise<void> => request(`/api/products/${id}`, { method: 'DELETE' }),

  getOrders: (): Promise<Order[]> => request<Order[]>('/api/orders'),
  getMyOrders: (): Promise<Order[]> => request<Order[]>('/api/orders/my'),
  saveOrder: (order: Order): Promise<Order> => request<Order>('/api/orders', { method: 'POST', body: JSON.stringify(order) }),
  updateOrderStatus: (id: string, status: Order['status']): Promise<Order> =>
    request<Order>(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateOrderPaymentStatus: (id: string, paymentStatus: Order['paymentVerificationStatus'], rejectionReason?: string): Promise<Order> =>
    request<Order>(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ paymentVerificationStatus: paymentStatus, rejectionReason }) }),
  deleteOrder: (id: string): Promise<void> => request(`/api/orders/${id}`, { method: 'DELETE' }),

  getArticles: (): Promise<Article[]> => request<Article[]>('/api/articles'),
  saveArticle: (article: Article): Promise<Article> =>
    article.id ? request<Article>(`/api/articles/${article.id}`, { method: 'PUT', body: JSON.stringify(article) }) : request<Article>('/api/articles', { method: 'POST', body: JSON.stringify(article) }),
  deleteArticle: (id: number): Promise<void> => request(`/api/articles/${id}`, { method: 'DELETE' }),

  getHeroSlides: (): Promise<HeroSlide[]> => request<HeroSlide[]>('/api/hero'),
  saveHeroSlide: (slide: HeroSlide): Promise<HeroSlide> =>
    request<HeroSlide>(`/api/hero/${slide.id}`, { method: 'PUT', body: JSON.stringify(slide) }).catch(() =>
      request<HeroSlide>('/api/hero', { method: 'POST', body: JSON.stringify(slide) })),
  deleteHeroSlide: (id: string): Promise<void> => request(`/api/hero/${id}`, { method: 'DELETE' }),

  getSupplies: (): Promise<Supply[]> => request<Supply[]>('/api/supplies'),
  saveSupply: (supply: Supply): Promise<Supply> =>
    supply.id ? request<Supply>(`/api/supplies/${supply.id}`, { method: 'PUT', body: JSON.stringify(supply) }) : request<Supply>('/api/supplies', { method: 'POST', body: JSON.stringify(supply) }),
  deleteSupply: (id: number): Promise<void> => request(`/api/supplies/${id}`, { method: 'DELETE' }),

  getAddresses: (): Promise<Address[]> => request<Address[]>('/api/addresses'),
  saveAddress: (address: Address): Promise<Address> =>
    request<Address>(`/api/addresses/${address.id}`, { method: 'PUT', body: JSON.stringify(address) }).catch(() =>
      request<Address>('/api/addresses', { method: 'POST', body: JSON.stringify(address) })),
  deleteAddress: (id: number): Promise<void> => request(`/api/addresses/${id}`, { method: 'DELETE' }),

  getUsers: (): Promise<User[]> => request<User[]>('/api/users'),
  saveUser: (user: User): Promise<User> => request<User>(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify(user) }),

  getOffers: (): Promise<import('../types').PromotionalCard[]> => request<import('../types').PromotionalCard[]>('/api/offers'),
  saveOffer: (offer: import('../types').PromotionalCard): Promise<import('../types').PromotionalCard> =>
    offer.id ? request<import('../types').PromotionalCard>(`/api/offers/${offer.id}`, { method: 'PUT', body: JSON.stringify(offer) }) : request<import('../types').PromotionalCard>('/api/offers', { method: 'POST', body: JSON.stringify(offer) }),
  deleteOffer: (id: string): Promise<void> => request(`/api/offers/${id}`, { method: 'DELETE' }),

  getPolicies: (): Promise<import('../types').PolicyDocument[]> => request<import('../types').PolicyDocument[]>('/api/policies'),
  savePolicy: (policy: import('../types').PolicyDocument): Promise<import('../types').PolicyDocument> =>
    policy.id ? request<import('../types').PolicyDocument>(`/api/policies/${policy.id}`, { method: 'PUT', body: JSON.stringify(policy) }) : request<import('../types').PolicyDocument>('/api/policies', { method: 'POST', body: JSON.stringify(policy) }),
  deletePolicy: (id: string): Promise<void> => request(`/api/policies/${id}`, { method: 'DELETE' }),

  getShamCashConfig: (): Promise<ShamCashConfig> => request<ShamCashConfig>('/api/settings/shamcash'),
  saveShamCashConfig: (config: ShamCashConfig): Promise<ShamCashConfig> => request<ShamCashConfig>('/api/settings/shamcash', { method: 'PUT', body: JSON.stringify(config) }),

  getSeoSettings: (): Promise<SeoSettings> => request<SeoSettings>('/api/settings/seo'),
  saveSeoSettings: (settings: SeoSettings): Promise<SeoSettings> => request<SeoSettings>('/api/settings/seo', { method: 'PUT', body: JSON.stringify(settings) }),

  getCompanyInfo: (): Promise<CompanyInfo> => request<CompanyInfo>('/api/settings/company'),
  saveCompanyInfo: (info: CompanyInfo): Promise<CompanyInfo> => request<CompanyInfo>('/api/settings/company', { method: 'PUT', body: JSON.stringify(info) }),

  getContactInfo: (): Promise<ContactInfo> => request<ContactInfo>('/api/settings/contact'),
  saveContactInfo: (info: ContactInfo): Promise<ContactInfo> => request<ContactInfo>('/api/settings/contact', { method: 'PUT', body: JSON.stringify(info) }),

  getTeamMembers: (): Promise<TeamMember[]> => request<TeamMember[]>('/api/team'),
  saveTeamMember: (member: TeamMember): Promise<TeamMember> =>
    request<TeamMember>(`/api/team/${member.id}`, { method: 'PUT', body: JSON.stringify(member) }).catch(() =>
      request<TeamMember>('/api/team', { method: 'POST', body: JSON.stringify(member) })),
  deleteTeamMember: (id: string): Promise<void> => request(`/api/team/${id}`, { method: 'DELETE' }),

  getFilterGroups: (): Promise<FilterGroup[]> => request<FilterGroup[]>('/api/filters'),
  saveFilterGroup: (group: FilterGroup): Promise<FilterGroup> =>
    request<FilterGroup>(`/api/filters/${group.id}`, { method: 'PUT', body: JSON.stringify(group) }).catch(() =>
      request<FilterGroup>('/api/filters', { method: 'POST', body: JSON.stringify(group) })),
  deleteFilterGroup: (id: string): Promise<void> => request(`/api/filters/${id}`, { method: 'DELETE' }),

  getCustomCategories: (): Promise<Array<{ value: string; label: string }>> => request<Array<{ value: string; label: string }>>('/api/custom-categories'),
  addCustomCategory: (category: { value: string; label: string }): Promise<Array<{ value: string; label: string }>> =>
    request<Array<{ value: string; label: string }>>('/api/custom-categories', { method: 'POST', body: JSON.stringify(category) }),

  getCustomSpecies: (): Promise<string[]> => request<string[]>('/api/custom-species'),
  addCustomSpecies: (species: string): Promise<string[]> =>
    request<string[]>('/api/custom-species', { method: 'POST', body: JSON.stringify({ species }) }),

  getPageContents: (): Promise<PageContent[]> => request<PageContent[]>('/api/page-contents'),
  getPageContentBySlug: (slug: string): Promise<PageContent> => request<PageContent>(`/api/page-contents/slug/${encodeURIComponent(slug)}`),
  savePageContent: (pageContent: PageContent): Promise<PageContent> =>
    pageContent.id
      ? request<PageContent>(`/api/page-contents/${pageContent.id}`, { method: 'PUT', body: JSON.stringify(pageContent) })
      : request<PageContent>('/api/page-contents', { method: 'POST', body: JSON.stringify(pageContent) }),
  deletePageContent: (id: string): Promise<void> => request(`/api/page-contents/${id}`, { method: 'DELETE' }),

  login: (email: string, password: string): Promise<AuthResponse> =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string): Promise<AuthResponse> =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  bootstrapAdmin: (name: string, email: string, password: string, secret: string): Promise<AuthResponse> =>
    request<AuthResponse>('/api/auth/bootstrap-admin', { method: 'POST', body: JSON.stringify({ name, email, password, secret }) }),

  // Media Library
  getMedia: (folderId?: string, category?: string): Promise<MediaItem[]> => {
    const params = new URLSearchParams();
    if (folderId) params.append('folderId', folderId);
    if (category) params.append('category', category);
    const query = params.toString();
    return request<MediaItem[]>(`/api/media${query ? '?' + query : ''}`);
  },
  searchMedia: (searchTerm: string): Promise<MediaItem[]> =>
    request<MediaItem[]>(`/api/media?search=${encodeURIComponent(searchTerm)}`),
  uploadMediaFile: (file: File, category?: string): Promise<MediaUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);
    return request<MediaUploadResult>('/api/media/upload-file', { method: 'POST', body: formData });
  },
  uploadMedia: (media: MediaItem): Promise<MediaItem> =>
    request<MediaItem>('/api/media', { method: 'POST', body: JSON.stringify(media) }),
  updateMedia: (id: string, updates: Partial<MediaItem>): Promise<MediaItem> =>
    request<MediaItem>(`/api/media/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteMedia: (id: string): Promise<void> =>
    request(`/api/media/${id}`, { method: 'DELETE' }),
  bulkDeleteMedia: (ids: string[]): Promise<{ deleted: number }> =>
    request<{ deleted: number }>('/api/media/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),

  // Media Folders
  getMediaFolders: (): Promise<MediaFolder[]> => request<MediaFolder[]>('/api/media-folders'),
  createMediaFolder: (folder: Partial<MediaFolder>): Promise<MediaFolder> =>
    request<MediaFolder>('/api/media-folders', { method: 'POST', body: JSON.stringify(folder) }),
  updateMediaFolder: (id: string, updates: Partial<MediaFolder>): Promise<MediaFolder> =>
    request<MediaFolder>(`/api/media-folders/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteMediaFolder: (id: string): Promise<void> =>
    request(`/api/media-folders/${id}`, { method: 'DELETE' }),

  // User Preferences
  getUserPreferences: (userId?: string): Promise<UserPreferences> => {
    const query = userId ? `?userId=${userId}` : '';
    return request<UserPreferences>(`/api/user-preferences${query}`);
  },
  saveUserPreferences: (prefs: Partial<UserPreferences>, userId?: string): Promise<UserPreferences> => {
    const query = userId ? `?userId=${userId}` : '';
    return request<UserPreferences>(`/api/user-preferences${query}`, {
      method: 'PUT',
      body: JSON.stringify(prefs)
    });
  },

  // Services
  getServices: (publishedOnly = false): Promise<ServiceItem[]> => {
    const query = publishedOnly ? '?publishedOnly=true' : '';
    return request<ServiceItem[]>(`/api/services${query}`);
  },
  getService: (id: string): Promise<ServiceItem> =>
    request<ServiceItem>(`/api/services/${id}`),
  createService: (service: Partial<ServiceItem>): Promise<ServiceItem> =>
    request<ServiceItem>('/api/services', {
      method: 'POST',
      body: JSON.stringify(service)
    }),
  updateService: (id: string, updates: Partial<ServiceItem>): Promise<ServiceItem> =>
    request<ServiceItem>(`/api/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  deleteService: (id: string): Promise<void> =>
    request(`/api/services/${id}`, { method: 'DELETE' }),
  reorderServices: (items: { id: string; sortOrder: number }[]): Promise<{ success: boolean }> =>
    request<{ success: boolean }>('/api/services/reorder', {
      method: 'POST',
      body: JSON.stringify({ items })
    }),
};
