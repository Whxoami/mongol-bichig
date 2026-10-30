import { json, device, withCookie, newCode, normCode, validCodeShape } from './lib/util.mjs';
import { PLANS, payInfo } from './lib/config.mjs';
import { codes } from './lib/access.mjs';

// A visitor asks to buy a plan. They get a reference code to put in the bank transfer note.
export default async (req) => {
  const dev = device(req);
  const reply = (b, s = 200) => withCookie(json(b, s), dev);
  if (req.method !== 'POST') return reply({ error: 'method' }, 405);
  if (!payInfo()) return reply({ error: 'not_configured' }, 503);
  let body; try { body = await req.json(); } catch { return reply({ error: 'bad_request' }, 400); }
  const plan = PLANS[body.plan];
  if (!plan) return reply({ error: 'bad_plan' }, 400);
  const renewOf = validCodeShape(normCode(body.renewOf)) ? normCode(body.renewOf) : null;

  const idx = await codes().get('d:' + dev.id) || [];
  for (const c of idx) { // reuse an open request for the same plan
    const r = await codes().get('c:' + c);
    if (r && r.status === 'pending' && r.plan === plan.id) return reply({ code: c, plan: plan.id, amount: r.amount });
  }
  const open = [];
  for (const c of idx) { const r = await codes().get('c:' + c); if (r && r.status === 'pending') open.push(c); }
  if (open.length >= 3) return reply({ error: 'too_many_pending' }, 429);

  let code; do { code = newCode(); } while (await codes().get('c:' + code));
  await codes().setJSON('c:' + code, { code, plan: plan.id, amount: plan.price, status: 'pending', createdAt: Date.now(), requestedBy: dev.id, renewOf, devices: [] });
  await codes().setJSON('d:' + dev.id, [...idx, code].slice(-10));
  return reply({ code, plan: plan.id, amount: plan.price });
};
export const config = { path: '/api/request' };
