const blockedBlockPattern = /<(script|style|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi;
const blockedTagPattern = /<\/?(script|style|iframe|object|embed|link|meta|base|form)[^>]*>/gi;
const eventHandlerPattern = /\son[a-z]+\s*=\s*(['"]).*?\1/gi;
const eventHandlerBarePattern = /\son[a-z]+\s*=\s*[^\s>]+/gi;
const javascriptProtocolPattern = /\s(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi;
const javascriptProtocolBarePattern = /\s(href|src)\s*=\s*javascript:[^\s>]*/gi;

export function sanitizeRichHtml(value) {
  return String(value || '')
    .replace(blockedBlockPattern, '')
    .replace(blockedTagPattern, '')
    .replace(eventHandlerPattern, '')
    .replace(eventHandlerBarePattern, '')
    .replace(javascriptProtocolPattern, ' $1="#"')
    .replace(javascriptProtocolBarePattern, ' $1="#"')
    .trim();
}

export function stripHtml(value) {
  return sanitizeRichHtml(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
