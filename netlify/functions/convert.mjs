import { json, device, withCookie, ipHash, clientIp, normCode, validCodeShape } from './lib/util.mjs';
import { convert, countWords } from './lib/engine.mjs';
import { FREE_WORDS, PAID_WORDS, PAID_DAILY_WORDS, FREE_COOLDOWN_SEC, FREE_MAX_CHARS, PAID_MAX_CHARS } from './lib/config.mjs';
import { checkAccess, codes, publicAccess } from './lib/access.mjs';
import { freeWait, markFreeUsed } from './lib/free.mjs';

export default async (req, ctx) => {
  const dev = device(req);
  const reply = (body, status = 200) => withCookie(json(body, status), dev);
  if (req.method !== 'POST') return reply({ error: 'method' }, 405);
  let body; try { body = await req.json(); } catch { return reply({ error: 'bad_request' }, 400); }
  const text = typeof body.text === 'string' ? body.text : '';
  const d = body.dir === 'c2t' ? 'c2t' : body.dir === 't2c' ? 't2c' : null;
  if (!d || !text.trim()) return reply({ error: 'empty' }, 400);

  const code = normCode(req.headers.get('x-access-code'));
  const access = validCodeShape(code) ? await checkAccess(code, dev.id, { bind: true }) : { state: 'none' };
  const words = countWords(text);

  if (access.state === 'active') {
    if (text.length > PAID_MAX_CHARS || words > PAID_WORDS) return reply({ error: 'too_long', limit: PAID_WORDS, words, access: publicAccess(access) }, 413);
    const rec = access.rec, day = new Date().toISOString().slice(0, 10);
    const used = rec.usage && rec.usage.day === day ? rec.usage.words : 0;
    if (used + words > PAID_DAILY_WORDS) return reply({ error: 'daily_cap', limit: PAID_DAILY_WORDS, access: publicAccess(access) }, 429);
    rec.usage = { day, words: used + words };
    await codes().setJSON('c:' + code, rec);
    return reply({ segments: convert(text, d), words, access: publicAccess(access) });
  }

  // Free use
  if (text.length > FREE_MAX_CHARS || words > FREE_WORDS) return reply({ error: 'too_long', limit: FREE_WORDS, words, free: true, access: publicAccess(access) }, 413);
  const ipH = ipHash(clientIp(req, ctx));
  const wait = await freeWait(dev.id, ipH);
  if (wait > 0) return reply({ error: 'cooldown', retryAfter: wait, access: publicAccess(access) }, 429);
  await markFreeUsed(dev.id, ipH);
  return reply({ segments: convert(text, d), words, free: { retryAfter: FREE_COOLDOWN_SEC }, access: publicAccess(access) });
};
export const config = { path: '/api/convert' };
