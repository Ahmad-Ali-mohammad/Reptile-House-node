import { companyInfo, contactInfo, storeSettings } from '../models/SettingsModel.js';
import { normalizeOrderStatus, normalizePaymentStatus } from '../models/OrderModel.js';
import { isMailConfigured, sendMail } from './mailer.js';

function normalizeRecipients(input) {
  if (Array.isArray(input)) {
    return Array.from(new Set(input.map((value) => String(value || '').trim()).filter(Boolean)));
  }

  return Array.from(
    new Set(
      String(input || '')
        .split(/[,\n;]/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(value, currency = 'USD') {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${currency} ${amount.toFixed(2)}`;
}

function getCustomerName(order) {
  return String(order?.customerName || '').trim() || 'عميل Reptile House';
}

function getShippingSummary(order) {
  const parts = [order?.shippingAddress, order?.shippingCity, order?.shippingCountry]
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  return parts.length ? parts.join('، ') : 'لم تُسجل بيانات الشحن بعد';
}

function getItemsText(order, currency) {
  if (!Array.isArray(order?.items) || order.items.length === 0) {
    return 'لا توجد عناصر مسجلة في الطلب.';
  }

  return order.items
    .map((item) => `- ${item.name} × ${item.quantity || 1} — ${formatMoney(item.price, currency)}`)
    .join('\n');
}

function getItemsHtml(order, currency) {
  if (!Array.isArray(order?.items) || order.items.length === 0) {
    return '<p style="margin:0;color:#4b5563">لا توجد عناصر مسجلة في الطلب.</p>';
  }

  const items = order.items
    .map(
      (item) =>
        `<li style="margin:0 0 8px"><strong>${escapeHtml(item.name)}</strong> × ${escapeHtml(
          item.quantity || 1,
        )} <span style="color:#6b7280">— ${escapeHtml(formatMoney(item.price, currency))}</span></li>`,
    )
    .join('');

  return `<ul style="margin:12px 0 0;padding-inline-start:20px">${items}</ul>`;
}

function buildTrackingUrl(orderId) {
  const base = String(process.env.PUBLIC_SERVER_URL || '').trim().replace(/\/+$/, '');
  if (!base) return '';
  return `${base}/order-tracking/${encodeURIComponent(orderId)}`;
}

async function loadNotificationContext() {
  const [company, contact, store] = await Promise.all([
    companyInfo.get().catch(() => null),
    contactInfo.get().catch(() => null),
    storeSettings.get().catch(() => null),
  ]);

  return {
    storeName: company?.name || company?.nameEnglish || 'Reptile House',
    storeCurrency: store?.storeCurrency || 'USD',
    contactEmail: String(contact?.email || '').trim(),
    emailsEnabled: store?.enableEmailNotifications !== false,
  };
}

function getAdminRecipients(context) {
  return normalizeRecipients(
    process.env.ORDER_ADMIN_EMAILS || context.contactEmail || process.env.MAIL_FROM || process.env.SMTP_USER,
  );
}

function getSharedSummary(order, context) {
  const normalizedStatus = normalizeOrderStatus(order.status);
  const normalizedPaymentStatus = normalizePaymentStatus(order.paymentVerificationStatus);
  const paidAmount =
    typeof order.paidAmount === 'number' && Number.isFinite(order.paidAmount) ? order.paidAmount : order.total;

  return {
    normalizedStatus,
    normalizedPaymentStatus,
    total: formatMoney(order.total, context.storeCurrency),
    paidAmount: formatMoney(paidAmount, context.storeCurrency),
    shippingSummary: getShippingSummary(order),
    trackingUrl: buildTrackingUrl(order.id),
  };
}

function buildMessage(event, audience, order, context) {
  const customerName = getCustomerName(order);
  const orderDate = String(order.date || new Date().toISOString().slice(0, 10));
  const summary = getSharedSummary(order, context);
  const itemsText = getItemsText(order, context.storeCurrency);
  const itemsHtml = getItemsHtml(order, context.storeCurrency);
  const isCustomer = audience === 'customer';

  let subject = `${context.storeName} | تحديث الطلب ${order.id}`;
  let intro = 'تم تسجيل تحديث جديد على الطلب.';

  switch (event) {
    case 'created':
      subject = isCustomer
        ? `${context.storeName} | تم استلام طلبك ${order.id}`
        : `${context.storeName} | طلب جديد يحتاج مراجعة ${order.id}`;
      intro = isCustomer
        ? 'استلمنا طلبك بنجاح وهو الآن بانتظار مراجعة الدفع من الإدارة.'
        : 'تم إنشاء طلب جديد ويحتاج إلى مراجعة الدفع وبدء المعالجة.';
      break;
    case 'accepted':
      subject = isCustomer
        ? `${context.storeName} | تم قبول طلبك ${order.id}`
        : `${context.storeName} | تم قبول الدفع للطلب ${order.id}`;
      intro = isCustomer
        ? 'تم قبول إثبات الدفع وتأكيد طلبك، ويمكنك متابعة تقدمه من خلال الرابط أدناه.'
        : 'تم قبول الدفع وتأكيد الطلب بنجاح.';
      break;
    case 'rejected':
      subject = isCustomer
        ? `${context.storeName} | تم رفض إثبات الدفع للطلب ${order.id}`
        : `${context.storeName} | تم رفض الدفع للطلب ${order.id}`;
      intro = isCustomer
        ? 'تم رفض إثبات الدفع الحالي. راجع سبب الرفض أدناه ثم أعد رفع التحويل أو تواصل مع الإدارة.'
        : 'تم رفض إثبات الدفع لهذا الطلب وتم حفظ سبب الرفض.';
      break;
    case 'shipping_update':
      subject =
        summary.normalizedStatus === 'تم التوصيل'
          ? `${context.storeName} | تم تسليم الطلب ${order.id}`
          : `${context.storeName} | تحديث شحن الطلب ${order.id}`;
      intro = isCustomer
        ? summary.normalizedStatus === 'تم التوصيل'
          ? 'تم تحديث حالة طلبك إلى تم التوصيل.'
          : 'تم تحديث حالة طلبك في مرحلة الشحن.'
        : `تم تحديث حالة الطلب إلى ${summary.normalizedStatus}.`;
      break;
    default:
      break;
  }

  const extraLines = [];
  if (event === 'rejected' && order.rejectionReason) {
    extraLines.push(`سبب الرفض: ${order.rejectionReason}`);
  }
  if (summary.trackingUrl) {
    extraLines.push(`رابط المتابعة: ${summary.trackingUrl}`);
  }

  const text = [
    `مرحبًا ${isCustomer ? customerName : 'فريق الإدارة'},`,
    '',
    intro,
    '',
    `رقم الطلب: ${order.id}`,
    `العميل: ${customerName}`,
    `البريد: ${order.customerEmail || 'غير متوفر'}`,
    `التاريخ: ${orderDate}`,
    `إجمالي الطلب: ${summary.total}`,
    `المبلغ المعتمد: ${summary.paidAmount}`,
    `حالة الطلب: ${summary.normalizedStatus}`,
    `حالة الدفع: ${summary.normalizedPaymentStatus}`,
    `عنوان الشحن: ${summary.shippingSummary}`,
    ...extraLines,
    '',
    'العناصر:',
    itemsText,
  ].join('\n');

  const rejectionBlock =
    event === 'rejected' && order.rejectionReason
      ? `<p style="margin:16px 0 0"><strong>سبب الرفض:</strong> ${escapeHtml(order.rejectionReason)}</p>`
      : '';
  const trackingBlock = summary.trackingUrl
    ? `<p style="margin:16px 0 0"><a href="${escapeHtml(
        summary.trackingUrl,
      )}" style="color:#b45309;text-decoration:none;font-weight:700">فتح صفحة متابعة الطلب</a></p>`
    : '';

  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#111827">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;padding:28px">
        <p style="margin:0 0 12px;color:#92400e;font-size:12px;font-weight:700;letter-spacing:.08em">REPTILE HOUSE</p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.4">${escapeHtml(subject)}</h1>
        <p style="margin:0 0 20px;color:#374151;line-height:1.8">${escapeHtml(intro)}</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 8px"><strong>رقم الطلب:</strong> ${escapeHtml(order.id)}</p>
          <p style="margin:0 0 8px"><strong>العميل:</strong> ${escapeHtml(customerName)}</p>
          <p style="margin:0 0 8px"><strong>البريد:</strong> ${escapeHtml(order.customerEmail || 'غير متوفر')}</p>
          <p style="margin:0 0 8px"><strong>التاريخ:</strong> ${escapeHtml(orderDate)}</p>
          <p style="margin:0 0 8px"><strong>إجمالي الطلب:</strong> ${escapeHtml(summary.total)}</p>
          <p style="margin:0 0 8px"><strong>المبلغ المعتمد:</strong> ${escapeHtml(summary.paidAmount)}</p>
          <p style="margin:0 0 8px"><strong>حالة الطلب:</strong> ${escapeHtml(summary.normalizedStatus)}</p>
          <p style="margin:0 0 8px"><strong>حالة الدفع:</strong> ${escapeHtml(summary.normalizedPaymentStatus)}</p>
          <p style="margin:0"><strong>عنوان الشحن:</strong> ${escapeHtml(summary.shippingSummary)}</p>
          ${rejectionBlock}
          ${trackingBlock}
        </div>
        <div>
          <h2 style="margin:0 0 10px;font-size:18px">العناصر</h2>
          ${itemsHtml}
        </div>
      </div>
    </div>
  `;

  return { subject, text, html };
}

export function getOrderNotificationEvents(previousOrder, nextOrder) {
  if (!nextOrder) return [];
  if (!previousOrder) return ['created'];

  const events = [];
  const previousPayment = normalizePaymentStatus(previousOrder.paymentVerificationStatus);
  const nextPayment = normalizePaymentStatus(nextOrder.paymentVerificationStatus);
  const previousStatus = normalizeOrderStatus(previousOrder.status);
  const nextStatus = normalizeOrderStatus(nextOrder.status);

  if (previousPayment !== 'مقبول' && nextPayment === 'مقبول') {
    events.push('accepted');
  }

  if (previousPayment !== 'مرفوض' && nextPayment === 'مرفوض') {
    events.push('rejected');
  }

  if (previousStatus !== nextStatus && ['تم الشحن', 'تم التوصيل'].includes(nextStatus)) {
    events.push('shipping_update');
  }

  return events;
}

export async function sendOrderNotifications(order, event) {
  if (!order || !event || !isMailConfigured()) {
    return false;
  }

  const context = await loadNotificationContext();
  if (!context.emailsEnabled) {
    return false;
  }

  const adminRecipients = getAdminRecipients(context);
  const customerRecipients = normalizeRecipients(order.customerEmail);
  const tasks = [];

  if (adminRecipients.length > 0) {
    const adminMessage = buildMessage(event, 'admin', order, context);
    tasks.push(sendMail({ to: adminRecipients, ...adminMessage }));
  }

  if (customerRecipients.length > 0) {
    const customerMessage = buildMessage(event, 'customer', order, context);
    tasks.push(sendMail({ to: customerRecipients, ...customerMessage }));
  }

  const results = await Promise.allSettled(tasks);
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error(`[mail] Failed to send ${event} notification for order ${order.id}:`, result.reason);
    }
  });

  return results.some((result) => result.status === 'fulfilled');
}
