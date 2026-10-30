import { store } from './store.mjs';
import { MAX_DEVICES } from './config.mjs';

export const codes = () => store('codes');

// Works out what a code allows right now. bind=true records the device on first use (max 2 devices per code).
export async function checkAccess(code, deviceId, { bind = false } = {}) {
  if (!code) return { state: 'none' };
  const rec = await codes().get('c:' + code);
  if (!rec) return { state: 'invalid' };
  if (rec.status === 'pending') return { state: 'pending', plan: rec.plan, amount: rec.amount };
  if (rec.status === 'revoked') return { state: 'revoked' };
  if (rec.expiresAt <= Date.now()) return { state: 'expired', plan: rec.plan, expiresAt: rec.expiresAt };
  const devices = rec.devices || [];
  if (!devices.includes(deviceId)) {
    if (devices.length >= MAX_DEVICES) return { state: 'device_limit' };
    if (bind) { rec.devices = [...devices, deviceId]; await codes().setJSON('c:' + code, rec); }
  }
  return { state: 'active', plan: rec.plan, expiresAt: rec.expiresAt, rec };
}
export const publicAccess = (a) => ({ state: a.state, plan: a.plan, expiresAt: a.expiresAt, amount: a.amount });
