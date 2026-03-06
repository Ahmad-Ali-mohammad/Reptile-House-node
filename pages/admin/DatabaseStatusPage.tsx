import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, api } from '../../services/api';
import type { DatabaseStatus } from '../../types';

const labelClass = 'text-xs font-black uppercase tracking-widest text-gray-500';
const valueClass = 'text-sm font-bold text-white break-all';

const DatabaseStatusPage: React.FC = () => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requestError, setRequestError] = useState<string>('');
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle');

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setRequestError('');
    setCopyState('idle');
    try {
      const nextStatus = await api.getDatabaseStatus({ includeDetails: true });
      setStatus(nextStatus);
    } catch (error) {
      setStatus(null);
      if (error instanceof ApiError) {
        setRequestError(error.message);
      } else {
        setRequestError('تعذر تحميل حالة قاعدة البيانات.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const statusMeta = useMemo(() => {
    if (!status) {
      return {
        title: requestError ? 'غير متاح' : 'جاري الفحص',
        classes: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      };
    }
    if (status.connected) {
      return {
        title: 'متصل',
        classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      };
    }
    return {
      title: 'غير متصل',
      classes: 'bg-red-500/20 text-red-300 border-red-400/40',
    };
  }, [status, requestError]);

  const handleCopyJson = async () => {
    if (!status) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(status, null, 2));
      setCopyState('done');
      window.setTimeout(() => setCopyState('idle'), 1500);
    } catch {
      setCopyState('error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">حالة قاعدة البيانات</h1>
          <p className="text-gray-400">تفاصيل الاتصال الفعلية مع قاعدة البيانات من الخادم.</p>
        </div>
        <button
          type="button"
          onClick={loadStatus}
          disabled={isLoading}
          className="px-5 py-3 rounded-xl border border-amber-400/40 text-amber-300 font-black hover:bg-amber-500/10 disabled:opacity-60"
        >
          {isLoading ? 'جاري التحديث...' : 'تحديث الآن'}
        </button>
      </div>

      <div className={`rounded-2xl border p-5 ${statusMeta.classes}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-lg font-black">اتصال قاعدة البيانات: {statusMeta.title}</div>
          <div className="text-sm font-bold">
            آخر فحص: {status?.checkedAt ? new Date(status.checkedAt).toLocaleString('ar-SY') : '—'}
          </div>
        </div>
        <div className="mt-2 text-sm font-bold">
          زمن الاستجابة: {typeof status?.latencyMs === 'number' ? `${status.latencyMs}ms` : '—'}
        </div>
      </div>

      {requestError && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200 font-bold">
          فشل طلب الحالة: {requestError}
        </div>
      )}

      {status && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h2 className="text-xl font-black text-white">بيانات الاتصال</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className={labelClass}>نوع القاعدة</div>
                  <div className={valueClass}>{status.dbType}</div>
                </div>
                <div>
                  <div className={labelClass}>طريقة الاتصال</div>
                  <div className={valueClass}>{status.connectionMethod}</div>
                </div>
                <div>
                  <div className={labelClass}>الخادم</div>
                  <div className={valueClass}>{status.host}</div>
                </div>
                <div>
                  <div className={labelClass}>المنفذ</div>
                  <div className={valueClass}>{status.port}</div>
                </div>
                <div>
                  <div className={labelClass}>اسم قاعدة البيانات</div>
                  <div className={valueClass}>{status.database}</div>
                </div>
                <div>
                  <div className={labelClass}>المستخدم</div>
                  <div className={valueClass}>{status.user}</div>
                </div>
                <div>
                  <div className={labelClass}>كلمة المرور</div>
                  <div className={valueClass}>{status.passwordConfigured ? 'موجودة' : 'غير موجودة'}</div>
                </div>
                <div>
                  <div className={labelClass}>SSL</div>
                  <div className={valueClass}>{status.sslEnabled ? 'مفعل' : 'غير مفعل'}</div>
                </div>
                <div>
                  <div className={labelClass}>الإعداد مكتمل</div>
                  <div className={valueClass}>{status.configured ? 'نعم' : 'لا'}</div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h2 className="text-xl font-black text-white">إعدادات الـ Pool</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className={labelClass}>waitForConnections</div>
                  <div className={valueClass}>{status.pool.waitForConnections ? 'true' : 'false'}</div>
                </div>
                <div>
                  <div className={labelClass}>connectionLimit</div>
                  <div className={valueClass}>{status.pool.connectionLimit}</div>
                </div>
                <div>
                  <div className={labelClass}>queueLimit</div>
                  <div className={valueClass}>{status.pool.queueLimit}</div>
                </div>
                <div>
                  <div className={labelClass}>charset</div>
                  <div className={valueClass}>{status.pool.charset}</div>
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h2 className="text-xl font-black text-white">معلومات خادم قاعدة البيانات</h2>
              {status.server ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className={labelClass}>Version</div>
                    <div className={valueClass}>{status.server.version || '—'}</div>
                  </div>
                  <div>
                    <div className={labelClass}>Version Comment</div>
                    <div className={valueClass}>{status.server.versionComment || '—'}</div>
                  </div>
                  <div>
                    <div className={labelClass}>Server Hostname</div>
                    <div className={valueClass}>{status.server.serverHost || '—'}</div>
                  </div>
                  <div>
                    <div className={labelClass}>Server Port</div>
                    <div className={valueClass}>{status.server.serverPort ?? '—'}</div>
                  </div>
                  <div>
                    <div className={labelClass}>Character Set</div>
                    <div className={valueClass}>{status.server.characterSet || '—'}</div>
                  </div>
                  <div>
                    <div className={labelClass}>Collation</div>
                    <div className={valueClass}>{status.server.collation || '—'}</div>
                  </div>
                  <div>
                    <div className={labelClass}>Current Database</div>
                    <div className={valueClass}>{status.server.currentDatabase || '—'}</div>
                  </div>
                  <div>
                    <div className={labelClass}>Current User</div>
                    <div className={valueClass}>{status.server.currentUser || '—'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm font-bold text-gray-400">لا توجد بيانات من خادم قاعدة البيانات.</div>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h2 className="text-xl font-black text-white">بيانات التشغيل</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className={labelClass}>Node Version</div>
                  <div className={valueClass}>{status.runtime?.nodeVersion || '—'}</div>
                </div>
                <div>
                  <div className={labelClass}>PID</div>
                  <div className={valueClass}>{status.runtime?.pid ?? '—'}</div>
                </div>
                <div>
                  <div className={labelClass}>Uptime (sec)</div>
                  <div className={valueClass}>{status.runtime?.uptimeSeconds ?? '—'}</div>
                </div>
              </div>
            </section>
          </div>

          {status.tableSummary && (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h2 className="text-xl font-black text-white">ملخص الجداول</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className={labelClass}>عدد الجداول</div>
                  <div className={valueClass}>{status.tableSummary.count}</div>
                </div>
                <div>
                  <div className={labelClass}>إجمالي الصفوف (تقريبي)</div>
                  <div className={valueClass}>{status.tableSummary.totalApproxRows.toLocaleString('en-US')}</div>
                </div>
                <div>
                  <div className={labelClass}>الحجم الكلي (MB)</div>
                  <div className={valueClass}>{status.tableSummary.totalSizeMb}</div>
                </div>
              </div>
            </section>
          )}

          {status.tables && status.tables.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h2 className="text-xl font-black text-white">تفاصيل الجداول</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="text-right p-3">اسم الجدول</th>
                      <th className="text-right p-3">Engine</th>
                      <th className="text-right p-3">Rows (تقريبي)</th>
                      <th className="text-right p-3">Size MB</th>
                      <th className="text-right p-3">Collation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.tables.map((table) => (
                      <tr key={table.tableName} className="border-b border-white/5">
                        <td className="p-3 font-bold text-white">{table.tableName}</td>
                        <td className="p-3 text-gray-300">{table.engine || '—'}</td>
                        <td className="p-3 text-gray-300">{Number(table.approxRows || 0).toLocaleString('en-US')}</td>
                        <td className="p-3 text-gray-300">{Number(table.sizeMb || 0)}</td>
                        <td className="p-3 text-gray-300">{table.collation || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {status.error && (
            <section className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 space-y-3">
              <h2 className="text-xl font-black text-red-200">تفاصيل الخطأ</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-red-100">
                <div>
                  <div className={labelClass}>Message</div>
                  <div className={valueClass}>{status.error.message || '—'}</div>
                </div>
                <div>
                  <div className={labelClass}>Code</div>
                  <div className={valueClass}>{status.error.code || '—'}</div>
                </div>
                <div>
                  <div className={labelClass}>Errno</div>
                  <div className={valueClass}>{status.error.errno ?? '—'}</div>
                </div>
                <div>
                  <div className={labelClass}>SQL State</div>
                  <div className={valueClass}>{status.error.sqlState || '—'}</div>
                </div>
                <div>
                  <div className={labelClass}>Syscall</div>
                  <div className={valueClass}>{status.error.syscall || '—'}</div>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-white/10 bg-[#0f131a] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-black text-white">البيانات الخام (JSON)</h2>
              <button
                type="button"
                onClick={handleCopyJson}
                className="px-3 py-2 rounded-lg border border-white/20 text-xs font-black text-gray-200 hover:bg-white/10"
              >
                {copyState === 'done' ? 'تم النسخ' : copyState === 'error' ? 'فشل النسخ' : 'نسخ JSON'}
              </button>
            </div>
            <pre className="text-xs text-gray-200 overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(status, null, 2)}
            </pre>
          </section>
        </>
      )}
    </div>
  );
};

export default DatabaseStatusPage;
