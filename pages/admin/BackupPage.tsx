import React, { useEffect, useMemo, useState } from 'react';
import { TrashIcon, CloudUploadIcon } from '../../components/icons';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { helpContent } from '../../constants/helpContent';
import { api, ApiError } from '../../services/api';
import type { BackupRecord, BackupSettings, BackupType } from '../../types';

const defaultSettings: BackupSettings = {
  enabled: true,
  frequency: 'weekly',
  timeOfDay: '03:00',
  dayOfWeek: 6,
  dayOfMonth: 1,
  retentionCount: 4,
  includedScopes: ['settings', 'products', 'orders', 'customers'],
  lastRunAt: null,
  lastStatus: 'idle',
  lastError: '',
  nextRunAt: null,
};

const backupTypes: Array<{ value: BackupType; label: string; description: string; icon: string }> = [
  { value: 'full', label: 'نسخة كاملة', description: 'جميع البيانات الأساسية والمحتوى في ملف مضغوط واحد.', icon: '🗄️' },
  { value: 'products', label: 'المنتجات والمستلزمات', description: 'الكتالوج والمخزون فقط.', icon: '📦' },
  { value: 'orders', label: 'الطلبات', description: 'الطلبات وعناصر الطلب فقط.', icon: '🧾' },
  { value: 'customers', label: 'العملاء', description: 'المستخدمون والعناوين المرتبطة بهم.', icon: '👥' },
  { value: 'settings', label: 'الإعدادات', description: 'إعدادات المتجر وSEO وشام كاش والبيانات الثابتة.', icon: '⚙️' },
];

const scopeOptions = [
  { value: 'settings', label: 'الإعدادات' },
  { value: 'products', label: 'المنتجات' },
  { value: 'orders', label: 'الطلبات' },
  { value: 'customers', label: 'العملاء' },
  { value: 'content', label: 'المحتوى' },
];

const frequencyOptions = [
  { value: 'weekly', label: 'أسبوعي', note: 'الافتراضي الموصى به لتقليل استهلاك التخزين.' },
  { value: 'biweekly', label: 'كل أسبوعين', note: 'مناسب للمتاجر ذات التحديث المحدود.' },
  { value: 'monthly', label: 'شهري', note: 'أقل استهلاكاً للمساحة مع احتفاظ أطول.' },
] as const;

const dayLabels = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const BackupPage: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [settings, setSettings] = useState<BackupSettings>(defaultSettings);
  const [backupType, setBackupType] = useState<BackupType>('full');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [busyBackupId, setBusyBackupId] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadPage = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [backupRows, backupSettings] = await Promise.all([
        api.getBackups(),
        api.getBackupSettings().catch(() => defaultSettings),
      ]);
      setBackups(backupRows);
      setSettings({ ...defaultSettings, ...backupSettings });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تحميل بيانات النسخ الاحتياطي.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const totalStorageBytes = useMemo(() => backups.reduce((sum, backup) => sum + backup.sizeBytes, 0), [backups]);

  const selectedTypeDetails = useMemo(
    () => backupTypes.find((item) => item.value === backupType) || backupTypes[0],
    [backupType]
  );

  const stats = useMemo(() => ({
    totalBackups: backups.length,
    automaticBackups: backups.filter((backup) => backup.isAutomatic).length,
    totalStorageMb: (totalStorageBytes / (1024 * 1024)).toFixed(1),
    lastBackupAt: backups[0]?.createdAt || null,
  }), [backups, totalStorageBytes]);

  const setFlashMessage = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(''), 2500);
  };

  const handleCreateBackup = async () => {
    setIsCreating(true);
    setError('');
    try {
      const created = await api.createBackup(backupType);
      setBackups((current) => [created, ...current]);
      setFlashMessage(`تم إنشاء ${selectedTypeDetails.label} بنجاح.`);
      await loadPage();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر إنشاء النسخة الاحتياطية.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setError('');
    try {
      const savedSettings = await api.saveBackupSettings(settings);
      setSettings({ ...defaultSettings, ...savedSettings });
      setFlashMessage('تم تحديث إعدادات النسخ التلقائي وتطبيق الجدولة الجديدة.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر حفظ إعدادات النسخ الاحتياطي.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!globalThis.confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    setBusyBackupId(backupId);
    setError('');
    try {
      await api.deleteBackup(backupId);
      setBackups((current) => current.filter((backup) => backup.id !== backupId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر حذف النسخة الاحتياطية.');
    } finally {
      setBusyBackupId(null);
    }
  };

  const handleDownloadBackup = async (backup: BackupRecord) => {
    setBusyBackupId(backup.id);
    setError('');
    try {
      const { blob, fileName } = await api.downloadBackup(backup.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تنزيل النسخة الاحتياطية.');
    } finally {
      setBusyBackupId(null);
    }
  };

  const handleRestoreBackup = (backup: BackupRecord) => {
    setSelectedBackup(backup);
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    if (!selectedBackup) return;

    setBusyBackupId(selectedBackup.id);
    setError('');
    try {
      const updated = await api.restoreBackup(selectedBackup.id);
      setBackups((current) => current.map((backup) => (backup.id === updated.id ? updated : backup)));
      setFlashMessage(`تمت استعادة النسخة "${selectedBackup.name}" بنجاح.`);
      setShowRestoreModal(false);
      setSelectedBackup(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذرت استعادة النسخة الاحتياطية.');
    } finally {
      setBusyBackupId(null);
    }
  };

  const toggleScope = (scope: string) => {
    setSettings((current) => {
      const includesScope = current.includedScopes.includes(scope);
      const nextScopes = includesScope
        ? current.includedScopes.filter((item) => item !== scope)
        : [...current.includedScopes, scope];

      return {
        ...current,
        includedScopes: nextScopes.length > 0 ? nextScopes : ['settings'],
      };
    });
  };

  const getStatusBadge = (status: BackupRecord['status']) => {
    const styles = {
      completed: 'bg-green-500/20 text-green-300',
      in_progress: 'bg-amber-500/20 text-amber-200',
      failed: 'bg-red-500/20 text-red-200',
    };
    const labels = {
      completed: 'مكتمل',
      in_progress: 'قيد التنفيذ',
      failed: 'فشل',
    };
    return <span className={`rounded-full px-3 py-1 text-xs font-black ${styles[status]}`}>{labels[status]}</span>;
  };

  return (
    <div className="space-y-8 animate-fade-in text-right">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">النسخ الاحتياطي</h1>
            <p className="text-gray-400">نسخ احتياطي مضغوط فعلي مع جدول أسبوعي/نصف شهري/شهري، احتفاظ محدود، واستعادة من نفس لوحة التحكم.</p>
          </div>
          <HelpButton onClick={() => setIsHelpOpen(true)} />
        </div>
        <button
          onClick={handleCreateBackup}
          disabled={isCreating || isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 font-black text-gray-900 transition-all hover:bg-amber-400 disabled:opacity-60"
        >
          <CloudUploadIcon className="h-5 w-5" />
          {isCreating ? 'جاري الإنشاء...' : 'إنشاء نسخة الآن'}
        </button>
      </div>

      {successMessage && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm font-bold text-green-200">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100">
        تم تحسين منطق النسخ الاحتياطي لتقليل استهلاك التخزين: الافتراضي الآن <span className="font-black">أسبوعي</span> وليس يومياً، مع
        ضغط <span className="font-black">gzip</span>، وجدولة قابلة للتعديل، وحذف تلقائي للنسخ الأقدم حسب حد الاحتفاظ الذي تحدده.
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-medium rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-gray-400">إجمالي النسخ</p>
          <p className="mt-2 text-2xl font-black text-white">{stats.totalBackups}</p>
        </div>
        <div className="glass-medium rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-gray-400">نسخ تلقائية</p>
          <p className="mt-2 text-2xl font-black text-blue-300">{stats.automaticBackups}</p>
        </div>
        <div className="glass-medium rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-gray-400">استهلاك التخزين</p>
          <p className="mt-2 text-2xl font-black text-amber-300">{stats.totalStorageMb} MB</p>
        </div>
        <div className="glass-medium rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-gray-400">آخر نسخة</p>
          <p className="mt-2 text-lg font-black text-emerald-300">
            {stats.lastBackupAt ? new Date(stats.lastBackupAt).toLocaleString('ar-SY') : 'لا يوجد'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)]">
        <div className="space-y-6">
          <div className="glass-medium rounded-2xl border border-white/10 p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-white">إعدادات النسخ الاحتياطي التلقائي</h2>
                <p className="mt-1 text-sm text-gray-400">عدّل التوقيت، نطاق البيانات، وحد الاحتفاظ ثم احفظ الجدولة.</p>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-white/20 disabled:opacity-60"
              >
                {isSavingSettings ? 'جاري الحفظ...' : 'حفظ الجدولة'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="mb-3 block text-sm font-black text-gray-300">تفعيل النسخ التلقائي</span>
                <div className="flex items-center gap-3">
                  <input
                    id="backup-enabled"
                    name="backupEnabled"
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings((current) => ({ ...current, enabled: e.target.checked }))}
                    className="h-5 w-5"
                  />
                  <span className="text-sm text-white">{settings.enabled ? 'مفعل' : 'متوقف'}</span>
                </div>
              </label>

              <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="mb-2 block text-sm font-black text-gray-300">التكرار</span>
                <select
                  id="backup-frequency"
                  name="backupFrequency"
                  value={settings.frequency}
                  onChange={(e) => setSettings((current) => ({ ...current, frequency: e.target.value as BackupSettings['frequency'] }))}
                  className="w-full rounded-xl border border-white/10 bg-[#141821] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {frequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-400">{frequencyOptions.find((option) => option.value === settings.frequency)?.note}</p>
              </label>

              <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="mb-2 block text-sm font-black text-gray-300">الوقت</span>
                <input
                  id="backup-time"
                  name="backupTime"
                  type="time"
                  value={settings.timeOfDay}
                  onChange={(e) => setSettings((current) => ({ ...current, timeOfDay: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#141821] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </label>

              <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="mb-2 block text-sm font-black text-gray-300">حد الاحتفاظ</span>
                <input
                  id="backup-retention"
                  name="backupRetention"
                  type="number"
                  min={1}
                  max={24}
                  value={settings.retentionCount}
                  onChange={(e) => setSettings((current) => ({ ...current, retentionCount: Math.max(1, Number(e.target.value || 1)) }))}
                  className="w-full rounded-xl border border-white/10 bg-[#141821] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="mt-2 text-xs text-gray-400">سيتم الاحتفاظ بآخر {settings.retentionCount} نسخ تلقائية فقط.</p>
              </label>

              {settings.frequency === 'monthly' ? (
                <label className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                  <span className="mb-2 block text-sm font-black text-gray-300">يوم التنفيذ من الشهر</span>
                  <input
                    id="backup-day-of-month"
                    name="backupDayOfMonth"
                    type="number"
                    min={1}
                    max={28}
                    value={settings.dayOfMonth}
                    onChange={(e) => setSettings((current) => ({ ...current, dayOfMonth: Math.min(28, Math.max(1, Number(e.target.value || 1))) }))}
                    className="w-full rounded-xl border border-white/10 bg-[#141821] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </label>
              ) : (
                <label className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                  <span className="mb-2 block text-sm font-black text-gray-300">يوم التنفيذ</span>
                  <select
                    id="backup-day-of-week"
                    name="backupDayOfWeek"
                    value={settings.dayOfWeek}
                    onChange={(e) => setSettings((current) => ({ ...current, dayOfWeek: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-white/10 bg-[#141821] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {dayLabels.map((label, index) => (
                      <option key={label} value={index}>{label}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-sm font-black text-white">نطاق النسخ التلقائي</p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {scopeOptions.map((scope) => (
                  <label key={scope.value} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <input
                      id={`backup-scope-${scope.value}`}
                      name={`backupScope-${scope.value}`}
                      type="checkbox"
                      checked={settings.includedScopes.includes(scope.value)}
                      onChange={() => toggleScope(scope.value)}
                      className="h-5 w-5"
                    />
                    <span className="font-bold text-white">{scope.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
              <p><span className="font-black">آخر تنفيذ:</span> {settings.lastRunAt ? new Date(settings.lastRunAt).toLocaleString('ar-SY') : 'لم ينفذ بعد'}</p>
              <p className="mt-2"><span className="font-black">التنفيذ القادم:</span> {settings.nextRunAt ? new Date(settings.nextRunAt).toLocaleString('ar-SY') : 'غير مجدول'}</p>
              <p className="mt-2"><span className="font-black">الحالة:</span> {settings.lastStatus}</p>
              {settings.lastError && <p className="mt-2 text-red-200"><span className="font-black">آخر خطأ:</span> {settings.lastError}</p>}
            </div>
          </div>

          <div className="glass-medium rounded-2xl border border-white/10 p-5 sm:p-6">
            <h2 className="text-xl font-black text-white">إنشاء نسخة يدوية</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[minmax(260px,1fr)_minmax(0,1.2fr)]">
              <div>
                <label htmlFor="backup-type-select" className="mb-2 block text-sm font-black text-gray-300">نوع النسخة</label>
                <select
                  id="backup-type-select"
                  name="backupType"
                  value={backupType}
                  onChange={(e) => setBackupType(e.target.value as BackupType)}
                  className="w-full rounded-2xl border border-white/10 bg-[#141821] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {backupTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <h3 className="font-black text-white">{selectedTypeDetails.icon} {selectedTypeDetails.label}</h3>
                <p className="mt-2 text-sm leading-7 text-gray-300">{selectedTypeDetails.description}</p>
              </div>
            </div>
          </div>

          <div className="glass-medium overflow-hidden rounded-2xl border border-white/10">
            <div className="border-b border-white/10 p-5">
              <h2 className="text-xl font-black text-white">النسخ المتاحة</h2>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-sm font-bold text-gray-400">جاري تحميل النسخ الاحتياطية...</div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full text-right">
                    <thead className="bg-white/5 text-xs uppercase tracking-widest text-gray-400">
                      <tr>
                        <th className="p-4">الاسم</th>
                        <th className="p-4">النوع</th>
                        <th className="p-4">الحجم</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4">التاريخ</th>
                        <th className="p-4">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map((backup) => (
                        <tr key={backup.id} className="border-t border-white/5">
                          <td className="p-4">
                            <p className="font-black text-white">{backup.name}</p>
                            <p className="mt-1 text-xs text-gray-400">{backup.description}</p>
                            {backup.isAutomatic && <span className="mt-2 inline-block rounded-full bg-blue-500/20 px-2.5 py-1 text-[11px] font-black text-blue-200">تلقائي</span>}
                          </td>
                          <td className="p-4 text-sm text-gray-300">{backup.type}</td>
                          <td className="p-4 text-sm text-white">{backup.sizeLabel}</td>
                          <td className="p-4">{getStatusBadge(backup.status)}</td>
                          <td className="p-4 text-sm text-gray-300">{new Date(backup.createdAt).toLocaleString('ar-SY')}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button onClick={() => handleDownloadBackup(backup)} disabled={busyBackupId === backup.id} className="rounded-lg bg-white/10 px-3 py-2 text-sm font-black text-white hover:bg-white/20">تنزيل</button>
                              <button onClick={() => handleRestoreBackup(backup)} disabled={busyBackupId === backup.id || backup.status !== 'completed'} className="rounded-lg bg-green-500/10 px-3 py-2 text-sm font-black text-green-300 hover:bg-green-500/20">استعادة</button>
                              <button onClick={() => handleDeleteBackup(backup.id)} disabled={busyBackupId === backup.id} className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-black text-red-300 hover:bg-red-500/20">
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
                  {backups.map((backup) => (
                    <div key={backup.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-white">{backup.name}</p>
                          <p className="mt-1 text-xs text-gray-400">{backup.description}</p>
                        </div>
                        {getStatusBadge(backup.status)}
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-gray-300">
                        <p>النوع: <span className="font-black text-white">{backup.type}</span></p>
                        <p>الحجم: <span className="font-black text-white">{backup.sizeLabel}</span></p>
                        <p>التاريخ: {new Date(backup.createdAt).toLocaleString('ar-SY')}</p>
                        {backup.isAutomatic && <p className="text-blue-200">هذه نسخة تلقائية خاضعة لسياسة الاحتفاظ.</p>}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => handleDownloadBackup(backup)} disabled={busyBackupId === backup.id} className="rounded-lg bg-white/10 px-3 py-2 text-sm font-black text-white">تنزيل</button>
                        <button onClick={() => handleRestoreBackup(backup)} disabled={busyBackupId === backup.id || backup.status !== 'completed'} className="rounded-lg bg-green-500/10 px-3 py-2 text-sm font-black text-green-300">استعادة</button>
                        <button onClick={() => handleDeleteBackup(backup.id)} disabled={busyBackupId === backup.id} className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-black text-red-300">حذف</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="glass-medium rounded-2xl border border-white/10 p-5 sm:p-6">
          <h2 className="text-xl font-black text-white">ملاحظات تشغيلية</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-gray-300">
            <li>النسخ التلقائي لم يعد يومياً، ويمكنك ضبطه أسبوعياً أو كل أسبوعين أو شهرياً حسب حجم البيانات.</li>
            <li>النسخ تحفظ بصيغة مضغوطة <code className="rounded bg-black/30 px-1.5 py-0.5">.json.gz</code> لتقليل استهلاك المساحة.</li>
            <li>حد الاحتفاظ يعمل تلقائياً على حذف أقدم النسخ المجدولة فقط، حتى لا تمتلئ الذاكرة.</li>
            <li>الاستعادة تستبدل بيانات الجداول المشمولة في النسخة، لذلك يجب استخدامها بحذر.</li>
            <li>يمكنك تخصيص نطاق النسخة التلقائية ليشمل الإعدادات فقط أو إضافة الطلبات والمنتجات والعملاء والمحتوى.</li>
          </ul>
        </div>
      </div>

      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowRestoreModal(false)} aria-hidden="true" />
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#11141b] p-6 shadow-2xl sm:p-8">
            <h2 className="text-2xl font-black text-white">استعادة النسخة الاحتياطية</h2>
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-gray-300">
              <p className="font-black text-white">{selectedBackup.name}</p>
              <p>النوع: {selectedBackup.type}</p>
              <p>الحجم: {selectedBackup.sizeLabel}</p>
              <p>التاريخ: {new Date(selectedBackup.createdAt).toLocaleString('ar-SY')}</p>
            </div>
            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100">
              ستتم إعادة كتابة البيانات الموجودة حالياً بالجداول المشمولة في هذه النسخة. استخدم الاستعادة فقط عندما تكون متأكداً من مصدر النسخة.
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setShowRestoreModal(false)} className="rounded-2xl border border-white/10 px-5 py-3 font-black text-white hover:bg-white/10">إلغاء</button>
              <button onClick={confirmRestore} disabled={busyBackupId === selectedBackup.id} className="rounded-2xl bg-amber-500 px-5 py-3 font-black text-gray-900 hover:bg-amber-400 disabled:opacity-60">
                {busyBackupId === selectedBackup.id ? 'جاري الاستعادة...' : 'استعادة النسخة'}
              </button>
            </div>
          </div>
        </div>
      )}

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        content={helpContent.backup}
      />
    </div>
  );
};

export default BackupPage;
