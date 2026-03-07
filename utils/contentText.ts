const SUSPICIOUS_SEGMENT_PATTERN = /(?:Ã.|\u00d8.|\u00d9.|\u00e2.|\uFFFD)/g;
const PLACEHOLDER_PREFIXES = [
  'حرر',
  'محتوى صفحة',
  'يمكنك تعديل',
  'محتوى ال',
  'Ø­Ø±Ø±',
  'Ù…Ø­ØªÙˆÙ‰ ØµÙØ­Ø©',
  'ÙŠÙ…ÙƒÙ†Ùƒ ØªØ¹Ø¯ÙŠÙ„',
  'Ù…Ø­ØªÙˆÙ‰ Ø§Ù„',
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function stripHtml(value: string): string {
  return normalizeWhitespace(value.replace(/<[^>]*>/g, ' '));
}

export function looksCorruptedText(value?: string | null): boolean {
  const text = normalizeWhitespace(String(value || ''));
  if (!text) return true;
  if (/^[?\uFFFD\s]+$/u.test(text)) return true;

  const questionMarks = (text.match(/\?/g) || []).length;
  if (questionMarks >= 4 && questionMarks >= Math.floor(text.length * 0.15)) {
    return true;
  }

  const suspiciousSegments = text.match(SUSPICIOUS_SEGMENT_PATTERN)?.length ?? 0;
  return suspiciousSegments >= Math.max(2, Math.floor(text.length * 0.08));
}

export function looksPlaceholderText(value?: string | null): boolean {
  const text = stripHtml(String(value || ''));
  if (!text) return true;
  return PLACEHOLDER_PREFIXES.some((prefix) => text.startsWith(prefix));
}

export function pickMeaningfulText(value: string | undefined | null, fallback: string): string {
  const nextValue = String(value || '').trim();
  if (!nextValue || looksCorruptedText(nextValue) || looksPlaceholderText(nextValue)) {
    return fallback;
  }

  return nextValue;
}
