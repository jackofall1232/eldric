export function sanitizeStoryText(value, maximum = 2000) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/(?:javascript|data|vbscript)\s*:/gi, '')
    .trim()
    .slice(0, maximum);
}
