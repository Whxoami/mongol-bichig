import { store } from './store.mjs';
import { FREE_COOLDOWN_SEC, IP_FREE_PER_WINDOW } from './config.mjs';

const fs = () => store('free');
// Returns seconds to wait (0 = a free use is available).
export async function freeWait(deviceId, ipH) {
  const now = Date.now();
  const d = await fs().get('d:' + deviceId);
  if (d && now - d.last < FREE_COOLDOWN_SEC * 1000) return Math.ceil((FREE_COOLDOWN_SEC * 1000 - (now - d.last)) / 1000);
  const ip = await fs().get('ip:' + ipH);
  if (ip && now - ip.start < FREE_COOLDOWN_SEC * 1000 && ip.count >= IP_FREE_PER_WINDOW)
    return Math.ceil((FREE_COOLDOWN_SEC * 1000 - (now - ip.start)) / 1000);
  return 0;
}
export async function markFreeUsed(deviceId, ipH) {
  const now = Date.now();
  await fs().setJSON('d:' + deviceId, { last: now });
  const ip = await fs().get('ip:' + ipH);
  if (ip && now - ip.start < FREE_COOLDOWN_SEC * 1000) await fs().setJSON('ip:' + ipH, { start: ip.start, count: ip.count + 1 });
  else await fs().setJSON('ip:' + ipH, { start: now, count: 1 });
}
