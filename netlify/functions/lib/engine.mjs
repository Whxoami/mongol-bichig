import DICT from './dict-data.mjs';
import { cyrToTrad, tradToCyr } from './conv.mjs';

const C2T = new Map(), T2C = new Map();
const add = (m, k, v) => { const a = m.get(k); if (a) { if (!a.includes(v)) a.push(v); } else m.set(k, [v]); };
for (const line of DICT.split('\n')) {
  const i = line.indexOf('\t'); if (i < 1) continue;
  const c = line.slice(0, i), t = line.slice(i + 1); add(C2T, c, t); add(T2C, t, c);
}
export const DICT_SIZE = C2T.size;

export const WORD_SRC = '[\\u0400-\\u04FF]+(?:[\\u2010-][\\u0400-\\u04FF]+)*|[\\u1800-\\u18AF\\u200C\\u200D]+(?:\\u2010[\\u1800-\\u18AF]+)*';
export const countWords = (text) => (text.match(new RegExp(WORD_SRC, 'g')) || []).length;

const cap = s => s.replace(/(^|‐)(.)/g, (m, a, b) => a + b.toUpperCase());
const stripMn = s => s.replace(/[᠋-᠏‌‍]/g, '');
const PUNCT_C2T = { ',': '᠂', '.': '᠃', '?': '᠉', '!': '᠉' };
const PUNCT_T2C = { '᠂': ',', '᠃': '.', '᠈': ',', '᠉': '?' };

function piece(w, d) {
  const m = d === 'c2t' ? C2T : T2C;
  const key = d === 'c2t' ? w.toLowerCase() : stripMn(w);
  const hit = m.get(key);
  if (hit) return { kind: 'dict', alts: hit };
  const arr = [...key];
  for (let k = arr.length - 3; k >= 3; k--) {
    const a = m.get(arr.slice(0, k).join('')), b = m.get(arr.slice(k).join(''));
    if (a && b) return { kind: 'split', alts: [a[0] + b[0]] };
  }
  return { kind: 'guess', alts: [d === 'c2t' ? cyrToTrad(key) : tradToCyr(key)] };
}

// d: 'c2t' Cyrillic to traditional, 't2c' traditional to Cyrillic.
// Returns plain segments the page can show as they are: {text} or {kind, alts}.
export function convert(text, d) {
  const out = []; let last = 0, m;
  const re = new RegExp(WORD_SRC, 'g');
  const want = d === 'c2t' ? /[Ѐ-ӿ]/ : /[᠀-᢯]/;
  const map = d === 'c2t' ? PUNCT_C2T : PUNCT_T2C;
  const plain = s => s.replace(/[,.?!᠂᠃᠈᠉]/g, ch => map[ch] || ch);
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: plain(text.slice(last, m.index)) });
    const w = m[0];
    if (!want.test(w)) out.push({ text: w });
    else {
      const parts = w.split(/[‐-]/);
      let r; const whole = piece(w.replace('-', '‐'), d);
      if (whole.kind === 'guess' && parts.length > 1) {
        const ps = parts.map(p => piece(p, d));
        r = { kind: ps.every(p => p.kind === 'dict') ? 'dict' : ps.some(p => p.kind === 'guess') ? 'guess' : 'split', alts: [ps.map(p => p.alts[0]).join('‐')] };
      } else r = whole;
      const doCap = d === 't2c' && r.kind !== 'guess';
      out.push({ kind: r.kind, alts: doCap ? r.alts.map(cap) : r.alts });
    }
    last = m.index + w.length;
  }
  if (last < text.length) out.push({ text: plain(text.slice(last)) });
  return out;
}
