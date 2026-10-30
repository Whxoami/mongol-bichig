import { json, ipHash, clientIp, safeEqual, newCode, normCode, validCodeShape } from './lib/util.mjs';
import { PLANS } from './lib/config.mjs';
import { codes } from './lib/access.mjs';
import { store } from './lib/store.mjs';

const DAY = 86400000;
async function listAll() {
  const { blobs } = await codes().list({ prefix: 'c:' });
  const all = [];
  for (const b of blobs) { const r = await codes().get(b.key); if (r) all.push(r); }
  all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const strip = ({ requestedBy, devices, ...r }) => ({ ...r, devices: (devices || []).length });
  return { now: Date.now(), plans: Object.values(PLANS),
    pending: all.filter(r => r.status === 'pending').map(strip),
    active: all.filter(r => r.status === 'active').sort((a, b) => b.expiresAt - a.expiresAt).map(strip),
    revoked: all.filter(r => r.status === 'revoked').slice(0, 20).map(strip) };
}

export default async (req, ctx) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 8) return json({ error: 'not_configured' }, 503);

  const fails = store('adminfail'), key = 'ip:' + ipHash(clientIp(req, ctx)), now = Date.now();
  const f = await fails.get(key);
  if (f && f.count >= 5 && now - f.start < 15 * 60 * 1000) return json({ error: 'locked' }, 429);
  if (!safeEqual(req.headers.get('x-admin-password') || '', pw)) {
    const fresh = f && now - f.start < 15 * 60 * 1000;
    await fails.setJSON(key, { start: fresh ? f.start : now, count: fresh ? f.count + 1 : 1 });
    return json({ error: 'unauthorized' }, 401);
  }
  if (f) await fails.delete(key);

  let body; try { body = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const c = normCode(body.code);
  switch (body.action) {
    case 'list': return json(await listAll());
    case 'approve': {
      if (!validCodeShape(c)) return json({ error: 'bad_code' }, 400);
      const rec = await codes().get('c:' + c);
      if (!rec || rec.status !== 'pending') return json({ error: 'not_pending' }, 404);
      const plan = PLANS[body.plan || rec.plan]; if (!plan) return json({ error: 'bad_plan' }, 400);
      let base = now;
      if (rec.renewOf) { const old = await codes().get('c:' + rec.renewOf); if (old && old.status === 'active' && old.expiresAt > now) base = old.expiresAt; }
      Object.assign(rec, { status: 'active', plan: plan.id, amount: plan.price, approvedAt: now, expiresAt: base + plan.days * DAY });
      await codes().setJSON('c:' + c, rec);
      return json(await listAll());
    }
    case 'create': {
      const plan = PLANS[body.plan]; if (!plan) return json({ error: 'bad_plan' }, 400);
      let code; do { code = newCode(); } while (await codes().get('c:' + code));
      await codes().setJSON('c:' + code, { code, plan: plan.id, amount: plan.price, status: 'active', createdAt: now, approvedAt: now, expiresAt: now + plan.days * DAY, devices: [], note: String(body.note || '').slice(0, 80) });
      return json({ created: code, ...(await listAll()) });
    }
    case 'revoke': case 'delete': {
      if (!validCodeShape(c)) return json({ error: 'bad_code' }, 400);
      const rec = await codes().get('c:' + c); if (!rec) return json({ error: 'not_found' }, 404);
      if (body.action === 'delete' && rec.status === 'pending') await codes().delete('c:' + c);
      else { rec.status = 'revoked'; await codes().setJSON('c:' + c, rec); }
      return json(await listAll());
    }
    default: return json({ error: 'bad_action' }, 400);
  }
};
export const config = { path: '/api/admin' };
