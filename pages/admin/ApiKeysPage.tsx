import React, { useEffect, useMemo, useState } from 'react';
import { SearchIcon, PlusIcon, TrashIcon } from '../../components/icons';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { helpContent } from '../../constants/helpContent';
import { api, ApiError } from '../../services/api';
import type { ApiKeyPermission, ApiKeyRecord } from '../../types';

type CreateKeyState = {
  name: string;
  permissions: ApiKeyPermission[];
  expiresAt: string;
};

const defaultNewKey: CreateKeyState = {
  name: '',
  permissions: ['read'],
  expiresAt: '',
};

const permissionLabels: Record<ApiKeyPermission, string> = {
  read: 'قراءة',
  write: 'كتابة',
  delete: 'حذف',
};

const permissionExamples: Record<ApiKeyPermission, string[]> = {
  read: ['GET /api/products', 'GET /api/orders', 'GET /api/settings/store'],
  write: ['POST /api/services', 'PUT /api/settings/shamcash', 'PATCH /api/orders/:id/status'],
  delete: ['DELETE /api/products/:id', 'DELETE /api/media/:id', 'DELETE /api/backups/:id'],
};

const ApiKeysPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [secretNotice, setSecretNotice] = useState<{ keyName: string; secret: string } | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyKeyId, setBusyKeyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [newKey, setNewKey] = useState<CreateKeyState>(defaultNewKey);

  const integrationBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
  const latestSecret = secretNotice?.secret || Object.values(revealedSecrets)[0] || 'ضع-المفتاح-هنا';

  const loadKeys = async () => {
    setIsLoading(true);
    setError('');
    try {
      const rows = await api.getApiKeys();
      setApiKeys(rows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تحميل مفاتيح الواجهة البرمجية.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const filteredKeys = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return apiKeys;
    return apiKeys.filter((key) =>
      key.name.toLowerCase().includes(normalizedSearch)
      || key.maskedKey.toLowerCase().includes(normalizedSearch)
      || key.keyPrefix.toLowerCase().includes(normalizedSearch)
    );
  }, [apiKeys, searchTerm]);

  const totalUsage = useMemo(() => apiKeys.reduce((sum, key) => sum + key.usageCount, 0), [apiKeys]);
  const expiredCount = useMemo(() => apiKeys.filter((key) => key.expiresAt && new Date(key.expiresAt) < new Date()).length, [apiKeys]);

  const getPermissionBadge = (permission: ApiKeyPermission) => {
    const colors: Record<ApiKeyPermission, string> = {
      read: 'bg-blue-500/20 text-blue-300',
      write: 'bg-amber-500/20 text-amber-300',
      delete: 'bg-red-500/20 text-red-300',
    };

    return (
      <span key={permission} className={`rounded-full px-2.5 py-1 text-xs font-black ${colors[permission]}`}>
        {permissionLabels[permission]}
      </span>
    );
  };

  const copyToClipboard = async (value: string, message = 'تم نسخ المفتاح إلى الحافظة') => {
    try {
      await navigator.clipboard.writeText(value);
      globalThis.alert(message);
    } catch {
      globalThis.alert('تعذر النسخ إلى الحافظة في هذا المتصفح');
    }
  };

  const handleCreateKey = async () => {
    if (!newKey.name.trim()) {
      globalThis.alert('يرجى إدخال اسم للمفتاح');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.createApiKey({
        name: newKey.name.trim(),
        permissions: newKey.permissions,
        expiresAt: newKey.expiresAt || null,
      });

      setApiKeys((current) => [response.apiKey, ...current]);
      setRevealedSecrets((current) => ({ ...current, [response.apiKey.id]: response.secret }));
      setShowKey((current) => ({ ...current, [response.apiKey.id]: true }));
      setSecretNotice({ keyName: response.apiKey.name, secret: response.secret });
      setNewKey(defaultNewKey);
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر إنشاء المفتاح');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!globalThis.confirm('هل أنت متأكد من حذف هذا المفتاح؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }

    setBusyKeyId(keyId);
    try {
      await api.deleteApiKey(keyId);
      setApiKeys((current) => current.filter((key) => key.id !== keyId));
      setRevealedSecrets((current) => {
        const next = { ...current };
        delete next[keyId];
        return next;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر حذف المفتاح');
    } finally {
      setBusyKeyId(null);
    }
  };

  const handleToggleKey = async (key: ApiKeyRecord) => {
    setBusyKeyId(key.id);
    try {
      const updated = await api.updateApiKey(key.id, { isActive: !key.isActive });
      setApiKeys((current) => current.map((row) => (row.id === key.id ? updated : row)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تحديث حالة المفتاح');
    } finally {
      setBusyKeyId(null);
    }
  };

  const handleRegenerateKey = async (key: ApiKeyRecord) => {
    if (!globalThis.confirm('سيتم إبطال المفتاح الحالي فوراً. هل تريد المتابعة؟')) {
      return;
    }

    setBusyKeyId(key.id);
    try {
      const response = await api.regenerateApiKey(key.id);
      setApiKeys((current) => current.map((row) => (row.id === key.id ? response.apiKey : row)));
      setRevealedSecrets((current) => ({ ...current, [key.id]: response.secret }));
      setShowKey((current) => ({ ...current, [key.id]: true }));
      setSecretNotice({ keyName: response.apiKey.name, secret: response.secret });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تجديد المفتاح');
    } finally {
      setBusyKeyId(null);
    }
  };

  const togglePermission = (permission: ApiKeyPermission) => {
    setNewKey((current) => {
      if (current.permissions.includes(permission)) {
        const nextPermissions = current.permissions.filter((item) => item !== permission);
        return { ...current, permissions: nextPermissions.length > 0 ? nextPermissions : ['read'] };
      }
      return { ...current, permissions: [...current.permissions, permission] };
    });
  };

  const renderKeyValue = (apiKey: ApiKeyRecord) => {
    const secret = revealedSecrets[apiKey.id];
    const shouldReveal = showKey[apiKey.id] && secret;
    return shouldReveal ? secret : apiKey.maskedKey;
  };

  return (
    <div className="space-y-8 animate-fade-in text-right">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">مفاتيح الواجهة البرمجية</h1>
            <p className="text-gray-400">إدارة مفاتيح API الفعلية مع تتبع الاستخدام والصلاحيات وربط مباشر بطبقة السيرفر.</p>
          </div>
          <HelpButton onClick={() => setIsHelpOpen(true)} />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 font-black text-gray-900 transition-all hover:bg-amber-400"
        >
          <PlusIcon className="h-5 w-5" />
          إنشاء مفتاح جديد
        </button>
      </div>

      {secretNotice && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-black">تم إنشاء/تجديد المفتاح: {secretNotice.keyName}</p>
              <p className="mt-1 break-all font-mono text-xs sm:text-sm">{secretNotice.secret}</p>
              <p className="mt-2 text-emerald-200/80">احفظ المفتاح الآن. بعد مغادرة الصفحة سيبقى الظاهر فقط هو الجزء المقنّع.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => copyToClipboard(secretNotice.secret)}
                className="rounded-xl bg-white/10 px-4 py-2 font-black text-white transition-colors hover:bg-white/20"
              >
                نسخ
              </button>
              <button
                onClick={() => setSecretNotice(null)}
                className="rounded-xl border border-white/15 px-4 py-2 font-black text-gray-200 transition-colors hover:bg-white/10"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-medium rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-gray-400">إجمالي المفاتيح</p>
          <p className="mt-2 text-2xl font-black text-white">{apiKeys.length}</p>
        </div>
        <div className="glass-medium rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-gray-400">المفاتيح النشطة</p>
          <p className="mt-2 text-2xl font-black text-emerald-300">{apiKeys.filter((key) => key.isActive).length}</p>
        </div>
        <div className="glass-medium rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-gray-400">إجمالي الاستخدام</p>
          <p className="mt-2 text-2xl font-black text-blue-300">{totalUsage}</p>
        </div>
        <div className="glass-medium rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-gray-400">مفاتيح منتهية</p>
          <p className="mt-2 text-2xl font-black text-red-300">{expiredCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <div className="relative">
            <SearchIcon className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="api-key-search"
              name="apiKeySearch"
              type="search"
              placeholder="البحث عن اسم المفتاح أو الجزء الظاهر منه..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pr-12 pl-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="glass-medium overflow-hidden rounded-2xl border border-white/10">
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-right">
                <thead className="bg-white/5 text-xs uppercase tracking-widest text-gray-400">
                  <tr>
                    <th className="p-4">المفتاح</th>
                    <th className="p-4">الصلاحيات</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4">الاستخدام</th>
                    <th className="p-4">الإنشاء</th>
                    <th className="p-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeys.map((apiKey) => (
                    <tr key={apiKey.id} className="border-t border-white/5 align-top">
                      <td className="p-4">
                        <div className="space-y-2">
                          <p className="font-black text-white">{apiKey.name}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <code className="break-all rounded-lg bg-black/20 px-2 py-1 text-xs text-gray-300">{renderKeyValue(apiKey)}</code>
                            <button
                              onClick={() => setShowKey((current) => ({ ...current, [apiKey.id]: !current[apiKey.id] }))}
                              className="text-xs font-black text-amber-300 hover:text-amber-200"
                            >
                              {showKey[apiKey.id] && revealedSecrets[apiKey.id] ? 'إخفاء' : 'إظهار'}
                            </button>
                            <button
                              onClick={() => {
                                const secret = revealedSecrets[apiKey.id];
                                if (!secret) {
                                  globalThis.alert('المفتاح الكامل متاح فقط بعد الإنشاء أو التجديد. يمكنك تجديده للحصول على قيمة جديدة.');
                                  return;
                                }
                                copyToClipboard(secret);
                              }}
                              className="text-xs font-black text-blue-300 hover:text-blue-200"
                            >
                              نسخ
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {apiKey.permissions.map((permission) => getPermissionBadge(permission))}
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleKey(apiKey)}
                          disabled={busyKeyId === apiKey.id}
                          className={`inline-flex min-w-[96px] items-center justify-center rounded-full px-4 py-2 text-xs font-black transition-colors ${apiKey.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-300'}`}
                        >
                          {busyKeyId === apiKey.id ? '...' : apiKey.isActive ? 'نشط' : 'معطل'}
                        </button>
                      </td>
                      <td className="p-4 text-sm text-gray-300">
                        <p className="font-black text-white">{apiKey.usageCount}</p>
                        <p className="mt-1 text-xs text-gray-400">آخر استخدام: {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleString('ar-SY') : 'لم يستخدم بعد'}</p>
                      </td>
                      <td className="p-4 text-sm text-gray-300">
                        <p>{new Date(apiKey.createdAt).toLocaleDateString('ar-SY')}</p>
                        <p className="mt-1 text-xs text-gray-400">{apiKey.expiresAt ? `ينتهي: ${apiKey.expiresAt}` : 'بدون تاريخ انتهاء'}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            onClick={() => handleRegenerateKey(apiKey)}
                            disabled={busyKeyId === apiKey.id}
                            className="rounded-lg bg-white/10 px-3 py-2 text-sm font-black text-white transition-colors hover:bg-white/20"
                          >
                            تجديد
                          </button>
                          <button
                            onClick={() => handleDeleteKey(apiKey.id)}
                            disabled={busyKeyId === apiKey.id}
                            className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-black text-red-300 transition-colors hover:bg-red-500/20"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 p-4 lg:hidden">
              {filteredKeys.map((apiKey) => (
                <div key={apiKey.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-black text-white">{apiKey.name}</h3>
                      <p className="mt-2 break-all text-xs text-gray-300">{renderKeyValue(apiKey)}</p>
                    </div>
                    <button
                      onClick={() => handleToggleKey(apiKey)}
                      disabled={busyKeyId === apiKey.id}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${apiKey.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-300'}`}
                    >
                      {apiKey.isActive ? 'نشط' : 'معطل'}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {apiKey.permissions.map((permission) => getPermissionBadge(permission))}
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-300">
                    <p>الاستخدام: <span className="font-black text-white">{apiKey.usageCount}</span></p>
                    <p>آخر استخدام: {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleString('ar-SY') : 'لم يستخدم بعد'}</p>
                    <p>الإنشاء: {new Date(apiKey.createdAt).toLocaleDateString('ar-SY')}</p>
                    <p>{apiKey.expiresAt ? `ينتهي: ${apiKey.expiresAt}` : 'بدون تاريخ انتهاء'}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowKey((current) => ({ ...current, [apiKey.id]: !current[apiKey.id] }))}
                      className="rounded-lg border border-white/10 px-3 py-2 text-sm font-black text-white"
                    >
                      {showKey[apiKey.id] && revealedSecrets[apiKey.id] ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
                    </button>
                    <button
                      onClick={() => handleRegenerateKey(apiKey)}
                      disabled={busyKeyId === apiKey.id}
                      className="rounded-lg bg-white/10 px-3 py-2 text-sm font-black text-white"
                    >
                      تجديد
                    </button>
                    <button
                      onClick={() => handleDeleteKey(apiKey.id)}
                      disabled={busyKeyId === apiKey.id}
                      className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-black text-red-300"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!isLoading && filteredKeys.length === 0 && (
              <div className="p-8 text-center text-sm font-bold text-gray-500">
                لا توجد مفاتيح مطابقة لبحثك.
              </div>
            )}

            {isLoading && (
              <div className="p-8 text-center text-sm font-bold text-gray-400">
                جاري تحميل المفاتيح...
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-medium rounded-2xl border border-white/10 p-5">
            <h2 className="text-lg font-black text-amber-300">كيف تستفيد من المفتاح فعلياً؟</h2>
            <p className="mt-3 text-sm leading-7 text-gray-300">
              أي مفتاح يتم إنشاؤه هنا يعمل مباشرة على طلبات الـ API عبر الترويسة <code className="rounded bg-black/30 px-1.5 py-0.5">X-API-Key</code> أو
              <code className="mr-1 rounded bg-black/30 px-1.5 py-0.5">Authorization: ApiKey ...</code>.
            </p>
            <div className="mt-4 rounded-2xl bg-black/30 p-4">
              <p className="mb-2 text-xs font-black text-gray-400">مثال قراءة</p>
              <pre className="overflow-x-auto text-xs text-gray-200">
{`curl -H "X-API-Key: ${latestSecret}" \\
  "${integrationBaseUrl}/api/products"`}
              </pre>
            </div>
            <div className="mt-4 rounded-2xl bg-black/30 p-4">
              <p className="mb-2 text-xs font-black text-gray-400">مثال كتابة</p>
              <pre className="overflow-x-auto text-xs text-gray-200">
{`curl -X PUT \\
  -H "X-API-Key: ${latestSecret}" \\
  -H "Content-Type: application/json" \\
  -d '{"isActive":true,"accountCode":"000000000000"}' \\
  "${integrationBaseUrl}/api/settings/shamcash"`}
              </pre>
            </div>
          </div>

          <div className="glass-medium rounded-2xl border border-white/10 p-5">
            <h2 className="text-lg font-black text-amber-300">خريطة الصلاحيات</h2>
            <div className="mt-4 space-y-4 text-sm text-gray-300">
              {(['read', 'write', 'delete'] as ApiKeyPermission[]).map((permission) => (
                <div key={permission} className="rounded-2xl bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    {getPermissionBadge(permission)}
                    <span className="font-black text-white">{permissionLabels[permission]}</span>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-400">
                    {permissionExamples[permission].map((example) => (
                      <li key={example} className="font-mono">{example}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} aria-hidden="true" />
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#11141b] p-6 shadow-2xl sm:p-8">
            <h2 className="text-2xl font-black text-white">إنشاء مفتاح واجهة برمجية جديد</h2>
            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="api-key-name" className="mb-2 block text-sm font-black text-gray-400">اسم المفتاح</label>
                <input
                  id="api-key-name"
                  name="apiKeyName"
                  type="text"
                  value={newKey.name}
                  onChange={(e) => setNewKey((current) => ({ ...current, name: e.target.value }))}
                  placeholder="مثال: تكامل ERP أو تطبيق المبيعات"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-gray-400">الصلاحيات</label>
                <div className="space-y-2">
                  {(['read', 'write', 'delete'] as ApiKeyPermission[]).map((permission) => (
                    <label key={permission} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <input
                        id={`api-key-permission-${permission}`}
                        name={`apiKeyPermission-${permission}`}
                        type="checkbox"
                        checked={newKey.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="h-5 w-5"
                      />
                      <span className="font-bold text-white">{permissionLabels[permission]}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="api-key-expires" className="mb-2 block text-sm font-black text-gray-400">تاريخ انتهاء الصلاحية</label>
                <input
                  id="api-key-expires"
                  name="apiKeyExpires"
                  type="date"
                  value={newKey.expiresAt}
                  onChange={(e) => setNewKey((current) => ({ ...current, expiresAt: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-2xl border border-white/10 px-5 py-3 font-black text-white transition-colors hover:bg-white/10"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateKey}
                disabled={isSubmitting}
                className="rounded-2xl bg-amber-500 px-5 py-3 font-black text-gray-900 transition-colors hover:bg-amber-400 disabled:opacity-60"
              >
                {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء المفتاح'}
              </button>
            </div>
          </div>
        </div>
      )}

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        content={helpContent.settings}
      />
    </div>
  );
};

export default ApiKeysPage;
