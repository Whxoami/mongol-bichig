import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });

export function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.get('cookie') || '').split(';')) {
    const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}
// Every browser gets a random device id in a cookie. The cookie is what the free-use lock and the 2-device limit key on.
export function device(req) {
  const c = parseCookies(req).mbd;
  if (c && /^[a-f0-9]{32}$/.test(c)) return { id: c, setCookie: null };
  const id = randomBytes(16).toString('hex');
  const secure = process.env.MB_MEMORY_STORE ? '' : '; Secure';
  return { id, setCookie: `mbd=${id}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure}` };
}
export const withCookie = (res, dev) => { if (dev.setCookie) res.headers.append('set-cookie', dev.setCookie); return res; };

export const ipHash = (ip) => createHash('sha256').update((process.env.IP_SALT || 'mb-salt') + '|' + (ip || 'unknown')).digest('hex').slice(0, 16);
export const clientIp = (req, ctx) => ctx?.ip || req.headers.get('x-nf-client-connection-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';

export function safeEqual(a, b) {
  const x = createHash('sha256').update(String(a)).digest(), y = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(x, y);
}
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newCode() {
  const b = randomBytes(6); let s = '';
  for (const x of b) s += ALPHABET[x % ALPHABET.length];
  return 'MB-' + s;
}
export const normCode = (c) => String(c || '').trim().toUpperCase();
export const validCodeShape = (c) => /^MB-[A-Z2-9]{6}$/.test(c);
