// In-memory stand-in used only for local tests (MB_MEMORY_STORE=1).
const mem = new Map();
function memStore(name) {
  const m = mem.get(name) || mem.set(name, new Map()).get(name);
  return {
    async get(k) { return m.has(k) ? JSON.parse(m.get(k)) : null; },
    async setJSON(k, v) { m.set(k, JSON.stringify(v)); },
    async delete(k) { m.delete(k); },
    async list({ prefix = '' } = {}) { return { blobs: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }; },
  };
}
export function store(name) {
  if (process.env.MB_MEMORY_STORE) return memStore(name);
  // Real storage on Netlify. Loaded lazily so local tests do not need the package.
  let s;
  const open = async () => s || (s = (await import('@netlify/blobs')).getStore({ name, consistency: 'strong' }));
  return {
    get: async k => (await open()).get(k, { type: 'json' }),
    setJSON: async (k, v) => (await open()).setJSON(k, v),
    delete: async k => (await open()).delete(k),
    list: async o => (await open()).list(o),
  };
}
