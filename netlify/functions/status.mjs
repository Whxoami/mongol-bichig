import { json, device, withCookie, ipHash, clientIp, normCode, validCodeShape } from './lib/util.mjs';
import { PLANS, FREE_WORDS, PAID_WORDS, payInfo } from './lib/config.mjs';
import { checkAccess, publicAccess } from './lib/access.mjs';
import { freeWait } from './lib/free.mjs';
import { DICT_SIZE } from './lib/engine.mjs';

export default async (req, ctx) => {
  const dev = device(req);
  const code = normCode(req.headers.get('x-access-code'));
  const access = validCodeShape(code) ? await checkAccess(code, dev.id) : { state: 'none' };
  const wait = await freeWait(dev.id, ipHash(clientIp(req, ctx)));
  return withCookie(json({
    access: publicAccess(access),
    free: { retryAfter: wait },
    limits: { free: FREE_WORDS, paid: PAID_WORDS },
    plans: Object.values(PLANS),
    pay: payInfo(),
    names: DICT_SIZE,
  }), dev);
};
export const config = { path: '/api/status' };
