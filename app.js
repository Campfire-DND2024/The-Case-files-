/* The Case File: a companion app for Call of Cthulhu 7th edition.
   One codebase for the Android app (assets inside the APK) and the web version (GitHub Pages).
   Without a Firebase project it runs on one device; with one, cases sync between phones. */
'use strict';

const APP_NAME = 'The Case File';
const APP_VERSION = '1.1.1';
/* Chaosium asks fan works to carry its notice word for word. Paste it here from
   https://www.chaosium.com/fan-material-policy (Requirements, point 1), replacing the bracketed words. */
const FAN_NOTICE = '';

/* ================= small helpers ================= */
const $ = (s, el = document) => el.querySelector(s);
function add(el, kids) {
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false || c === true) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
function h(tag, a, ...kids) {
  const el = document.createElement(tag);
  if (a) for (const k in a) {
    const v = a[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') { if (typeof v === 'string') el.style.cssText = v; else Object.assign(el.style, v); }
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'multiple') el[k] = !!v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  return add(el, kids);
}
const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const num = (v, d = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const two = n => (n < 10 ? '0' : '') + n;
function nid(len = 20) {
  const c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', a = new Uint32Array(len);
  crypto.getRandomValues(a); return Array.from(a, x => c[x % c.length]).join('');
}
function deepMerge(a, b) {
  for (const k in b) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) deepMerge(a[k], b[k]);
    else a[k] = b[k];
  }
  return a;
}
function initials(s) { const p = String(s || '?').trim().split(/\s+/); return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); }
function ago(t) {
  const s = Math.round((Date.now() - (t || 0)) / 1000);
  if (s < 50) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' h ago'; return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
const IN_APP = () => !!window.CaseFileAndroid;

/* ================= icons (inline stroke SVG) ================= */
const ICONS = {
  back: '<path d="M15 6l-6 6 6 6"/>', chev: '<path d="M9 6l6 6-6 6"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 14.2c2.9.2 5 2.3 5 5.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>', doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h4"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/>',
  eye: '<path d="M2.5 12c1.8-3.6 5.3-6 9.5-6s7.7 2.4 9.5 6c-1.8 3.6-5.3 6-9.5 6s-7.7-2.4-9.5-6z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c5 0 8.5 4.2 9.5 7-.4 1.1-1.2 2.5-2.4 3.7M6.6 6.6C4.6 7.9 3.1 9.9 2.5 12c1 2.8 4.5 7 9.5 7 1.9 0 3.6-.6 5-1.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  log: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  more: '<circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  sync: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  shield: '<path d="M12 3l8 4v5c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V7z"/>',
  sheet: '<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'
};
function icon(name, size = 22, sw = 2) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', size); s.setAttribute('height', size);
  s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', sw);
  s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = ICONS[name] || ''; return s;
}
function d10Svg(text, label, used, colour) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 48 52'); s.setAttribute('width', 46); s.setAttribute('height', 50);
  s.setAttribute('role', 'img'); s.setAttribute('aria-label', label);
  const stroke = used ? colour : 'var(--off)', dash = used ? '0' : '4 3';
  s.innerHTML = `<path d="M24 3 L44 21 L24 49 L4 21 Z" fill="var(--deep)" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round" stroke-dasharray="${dash}"/>` +
    `<path d="M4 21 L24 29 L44 21 M24 29 L24 49" fill="none" stroke="${stroke}" stroke-width="1.2" opacity=".6"/>` +
    `<text x="24" y="24" text-anchor="middle" font-family="CF Type, Courier New, monospace" font-size="16" fill="${used ? 'var(--text)' : 'var(--muted)'}"></text>`;
  s.querySelector('text').textContent = text; return s;
}

/* ================= on-device storage: IndexedDB with a localStorage fallback ================= */
const KV = {
  db: null, ls: false,
  open() {
    if (this.db || this.ls) return Promise.resolve();
    if (this._p) return this._p;
    this._p = new Promise(res => {
      try {
        const r = indexedDB.open('the-case-file', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => { this.db = r.result; res(); };
        r.onerror = () => { this.ls = true; res(); };
      } catch (e) { this.ls = true; res(); }
    });
    return this._p;
  },
  run(mode, fn) { return new Promise((res, rej) => { const tx = this.db.transaction('kv', mode); const q = fn(tx.objectStore('kv')); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); }); },
  async get(k) { await this.open(); if (this.ls) { try { const v = localStorage.getItem('tcf:' + k); return v ? JSON.parse(v) : undefined; } catch (e) { return undefined; } } return this.run('readonly', s => s.get(k)); },
  async set(k, v) { await this.open(); if (this.ls) { localStorage.setItem('tcf:' + k, JSON.stringify(v)); return; } return this.run('readwrite', s => s.put(v, k)); },
  async del(k) { await this.open(); if (this.ls) { try { localStorage.removeItem('tcf:' + k); } catch (e) { } return; } return this.run('readwrite', s => s.delete(k)); }
};
const pref = { get(k, d) { try { const v = localStorage.getItem('tcf-' + k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { if (v == null) localStorage.removeItem('tcf-' + k); else localStorage.setItem('tcf-' + k, v); } catch (e) { } } };

/* ================= toast, sheets and dialogs ================= */
let toastT = 0;
function toast(msg, ms = 2800) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
function errMsg(e) {
  if (typeof cloudMsg === 'function' && e && (e.code || e.name === 'FirebaseError')) return cloudMsg(e);
  return (e && e.message) || 'Something went wrong. Please try again.';
}
function busyBtn(btn, fn) {
  return async ev => {
    if (btn.disabled) return; btn.disabled = true;
    try { await fn(ev); } catch (e) { console.warn(e); toast(errMsg(e), 4200); } finally { btn.disabled = false; }
  };
}
const fire = p => { if (p && p.catch) p.catch(e => { console.warn(e); toast(errMsg(e), 4200); }); return p; };

const SHEETS = [];
function openSheet(title, build, opts = {}) {
  const body = h('div', { class: 'body' });
  const rec = { body, closed: false, onClose: opts.onClose, prev: document.activeElement };
  const close = v => {
    if (rec.closed) return; rec.closed = true; wrap.remove(); SHEETS.splice(SHEETS.indexOf(rec), 1);
    if (rec.onClose) rec.onClose(v);
    try { if (rec.prev && document.body.contains(rec.prev)) rec.prev.focus(); } catch (e) { }
  };
  rec.close = close;
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('header', null, h('h2', null, title), h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: () => close() }, icon('x'))), body);
  const wrap = h('div', null, h('div', { class: 'shade', onclick: () => close() }), sheet);
  rec.fill = () => { body.textContent = ''; add(body, [build(rec)]); };
  rec.fill();
  $('#sheets').append(wrap); SHEETS.push(rec);
  setTimeout(() => { const f = !opts.noFocus && body.querySelector('input:not([type=checkbox]):not([type=file]),textarea'); (f || sheet.querySelector('header button')).focus(); }, 40);
  return rec;
}
const closeAllSheets = () => { while (SHEETS.length) SHEETS[SHEETS.length - 1].close(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape' && SHEETS.length) SHEETS[SHEETS.length - 1].close(); });

function askText(title, value = '', o = {}) {
  return new Promise(res => {
    let out = null;
    openSheet(title, rec => {
      const id = 'ask-' + nid(6);
      const inp = o.multiline ? h('textarea', { class: 'in', id, maxlength: o.max || 4000, placeholder: o.placeholder || '' }) :
        h('input', { class: 'in', id, type: o.type || 'text', inputmode: o.inputmode, maxlength: o.max || 120, placeholder: o.placeholder || '', autocomplete: 'off', enterkeyhint: 'done' });
      inp.value = value == null ? '' : value;
      const ok = () => { out = inp.value.trim(); rec.close(); };
      if (!o.multiline) inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
      return h('div', null, o.label !== false ? h('label', { class: 'lbl', for: id }, o.label || title) : null, inp,
        o.help ? h('p', { class: 'note', style: 'margin-top:8px' }, o.help) : null,
        h('div', { class: 'acts' }, h('button', { class: 'btn quiet', onclick: () => rec.close() }, 'Cancel'), h('button', { class: 'btn primary', onclick: ok }, o.ok || 'Save')));
    }, { onClose: () => res(out) });
  });
}
function confirmSheet(title, text, okLabel = 'OK', danger = true) {
  return new Promise(res => {
    let out = false;
    openSheet(title, rec => h('div', null, h('p', { class: 'note', style: 'font-size:16px' }, text),
      h('div', { class: 'acts' }, h('button', { class: 'btn quiet', onclick: () => rec.close() }, 'Cancel'),
        h('button', { class: 'btn ' + (danger ? 'danger' : 'primary'), onclick: () => { out = true; rec.close(); } }, okLabel))), { onClose: () => res(out), noFocus: true });
  });
}
/* number pad sheet: quick amounts plus dice like 1D6, returns {amount, text} */
function askAmount(title, o = {}) {
  return new Promise(res => {
    let out = null;
    openSheet(title, rec => {
      const id = 'amt-' + nid(6);
      const inp = h('input', { class: 'in', id, inputmode: 'text', placeholder: o.placeholder || 'e.g. 3 or 1D6', autocomplete: 'off', style: 'text-transform:uppercase' });
      const done = v => {
        const s = String(v).trim(); if (!s) return;
        const r = rollDice(s); if (!r) { toast('Type a number, or dice like 1D6 or 2D4+1.'); return; }
        out = { amount: Math.max(0, r.total), text: r.isFixed ? String(r.total) : s.toUpperCase() + ' rolled ' + r.total }; rec.close();
      };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') done(inp.value); });
      const quick = (o.quick || [1, 2, 3, 4, 5]).map(q => h('button', { type: 'button', onclick: () => done(q) }, String(q)));
      const dice = (o.dice || ['1D3', '1D4', '1D6', '1D8', '1D10']).map(q => h('button', { type: 'button', onclick: () => done(q) }, q));
      return h('div', { class: 'col' }, o.help ? h('p', { class: 'note' }, o.help) : null,
        h('div', { class: 'amounts' }, quick), h('div', { class: 'amounts' }, dice),
        h('label', { class: 'lbl', for: id, style: 'margin:6px 0 0' }, 'Or type an amount or dice'),
        h('div', { class: 'row' }, inp, h('button', { class: 'btn primary', onclick: () => done(inp.value) }, o.ok || 'Apply')));
    }, { onClose: () => res(out), noFocus: true });
  });
}

/* ================= dice ================= */
function rnd(n) { const a = new Uint32Array(1), lim = Math.floor(0x100000000 / n) * n; let x; do { crypto.getRandomValues(a); x = a[0]; } while (x >= lim); return 1 + (x % n); }
function parseDice(s) {
  s = String(s || '').toUpperCase().replace(/\s+/g, '');
  if (!s || !/^[+-]?(\d*D\d+|\d+)([+-](\d*D\d+|\d+))*$/.test(s)) return null;
  const terms = [];
  for (const m of s.matchAll(/([+-]?)(\d*)D(\d+)|([+-]?)(\d+)/g)) {
    if (m[3] != null) { const n = m[2] === '' ? 1 : +m[2], d = +m[3]; if (n < 1 || n > 50 || d < 2 || d > 1000) return null; terms.push({ sign: m[1] === '-' ? -1 : 1, n, d }); }
    else terms.push({ sign: m[4] === '-' ? -1 : 1, k: +m[5] });
  }
  return terms;
}
function rollDice(s) {
  const t = parseDice(s); if (!t) return null;
  let total = 0; const parts = []; let fixed = true;
  for (const x of t) {
    if (x.k != null) { total += x.sign * x.k; parts.push((x.sign < 0 ? '−' : '+') + x.k); continue; }
    fixed = false; const rolls = Array.from({ length: x.n }, () => rnd(x.d)); const sum = rolls.reduce((a, b) => a + b, 0);
    total += x.sign * sum; parts.push((x.sign < 0 ? '−' : '+') + '[' + rolls.join(', ') + ']');
  }
  return { total, isFixed: fixed, detail: parts.join(' ').replace(/^\+/, '') };
}
/* d100 with bonus (bp > 0) or penalty (bp < 0) dice */
function rollD100(bp = 0) {
  const units = rnd(10) - 1, tens = [rnd(10) - 1];
  for (let i = 0; i < Math.abs(bp); i++) tens.push(rnd(10) - 1);
  return pickD100(tens, units, bp);
}
function pickD100(tens, units, bp) {
  const val = t => { const v = t * 10 + units; return v === 0 ? 100 : v; };
  let c = 0;
  for (let i = 1; i < tens.length; i++) { if (bp > 0 && val(tens[i]) < val(tens[c])) c = i; if (bp < 0 && val(tens[i]) > val(tens[c])) c = i; }
  return { tens, units, chosen: c, bp, value: val(tens[c]) };
}

/* ================= Call of Cthulhu 7th edition rules ================= */
const LEVELS = ['Critical', 'Extreme success', 'Hard success', 'Regular success', 'Failure', 'Fumble'];
const DIFFS = { Regular: 3, Hard: 2, Extreme: 1 };
function levelOf(roll, target) {
  if (roll === 1) return 0;
  if (roll === 100 || (target < 50 && roll >= 96)) return 5;
  if (roll <= Math.floor(target / 5)) return 1;
  if (roll <= Math.floor(target / 2)) return 2;
  if (roll <= target) return 3;
  return 4;
}
const threshold = (target, diff) => diff === 'Extreme' ? Math.floor(target / 5) : diff === 'Hard' ? Math.floor(target / 2) : target;
const passes = (lv, diff) => lv <= (DIFFS[diff] || 3);
const levelColour = lv => lv <= 1 ? 'var(--acc)' : lv <= 3 ? 'var(--good)' : lv === 5 ? 'var(--bad)' : 'var(--muted)';

const CHARS = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU'];
const CHAR_NAMES = { STR: 'Strength', CON: 'Constitution', SIZ: 'Size', DEX: 'Dexterity', APP: 'Appearance', INT: 'Intelligence', POW: 'Power', EDU: 'Education' };
const rollChar = c => (c === 'SIZ' || c === 'INT' || c === 'EDU') ? (rnd(6) + rnd(6) + 6) * 5 : (rnd(6) + rnd(6) + rnd(6)) * 5;
const SKILLS = [
  ['Accounting', 5], ['Anthropology', 1], ['Appraise', 5], ['Archaeology', 1], ['Art/Craft', 5], ['Charm', 15], ['Climb', 20],
  ['Credit Rating', 0], ['Cthulhu Mythos', 0], ['Disguise', 5], ['Dodge', 'DEX'], ['Drive Auto', 20], ['Electrical Repair', 10],
  ['Fast Talk', 5], ['Fighting (Brawl)', 25], ['Firearms (Handgun)', 20], ['Firearms (Rifle/Shotgun)', 25], ['First Aid', 30],
  ['History', 5], ['Intimidate', 15], ['Jump', 20], ['Language (Other)', 1], ['Language (Own)', 'EDU'], ['Law', 5],
  ['Library Use', 20], ['Listen', 20], ['Locksmith', 1], ['Mechanical Repair', 10], ['Medicine', 1], ['Natural World', 10],
  ['Navigate', 10], ['Occult', 5], ['Operate Heavy Machinery', 1], ['Persuade', 10], ['Pilot', 1], ['Psychology', 10],
  ['Psychoanalysis', 1], ['Ride', 5], ['Science', 1], ['Sleight of Hand', 10], ['Spot Hidden', 25], ['Stealth', 20],
  ['Survival', 10], ['Swim', 20], ['Throw', 20], ['Track', 10]
];
function skillBase(name, ch) {
  const s = SKILLS.find(x => x[0] === name); if (!s) return null;
  if (s[1] === 'DEX') return Math.floor((ch.DEX || 0) / 2);
  if (s[1] === 'EDU') return ch.EDU || 0;
  return s[1];
}
function buildDB(strSiz) {
  if (strSiz <= 64) return { build: -2, db: '−2' };
  if (strSiz <= 84) return { build: -1, db: '−1' };
  if (strSiz <= 124) return { build: 0, db: 'None' };
  if (strSiz <= 164) return { build: 1, db: '+1D4' };
  if (strSiz <= 204) return { build: 2, db: '+1D6' };
  const extra = Math.ceil((strSiz - 204) / 80); return { build: 2 + extra, db: '+' + (extra + 1) + 'D6' };
}
function derived(inv) {
  const c = inv.ch || {};
  let move = (c.DEX < c.SIZ && c.STR < c.SIZ) ? 7 : (c.DEX > c.SIZ && c.STR > c.SIZ) ? 9 : 8;
  const age = num(inv.age, 0); if (age >= 40) move -= Math.min(5, Math.floor((age - 30) / 10));
  const bd = buildDB((c.STR || 0) + (c.SIZ || 0));
  const mythos = skillVal(inv, 'Cthulhu Mythos');
  return {
    hpMax: Math.max(1, Math.floor(((c.CON || 0) + (c.SIZ || 0)) / 10)), mpMax: Math.floor((c.POW || 0) / 5),
    sanMax: 99 - mythos, move: Math.max(1, move), build: bd.build, db: bd.db, dodge: skillVal(inv, 'Dodge'),
    limit: Math.floor((inv.sanDayStart != null ? inv.sanDayStart : inv.san || 0) / 5)
  };
}
function skillVal(inv, name) { const s = inv.skills && inv.skills[name]; return s && s.v != null ? s.v : (skillBase(name, inv.ch || {}) || 0); }
function skillList(inv) {
  const out = [];
  for (const k in (inv.skills || {})) { const s = inv.skills[k]; if (s && s.v != null) out.push({ name: k, v: s.v, t: !!s.t }); }
  return out.sort((a, b) => b.v - a.v || a.name.localeCompare(b.name));
}
function newInvestigator(f) {
  const ch = {}; CHARS.forEach(c => ch[c] = clamp(num(f.ch[c], 50), 1, 99));
  const inv = { name: f.name || 'Unnamed investigator', occupation: f.occupation || '', age: num(f.age, 30), residence: f.residence || '', era: '1920s', ch,
    luck: clamp(num(f.luck, 50), 0, 99), conds: [], weapons: [{ name: 'Unarmed', skill: 'Fighting (Brawl)', dmg: '1D3+DB', range: '', attacks: '1' }],
    gear: '', cash: '', story: {}, notes: '', created: Date.now() };
  inv.skills = {}; SKILLS.forEach(([n]) => inv.skills[n] = { v: skillBase(n, ch), t: false });
  const d = derived(inv); inv.hp = d.hpMax; inv.mp = d.mpMax; inv.san = ch.POW; inv.sanDayStart = ch.POW; inv.lost = 0;
  return inv;
}
const STORY_FIELDS = ['Personal description', 'Ideology and beliefs', 'Significant people', 'Meaningful locations', 'Treasured possessions', 'Traits', 'Injuries and scars', 'Phobias and manias', 'Arcane tomes, spells and artefacts', 'Encounters with strange entities'];
const COND_PRESETS = ['Major wound', 'Dying', 'Unconscious', 'Temporary insanity', 'Indefinite insanity', 'Bout of madness', 'Prone', 'Phobia: ', 'Mania: '];

/* ================= app state ================= */
const S = { view: 'home', tab: null, page: null, form: {}, auth: 'signin', san: null, secret: null, dice: null, sheetTab: 'Skills' };
const ME = { uid: null, name: '', keeper: false, invId: null };
let C = null; /* the open case: { id, store, info, invs, handouts, rolls, req, unsubs } */
let RQ = 0;
const schedule = () => { if (!RQ) RQ = requestAnimationFrame(() => { RQ = 0; render(); }); };

/* ================= stores: one shape for on-device and Firebase ================= */
/* paths are relative to the case: '' (the case itself), 'investigators/<id>', 'handouts/<id>', 'rolls/<id>', 'requests/current' */
const LOCAL_STORES = {};
function LocalStore(cid) {
  if (LOCAL_STORES[cid]) return LOCAL_STORES[cid];
  const key = 'case:' + cid, L = new Set(); let data = {}, saveT = 0;
  const ready = KV.get(key).then(d => { data = d || {}; }).catch(() => { data = {}; });
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => KV.set(key, data).catch(() => toast('This phone is out of storage space. Remove old handout pictures.', 5000)), 120); };
  const notify = () => L.forEach(l => l());
  const inCol = (p, col) => p.startsWith(col + '/') && p.indexOf('/', col.length + 1) === -1;
  const list = (col, o = {}) => {
    let out = Object.keys(data).filter(p => inCol(p, col)).map(p => Object.assign({ id: p.slice(col.length + 1) }, clone(data[p])));
    if (o.where) out = out.filter(x => x[o.where[0]] === o.where[1]);
    if (o.orderBy) { const [f, dir] = o.orderBy; out.sort((a, b) => ((a[f] || 0) > (b[f] || 0) ? 1 : (a[f] || 0) < (b[f] || 0) ? -1 : 0) * (dir === 'desc' ? -1 : 1)); }
    if (o.limit) out = out.slice(0, o.limit);
    return out;
  };
  const st = {
    local: true, ready,
    async get(p) { await ready; return data[p] ? clone(data[p]) : null; },
    async set(p, d, merge) { await ready; data[p] = merge && data[p] ? deepMerge(clone(data[p]), clone(d)) : clone(d); save(); notify(); },
    async del(p) { await ready; delete data[p]; save(); notify(); },
    async add(col, d) { const id = nid(); await st.set(col + '/' + id, d); return id; },
    async list(col) { await ready; return list(col); },
    watchDoc(p, cb) { const l = () => cb(data[p] ? clone(data[p]) : null); L.add(l); ready.then(() => L.has(l) && l()); return () => L.delete(l); },
    watchCol(col, o, cb) { const l = () => cb(list(col, o)); L.add(l); ready.then(() => L.has(l) && l()); return () => L.delete(l); },
    async dump() { await ready; return clone(data); },
    async wipe() { data = {}; clearTimeout(saveT); delete LOCAL_STORES[cid]; await KV.del(key); }
  };
  LOCAL_STORES[cid] = st;
  return st;
}

/* ================= Firebase (accounts and sync) ================= */
const CLOUD = { on: false, auth: null, fs: null, user: null, known: false, cases: null };
const F = () => window.CFB;
const cloudConfigured = () => { const c = window.CF_CONFIG; return !!(window.CFB && c && c.apiKey && !/^PASTE/i.test(c.apiKey) && c.projectId && !/^PASTE/i.test(c.projectId)); };
const fdoc = p => F().doc(CLOUD.fs, p), fcol = p => F().collection(CLOUD.fs, p);
async function fget(p) { const s = await F().getDoc(fdoc(p)); return s.exists() ? s.data() : null; }
const fset = (p, d, merge) => merge ? F().setDoc(fdoc(p), d, { merge: true }) : F().setDoc(fdoc(p), d);
const fdel = p => F().deleteDoc(fdoc(p));
async function flist(p, w) { const X = F(); const r = w ? X.query(fcol(p), X.where(w[0], '==', w[1])) : fcol(p); const s = await X.getDocs(r); return s.docs.map(d => Object.assign({ id: d.id }, d.data())); }
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 6 }, () => CODE_CHARS[rnd(CODE_CHARS.length) - 1]).join('');
const showCode = c => c ? c.slice(0, 3) + '-' + c.slice(3) : '';
const myName = () => { const u = CLOUD.user; return (u && (u.displayName || (u.email || '').split('@')[0])) || 'Investigator'; };
const isPasswordUser = u => !!u && (u.providerData || []).some(p => p.providerId === 'password');
const needsVerify = u => isPasswordUser(u) && !u.emailVerified;

function CloudStore(cid) {
  const X = F(), root = 'cases/' + cid;
  const ref = p => p ? X.doc(CLOUD.fs, root + '/' + p) : X.doc(CLOUD.fs, root);
  const q = (col, o = {}) => {
    const r = X.collection(CLOUD.fs, root + '/' + col), cs = [];
    if (o.where) cs.push(X.where(o.where[0], '==', o.where[1]));
    if (o.orderBy) cs.push(X.orderBy(o.orderBy[0], o.orderBy[1] || 'asc'));
    if (o.limit) cs.push(X.limit(o.limit));
    return cs.length ? X.query(r, ...cs) : r;
  };
  const st = {
    local: false,
    async get(p) { const s = await X.getDoc(ref(p)); return s.exists() ? s.data() : null; },
    set: (p, d, merge) => merge ? X.setDoc(ref(p), d, { merge: true }) : X.setDoc(ref(p), d),
    del: p => X.deleteDoc(ref(p)),
    async add(col, d) { const id = nid(); await X.setDoc(X.doc(CLOUD.fs, root + '/' + col + '/' + id), d); return id; },
    async list(col, o) { const s = await X.getDocs(q(col, o)); return s.docs.map(d => Object.assign({ id: d.id }, d.data())); },
    watchDoc: (p, cb, err) => X.onSnapshot(ref(p), s => cb(s.exists() ? s.data() : null), e => { console.warn('watch', p, e); if (err) err(e); }),
    watchCol: (col, o, cb, err) => X.onSnapshot(q(col, o), s => cb(s.docs.map(d => Object.assign({ id: d.id }, d.data()))), e => { console.warn('watch', col, e); if (err) err(e); })
  };
  return st;
}

async function cloudInit() {
  const X = F();
  const app = X.initializeApp(window.CF_CONFIG);
  CLOUD.auth = X.initializeAuth(app, { persistence: [X.indexedDBLocalPersistence, X.browserLocalPersistence] });
  try { CLOUD.fs = X.initializeFirestore(app, { localCache: X.persistentLocalCache({ tabManager: X.persistentSingleTabManager() }), ignoreUndefinedProperties: true }); }
  catch (e) { CLOUD.fs = X.initializeFirestore(app, { ignoreUndefinedProperties: true }); }
  CLOUD.on = true;
  X.onAuthStateChanged(CLOUD.auth, u => {
    const changed = (u && u.uid) !== (CLOUD.user && CLOUD.user.uid);
    CLOUD.user = u; CLOUD.known = true;
    if (changed) CLOUD.cases = null;
    if (u && !needsVerify(u)) fset('users/' + u.uid, { name: myName(), seen: Date.now() }, true).catch(() => { });
    if (u && S.mode === 'device' && !C) S.mode = 'cloud';
    if (!u && C && !C.store.local) exitCase();
    if (!C) schedule();
  });
}
function authMsg(e) {
  const c = (e && e.code) || '';
  const m = {
    'auth/invalid-credential': 'That email and password don’t match an account.', 'auth/wrong-password': 'That email and password don’t match an account.',
    'auth/user-not-found': 'That email and password don’t match an account.', 'auth/email-already-in-use': 'There’s already an account with that email. Try signing in instead.',
    'auth/weak-password': 'Use a password of at least 8 characters.', 'auth/invalid-email': 'That email address doesn’t look right.',
    'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.', 'auth/network-request-failed': 'No connection. Check your internet and try again.',
    'auth/user-disabled': 'This account has been switched off.', 'auth/requires-recent-login': 'Please sign in again to confirm it’s you.',
    'auth/operation-not-allowed': 'This kind of sign-in isn’t switched on in the Firebase project (Authentication, Sign-in method).',
    'auth/configuration-not-found': 'Sign-in isn’t set up yet. In the Firebase console, open Authentication and click Get started.',
    'auth/invalid-api-key': 'The Firebase settings in this app don’t match your project.', 'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'The Firebase settings in this app don’t match your project.'
  };
  return m[c] || (e && e.message) || 'Sign-in failed. Please try again.';
}
function cloudMsg(e) {
  const c = String((e && e.code) || ''), m = String((e && e.message) || '');
  if (c.startsWith('auth/')) return authMsg(e);
  if (/does not exist|NOT_FOUND|database \(default\)/i.test(m)) return 'The Firestore database hasn’t been created yet. In the Firebase console, open Firestore Database and click Create database.';
  if (/permission/i.test(c) || /permission/i.test(m)) return 'The database refused this. You may not have access any more, or the rules from firestore.rules aren’t published yet.';
  if (/unavailable|deadline/i.test(c)) return 'No connection. It will sync when you’re back online.';
  return m || 'Something went wrong. Please try again.';
}

/* ---------- Google sign-in, only inside the Android app ---------- */
const hasGoogle = () => { try { return !!(window.CaseFileAndroid && CaseFileAndroid.googleAvailable()); } catch (e) { return false; } };
let gWait = null;
window.cfGoogleResult = t => { if (gWait) { const w = gWait; gWait = null; w.res(t); } };
window.cfGoogleError = m => { if (gWait) { const w = gWait; gWait = null; w.rej({ code: /cancel/i.test(m || '') ? 'cancelled' : 'google', message: m || 'Google sign-in didn’t work.' }); } };
const googleToken = () => new Promise((res, rej) => { gWait = { res, rej }; try { CaseFileAndroid.googleSignIn(); } catch (e) { gWait = null; rej(e); } });
async function signInGoogle() {
  let t; try { t = await googleToken(); } catch (e) { if (e && e.code === 'cancelled') return; throw e; }
  await F().signInWithCredential(CLOUD.auth, F().GoogleAuthProvider.credential(t));
}
async function cloudSignOut() {
  try { if (window.CaseFileAndroid) CaseFileAndroid.googleSignOut(); } catch (e) { }
  if (C) exitCase();
  await F().signOut(CLOUD.auth); CLOUD.cases = null; S.auth = 'signin'; schedule();
}

/* ---------- cases in the cloud ---------- */
function loadMyCases(u) {
  if (!CLOUD.loading) CLOUD.loading = fetchMyCases(u).finally(() => { CLOUD.loading = null; });
  return CLOUD.loading;
}
async function fetchMyCases(u) {
  let entries = [];
  try { entries = await flist('users/' + u.uid + '/cases'); } catch (e) { toast(cloudMsg(e), 4200); CLOUD.cases = CLOUD.cases || []; return CLOUD.cases; }
  const out = await Promise.all(entries.map(async e => {
    let name = e.name || '', gone = false;
    try { const c = await fget('cases/' + e.id); if (c) name = c.name || name; else gone = true; } catch (err) { gone = true; }
    return Object.assign({}, e, { name, gone });
  }));
  out.sort((a, b) => (b.at || 0) - (a.at || 0));
  CLOUD.cases = out; return out;
}
async function createCloudCase(name, pack) {
  const u = CLOUD.user, cid = nid();
  let code = null;
  for (let i = 0; i < 8 && !code; i++) { const c = genCode(); if (!(await fget('codes/' + c))) code = c; }
  if (!code) throw new Error('Couldn’t make a case code. Try again.');
  await fset('cases/' + cid, { ownerUid: u.uid, code, name, created: Date.now() });
  await fset('codes/' + code, { cid, ownerUid: u.uid });
  await fset('users/' + u.uid + '/cases/' + cid, { role: 'keeper', name, at: Date.now() });
  if (pack) await applyPack(CloudStore(cid), pack, false);
  CLOUD.cases = null; await openCloudCase(cid);
}
async function joinByCode(raw) {
  const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 6) { toast('Case codes have six letters and numbers.'); return; }
  const u = CLOUD.user;
  const c = await fget('codes/' + code);
  if (!c || !c.cid) { toast('No case with that code. Check it with your Keeper.', 3600); return; }
  if (c.ownerUid !== u.uid) await fset('cases/' + c.cid + '/members/' + u.uid, { code, name: myName(), joined: Date.now() });
  const info = await fget('cases/' + c.cid);
  await fset('users/' + u.uid + '/cases/' + c.cid, { role: c.ownerUid === u.uid ? 'keeper' : 'investigator', name: (info && info.name) || '', at: Date.now() });
  S.form['join-code'] = ''; CLOUD.cases = null; await openCloudCase(c.cid);
}
async function openCloudCase(cid) {
  const info = await fget('cases/' + cid).catch(() => null);
  if (!info) { toast('This case isn’t available any more.', 3600); CLOUD.cases = null; schedule(); return; }
  const u = CLOUD.user, keeper = info.ownerUid === u.uid;
  ME.uid = u.uid; ME.name = myName();
  fset('users/' + u.uid + '/cases/' + cid, { at: Date.now(), name: info.name || '' }, true).catch(() => { });
  if (!keeper) fset('cases/' + cid + '/members/' + u.uid, { name: myName() }, true).catch(() => { });
  enterCase({ id: cid, store: CloudStore(cid), keeper, invId: keeper ? null : u.uid, info });
}
async function deleteCloudCase(entry) {
  const u = CLOUD.user, info = await fget('cases/' + entry.id).catch(() => null);
  if (info && info.ownerUid !== u.uid) { toast('Only the Keeper who opened this case can delete it.'); return; }
  toast('Deleting the case…', 6000);
  if (info) {
    const st = CloudStore(entry.id);
    for (const col of ['investigators', 'handouts', 'rolls', 'requests', 'members', 'pregens', 'keeper']) {
      for (const d of await st.list(col).catch(() => [])) await st.del(col + '/' + d.id).catch(() => { });
    }
    await fdel('codes/' + info.code).catch(() => { });
    await fdel('cases/' + entry.id).catch(() => { });
  }
  await fdel('users/' + u.uid + '/cases/' + entry.id).catch(() => { });
  CLOUD.cases = null; toast('Case deleted'); schedule();
}
async function leaveCloudCase(entry) {
  const u = CLOUD.user, st = CloudStore(entry.id);
  if (!entry.gone) {
    await st.del('investigators/' + u.uid).catch(() => { });
    for (const r of await st.list('rolls', { where: ['uid', u.uid] }).catch(() => [])) await st.del('rolls/' + r.id).catch(() => { });
    await st.del('members/' + u.uid).catch(() => { });
  }
  await fdel('users/' + u.uid + '/cases/' + entry.id).catch(() => { });
  CLOUD.cases = null; schedule();
}

/* ---------- cases on this device ---------- */
const deviceCases = async () => { try { return (await KV.get('cases')) || []; } catch (e) { return []; } };
const saveDeviceCases = l => KV.set('cases', l);
async function createDeviceCase(name, data) {
  const id = nid(); const st = LocalStore(id); await st.ready;
  if (data) { for (const p in data) await st.set(p, data[p]); }
  await st.set('', Object.assign({}, data && data[''], { name, created: Date.now() }));
  await saveDeviceCases([{ id, name, at: Date.now() }, ...(await deviceCases())]);
  return id;
}
async function openDeviceCase(id) {
  const st = LocalStore(id); await st.ready;
  const info = (await st.get('')) || { name: 'Case' };
  const list = await deviceCases(); const e = list.find(x => x.id === id); if (e) { e.at = Date.now(); saveDeviceCases(list); }
  ME.uid = 'local'; ME.name = 'Keeper';
  enterCase({ id, store: st, keeper: true, invId: null, info });
}
async function deleteDeviceCase(id) {
  await LocalStore(id).wipe();
  await saveDeviceCases((await deviceCases()).filter(x => x.id !== id));
  schedule();
}

/* ---------- inside a case ---------- */
function enterCase(o) {
  if (C) exitCase(true);
  C = { id: o.id, store: o.store, info: o.info || {}, invs: {}, invsLoaded: false, handouts: [], rolls: [], req: null, notes: null, pregens: [], unsubs: [] };
  ME.keeper = !!o.keeper; ME.invId = o.invId || null;
  const st = C.store, U = f => C.unsubs.push(f), all = ME.keeper || st.local;
  const lost = e => { if (C && C.store === st && /permission/i.test((e && e.code) || '')) { toast('You no longer have access to this case.', 4200); exitCase(); } };
  U(st.watchDoc('', d => { if (!C || C.store !== st) return; if (d) { C.info = d; schedule(); } else if (!st.local) { toast('This case has been closed by its Keeper.', 4200); exitCase(); } }, lost));
  U(st.watchCol('investigators', {}, l => { if (!C) return; C.invs = {}; l.forEach(x => C.invs[x.id] = x); C.invsLoaded = true; schedule(); }, lost));
  U(st.watchCol('handouts', all ? {} : { where: ['shared', true] }, l => { if (!C) return; C.handouts = l.sort((a, b) => (a.at || 0) - (b.at || 0)); schedule(); }, () => { }));
  U(st.watchCol('rolls', all ? { orderBy: ['at', 'desc'], limit: 80 } : { where: ['uid', ME.uid] }, l => { if (!C) return; C.rolls = l.sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 80); schedule(); }, () => { }));
  U(st.watchDoc('requests/current', d => { if (!C) return; C.req = d; schedule(); }, () => { }));
  if (all) U(st.watchDoc('keeper/notes', d => { if (!C) return; C.notes = d; schedule(); }, () => { }));
  U(st.watchCol('pregens', {}, l => { if (!C) return; C.pregens = l.sort((a, b) => (a.order || 0) - (b.order || 0)); schedule(); }, () => { }));
  S.view = 'case'; S.tab = ME.keeper ? 'party' : 'sheet'; S.page = null; S.san = null; S.secret = null; S.sheetTab = 'Skills';
  schedule();
}
function exitCase(quiet) {
  if (C) C.unsubs.forEach(f => { try { f(); } catch (e) { } });
  C = null; S.view = 'home'; S.page = null; S.tab = null; ME.keeper = false; ME.invId = null;
  closeAllSheets();
  if (!quiet) { CLOUD.cases = null; schedule(); }
}
const myInv = () => C && ME.invId ? C.invs[ME.invId] : null;
const invList = () => C ? Object.values(C.invs).sort((a, b) => (a.created || 0) - (b.created || 0)) : [];
/* write part of an investigator: only top-level fields are sent, so the Keeper and the player don't overwrite each other */
const patchInv = (id, fields) => fire(C.store.set('investigators/' + id, Object.assign(fields, { updated: Date.now() }), true));
function postRoll(r) {
  if (!C) return;
  const inv = r.invId ? C.invs[r.invId] : null;
  fire(C.store.add('rolls', Object.assign({ uid: ME.uid, by: ME.keeper ? 'keeper' : 'investigator', name: inv ? inv.name : (ME.keeper ? 'Keeper' : ME.name), at: Date.now() }, r)));
}

/* ---------- account ---------- */
function openAccount() {
  openSheet('Account', rec => {
    const u = CLOUD.user; if (!u) { setTimeout(() => rec.close()); return null; }
    const google = (u.providerData || []).some(p => p.providerId === 'google.com');
    const b = (label, fn, cls = 'btn quiet block') => { const x = h('button', { class: cls, style: 'margin-bottom:8px' }, label); x.onclick = busyBtn(x, fn); return x; };
    return h('div', null,
      h('div', { class: 'row', style: 'margin-bottom:14px' }, h('span', { class: 'ring inv', 'aria-hidden': 'true' }, initials(myName())),
        h('div', { class: 'grow' }, h('b', { style: 'font-size:18px' }, myName()), h('div', { class: 'small muted' }, u.email || ''), h('div', { class: 'tiny muted' }, google ? 'Signed in with Google' : 'Signed in with email'))),
      b('Change display name', async () => {
        const n = await askText('Display name', myName(), { max: 40 }); if (!n) return;
        await F().updateProfile(u, { displayName: n }); await fset('users/' + u.uid, { name: n }, true);
        for (const c of await flist('users/' + u.uid + '/cases')) if (c.role !== 'keeper') fset('cases/' + c.id + '/members/' + u.uid, { name: n }, true).catch(() => { });
        rec.fill(); toast('Name updated');
      }),
      !google ? b('Change password', async () => { await F().sendPasswordResetEmail(CLOUD.auth, u.email); toast('We’ve emailed you a link to choose a new password.', 3600); }) : null,
      b('Download all my data', exportAccount),
      b('Sign out', async () => { rec.close(); await cloudSignOut(); }),
      h('p', { class: 'note', style: 'margin:14px 0 8px' }, 'Deleting your account removes your sign-in, your investigators and rolls, and every case you keep, for good.'),
      b('Delete my account', deleteAccount, 'btn danger block'),
      h('button', { class: 'linkish', onclick: () => openLegal('privacy') }, 'Read the privacy notice'));
  }, { noFocus: true });
}
async function gatherAccountData() {
  const u = CLOUD.user, out = { app: APP_NAME, exported: new Date().toISOString(), account: { uid: u.uid, email: u.email, name: myName() }, cases: [] };
  for (const c of await flist('users/' + u.uid + '/cases')) {
    const st = CloudStore(c.id), entry = { id: c.id, role: c.role, name: c.name };
    try {
      if (c.role === 'keeper') { entry.case = await st.get(''); entry.keeperNotes = await st.get('keeper/notes'); for (const col of ['investigators', 'handouts', 'rolls', 'members', 'pregens']) entry[col] = await st.list(col); }
      else { entry.investigator = await st.get('investigators/' + u.uid); entry.rolls = await st.list('rolls', { where: ['uid', u.uid] }); }
    } catch (e) { entry.error = 'Not available'; }
    out.cases.push(entry);
  }
  return out;
}
async function exportAccount() { toast('Gathering your data…'); saveTextFile('the-case-file-my-data.json', JSON.stringify(await gatherAccountData(), null, 2)); }
function saveTextFile(name, text) {
  if (window.CaseFileAndroid && CaseFileAndroid.saveFile) { CaseFileAndroid.saveFile(name, 'application/json', text); return; }
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: name });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
async function deleteAccount() {
  if (!(await confirmSheet('Delete your account?', 'This deletes your sign-in, your investigators, your rolls and every case you keep, for everyone in them. It can’t be undone.', 'Delete my account'))) return;
  const u = CLOUD.user;
  /* confirm it's really you first, so nothing is deleted if the final step would fail */
  try {
    if ((u.providerData || []).some(p => p.providerId === 'google.com') && hasGoogle()) {
      const t = await googleToken(); await F().reauthenticateWithCredential(u, F().GoogleAuthProvider.credential(t));
    } else if (isPasswordUser(u)) {
      const pw = await askText('Confirm your password', '', { type: 'password', ok: 'Confirm', help: 'Enter your password to delete your account.' });
      if (!pw) return; await F().reauthenticateWithCredential(u, F().EmailAuthProvider.credential(u.email, pw));
    }
  } catch (e) { if (e && e.code === 'cancelled') return; toast(authMsg(e), 4200); return; }
  closeAllSheets(); if (C) exitCase(true);
  toast('Deleting your account…', 8000);
  for (const c of await flist('users/' + u.uid + '/cases').catch(() => [])) {
    if (c.role === 'keeper') await deleteCloudCase(c).catch(() => { }); else await leaveCloudCase(c).catch(() => { });
  }
  await fdel('users/' + u.uid).catch(() => { });
  try { await F().deleteUser(u); toast('Your account has been deleted.', 4200); }
  catch (e) { toast(authMsg(e), 5000); }
  CLOUD.cases = null; schedule();
}

/* ================= rendering ================= */
function render() {
  const app = $('#app');
  const sc = app.querySelector('.scroll'), top = sc ? sc.scrollTop : 0, oldKey = S.key;
  const ae = document.activeElement, aid = ae && ae.id && app.contains(ae) ? ae.id : null;
  const sel = aid && typeof ae.selectionStart === 'number' ? [ae.selectionStart, ae.selectionEnd] : null;
  let nodes;
  try { nodes = C ? (S.page ? renderPage() : renderCase()) : renderHome(); }
  catch (e) {
    console.error(e);
    nodes = [h('div', { class: 'scroll' }, h('p', { class: 'loading' }, 'Something went wrong drawing this screen.'),
      h('button', { class: 'btn block', onclick: () => { S.page = null; if (C) exitCase(); else schedule(); } }, 'Back to your cases'))];
  }
  app.textContent = ''; add(app, [nodes]);
  const sc2 = app.querySelector('.scroll'); if (sc2 && S.key === oldKey) sc2.scrollTop = top;
  if (aid) { const el = document.getElementById(aid); if (el) { el.focus({ preventScroll: true }); if (sel) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { } } }
  statusBar();
}
function statusBar() {
  const t = document.documentElement.getAttribute('data-theme') || 'ink';
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#1C2220';
  const m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', bg);
  try { if (window.CaseFileAndroid && CaseFileAndroid.setTheme) CaseFileAndroid.setTheme(bg, t === 'day'); } catch (e) { }
}
/* an input whose value survives re-renders */
function bound(id, attrs = {}) {
  const tag = attrs.tag || 'input'; const a = Object.assign({ id, class: 'in' }, attrs); delete a.tag;
  const el = h(tag, a); el.value = S.form[id] || '';
  el.addEventListener('input', () => { S.form[id] = el.value; });
  return el;
}
function topBar(backLabel, onBack, mid, right) {
  return h('div', { class: 'top' },
    h('button', { class: 'back', onclick: onBack }, icon('back'), backLabel),
    h('span', { class: 'mid' }, mid || ''),
    h('div', { class: 'row', style: 'gap:2px' }, right || h('span', { style: 'width:44px' })));
}

/* ================= front door ================= */
function folderHeader() {
  return h('header', { style: 'margin-bottom:24px' },
    h('div', { class: 'folder-tab', 'aria-hidden': 'true' }, 'Case no. 1925'),
    h('div', { class: 'folder' }, h('h1', null, APP_NAME), h('p', null, 'Your Call of Cthulhu cases, for investigators and Keepers.')));
}
function renderHome() {
  S.key = 'home';
  const p = h('div', { class: 'scroll', style: 'padding-top:calc(24px + env(safe-area-inset-top, 0px))' }, folderHeader());
  if (cloudConfigured() && S.mode !== 'device') {
    if (!CLOUD.known) p.append(h('p', { class: 'loading' }, 'Checking your sign-in…'));
    else if (!CLOUD.user) p.append(signInCard(), h('div', { class: 'col', style: 'margin-top:18px' },
      h('button', { class: 'btn quiet block', onclick: () => { S.mode = 'device'; pref.set('mode', 'device'); schedule(); } }, 'Use on this phone only, without an account')));
    else if (needsVerify(CLOUD.user)) p.append(verifyCard(CLOUD.user));
    else cloudHome(p);
  } else deviceHome(p);
  p.append(homeFooter());
  return [p];
}
function caseItem(o) {
  const keeper = o.role === 'keeper';
  const main = h('button', { class: 'li-main', onclick: o.open },
    h('span', { class: 'ring' + (keeper ? '' : ' inv'), 'aria-hidden': 'true' }, initials(o.name || '?')),
    h('span', { class: 'grow', style: 'display:flex;flex-direction:column;gap:2px' },
      h('span', { class: 'k', style: 'color:' + (keeper ? 'var(--acc)' : 'var(--good)') }, keeper ? 'Keeper' : 'Investigator'),
      h('span', { class: 't' }, o.name || 'Unnamed case'), o.sub ? h('span', { class: 's' }, o.sub) : null));
  return h('div', { class: 'li' }, main, o.menu ? h('button', { class: 'icon-btn', 'aria-label': 'Options for ' + (o.name || 'this case'), onclick: o.menu }, icon('more', 22)) : icon('chev', 20));
}
function cloudHome(p) {
  const u = CLOUD.user;
  p.append(h('div', { class: 'row', style: 'margin-bottom:6px' }, h('span', { class: 'ring inv', style: 'width:40px;height:40px;font-size:16px', 'aria-hidden': 'true' }, initials(myName())),
    h('div', { class: 'grow' }, h('b', null, myName()), h('div', { class: 'small muted', style: 'overflow:hidden;text-overflow:ellipsis' }, u.email || '')),
    h('button', { class: 'btn sm quiet', onclick: openAccount }, 'Account')));
  p.append(h('h2', { class: 'sec' }, 'Your cases'));
  if (!CLOUD.cases) { p.append(h('p', { class: 'empty' }, 'Loading your cases…')); loadMyCases(u).then(() => schedule()); }
  else if (!CLOUD.cases.length) p.append(h('p', { class: 'empty' }, 'No cases yet. Join one with a code from your Keeper, or open a new case.'));
  else CLOUD.cases.forEach(c => p.append(caseItem({
    name: c.name, role: c.role,
    sub: c.gone ? 'No longer available. Tap to remove it.' : (c.role === 'keeper' ? 'You keep this case' : 'You investigate'),
    open: () => c.gone ? confirmSheet('Remove this case?', 'It has been closed by its Keeper or you were removed.', 'Remove', false).then(ok => ok && fire(leaveCloudCase(c))) : fire(openCloudCase(c.id)),
    menu: () => caseMenu(c)
  })));
  const code = bound('join-code', { class: 'in code-in', autocomplete: 'off', spellcheck: 'false', maxlength: 7, placeholder: '7QX-M3L', 'aria-label': 'Case code', enterkeyhint: 'go' });
  code.addEventListener('input', () => { code.value = code.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); S.form['join-code'] = code.value; });
  const join = h('button', { class: 'btn primary' }, 'Join');
  join.onclick = busyBtn(join, () => joinByCode(code.value));
  code.addEventListener('keydown', e => { if (e.key === 'Enter') join.click(); });
  p.append(h('h2', { class: 'sec' }, 'Join a case'), h('label', { class: 'lbl', for: 'join-code' }, 'Case code from your Keeper'),
    h('div', { class: 'row' }, code, join));
  const nb = h('button', { class: 'btn block', style: 'margin-top:26px', onclick: openNewCase }, 'Open a new case');
  p.append(nb, h('p', { class: 'note', style: 'text-align:center;margin-top:10px' }, 'You’ll be the Keeper. Investigators join with your case code.'));
}
function caseMenu(c) {
  openSheet(c.name || 'Case', rec => h('div', { class: 'col' },
    h('button', { class: 'btn primary block', onclick: () => { rec.close(); fire(openCloudCase(c.id)); } }, 'Open'),
    c.role === 'keeper'
      ? h('button', { class: 'btn danger block', onclick: async () => { rec.close(); if (await confirmSheet('Delete this case?', `“${c.name || 'This case'}” will be deleted for everyone: every investigator, handout and roll in it. This can’t be undone.`, 'Delete case')) fire(deleteCloudCase(c)); } }, 'Delete case')
      : h('button', { class: 'btn danger block', onclick: async () => { rec.close(); if (await confirmSheet('Leave this case?', 'Your investigator and your rolls in this case are deleted. You can join again later with the code.', 'Leave case')) fire(leaveCloudCase(c)); } }, 'Leave case')), { noFocus: true });
}
function deviceHome(p) {
  p.append(h('h2', { class: 'sec', style: 'margin-top:0' }, 'Cases on this phone'));
  if (S.devCases == null) { p.append(h('p', { class: 'empty' }, 'Loading…')); deviceCases().then(l => { S.devCases = l; schedule(); }); }
  else if (!S.devCases.length) p.append(h('p', { class: 'empty' }, 'No cases yet. Open one to keep your investigators, handouts and rolls on this phone.'));
  else S.devCases.forEach(c => p.append(caseItem({ name: c.name, role: 'keeper', sub: 'On this phone', open: () => fire(openDeviceCase(c.id)), menu: () => deviceCaseMenu(c) })));
  const nb = h('button', { class: 'btn primary block', style: 'margin-top:18px', onclick: openNewCase }, 'Open a new case');
  const file = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: async e => { const f = e.target.files[0]; if (f) fire(importCaseFile(f)); e.target.value = ''; } });
  p.append(nb, h('button', { class: 'btn quiet block', style: 'margin-top:10px', onclick: () => file.click() }, 'Import a backup or pack file'), file);
  if (cloudConfigured()) p.append(h('div', { class: 'dash', style: 'margin-top:22px' }, h('p', { class: 'note' }, 'Sign in to share a case between phones: the Keeper on one, each investigator on their own.'),
    h('button', { class: 'btn block', style: 'margin-top:10px', onclick: () => { S.mode = 'cloud'; pref.set('mode', null); schedule(); } }, 'Sign in to sync')));
}
function deviceCaseMenu(c) {
  openSheet(c.name || 'Case', rec => h('div', { class: 'col' },
    h('button', { class: 'btn primary block', onclick: () => { rec.close(); fire(openDeviceCase(c.id)); } }, 'Open'),
    h('button', { class: 'btn quiet block', onclick: async () => { rec.close(); const d = await LocalStore(c.id).dump(); saveTextFile(fileName(c.name) + '.json', JSON.stringify({ app: APP_NAME, kind: 'case', version: 1, data: d }, null, 2)); } }, 'Export a backup file'),
    h('button', { class: 'btn danger block', onclick: async () => { rec.close(); if (await confirmSheet('Delete this case?', `“${c.name || 'This case'}” and everything in it will be deleted from this phone. Export a backup first if you want to keep it.`, 'Delete case')) { await deleteDeviceCase(c.id); S.devCases = null; schedule(); } } }, 'Delete case')), { noFocus: true });
}
const fileName = s => (String(s || 'case').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'case');
async function importCaseFile(f) {
  let j; try { j = JSON.parse(await f.text()); } catch (e) { toast('That file isn’t a case file.'); return; }
  if (j && j.kind === 'pack') { await startFromPack(checkPack(j)); return; }
  if (!j || j.kind !== 'case' || !j.data) { toast('That file isn’t a case file from ' + APP_NAME + '.'); return; }
  const name = (j.data[''] && j.data[''].name) || 'Imported case';
  await createDeviceCase(name, j.data); S.devCases = null; toast('Case imported'); schedule();
}
function signInCard() {
  const v = S.auth; /* signin | create | reset */
  const card = h('section', { class: 'card col', 'aria-label': 'Sign in' });
  const email = bound('auth-email', { type: 'email', autocomplete: 'email', placeholder: 'you@example.com', inputmode: 'email' });
  if (v === 'reset') {
    const go = h('button', { class: 'btn primary block' }, 'Send reset link');
    go.onclick = busyBtn(go, async () => { if (!email.value.trim()) { toast('Enter your email first.'); return; } await F().sendPasswordResetEmail(CLOUD.auth, email.value.trim()); toast('If there’s an account for that email, a reset link is on its way.', 4200); S.auth = 'signin'; schedule(); });
    add(card, [h('h2', { class: 'sec', style: 'margin:0' }, 'Reset your password'), h('p', { class: 'note' }, 'We’ll email you a link to choose a new password.'),
      h('label', { class: 'lbl', for: 'auth-email', style: 'margin:0' }, 'Email'), email, go, h('button', { class: 'linkish', onclick: () => { S.auth = 'signin'; schedule(); } }, 'Back to sign in')]);
    return card;
  }
  const pw = bound('auth-pw', { type: 'password', autocomplete: v === 'create' ? 'new-password' : 'current-password', placeholder: v === 'create' ? 'At least 8 characters' : '' });
  const name = v === 'create' ? bound('auth-name', { autocomplete: 'nickname', maxlength: 40, placeholder: 'What your group calls you' }) : null;
  const agree = h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'auth-agree', checked: S.form.agree, onchange: e => S.form.agree = e.target.checked }),
    h('span', null, 'I’ve read the ', h('button', { class: 'linkish', type: 'button', style: 'min-height:0;padding:0', onclick: e => { e.preventDefault(); openLegal('privacy'); } }, 'privacy notice'), ' and I’m 13 or older.'));
  const go = h('button', { class: 'btn primary block' }, v === 'create' ? 'Create account' : 'Sign in');
  go.onclick = busyBtn(go, async () => {
    const e = email.value.trim(), p = pw.value;
    if (!e || !p) { toast('Enter your email and password.'); return; }
    try {
      if (v === 'create') {
        if (!S.form.agree) { toast('Please confirm you’ve read the privacy notice.'); return; }
        const cred = await F().createUserWithEmailAndPassword(CLOUD.auth, e, p);
        const n = (name.value || '').trim(); if (n) await F().updateProfile(cred.user, { displayName: n });
        await F().sendEmailVerification(cred.user); CLOUD.user = CLOUD.auth.currentUser; S.form['auth-pw'] = ''; schedule();
      } else { await F().signInWithEmailAndPassword(CLOUD.auth, e, p); S.form['auth-pw'] = ''; }
    } catch (err) { toast(authMsg(err), 4200); }
  });
  add(card, [h('h2', { class: 'sec', style: 'margin:0' }, v === 'create' ? 'Create an account' : 'Sign in'),
    h('p', { class: 'note' }, 'An account lets your Keeper and investigators share a case between phones.')]);
  if (hasGoogle()) {
    const g = h('button', { class: 'btn block', style: 'background:#fff;color:#1f1f1f;border-color:#fff' }, googleMark(), 'Continue with Google');
    g.onclick = busyBtn(g, async () => { if (!S.form.agree) { toast('Please confirm you’ve read the privacy notice first.'); return; } await signInGoogle(); });
    add(card, [g, h('p', { class: 'tiny muted', style: 'text-align:center' }, 'or with email')]);
  }
  if (name) add(card, [h('label', { class: 'lbl', for: 'auth-name', style: 'margin:0' }, 'Display name'), name]);
  add(card, [h('label', { class: 'lbl', for: 'auth-email', style: 'margin:0' }, 'Email'), email, h('label', { class: 'lbl', for: 'auth-pw', style: 'margin:0' }, 'Password'), pw]);
  if (v === 'create' || hasGoogle()) card.append(agree);
  add(card, [go, h('div', { class: 'row wrap', style: 'justify-content:space-between' },
    h('button', { class: 'linkish', onclick: () => { S.auth = v === 'create' ? 'signin' : 'create'; schedule(); } }, v === 'create' ? 'I already have an account' : 'Create an account'),
    v === 'signin' ? h('button', { class: 'linkish', onclick: () => { S.auth = 'reset'; schedule(); } }, 'Forgot password?') : null)]);
  return card;
}
function googleMark() {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 48 48'); s.setAttribute('width', 20); s.setAttribute('height', 20); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.4 0 20.1 0 24s1 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/>';
  return s;
}
function verifyCard(u) {
  const again = h('button', { class: 'btn primary block' }, 'I’ve confirmed my email');
  again.onclick = busyBtn(again, async () => { await F().reload(u); await u.getIdToken(true); CLOUD.user = CLOUD.auth.currentUser; if (needsVerify(CLOUD.user)) toast('Not confirmed yet. Tap the link in the email first.', 3600); else fset('users/' + u.uid, { name: myName(), seen: Date.now() }, true).catch(() => { }); schedule(); });
  const resend = h('button', { class: 'btn sm quiet' }, 'Send the email again');
  resend.onclick = busyBtn(resend, async () => { await F().sendEmailVerification(u); toast('Sent. Check your inbox and spam folder.'); });
  return h('section', { class: 'card col' }, h('h2', { class: 'sec', style: 'margin:0' }, 'Check your inbox'),
    h('p', { class: 'note' }, `We sent a link to ${u.email}. Tap it to confirm your email, then come back here.`), again,
    h('div', { class: 'row', style: 'justify-content:space-between' }, resend, h('button', { class: 'linkish', onclick: () => fire(cloudSignOut()) }, 'Sign out')));
}
function homeFooter() {
  return h('div', { class: 'row wrap', style: 'justify-content:center;margin-top:30px;gap:4px' },
    h('button', { class: 'linkish', onclick: openTheme }, 'Colours'),
    h('button', { class: 'linkish', onclick: () => openLegal('privacy') }, 'Privacy'),
    h('button', { class: 'linkish', onclick: () => openLegal('about') }, 'About'));
}
const THEMES = [['ink', 'Ink and manila'], ['deep', 'Deep water'], ['day', 'Asylum daylight']];
function openTheme() {
  openSheet('Colours', rec => {
    const cur = document.documentElement.getAttribute('data-theme') || 'ink';
    return h('div', { class: 'col' }, THEMES.map(([k, label]) => h('button', { class: 'btn block ' + (k === cur ? 'primary' : 'quiet'), 'aria-pressed': String(k === cur),
      onclick: () => { document.documentElement.setAttribute('data-theme', k); pref.set('theme', k); rec.fill(); schedule(); } }, label)));
  }, { noFocus: true });
}

/* ================= inside a case ================= */
function renderCase() {
  const keeper = ME.keeper;
  const tabs = keeper ? [['party', 'Party', 'people'], ['notes', 'Notes', 'sheet'], ['handouts', 'Handouts', 'doc'], ['sanity', 'Sanity', 'eye'], ['rolls', 'Rolls', 'dice']]
    : [['sheet', 'Sheet', 'sheet'], ['dice', 'Dice', 'dice'], ['handouts', 'Handouts', 'doc']];
  if (!tabs.some(t => t[0] === S.tab)) S.tab = tabs[0][0];
  S.key = 'case:' + S.tab;
  const right = [];
  if (keeper && !C.store.local && C.info.code) right.push(h('button', { class: 'btn sm quiet', style: 'min-height:44px', 'aria-label': 'Share case code ' + showCode(C.info.code), onclick: openCodeSheet }, h('span', { class: 'muted' }, 'Code'), h('b', { style: 'letter-spacing:1px' }, showCode(C.info.code))));
  if (keeper) right.push(h('button', { class: 'icon-btn', 'aria-label': 'Case settings', onclick: openCaseSettings }, icon('more')));
  else right.push(h('button', { class: 'icon-btn', 'aria-label': 'Investigators in this case', onclick: openParty }, icon('people', 24, 1.8)));
  const out = [topBar('Cases', () => exitCase(), keeper ? '' : (C.info.name || ''), right)];
  const banner = !keeper ? sanityBanner() : null;
  let body;
  switch (S.tab) {
    case 'party': body = keeperParty(); break;
    case 'notes': body = keeperNotes(); break;
    case 'handouts': body = keeper ? keeperHandouts() : playerHandouts(banner); break;
    case 'sanity': body = keeperSanity(); break;
    case 'rolls': body = diceTab(true); break;
    case 'dice': body = diceTab(false, banner); break;
    default: body = playerSheetTab(banner);
  }
  out.push(body);
  out.push(h('nav', { class: 'nav', 'aria-label': 'Sections' }, tabs.map(([k, label, ic]) => h('button', { 'aria-current': S.tab === k ? 'page' : null, onclick: () => { S.tab = k; schedule(); } }, icon(ic, 24, 1.8), label))));
  return out;
}
function openCodeSheet() {
  const code = showCode(C.info.code), text = `Join my Call of Cthulhu case “${C.info.name || ''}” in ${APP_NAME}. Case code: ${code}`;
  openSheet('Case code', rec => h('div', { class: 'col', style: 'align-items:stretch' },
    h('p', { class: 'note' }, 'Investigators enter this code on the front page to join.'),
    h('div', { class: 'type', style: 'font-size:46px;text-align:center;letter-spacing:4px;color:var(--acc);padding:10px 0' }, code),
    h('button', { class: 'btn primary block', onclick: () => shareText(text) }, icon('share'), 'Share the code'),
    h('button', { class: 'btn quiet block', onclick: () => { try { navigator.clipboard.writeText(C.info.code); toast('Code copied'); } catch (e) { toast('Couldn’t copy. Long-press the code instead.'); } } }, 'Copy')), { noFocus: true });
}
function shareText(text) {
  try { if (window.CaseFileAndroid && CaseFileAndroid.share) { CaseFileAndroid.share(text); return; } } catch (e) { }
  if (navigator.share) navigator.share({ text }).catch(() => { });
  else { try { navigator.clipboard.writeText(text); toast('Copied, ready to paste'); } catch (e) { } }
}
function openCaseSettings() {
  openSheet('Case settings', rec => {
    const b = (label, fn, cls = 'btn quiet block') => { const x = h('button', { class: cls }, label); x.onclick = busyBtn(x, fn); return x; };
    return h('div', { class: 'col' },
      b('Add a scenario pack', async () => { rec.close(); openPackPicker(async pack => { await applyPack(C.store, pack, false); toast(pack.title + ' added: see Notes, Handouts and Party.', 4200); S.tab = 'notes'; schedule(); }); }),
      b('Rename the case', async () => { const n = await askText('Case name', C.info.name || '', { max: 60 }); if (!n) return; await C.store.set('', { name: n }, true); if (C.store.local) { const l = await deviceCases(); const e = l.find(x => x.id === C.id); if (e) { e.name = n; await saveDeviceCases(l); S.devCases = null; } } rec.close(); }),
      b('Export a backup file', async () => { const d = C.store.local ? await C.store.dump() : await cloudCaseDump(); saveTextFile(fileName(C.info.name) + '.json', JSON.stringify({ app: APP_NAME, kind: 'case', version: 1, data: d }, null, 2)); }),
      b('Clear the roll log', async () => { if (!(await confirmSheet('Clear the roll log?', 'Every roll in this case is removed from the log.', 'Clear log'))) return; for (const r of await C.store.list('rolls')) await C.store.del('rolls/' + r.id); toast('Roll log cleared'); }),
      h('p', { class: 'note' }, C.store.local ? 'This case lives on this phone only.' : 'Delete the case from the front page if you no longer need it.'));
  }, { noFocus: true });
}
async function cloudCaseDump() {
  const d = { '': Object.assign({}, C.info) }; delete d[''].ownerUid; delete d[''].code;
  for (const col of ['investigators', 'handouts', 'rolls', 'pregens']) for (const x of await C.store.list(col)) { const id = x.id; delete x.id; d[col + '/' + id] = x; }
  const notes = await C.store.get('keeper/notes'); if (notes) d['keeper/notes'] = notes;
  return d;
}
function openParty() {
  openSheet('Investigators', () => {
    const l = invList();
    if (!l.length) return h('p', { class: 'empty' }, 'No investigators yet.');
    return h('div', null, l.map(i => { const d = derived(i); return h('div', { class: 'card' }, h('b', { style: 'font-size:18px' }, i.name), h('div', { class: 'small muted' }, i.occupation || ''),
      h('div', { class: 'row wrap small', style: 'margin-top:6px;gap:4px 14px' }, h('span', null, h('span', { class: 'muted' }, 'HP '), h('b', null, `${i.hp}/${d.hpMax}`)), h('span', null, h('span', { class: 'muted' }, 'SAN '), h('b', null, String(i.san))), h('span', null, h('span', { class: 'muted' }, 'Luck '), h('b', null, String(i.luck)))),
      (i.conds || []).length ? h('div', { class: 'row wrap', style: 'gap:4px;margin-top:6px' }, i.conds.map(c => h('span', { class: 'pill' }, c))) : null); }));
  }, { noFocus: true });
}

/* ================= investigator sheet ================= */
const first = n => String(n || '').trim().split(/\s+/)[0] || 'They';
function playerSheetTab(banner) {
  if (!C.invsLoaded) return h('div', { class: 'scroll' }, h('p', { class: 'loading' }, 'Loading…'));
  const inv = myInv();
  if (!inv) return h('div', { class: 'scroll' }, banner, h('h1', { class: 'title', style: 'margin-top:8px' }, 'Your investigator'),
    h('p', { class: 'note', style: 'margin:8px 0 18px' }, 'Create your investigator for this case. Your Keeper can see your sheet and your rolls.'),
    h('button', { class: 'btn primary block', onclick: () => openCreate(ME.invId) }, 'Create your investigator'),
    C.pregens.length ? [h('h2', { class: 'sec' }, 'Or play a ready-made one'), C.pregens.map(pg => pregenCard(pg, () => {
      const nv = invFromPregen(pg); nv.owner = ME.uid; nv.updated = Date.now(); fire(C.store.set('investigators/' + ME.invId, nv)); S.sheetTab = 'Story';
    }, 'Play as ' + first(pg.name)))] : null);
  return sheetView(inv, ME.invId, banner);
}
function sheetView(inv, id, banner) {
  const d = derived(inv);
  const sc = h('div', { class: 'scroll', style: 'padding:0 0 28px' });
  if (banner) sc.append(banner);
  const sub = [inv.occupation, inv.age ? (inv.occupation ? String(inv.age) : 'Age ' + inv.age) : ''].filter(Boolean).join(', ') + (inv.residence ? '. ' + inv.residence + '.' : (inv.occupation ? '.' : ''));
  sc.append(h('div', { class: 'who' },
    h('div', { style: 'min-width:0' }, h('h1', { class: 'title' }, inv.name), sub ? h('p', { class: 'muted', style: 'margin-top:4px' }, sub) : null),
    h('button', { class: 'luck-btn', 'aria-label': `Luck ${inv.luck}. Tap to roll or spend Luck.`, onclick: () => luckSheet(id) }, h('b', null, String(inv.luck)), 'Luck')));

  const lost = inv.lost || 0, over = d.limit > 0 && lost >= d.limit;
  sc.append(h('section', { class: 'tracker', 'aria-label': 'Sanity' },
    h('div', { class: 'row', style: 'justify-content:space-between;align-items:flex-end' },
      h('div', { class: 'row', style: 'align-items:baseline;gap:6px' }, h('span', { class: 'num' }, String(inv.san)), h('span', { class: 'muted', style: 'font-size:18px' }, `/ ${d.sanMax} Sanity`)),
      h('div', { style: 'display:flex;flex-direction:column;align-items:flex-end;gap:1px' }, h('span', { class: 'tiny muted' }, 'Lost today'),
        h('b', { style: 'font-size:16px;color:' + (over ? 'var(--bad)' : 'var(--text)') }, `${lost} of ${d.limit}`))),
    h('div', { class: 'bar', 'aria-hidden': 'true' }, h('div', { style: `width:${clamp(inv.san / 99 * 100, 0, 100)}%` })),
    h('div', { class: 'row' }, h('button', { class: 'btn sm danger grow', onclick: () => loseSan(id) }, 'Lose'), h('button', { class: 'btn sm good grow', onclick: () => regainSan(id) }, 'Regain')),
    h('button', { class: 'linkish', style: 'align-self:flex-start;min-height:36px;font-size:15px', onclick: () => newDay(id) }, 'Start a new day')));

  const tile = (label, value, fn, aria) => h('button', { class: 'tile', onclick: fn, 'aria-label': aria || null }, h('span', null, label), h('b', null, value));
  sc.append(h('section', { class: 'tiles', 'aria-label': 'Hit points, magic points, Dodge and Move' },
    tile('HP', `${inv.hp}/${d.hpMax}`, () => hpSheet(id), `Hit points ${inv.hp} of ${d.hpMax}`),
    tile('MP', `${inv.mp}/${d.mpMax}`, () => mpSheet(id), `Magic points ${inv.mp} of ${d.mpMax}`),
    tile('Dodge', String(d.dodge), () => openRoll({ invId: id, kind: 'skill', skill: 'Dodge', label: 'Dodge' })),
    tile('Move', String(d.move), () => moveSheet(id), `Move ${d.move}, build and damage bonus`)));

  sc.append(h('div', { class: 'chips' }, (inv.conds || []).map(c => h('button', { class: 'chip' + (/insanity|Dying/.test(c) ? ' solid' : ''), 'aria-label': c + '. Tap to remove.', onclick: async () => { if (await confirmSheet('Remove condition?', `Remove “${c}” from ${first(inv.name)}?`, 'Remove', false)) patchInv(id, { conds: (C.invs[id].conds || []).filter(x => x !== c) }); } }, c)),
    h('button', { class: 'chip add', onclick: () => addCondition(id) }, icon('plus', 16, 2.2), 'Add condition')));

  sc.append(h('div', { class: 'pad', style: 'margin-top:12px' }, h('div', { class: 'grid3' },
    quickRoll('Sanity', inv.san, () => openRoll({ invId: id, kind: 'san', label: 'Sanity' }), true),
    quickRoll('INT', inv.ch.INT, () => openRoll({ invId: id, kind: 'char', char: 'INT', label: 'INT' })),
    quickRoll('EDU', inv.ch.EDU, () => openRoll({ invId: id, kind: 'char', char: 'EDU', label: 'EDU' })))));

  const tabs = ['Skills', 'Stats', 'Gear', 'Story'];
  sc.append(h('nav', { class: 'seg tabs', 'aria-label': 'Sheet sections' }, tabs.map(t => h('button', { 'aria-pressed': String(S.sheetTab === t), onclick: () => { S.sheetTab = t; schedule(); } }, t))));
  const body = h('div', { class: 'pad', style: 'margin-top:6px' });
  if (S.sheetTab === 'Stats') statsTab(body, inv, id, d);
  else if (S.sheetTab === 'Gear') gearTab(body, inv, id);
  else if (S.sheetTab === 'Story') storyTab(body, inv, id);
  else skillsTab(body, inv, id);
  sc.append(body);
  return sc;
}
function quickRoll(label, value, fn, san) {
  return h('button', { class: 'tile', style: 'min-height:58px;border:1.5px solid ' + (san ? 'var(--good)' : 'var(--line)') + ';background:transparent', onclick: fn },
    h('span', { style: 'font-weight:700;color:' + (san ? 'var(--good)' : 'var(--muted)') + ';font-size:14px' }, label), h('b', null, String(value)));
}

/* ---------- skills ---------- */
const NO_TICK = ['Cthulhu Mythos', 'Credit Rating'];
function skillsTab(body, inv, id) {
  const list = skillList(inv), ticked = list.filter(s => s.t).length;
  body.append(h('div', { class: 'row', style: 'justify-content:space-between;margin:4px 0 2px' },
    h('button', { class: 'linkish', onclick: () => editSkills(id) }, 'Edit skills'),
    h('button', { class: 'linkish', onclick: () => improveSkills(id), disabled: !ticked }, ticked ? `Improve ${ticked} ticked` : 'No skills ticked')));
  list.forEach(s => {
    body.append(h('div', { class: 'line-row', style: 'padding:0 0 0 2px;gap:6px' },
      h('button', { class: 'main', onclick: () => openRoll({ invId: id, kind: 'skill', skill: s.name, label: s.name }) },
        h('span', { class: 'grow', style: 'display:flex;flex-direction:column;gap:2px' }, h('b', { style: 'font-size:17px' }, s.name), h('span', { class: 'small muted' }, `Hard ${Math.floor(s.v / 2)} · Extreme ${Math.floor(s.v / 5)}`)),
        h('span', { class: 'big' }, String(s.v))),
      NO_TICK.includes(s.name) ? h('span', { style: 'width:44px' }) :
        h('button', { class: 'tick', 'aria-pressed': String(s.t), 'aria-label': s.name + (s.t ? ', ticked for improvement' : ', not ticked for improvement'), onclick: () => patchInv(id, { skills: { [s.name]: { t: !s.t } } }) },
          h('span', null, s.t ? Object.assign(icon('check', 14, 3.4), { style: 'color:var(--on-acc)' }) : null))));
  });
}
function editSkills(id) {
  const inv = C.invs[id]; if (!inv) return;
  openSheet('Edit skills', rec => {
    const rows = skillList(inv).sort((a, b) => a.name.localeCompare(b.name)), inputs = {};
    const wrap = h('div', null, h('p', { class: 'note', style: 'margin-bottom:10px' }, 'Set each skill to its full value, including occupation and personal interest points.'));
    rows.forEach((s, i) => {
      const base = skillBase(s.name, inv.ch);
      const inp = h('input', { class: 'in', id: 'sk-' + i, type: 'number', inputmode: 'numeric', min: 0, max: 999, value: String(s.v), style: 'width:92px;text-align:center' });
      inputs[s.name] = inp;
      wrap.append(h('div', { class: 'kv', style: 'align-items:center' }, h('label', { for: 'sk-' + i, class: 'grow' }, s.name, base != null ? h('span', { class: 'tiny muted' }, ' base ' + base) : null), inp));
    });
    const nn = h('input', { class: 'in', id: 'sk-new', placeholder: 'e.g. Language (Latin)', maxlength: 40 }), nv = h('input', { class: 'in', id: 'sk-new-v', type: 'number', inputmode: 'numeric', placeholder: '%', style: 'width:92px;text-align:center' });
    wrap.append(h('h3', { style: 'margin:18px 0 8px;font-size:17px' }, 'Add a skill or speciality'), h('div', { class: 'row' }, nn, nv),
      h('p', { class: 'note', style: 'margin-top:6px' }, 'To remove an added skill, set it to nothing (clear the box).'));
    const save = () => {
      const skills = {};
      for (const k in inputs) { const raw = inputs[k].value.trim(); const base = skillBase(k, inv.ch); if (raw === '') { if (base == null) skills[k] = { v: null, t: false }; continue; } const v = clamp(num(raw, 0), 0, 999); if (v !== (inv.skills[k] || {}).v) skills[k] = { v }; }
      const n = nn.value.trim(); if (n) skills[n] = { v: clamp(num(nv.value, 1), 0, 999), t: false };
      if (Object.keys(skills).length) patchInv(id, { skills });
      rec.close();
    };
    wrap.append(h('div', { class: 'acts' }, h('button', { class: 'btn quiet', onclick: () => rec.close() }, 'Cancel'), h('button', { class: 'btn primary', onclick: save }, 'Save')));
    return wrap;
  }, { noFocus: true });
}
async function improveSkills(id) {
  const inv = C.invs[id]; const ticked = skillList(inv).filter(s => s.t && !NO_TICK.includes(s.name));
  if (!ticked.length) { toast('No skills are ticked yet.'); return; }
  if (!(await confirmSheet('Improve ticked skills?', 'Use this at the end of a session. Each ticked skill gets a roll: over the skill (or 96 and up) and it rises by 1D10. The ticks are then cleared.', 'Roll improvements', false))) return;
  const cur = C.invs[id], d = derived(cur), skills = {}, res = []; let sanGain = 0;
  for (const s of ticked) {
    const r = rnd(100), up = r > s.v || r >= 96, gain = up ? rnd(10) : 0, nv = s.v + gain;
    if (s.v < 90 && nv >= 90) sanGain += rnd(6) + rnd(6);
    skills[s.name] = { v: nv, t: false }; res.push({ name: s.name, r, gain, nv });
  }
  const fields = { skills }; if (sanGain) fields.san = Math.min(d.sanMax, cur.san + sanGain);
  patchInv(id, fields);
  postRoll({ kind: 'note', invId: id, label: 'Skill improvements', text: res.map(x => x.gain ? `${x.name} +${x.gain}` : `${x.name} no change`).join(', ') });
  openSheet('Improvements', rec => h('div', null, res.map(x => h('div', { class: 'kv' }, h('span', null, x.name, h('span', { class: 'tiny muted' }, ` rolled ${two(x.r)}`)), h('b', { class: x.gain ? 'good' : 'muted' }, x.gain ? `+${x.gain} to ${x.nv}` : 'No change'))),
    sanGain ? h('p', { class: 'note', style: 'margin-top:12px' }, `Reaching 90% in a skill restores ${sanGain} Sanity.`) : null,
    h('div', { class: 'acts' }, h('button', { class: 'btn primary', onclick: () => rec.close() }, 'Done'))), { noFocus: true });
}

/* ---------- characteristics and details ---------- */
function statsTab(body, inv, id, d) {
  body.append(h('div', { class: 'stat-grid', style: 'margin-top:8px' }, CHARS.map(c => h('button', { 'aria-label': `${CHAR_NAMES[c]} ${inv.ch[c]}. Tap to roll.`, onclick: () => openRoll({ invId: id, kind: 'char', char: c, label: c }) },
    h('span', null, c), h('b', null, String(inv.ch[c])), h('small', null, `${Math.floor(inv.ch[c] / 2)} · ${Math.floor(inv.ch[c] / 5)}`)))));
  const kv = (k, v) => h('div', { class: 'kv' }, h('span', { class: 'muted' }, k), h('b', null, v));
  body.append(h('div', { style: 'margin-top:10px' }, kv('Hit points', `${inv.hp} of ${d.hpMax}`), kv('Magic points', `${inv.mp} of ${d.mpMax}`), kv('Sanity', `${inv.san}, highest ${d.sanMax}`),
    kv('Luck', String(inv.luck)), kv('Move', String(d.move)), kv('Build', String(d.build)), kv('Damage bonus', d.db), kv('Age', String(inv.age || '')), kv('Era', inv.era || '1920s')));
  body.append(h('button', { class: 'btn quiet block', style: 'margin-top:16px', onclick: () => openCreate(id, inv) }, 'Edit details and characteristics'));
  if (ME.keeper || C.store.local) body.append(h('button', { class: 'btn danger block', style: 'margin-top:10px', onclick: async () => { if (await confirmSheet('Delete this investigator?', `${inv.name} and their sheet will be deleted from this case.`, 'Delete')) { await C.store.del('investigators/' + id); S.page = null; schedule(); } } }, 'Delete investigator'));
}
function openCreate(id, existing) {
  const ex = existing || null;
  openSheet(ex ? 'Edit investigator' : 'New investigator', rec => {
    const f = (key, label, val, attrs = {}) => { const inp = h('input', Object.assign({ class: 'in', id: 'cr-' + key, value: val == null ? '' : String(val), autocomplete: 'off' }, attrs)); return [h('label', { class: 'lbl', for: 'cr-' + key, style: 'margin-top:12px' }, label), inp]; };
    const wrap = h('div', null,
      f('name', 'Name', ex ? ex.name : '', { maxlength: 60, placeholder: 'e.g. Agnes Whitlow' }),
      f('occupation', 'Occupation', ex ? ex.occupation : '', { maxlength: 60, placeholder: 'e.g. Antiquarian' }),
      h('div', { class: 'grid2' }, h('div', null, f('age', 'Age', ex ? ex.age : 30, { type: 'number', inputmode: 'numeric', min: 15, max: 99 })), h('div', null, f('residence', 'Residence', ex ? ex.residence : '', { maxlength: 60, placeholder: 'e.g. Boston' }))));
    const chars = h('div', { class: 'grid4', style: 'margin-top:8px' });
    [...CHARS, 'Luck'].forEach(c => { const v = ex ? (c === 'Luck' ? ex.luck : ex.ch[c]) : ''; chars.append(h('div', null, h('label', { class: 'lbl', for: 'cr-' + c, style: 'margin:6px 0 4px;text-align:center' }, c), h('input', { class: 'in', id: 'cr-' + c, type: 'number', inputmode: 'numeric', min: 1, max: 99, value: v === '' ? '' : String(v), placeholder: '–', style: 'text-align:center;padding:0 4px' }))); });
    wrap.append(h('div', { class: 'row', style: 'justify-content:space-between;margin-top:16px' }, h('h3', { style: 'margin:0;font-size:17px' }, 'Characteristics'),
      ex ? null : h('button', { class: 'btn sm', onclick: () => { CHARS.forEach(c => $('#cr-' + c).value = rollChar(c)); $('#cr-Luck').value = (rnd(6) + rnd(6) + rnd(6)) * 5; } }, icon('dice', 18), 'Roll them')), chars,
      h('p', { class: 'note', style: 'margin-top:8px' }, ex ? 'Hit points, magic points, Move, Build and damage bonus update from these.' : 'Roll them, or type in the values you already have. You set skill values after this.'));
    const save = () => {
      const v = k => $('#cr-' + k).value.trim();
      const ch = {}; for (const c of CHARS) { if (v(c) === '') { toast('Fill in every characteristic, or tap Roll them.'); return; } ch[c] = clamp(num(v(c)), 1, 99); }
      if (v('Luck') === '') { toast('Fill in Luck, or tap Roll them.'); return; }
      const data = { name: v('name') || 'Unnamed investigator', occupation: v('occupation'), age: clamp(num(v('age'), 30), 15, 99), residence: v('residence'), ch, luck: clamp(num(v('Luck')), 0, 99) };
      if (ex) {
        const next = Object.assign(clone(C.invs[id]), data), d = derived(next);
        const fields = Object.assign({}, data, { hp: Math.min(next.hp, d.hpMax), mp: Math.min(next.mp, d.mpMax) });
        const sk = {}; ['Dodge', 'Language (Own)'].forEach(n => { const oldBase = skillBase(n, ex.ch); if ((ex.skills[n] || {}).v === oldBase) sk[n] = { v: skillBase(n, ch) }; });
        if (Object.keys(sk).length) fields.skills = sk;
        patchInv(id, fields);
      } else {
        const inv = newInvestigator(data); inv.owner = ME.uid; inv.updated = Date.now();
        fire(C.store.set('investigators/' + id, inv));
        if (!C.store.local || ME.keeper) setTimeout(() => toast('Now set your skill values: Skills, then Edit skills.', 3000), 400);
        if (ME.keeper) S.page = { type: 'sheet', id };
      }
      rec.close(); schedule();
    };
    wrap.append(h('div', { class: 'acts' }, h('button', { class: 'btn quiet', onclick: () => rec.close() }, 'Cancel'), h('button', { class: 'btn primary', onclick: save }, ex ? 'Save' : 'Create')));
    return wrap;
  });
}

/* ---------- trackers ---------- */
async function loseSan(id) {
  const inv = C.invs[id]; if (!inv) return;
  const r = await askAmount('Lose Sanity', { help: `How much Sanity did ${first(inv.name)} lose?`, quick: [1, 2, 3, 4, 5], dice: ['1D3', '1D4', '1D6', '1D8', '1D10'] }); if (!r) return;
  applySanLoss(id, r.amount, r.text, true);
}
function applySanLoss(id, amount, text, showNotes) {
  const cur = C.invs[id]; if (!cur) return [];
  const d = derived(cur), san = Math.max(0, cur.san - amount), lost = (cur.lost || 0) + amount, conds = new Set(cur.conds || []), notes = [];
  if (amount >= 5) notes.push(`${first(cur.name)} lost 5 or more at once: make an INT roll. If it succeeds, a bout of madness follows and they are temporarily insane.`);
  if (d.limit > 0 && lost >= d.limit && !conds.has('Indefinite insanity')) { conds.add('Indefinite insanity'); notes.push(`That’s a fifth or more of today’s Sanity: ${first(cur.name)} is indefinitely insane.`); }
  if (san === 0) { conds.add('Permanent insanity'); notes.push('Sanity has reached 0: permanent insanity.'); }
  patchInv(id, { san, lost, conds: [...conds] });
  postRoll({ kind: 'note', invId: id, label: 'Lost Sanity', value: amount, text });
  if (showNotes && notes.length) openSheet('Sanity', rec => h('div', { class: 'col' }, notes.map(n => h('p', { style: 'font-size:16px' }, n)),
    amount >= 5 ? h('button', { class: 'btn primary block', onclick: () => { rec.close(); openRoll({ invId: id, kind: 'char', char: 'INT', label: 'INT' }); } }, 'Roll INT') : null,
    h('button', { class: 'btn quiet block', onclick: () => rec.close() }, 'OK')), { noFocus: true });
  return notes;
}
async function regainSan(id) {
  const r = await askAmount('Regain Sanity', { quick: [1, 2, 3, 4, 5], dice: ['1D3', '1D4', '1D6', '1D10', '2D6'] }); if (!r) return;
  const cur = C.invs[id], d = derived(cur); patchInv(id, { san: Math.min(d.sanMax, cur.san + r.amount) });
  postRoll({ kind: 'note', invId: id, label: 'Regained Sanity', value: r.amount, text: r.text });
}
function newDay(id) {
  const cur = C.invs[id]; patchInv(id, { lost: 0, sanDayStart: cur.san });
  toast(`New day. Today’s limit is ${Math.floor(cur.san / 5)} Sanity.`, 3200);
}
function hpSheet(id) {
  const inv = C.invs[id], d = derived(inv);
  openSheet('Hit points', rec => h('div', { class: 'col' },
    h('div', { class: 'type', style: 'font-size:44px;text-align:center' }, `${inv.hp} / ${d.hpMax}`),
    h('p', { class: 'note' }, `A single loss of ${Math.ceil(d.hpMax / 2)} or more is a major wound.`),
    h('div', { class: 'row' }, h('button', { class: 'btn danger grow', onclick: async () => { rec.close(); const r = await askAmount('Take damage', { quick: [1, 2, 3, 4, 5], dice: ['1D3', '1D4', '1D6', '1D8', '1D10'] }); if (r) takeDamage(id, r); } }, 'Take damage'),
      h('button', { class: 'btn good grow', onclick: async () => { rec.close(); const r = await askAmount('Heal', { quick: [1, 2, 3, 4, 5], dice: ['1D3', '1D4', '1D6', '1D8', '1D10'] }); if (r) { const c = C.invs[id]; patchInv(id, { hp: Math.min(derived(c).hpMax, c.hp + r.amount) }); } } }, 'Heal'))), { noFocus: true });
}
function takeDamage(id, r) {
  const cur = C.invs[id], d = derived(cur), amt = r.amount, hp = Math.max(0, cur.hp - amt), conds = new Set(cur.conds || []), notes = [];
  if (amt > 0 && amt * 2 >= d.hpMax) { conds.add('Major wound'); notes.push('A major wound. Make a CON roll to stay conscious.'); }
  if (hp === 0) { if (conds.has('Major wound')) { conds.add('Dying'); notes.push('At 0 hit points with a major wound: dying. First Aid is needed now.'); } else { conds.add('Unconscious'); notes.push('At 0 hit points: unconscious.'); } }
  patchInv(id, { hp, conds: [...conds] });
  postRoll({ kind: 'note', invId: id, label: 'Took damage', value: amt, text: r.text });
  if (notes.length) openSheet('Hit points', rec => h('div', { class: 'col' }, notes.map(n => h('p', { style: 'font-size:16px' }, n)),
    conds.has('Major wound') && hp > 0 ? h('button', { class: 'btn primary block', onclick: () => { rec.close(); openRoll({ invId: id, kind: 'char', char: 'CON', label: 'CON' }); } }, 'Roll CON') : null,
    h('button', { class: 'btn quiet block', onclick: () => rec.close() }, 'OK')), { noFocus: true });
}
function mpSheet(id) {
  const inv = C.invs[id], d = derived(inv);
  openSheet('Magic points', rec => h('div', { class: 'col' },
    h('div', { class: 'type', style: 'font-size:44px;text-align:center' }, `${inv.mp} / ${d.mpMax}`),
    h('div', { class: 'row' }, h('button', { class: 'btn danger grow', onclick: async () => { rec.close(); const r = await askAmount('Spend magic points'); if (r) patchInv(id, { mp: Math.max(0, C.invs[id].mp - r.amount) }); } }, 'Spend'),
      h('button', { class: 'btn good grow', onclick: async () => { rec.close(); const r = await askAmount('Regain magic points'); if (r) patchInv(id, { mp: Math.min(d.mpMax, C.invs[id].mp + r.amount) }); } }, 'Regain'))), { noFocus: true });
}
function moveSheet(id) {
  const inv = C.invs[id], d = derived(inv);
  openSheet('Move and build', () => h('div', null, h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Move'), h('b', null, String(d.move))),
    h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Build'), h('b', null, String(d.build))), h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Damage bonus'), h('b', null, d.db)),
    h('p', { class: 'note', style: 'margin-top:10px' }, 'Worked out from STR, DEX, SIZ and age.')), { noFocus: true });
}
function luckSheet(id) {
  const inv = C.invs[id];
  openSheet('Luck', rec => h('div', { class: 'col' },
    h('div', { class: 'type', style: 'font-size:44px;text-align:center;color:var(--acc)' }, String(inv.luck)),
    h('button', { class: 'btn primary block', onclick: () => { rec.close(); openRoll({ invId: id, kind: 'luck', label: 'Luck' }); } }, 'Roll Luck'),
    h('div', { class: 'row' }, h('button', { class: 'btn danger grow', onclick: async () => { rec.close(); const r = await askAmount('Spend Luck', { quick: [1, 2, 5, 10, 20], dice: ['1D10', '2D10', '1D6', '1D4', '1D3'] }); if (r) { patchInv(id, { luck: Math.max(0, C.invs[id].luck - r.amount) }); postRoll({ kind: 'note', invId: id, label: 'Spent Luck', value: r.amount }); } } }, 'Spend'),
      h('button', { class: 'btn good grow', onclick: async () => { rec.close(); const r = await askAmount('Add Luck', { quick: [1, 2, 5, 10, 20], dice: ['1D10', '2D10', '1D6', '1D4', '1D3'] }); if (r) patchInv(id, { luck: Math.min(99, C.invs[id].luck + r.amount) }); } }, 'Add'))), { noFocus: true });
}
function addCondition(id) {
  openSheet('Add condition', rec => {
    const inp = h('input', { class: 'in', id: 'cond-in', maxlength: 60, placeholder: 'e.g. Phobia: deep water' });
    const ok = () => { const v = inp.value.trim(); if (!v || /:\s*$/.test(v)) { toast('Finish typing the condition first.'); return; } const cur = C.invs[id]; patchInv(id, { conds: [...new Set([...(cur.conds || []), v])] }); rec.close(); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
    return h('div', { class: 'col' }, h('div', { class: 'row wrap', style: 'gap:8px' }, COND_PRESETS.map(c => h('button', { class: 'chip ok', style: 'font-weight:500', onclick: () => { if (c.endsWith(' ')) { inp.value = c; inp.focus(); } else { inp.value = c; ok(); } } }, c.trim()))),
      h('label', { class: 'lbl', for: 'cond-in', style: 'margin:8px 0 0' }, 'Or type your own'), inp, h('div', { class: 'acts' }, h('button', { class: 'btn quiet', onclick: () => rec.close() }, 'Cancel'), h('button', { class: 'btn primary', onclick: ok }, 'Add')));
  }, { noFocus: true });
}

/* ---------- gear and story ---------- */
function gearTab(body, inv, id) {
  body.append(h('h3', { style: 'margin:14px 0 4px;font-size:17px' }, 'Weapons'));
  (inv.weapons || []).forEach((w, i) => {
    const sv = skillVal(inv, w.skill);
    body.append(h('div', { class: 'line-row' },
      h('button', { class: 'main', onclick: () => openRoll({ invId: id, kind: 'weapon', skill: w.skill, label: w.name, weapon: w }) },
        h('span', { class: 'grow', style: 'display:flex;flex-direction:column;gap:2px' }, h('b', { style: 'font-size:17px' }, w.name),
          h('span', { class: 'small muted' }, [w.skill, 'damage ' + (w.dmg || '–'), w.range ? 'range ' + w.range : '', w.attacks ? w.attacks + ' per round' : '', w.ammo ? 'ammo ' + w.ammo : ''].filter(Boolean).join(' · '))),
        h('span', { class: 'big' }, String(sv))),
      h('button', { class: 'icon-btn', 'aria-label': 'Edit ' + w.name, onclick: () => editWeapon(id, i) }, icon('edit', 20))));
  });
  body.append(h('button', { class: 'chip add', style: 'margin-top:10px', onclick: () => editWeapon(id, -1) }, icon('plus', 16, 2.2), 'Add a weapon'));
  textBlock(body, 'Possessions', inv.gear, v => patchInv(id, { gear: v }));
  textBlock(body, 'Cash and assets', inv.cash, v => patchInv(id, { cash: v }));
}
function textBlock(body, title, text, save) {
  body.append(h('div', { class: 'row', style: 'justify-content:space-between;margin-top:16px' }, h('h3', { style: 'margin:0;font-size:17px' }, title),
    h('button', { class: 'linkish', 'aria-label': (text ? 'Edit ' : 'Add ') + title, onclick: async () => { const v = await askText(title, text || '', { multiline: true, label: false }); if (v != null) save(v); } }, text ? 'Edit' : 'Add')),
    text ? h('p', { class: 'prose', style: 'margin-top:4px' }, text) : h('p', { class: 'small muted' }, 'Nothing yet.'));
}
function editWeapon(id, idx) {
  const inv = C.invs[id], list = clone(inv.weapons || []), w = idx >= 0 ? list[idx] : { name: '', skill: 'Firearms (Handgun)', dmg: '', range: '', attacks: '1', ammo: '' };
  openSheet(idx >= 0 ? 'Edit weapon' : 'Add a weapon', rec => {
    const f = (k, label, attrs = {}) => [h('label', { class: 'lbl', for: 'w-' + k, style: 'margin-top:12px' }, label), h('input', Object.assign({ class: 'in', id: 'w-' + k, value: w[k] || '', autocomplete: 'off' }, attrs))];
    const sel = h('select', { class: 'in', id: 'w-skill' }, skillList(inv).filter(s => /Fighting|Firearms|Throw|Artillery|Demolitions|Heavy Weapons|Spear|Bow|Whip|Sword|Axe|Flail|Chainsaw/i.test(s.name) || s.name === w.skill).sort((a, b) => a.name.localeCompare(b.name)).map(s => h('option', { value: s.name, selected: s.name === w.skill }, `${s.name} (${s.v})`)));
    const save = () => {
      const g = k => $('#w-' + k).value.trim();
      const nw = { name: g('name') || 'Weapon', skill: sel.value, dmg: g('dmg').toUpperCase(), range: g('range'), attacks: g('attacks'), ammo: g('ammo') };
      if (nw.dmg && !rollDice(nw.dmg.replace(/\+?½?DB|\+?HALF ?DB/g, ''))) { toast('Damage should look like 1D10, 1D6+2 or 1D3+DB.'); return; }
      if (idx >= 0) list[idx] = nw; else list.push(nw);
      patchInv(id, { weapons: list }); rec.close();
    };
    return h('div', null, f('name', 'Name', { maxlength: 40, placeholder: 'e.g. .38 revolver' }), h('label', { class: 'lbl', for: 'w-skill', style: 'margin-top:12px' }, 'Skill'), sel,
      h('div', { class: 'grid2' }, h('div', null, f('dmg', 'Damage', { placeholder: '1D10 or 1D3+DB', style: 'text-transform:uppercase' })), h('div', null, f('range', 'Range', { placeholder: 'e.g. 15 yards' }))),
      h('div', { class: 'grid2' }, h('div', null, f('attacks', 'Attacks per round', { maxlength: 10 })), h('div', null, f('ammo', 'Ammo', { maxlength: 10 }))),
      h('p', { class: 'note', style: 'margin-top:8px' }, 'For a Fighting skill not on the list, add it in Skills, Edit skills first.'),
      h('div', { class: 'acts' }, idx >= 0 ? h('button', { class: 'btn danger', onclick: () => { list.splice(idx, 1); patchInv(id, { weapons: list }); rec.close(); } }, 'Remove') : h('button', { class: 'btn quiet', onclick: () => rec.close() }, 'Cancel'),
        h('button', { class: 'btn primary', onclick: save }, 'Save')));
  });
}
function storyTab(body, inv, id) {
  STORY_FIELDS.forEach(k => textBlock(body, k, (inv.story || {})[k], v => patchInv(id, { story: { [k]: v } })));
  textBlock(body, 'Notes', inv.notes, v => patchInv(id, { notes: v }));
}

/* ================= the roll page ================= */
function openRoll(o) {
  S.page = Object.assign({ type: 'roll', diff: 'Regular', bp: 0, res: null, pushed: false, luckSpent: 0, dmg: null, back: S.page && S.page.type === 'sheet' ? S.page : null }, o);
  closeAllSheets(); schedule();
}
function rollTarget(p, inv) {
  if (p.kind === 'skill' || p.kind === 'weapon') return skillVal(inv, p.skill);
  if (p.kind === 'char') return (inv.ch || {})[p.char] || 0;
  if (p.kind === 'luck') return inv.luck || 0;
  if (p.kind === 'san') return inv.san || 0;
  return 0;
}
function diceMax(expr) { const t = parseDice(expr); if (!t) return 0; return t.reduce((s, x) => s + x.sign * (x.k != null ? x.k : x.n * x.d), 0); }
function renderPage() {
  const p = S.page;
  if (p.type === 'sheet') {
    const inv = C.invs[p.id]; if (!inv) { S.page = null; return renderCase(); }
    S.key = 'page:sheet:' + p.id;
    return [topBar('Investigators', () => { S.page = null; schedule(); }, '', null), sheetView(inv, p.id)];
  }
  if (p.type === 'roll') return renderRollPage(p);
  S.page = null; return renderCase();
}
function renderRollPage(p) {
  const inv = C.invs[p.invId];
  if (!inv) { S.page = p.back || null; return S.page ? renderPage() : renderCase(); }
  S.key = 'page:roll';
  const goBack = () => { S.page = p.back || null; schedule(); };
  const res = p.res, target = res ? res.target : rollTarget(p, inv);
  const fixedDiff = p.kind === 'san' || p.kind === 'luck';
  const diff = fixedDiff ? 'Regular' : p.diff;
  const sc = h('div', { class: 'scroll' });
  let sub = p.kind === 'san' ? `Roll ${target} or under, your current Sanity` : p.kind === 'luck' ? `Roll ${target} or under` : `${target} · Hard ${Math.floor(target / 2)} · Extreme ${Math.floor(target / 5)}`;
  sc.append(h('h1', { class: 'title' }, p.label), h('p', { class: 'muted', style: 'margin-top:4px' }, sub));
  if (p.weapon) sc.append(h('p', { class: 'small', style: 'margin-top:4px' }, `Damage ${p.weapon.dmg || '–'}`, p.weapon.range ? ` · range ${p.weapon.range}` : ''));
  if (p.reqId && C.req) sc.append(h('div', { class: 'card', style: 'margin-top:12px' }, h('b', null, C.req.source || 'Sanity roll'), h('div', { class: 'small muted' }, `Loss ${C.req.succ || '1'}/${C.req.fail || '1D6'}: the first on a success, the second on a failure.`)));
  if (!fixedDiff) {
    sc.append(h('div', { style: 'margin-top:16px' }, h('p', { class: 'row small', style: 'gap:6px;margin-bottom:8px' }, icon('shield', 16), 'Difficulty, set by your Keeper'),
      h('div', { class: 'seg', role: 'group', 'aria-label': 'Difficulty' }, ['Regular', 'Hard', 'Extreme'].map(d => h('button', { 'aria-pressed': String(diff === d), disabled: !!res, onclick: () => { p.diff = d; schedule(); } }, d)))));
  }
  if (p.kind !== 'san') {
    const bps = [[-2, 'Penalty', '−2'], [-1, 'Penalty', '−1'], [0, 'None', '0'], [1, 'Bonus', '+1'], [2, 'Bonus', '+2']];
    sc.append(h('div', { style: 'margin-top:14px' }, h('p', { class: 'small muted', style: 'margin-bottom:8px' }, 'Bonus and penalty dice'),
      h('div', { class: 'seg solid tall', role: 'group', 'aria-label': 'Bonus and penalty dice' }, bps.map(([n, l, s]) => h('button', { 'aria-pressed': String(p.bp === n), disabled: !!res, 'aria-label': n === 0 ? 'No bonus or penalty dice' : `${Math.abs(n)} ${l.toLowerCase()} ${Math.abs(n) === 1 ? 'die' : 'dice'}`, onclick: () => { p.bp = n; schedule(); } }, h('small', null, l), h('b', null, s))))));
  }
  if (res) {
    const lvName = (p.pushed ? 'Pushed: ' : '') + (p.luckSpent ? 'Regular success' : LEVELS[res.lv]);
    const dice = h('div', { class: 'dice' + (p.anim ? ' rolling' : '') });
    res.tens.forEach((t, i) => { const used = i === res.chosen, cap = i === 0 ? 'Tens' : (res.bp > 0 ? 'Bonus' : 'Penalty'), txt = t === 0 ? '00' : String(t * 10);
      dice.append(h('div', { class: 'die' }, d10Svg(txt, `${cap} die, ${txt}${used ? ', counts' : ', set aside'}`, used, 'var(--acc)'), h('span', { style: 'color:' + (used ? 'var(--acc)' : 'var(--muted)') }, cap))); });
    dice.append(h('div', { class: 'die' }, d10Svg(String(res.units), 'Units die, ' + res.units, true, 'var(--good)'), h('span', { class: 'good' }, 'Units')));
    p.anim = false;
    const needs = threshold(target, diff);
    let subline = p.luckSpent ? `Rolled ${two(res.value)}, spent ${p.luckSpent} Luck` : `Needed ${needs} or less`;
    if (p.kind === 'san' && p.reqId && res.loss != null) subline = `Lose ${res.loss} Sanity. Your Keeper applies it.`;
    sc.append(h('section', { class: 'card', 'aria-label': 'Roll result', style: 'margin-top:14px;display:flex;flex-direction:column;gap:12px' },
      h('div', { class: 'row', style: 'justify-content:space-between;align-items:flex-start' }, dice,
        !p.reqId ? h('button', { class: 'btn sm quiet', onclick: () => { p.res = null; p.pushed = false; p.luckSpent = 0; p.dmg = null; schedule(); } }, icon('sync', 16), 'Again') : null),
      h('div', { style: 'height:1px;background:var(--line)' }),
      h('div', { class: 'row', style: 'gap:14px', 'aria-live': 'polite' }, h('span', { class: 'result-num' }, p.luckSpent ? String(needs) : (res.value === 100 ? '100' : two(res.value))),
        h('div', { style: 'display:flex;flex-direction:column;gap:2px;min-width:0' }, h('b', { style: 'font-size:21px;color:' + (p.luckSpent ? 'var(--good)' : levelColour(res.lv)) }, lvName), h('span', { class: 'small muted' }, subline))),
      p.dmg ? h('div', { class: 'dash' }, h('b', null, `Damage ${p.dmg.total}`), h('div', { class: 'small muted' }, `${p.dmg.expr}: ${p.dmg.detail}`)) : null));
  }
  const ladder = h('section', { class: 'ladder', 'aria-label': 'Success levels', style: 'margin-top:12px' });
  const fifth = Math.floor(target / 5), half = Math.floor(target / 2), fum = target < 50 ? 96 : 100;
  const ranges = ['01', fifth >= 1 ? `${fifth} or less` : '–', half >= 1 ? `${half} or less` : '–', target >= 1 ? `${target} or less` : '–', target + 1 <= fum - 1 ? `${target + 1} to ${fum - 1}` : '–', fum === 100 ? '100' : '96 to 100'];
  const activeLv = res ? (p.luckSpent ? 3 : res.lv) : -1;
  LEVELS.forEach((l, i) => ladder.append(h('div', { class: i === activeLv ? 'on' : '' }, h('b', null, l), h('span', { class: 'small' }, ranges[i]), i === activeLv ? icon('check', 18, 3) : h('span', { style: 'width:18px' }))));
  sc.append(ladder);
  const out = [topBar(first(inv.name), goBack, '', null), sc];
  const foot = h('div', { class: 'footer' });
  if (!res) {
    const go = h('button', { class: 'btn primary block', style: 'min-height:56px;font-size:19px' }, icon('dice', 22), 'Roll');
    go.onclick = () => doRoll(p, inv, false);
    foot.append(go);
  } else {
    const pass = p.luckSpent ? true : passes(res.lv, diff);
    if (!pass && res.lv !== 5 && !p.pushed && !p.luckSpent && ['skill', 'char', 'weapon'].includes(p.kind)) {
      const cost = res.value - threshold(target, diff), canSpend = cost > 0 && cost <= (inv.luck || 0), canPush = p.kind !== 'weapon';
      if (canPush) foot.append(h('p', { class: 'note' }, 'To push, tell your Keeper how you try harder. If the pushed roll fails, something worse happens.'));
      foot.append(h('div', { class: 'row' },
        canSpend ? h('button', { class: 'btn primary grow', onclick: () => { patchInv(p.invId, { luck: (C.invs[p.invId].luck || 0) - cost }); p.luckSpent = cost; postRoll({ kind: 'note', invId: p.invId, label: 'Spent Luck on ' + p.label, value: cost }); schedule(); } }, `Spend ${cost} Luck`) : null,
        canPush ? h('button', { class: 'btn danger grow', onclick: () => doRoll(p, C.invs[p.invId], true) }, 'Push the roll') : null));
    } else if (p.kind === 'weapon' && pass && p.weapon && p.weapon.dmg && !p.dmg) {
      foot.append(h('button', { class: 'btn primary block', onclick: () => { p.dmg = rollDamage(p.weapon.dmg, C.invs[p.invId]); if (p.dmg) postRoll({ kind: 'dice', invId: p.invId, label: p.weapon.name + ' damage', value: p.dmg.total, text: p.dmg.detail }); else toast('That damage doesn’t look like dice.'); schedule(); } }, `Roll damage, ${p.weapon.dmg}`));
      if (res.lv <= 1) foot.append(h('p', { class: 'note' }, 'Extreme success: your Keeper may rule maximum damage, plus a damage roll for impaling weapons.'));
    } else if (p.kind === 'san' && !pass && !p.reqId) {
      foot.append(h('button', { class: 'btn danger block', onclick: () => { S.page = p.back || null; loseSan(p.invId); schedule(); } }, 'Lose Sanity'));
    } else if (pass && (p.kind === 'skill' || p.kind === 'weapon') && !p.luckSpent && !NO_TICK.includes(p.skill)) {
      foot.append(h('p', { class: 'note' }, `${p.skill} is ticked for improvement.`));
    } else if (p.luckSpent) foot.append(h('p', { class: 'note' }, 'Successes bought with Luck don’t earn an improvement tick.'));
    foot.append(h('button', { class: 'btn quiet block', onclick: goBack }, 'Done'));
  }
  if (!C.store.local && !ME.keeper) foot.append(h('p', { class: 'sync-note' }, icon('sync', 16), 'Your Keeper sees this roll as it happens'));
  out.push(foot);
  return out;
}
function doRoll(p, inv, pushed) {
  const target = rollTarget(p, inv), bp = p.kind === 'san' ? 0 : p.bp, r = rollD100(bp), lv = levelOf(r.value, target);
  const diff = (p.kind === 'san' || p.kind === 'luck') ? 'Regular' : p.diff, pass = passes(lv, diff);
  p.res = Object.assign(r, { target, lv, pass, diff }); p.pushed = !!pushed; p.luckSpent = 0; p.dmg = null; p.anim = true;
  const rec = { kind: p.kind, invId: p.invId, label: p.label, target, diff, bp, value: r.value, level: LEVELS[lv], pass, pushed: !!pushed };
  if (p.kind === 'san' && p.reqId) {
    const q = C.req || {}; let loss;
    if (lv === 5) loss = diceMax(q.fail || '1D6');
    else { const rr = rollDice(pass ? (q.succ || '1') : (q.fail || '1D6')); loss = rr ? Math.max(0, rr.total) : 0; }
    p.res.loss = loss; rec.reqId = p.reqId; rec.loss = loss;
  }
  postRoll(rec);
  if (pass && (p.kind === 'skill' || p.kind === 'weapon') && p.skill && !NO_TICK.includes(p.skill)) { const s = (inv.skills || {})[p.skill]; if (!s || !s.t) patchInv(p.invId, { skills: { [p.skill]: { t: true } } }); }
  try { if (navigator.vibrate) navigator.vibrate(18); } catch (e) { }
  schedule();
}
function rollDamage(dmg, inv) {
  const db = derived(inv).db, dbx = db === 'None' ? '' : db.replace('−', '-');
  const expr = String(dmg).toUpperCase().replace(/\s+/g, '').replace(/\+?DB/, dbx ? (dbx.startsWith('-') ? dbx : '+' + dbx.replace(/^\+/, '')) : '');
  const r = rollDice(expr); return r ? { total: Math.max(0, r.total), detail: r.detail, expr } : null;
}

/* ================= dice and the roll log ================= */
function diceTab(all, banner) {
  const sc = h('div', { class: 'scroll' }); if (banner) sc.append(banner);
  sc.append(h('h1', { class: 'title', style: 'margin-top:6px' }, all ? 'Rolls' : 'Dice'));
  sc.append(h('div', { class: 'grid4', style: 'margin-top:14px' }, ['D3', 'D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100'].map(d => h('button', { class: 'tile', style: 'min-height:56px;justify-content:center', 'aria-label': 'Roll 1' + d, onclick: () => quickDice('1' + d) }, h('b', null, d)))));
  const inp = bound('dice-expr', { placeholder: 'e.g. 2D6+1D4', autocomplete: 'off', 'aria-label': 'Dice to roll', style: 'text-transform:uppercase', enterkeyhint: 'go' });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') quickDice(inp.value); });
  sc.append(h('div', { class: 'row', style: 'margin-top:10px' }, inp, h('button', { class: 'btn primary', onclick: () => quickDice(inp.value) }, 'Roll')));
  if (S.dice) sc.append(h('div', { class: 'card', style: 'margin-top:12px', 'aria-live': 'polite' }, h('div', { class: 'row', style: 'gap:14px' }, h('span', { class: 'result-num' }, String(S.dice.total)),
    h('div', null, h('b', { style: 'font-size:19px' }, S.dice.expr), h('div', { class: 'small muted' }, S.dice.detail)))));
  sc.append(h('h2', { class: 'sec' }, all ? 'Everyone’s rolls' : 'Your recent rolls'));
  const rolls = C.rolls.filter(r => all || !C.store.local || r.invId === ME.invId);
  if (!rolls.length) sc.append(h('p', { class: 'empty' }, all ? 'Rolls from the investigators show up here as they happen.' : 'Your rolls show up here.'));
  rolls.slice(0, 60).forEach(r => sc.append(rollItem(r)));
  return sc;
}
function quickDice(expr) {
  const r = rollDice(expr);
  if (!r) { toast('Dice look like 1D6, 2D6+3 or 1D8+1D4.'); return; }
  S.dice = { expr: String(expr).toUpperCase().replace(/\s+/g, ''), total: r.total, detail: r.detail };
  postRoll({ kind: 'dice', invId: ME.invId, label: S.dice.expr, value: r.total, text: r.detail });
  schedule();
}
function rollItem(r) {
  let main, colour = 'var(--text)';
  if (r.kind === 'note') main = `${r.label}${r.value != null ? ' ' + r.value : ''}${r.text && r.text !== String(r.value) ? ' (' + r.text + ')' : ''}`;
  else if (r.kind === 'dice') main = `${r.label}: ${r.value}`;
  else {
    const lv = LEVELS.indexOf(r.level); colour = levelColour(lv);
    main = `${r.pushed ? 'Pushed ' : ''}${r.label} ${r.value === 100 ? '100' : two(r.value || 0)} against ${r.target}${r.diff && r.diff !== 'Regular' ? ' (' + r.diff + ')' : ''}`;
  }
  const extra = [];
  if (r.bp) extra.push(Math.abs(r.bp) + (r.bp > 0 ? ' bonus' : ' penalty') + (Math.abs(r.bp) > 1 ? ' dice' : ' die'));
  if (r.loss != null) extra.push('loses ' + r.loss + ' Sanity');
  if (r.kind === 'dice' && r.text) extra.push(r.text);
  return h('div', { class: 'kv', style: 'align-items:flex-start' }, h('div', { class: 'grow' }, h('b', null, r.name || ''), h('div', null, main, r.level && r.kind !== 'note' && r.kind !== 'dice' ? h('span', { style: 'color:' + colour + ';font-weight:700' }, ', ' + r.level.toLowerCase()) : null),
    extra.length ? h('div', { class: 'tiny muted' }, extra.join(' · ')) : null), h('span', { class: 'tiny muted', style: 'white-space:nowrap' }, ago(r.at)));
}

/* ================= handouts ================= */
const safeImg = s => typeof s === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,/.test(s) ? s : '';
function handoutRow(hd, onOpen, right) {
  const img = safeImg(hd.img);
  return h('div', { class: 'line-row', style: 'min-height:68px' },
    h('button', { class: 'main', onclick: onOpen }, img ? h('img', { class: 'thumb', src: img, alt: '' }) : h('span', { class: 'muted', style: 'width:48px;display:flex;justify-content:center' }, icon('doc', 24, 1.8)),
      h('span', { class: 'grow' }, h('b', { style: 'display:block;font-size:17px' }, hd.title || 'Untitled handout'), (hd.n || hd.where) ? h('span', { class: 'small muted' }, [hd.n ? 'Handout ' + hd.n : '', hd.where || ''].filter(Boolean).join(' · ')) : null)), right || null);
}
function readHandout(hd) {
  const img = safeImg(hd.img);
  openSheet(hd.title || 'Handout', () => {
    let pic = null;
    if (img) {
      const im = h('img', { class: 'handout-img', src: img, alt: hd.title ? 'Picture of ' + hd.title : 'Handout picture' });
      const box = h('div', { class: 'zoom-box' }, im);
      const zb = h('button', { class: 'btn sm quiet', 'aria-pressed': 'false' }, 'Zoom in');
      zb.onclick = () => { const on = box.classList.toggle('zoomed'); zb.setAttribute('aria-pressed', String(on)); zb.textContent = on ? 'Fit to screen' : 'Zoom in'; };
      im.onclick = () => zb.click();
      pic = [box, h('div', { class: 'row', style: 'justify-content:flex-end' }, zb)];
    }
    return h('div', { class: 'col' }, hd.where ? h('p', { class: 'note' }, 'Found: ' + hd.where) : null, pic,
      hd.text ? [img ? h('h3', { style: 'margin:6px 0 0;font-size:16px', class: 'muted' }, 'Transcript') : null, h('p', { class: 'prose type', style: 'font-size:17px' }, hd.text)] : null);
  }, { noFocus: true });
}
function playerHandouts(banner) {
  const sc = h('div', { class: 'scroll' }); if (banner) sc.append(banner);
  sc.append(h('h1', { class: 'title', style: 'margin-top:6px' }, 'Handouts'), h('p', { class: 'note', style: 'margin:6px 0 8px' }, 'Clues and papers your Keeper has shared with the investigators.'));
  const list = C.handouts.filter(x => x.shared);
  if (!list.length) sc.append(h('p', { class: 'empty' }, 'Nothing shared yet.'));
  list.forEach(hd => sc.append(handoutRow(hd, () => readHandout(hd))));
  return sc;
}
function keeperHandouts() {
  const sc = h('div', { class: 'scroll' }), list = C.handouts, shared = list.filter(x => x.shared).length;
  sc.append(h('h1', { class: 'title', style: 'margin-top:6px' }, 'Handouts'), h('p', { class: 'note', style: 'margin-top:4px' }, C.store.local ? 'Keep your clues here and show them when they’re found.' : 'Share one and it lands on every investigator’s phone.'));
  if (list.length) {
    const hidden = list.find(x => !x.shared);
    sc.append(h('section', { class: 'card', style: 'margin-top:12px;display:flex;flex-direction:column;gap:12px', 'aria-label': 'Handouts shared' },
      h('div', { class: 'row', style: 'justify-content:space-between;align-items:baseline' }, h('span', { class: 'type', style: 'font-size:36px;line-height:1;color:var(--acc)' }, `${shared} of ${list.length}`), h('span', { class: 'muted' }, 'shared so far')),
      h('div', { 'aria-hidden': 'true', style: `display:grid;grid-template-columns:repeat(${Math.min(list.length, 12)},minmax(0,1fr));gap:4px` }, list.slice(0, 12).map(x => h('div', { style: 'height:12px;border-radius:4px;border:1.5px solid ' + (x.shared ? 'var(--acc)' : 'var(--line)') + ';background:' + (x.shared ? 'var(--acc)' : 'transparent') }))),
      h('p', { class: 'small muted' }, hidden ? `Still hidden: ${hidden.title || 'untitled'}${list.length - shared > 1 ? ' and ' + (list.length - shared - 1) + ' more' : ''}.` : 'Every handout is with the investigators.')));
  }
  sc.append(h('h2', { class: 'sec' }, 'In this case'));
  if (!list.length) sc.append(h('p', { class: 'empty' }, 'No handouts yet. Photograph a prop or write one out.'));
  list.forEach(hd => sc.append(handoutRow(hd, () => editHandout(hd),
    h('button', { class: 'btn sm ' + (hd.shared ? 'good' : ''), style: 'min-width:92px;flex-shrink:0', 'aria-pressed': String(!!hd.shared), 'aria-label': hd.shared ? `${hd.title}, shared. Tap to take it back.` : `Share ${hd.title} with the investigators`,
      onclick: () => fire(C.store.set('handouts/' + hd.id, { shared: !hd.shared }, true)) }, hd.shared ? icon('check', 14, 3) : null, hd.shared ? 'Shared' : 'Share'))));
  const photo = h('button', { class: 'btn' }, icon('camera', 18), 'Photograph');
  photo.onclick = busyBtn(photo, async () => { const img = await pickImage(); if (img) editHandout(null, img); });
  sc.append(h('div', { class: 'grid2', style: 'margin-top:18px' }, photo, h('button', { class: 'btn primary', onclick: () => editHandout(null) }, icon('plus', 18), 'Write one')));
  return sc;
}
function pickImage() {
  return new Promise(res => {
    const inp = h('input', { type: 'file', accept: 'image/*', style: 'display:none' });
    inp.onchange = async () => { const f = inp.files[0]; inp.remove(); if (!f) return res(null); try { res(await shrinkImage(f)); } catch (e) { toast('Couldn’t read that picture.'); res(null); } };
    document.body.append(inp); inp.click();
  });
}
async function shrinkImage(file) {
  const url = URL.createObjectURL(file);
  const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
  let max = 1400, q = .8, out = '';
  for (let k = 0; k < 7; k++) {
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(img.naturalWidth * s)); cv.height = Math.max(1, Math.round(img.naturalHeight * s));
    const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
    out = cv.toDataURL('image/jpeg', q); if (out.length < 650000) break; max *= .8; q = Math.max(.5, q - .07);
  }
  URL.revokeObjectURL(url); return out;
}
function editHandout(hd, newImg) {
  const isNew = !hd; let img = newImg || (hd && safeImg(hd.img)) || '';
  openSheet(isNew ? 'New handout' : 'Edit handout', rec => {
    const f = (k, label, v, attrs = {}) => [h('label', { class: 'lbl', for: 'hd-' + k, style: 'margin-top:12px' }, label), h(attrs.tag || 'input', Object.assign({ class: 'in', id: 'hd-' + k, value: v || '' }, attrs, { tag: null }))];
    const pic = h('div', { style: 'margin-top:12px' });
    const drawPic = () => { pic.textContent = ''; if (img) add(pic, [h('img', { class: 'handout-img', src: img, alt: 'Handout picture' }), h('div', { class: 'row', style: 'margin-top:8px' }, h('button', { class: 'btn sm quiet', onclick: async () => { const x = await pickImage(); if (x) { img = x; drawPic(); } } }, 'Replace picture'), h('button', { class: 'btn sm danger', onclick: () => { img = ''; drawPic(); } }, 'Remove'))]); else pic.append(h('button', { class: 'btn sm quiet', onclick: async () => { const x = await pickImage(); if (x) { img = x; drawPic(); } } }, icon('camera', 16), 'Add a picture')); };
    drawPic();
    const shareBox = h('input', { type: 'checkbox', id: 'hd-shared', checked: hd ? !!hd.shared : false });
    const save = () => {
      const title = $('#hd-title').value.trim(), where = $('#hd-where').value.trim(), text = $('#hd-text').value.trim();
      if (!title && !text && !img) { toast('Add a title, some text or a picture.'); return; }
      const d = { title: title || 'Untitled handout', where, text, img, shared: shareBox.checked, at: hd ? hd.at || Date.now() : Date.now() };
      fire(C.store.set('handouts/' + (hd ? hd.id : nid()), d)); rec.close();
    };
    return h('div', null, f('title', 'Title', hd && hd.title, { maxlength: 80, placeholder: 'e.g. Letter from Josiah Pell' }), f('where', 'Where it’s found', hd && hd.where, { maxlength: 80, placeholder: 'e.g. Drawer in Pell’s study' }),
      f('text', 'Text', hd && hd.text, { tag: 'textarea', maxlength: 6000, placeholder: 'What the investigators read' }), pic,
      h('label', { class: 'check', style: 'margin-top:14px' }, shareBox, h('span', null, 'Shared with the investigators')),
      h('div', { class: 'acts' }, isNew ? h('button', { class: 'btn quiet', onclick: () => rec.close() }, 'Cancel') : h('button', { class: 'btn danger', onclick: async () => { if (await confirmSheet('Delete this handout?', 'It disappears for everyone.', 'Delete')) { fire(C.store.del('handouts/' + hd.id)); rec.close(); } } }, 'Delete'),
        h('button', { class: 'btn primary', onclick: save }, 'Save')));
  }, { noFocus: true });
}

/* ================= Sanity rolls called by the Keeper ================= */
function sanityBanner() {
  const q = C.req, inv = myInv();
  if (!q || !q.active || !inv || ME.keeper) return null;
  if (C.rolls.some(r => r.reqId === q.id && r.invId === ME.invId)) return null;
  return h('div', { class: 'banner', role: 'alert' }, icon('eye', 26, 1.8), h('div', { class: 'grow' }, h('b', null, 'Your Keeper calls for a Sanity roll'), h('div', { class: 'small muted' }, `${q.source || 'Something terrible'}. Loss ${q.succ}/${q.fail}.`)),
    h('button', { class: 'btn sm primary', onclick: () => openRoll({ invId: ME.invId, kind: 'san', label: 'Sanity', reqId: q.id }) }, 'Roll'));
}
function sanResultFor(id) {
  const s = S.san; if (!s) return null;
  if (s.results[id]) return s.results[id];
  const r = C.rolls.find(x => x.kind === 'san' && x.reqId === s.reqId && x.invId === id);
  return r ? { roll: r.value, lv: LEVELS.indexOf(r.level), pass: r.pass, loss: r.loss || 0, by: 'investigator' } : null;
}
function keeperSanRoll(inv, id) {
  const s = S.san, roll = rnd(100), lv = levelOf(roll, inv.san), pass = lv <= 3;
  let loss; if (lv === 5) loss = diceMax(s.fail); else { const r = rollDice(pass ? s.succ : s.fail); loss = r ? Math.max(0, r.total) : 0; }
  postRoll({ kind: 'san', invId: id, label: 'Sanity', target: inv.san, diff: 'Regular', bp: 0, value: roll, level: LEVELS[lv], pass, pushed: false, reqId: s.reqId, loss, by: 'keeper' });
  return { roll, lv, pass, loss, by: 'keeper' };
}
function keeperSanity() {
  const sc = h('div', { class: 'scroll' }), invs = invList();
  sc.append(h('h1', { class: 'title', style: 'margin-top:6px' }, 'Sanity roll'));
  if (!invs.length) { sc.append(h('p', { class: 'empty' }, 'Once there are investigators in the case, you can call for Sanity rolls here.')); return sc; }
  /* pick up a call that's still open, e.g. after the Keeper left the case and came back */
  if (!S.san && C.req && C.req.active && C.req.id && !C.store.local) S.san = { source: C.req.source || '', succ: C.req.succ || '1', fail: C.req.fail || '1D6', reqId: C.req.id, results: {}, appliedIds: Object.assign({}, C.req.applied || {}), notes: [] };
  if (!S.san) {
    if (S.form['san-succ'] == null) S.form['san-succ'] = '1';
    if (S.form['san-fail'] == null) S.form['san-fail'] = '1D6';
    const presets = (C.notes && C.notes.sanity) || [];
    if (presets.length) sc.append(h('p', { class: 'small muted', style: 'margin:12px 0 8px' }, 'From the scenario'), h('div', { class: 'row wrap', style: 'gap:8px' }, presets.map(x => h('button', { class: 'chip ok', style: 'font-weight:500;text-align:left', onclick: () => { S.form['san-source'] = x.source; S.form['san-succ'] = x.succ; S.form['san-fail'] = x.fail; schedule(); } }, `${x.source} ${x.succ}/${x.fail}`))));
    sc.append(h('label', { class: 'lbl', for: 'san-source', style: 'margin-top:14px' }, 'What did they see?'), bound('san-source', { placeholder: 'e.g. the thing in the drained pond', maxlength: 80 }),
      h('div', { class: 'grid2', style: 'margin-top:12px' }, h('div', null, h('label', { class: 'lbl', for: 'san-succ' }, 'Loss on a success'), bound('san-succ', { placeholder: '0 or 1', style: 'text-transform:uppercase' })),
        h('div', null, h('label', { class: 'lbl', for: 'san-fail' }, 'Loss on a failure'), bound('san-fail', { placeholder: '1D6', style: 'text-transform:uppercase' }))),
      h('p', { class: 'note', style: 'margin-top:8px' }, 'Written as 1/1D6: lose 1 on a success, 1D6 on a failure. A fumble loses the most the dice can give.'));
    const start = ask => {
      const succ = (S.form['san-succ'] || '0').toUpperCase().replace(/\s+/g, ''), fail = (S.form['san-fail'] || '').toUpperCase().replace(/\s+/g, '');
      if (!rollDice(succ) || !rollDice(fail)) { toast('Losses look like 0, 1, 1D4 or 1D6+1.'); return; }
      S.san = { source: (S.form['san-source'] || '').trim(), succ, fail, reqId: nid(10), results: {}, applied: false, appliedIds: {}, notes: [] };
      if (ask) fire(C.store.set('requests/current', { id: S.san.reqId, source: S.san.source, succ, fail, active: true, at: Date.now() }));
      else invs.forEach(i => S.san.results[i.id] = keeperSanRoll(i, i.id));
      schedule();
    };
    const acts = h('div', { class: 'col', style: 'margin-top:18px' });
    if (!C.store.local) acts.append(h('button', { class: 'btn primary block', onclick: () => start(true) }, 'Ask investigators to roll'));
    acts.append(h('button', { class: 'btn block ' + (C.store.local ? 'primary' : ''), onclick: () => start(false) }, 'Roll for everyone'));
    sc.append(acts);
    return sc;
  }
  const s = S.san;
  sc.append(h('section', { class: 'card row', style: 'margin-top:12px;gap:14px' }, h('span', { class: 'type', style: 'font-size:32px;line-height:1;color:var(--acc)' }, `${s.succ}/${s.fail}`),
    h('span', { class: 'small muted' }, s.source || 'Sanity roll')));
  let have = 0;
  invs.forEach(inv => {
    const res = sanResultFor(inv.id), d = derived(inv), done = s.appliedIds[inv.id];
    if (res) have++;
    const bout = res && res.loss >= 5, overLimit = res && !done && d.limit > 0 && (inv.lost || 0) + res.loss >= d.limit;
    const flagged = res && (bout || overLimit || (done && (inv.conds || []).some(c => /insanity/.test(c))));
    const chips = [];
    if (!res) chips.push(h('span', { class: 'pill muted' }, 'Waiting to roll'));
    else {
      chips.push(h('span', { class: 'pill ' + (bout ? '' : 'text') }, `−${res.loss} SAN`));
      if (bout) chips.push(h('span', { class: 'pill' }, '5+ lost: INT roll'));
      if (overLimit) chips.push(h('span', { class: 'pill' }, 'Past daily limit'));
      if (done) chips.push(h('span', { class: 'pill good' }, 'Applied'));
    }
    const line = !res ? `SAN ${inv.san} · lost ${inv.lost || 0} of ${d.limit} today` : done ? `SAN ${inv.san} · lost ${inv.lost || 0} of ${d.limit} today`
      : `Rolled ${two(res.roll)} against ${inv.san}: ${LEVELS[res.lv].toLowerCase()}${res.by === 'investigator' ? ', by them' : ''}`;
    sc.append(h('div', { class: 'row', style: `margin-top:8px;min-height:72px;padding:8px 10px;border-radius:14px;align-items:center;${flagged ? 'background:var(--surf);border:2px solid var(--bad)' : 'border:1px solid var(--div)'}` },
      h('span', { class: 'ring inv', style: 'width:46px;height:46px;font-size:19px;color:var(--text);' + (flagged ? 'border-color:var(--bad);box-shadow:none' : 'box-shadow:none') }, h('span', { class: 'sr' }, 'Sanity '), String(inv.san)),
      h('div', { class: 'grow', style: 'display:flex;flex-direction:column;gap:3px' }, h('b', { style: 'font-size:17px' }, inv.name), h('span', { class: 'small muted' }, line), h('div', { class: 'row wrap', style: 'gap:4px' }, chips)),
      !res ? h('button', { class: 'btn sm', onclick: () => { s.results[inv.id] = keeperSanRoll(inv, inv.id); schedule(); } }, 'Roll') : null));
  });
  if (s.notes.length) sc.append(h('div', { class: 'dash col', style: 'margin-top:14px' }, s.notes.map(n => h('p', { class: 'bad', style: 'font-size:15px' }, n))));
  const pending = invs.filter(i => sanResultFor(i.id) && !s.appliedIds[i.id]).length;
  const apply = () => {
    invs.forEach(i => { const r = sanResultFor(i.id); if (r && !s.appliedIds[i.id]) { s.notes.push(...applySanLoss(i.id, r.loss, `Sanity roll${s.source ? ': ' + s.source : ''}`, false)); s.appliedIds[i.id] = true; } });
    if (!C.store.local && C.req && C.req.id === s.reqId) fire(C.store.set('requests/current', { applied: s.appliedIds, active: !invs.every(i => s.appliedIds[i.id]) }, true));
    schedule();
  };
  const stop = () => { if (!C.store.local && C.req && C.req.active) fire(C.store.set('requests/current', { active: false }, true)); S.san = null; schedule(); };
  sc.append(h('p', { class: 'note', style: 'margin-top:14px' }, pending ? 'Nothing changes on their sheets until you apply.' : have ? 'All rolled losses are applied.' : 'Waiting for rolls.'),
    h('div', { class: 'row', style: 'margin-top:10px' }, h('button', { class: 'btn quiet grow', onclick: stop }, pending || !have ? 'Cancel' : 'Done'), h('button', { class: 'btn primary grow', disabled: !pending, onclick: apply }, 'Apply losses')));
  return sc;
}

/* ================= Keeper: the investigators ================= */
const SECRET = ['Psychology', 'Spot Hidden', 'Listen', 'Luck', 'POW', 'INT', 'Stealth', 'Sanity', 'Occult', 'Cthulhu Mythos'];
const secretTarget = (inv, k) => k === 'Luck' ? inv.luck : k === 'Sanity' ? inv.san : CHARS.includes(k) ? inv.ch[k] : skillVal(inv, k);
function keeperParty() {
  const sc = h('div', { class: 'scroll' }), invs = invList();
  sc.append(h('h1', { class: 'title', style: 'margin-top:6px' }, C.info.name || 'Case'),
    h('p', { class: 'muted', style: 'margin-top:4px' }, invs.length ? `${invs.length} investigator${invs.length === 1 ? '' : 's'}` + (C.store.local ? ', on this phone.' : '.') : (C.store.local ? 'On this phone.' : 'Waiting for investigators.')));
  if (invs.length) {
    if (!S.form['secret-skill']) S.form['secret-skill'] = 'Psychology';
    const sel = h('select', { class: 'in', id: 'secret-skill', 'aria-label': 'What to roll in secret', style: 'min-height:44px;font-size:16px' }, SECRET.map(s => h('option', { value: s, selected: S.form['secret-skill'] === s }, s)));
    sel.onchange = () => { S.form['secret-skill'] = sel.value; };
    sc.append(h('section', { class: 'dash', style: 'margin-top:14px', 'aria-label': 'Secret roll' },
      h('div', { class: 'row' }, h('span', { class: 'muted' }, icon('eyeoff', 24, 1.8)), h('div', { class: 'grow' }, h('b', null, 'Secret rolls'), h('div', { class: 'small muted' }, 'Only you see these results.'))),
      h('div', { class: 'row', style: 'margin-top:10px' }, sel, h('button', { class: 'btn sm', style: 'border-width:1.5px', onclick: () => { const k = S.form['secret-skill']; S.secret = { skill: k, rolls: {} }; invs.forEach(i => S.secret.rolls[i.id] = rnd(100)); schedule(); } }, 'Roll'))));
  }
  sc.append(h('h2', { class: 'sec' }, 'The investigators'));
  if (!invs.length) sc.append(h('p', { class: 'empty' }, C.store.local ? 'Add the investigators who are playing. Each one gets a full sheet.' : 'When players join with your case code and create their investigators, they appear here.'));
  invs.forEach(inv => {
    const d = derived(inv), pct = clamp(inv.hp / d.hpMax, 0, 1);
    let secret = null;
    if (S.secret && S.secret.rolls[inv.id] != null) { const r = S.secret.rolls[inv.id], t = secretTarget(inv, S.secret.skill), lv = levelOf(r, t);
      secret = h('div', { style: 'display:flex;flex-direction:column;align-items:flex-end;gap:1px;flex-shrink:0' }, h('span', { class: 'tiny muted' }, `${S.secret.skill} ${t}`), h('b', { style: 'font-size:15px;color:' + levelColour(lv) }, `${two(r)}, ${LEVELS[lv].toLowerCase()}`)); }
    sc.append(h('button', { class: 'card', style: 'width:100%;text-align:left;display:flex;flex-direction:column;gap:8px;color:var(--text);margin-top:8px', onclick: () => { S.page = { type: 'sheet', id: inv.id }; schedule(); } },
      h('div', { class: 'row', style: 'justify-content:space-between;align-items:flex-start' }, h('div', { style: 'min-width:0' }, h('b', { style: 'font-size:18px;display:block' }, inv.name), h('span', { class: 'small muted' }, inv.occupation || '')), secret),
      h('div', { class: 'row' }, h('b', { class: 'small', style: 'white-space:nowrap' }, `${inv.hp} / ${d.hpMax} HP`), h('div', { class: 'bar thin grow', 'aria-hidden': 'true' }, h('div', { style: `width:${pct * 100}%;background:${pct <= .5 ? 'var(--bad)' : 'var(--text)'}` }))),
      h('div', { class: 'row wrap small', style: 'gap:4px 14px' }, [['SAN', inv.san], ['Luck', inv.luck], ['MP', inv.mp]].map(([k, v]) => h('span', null, h('span', { class: 'muted' }, k + ' '), h('b', null, String(v)))),
        (inv.conds || []).map(c => h('span', { class: 'pill' }, c)))));
  });
  if (C.store.local) sc.append(h('button', { class: 'btn block', style: 'margin-top:16px', onclick: () => openCreate(nid()) }, icon('plus', 18), 'Add an investigator'));
  if (C.pregens.length) {
    sc.append(h('h2', { class: 'sec' }, 'Ready-made investigators'), h('p', { class: 'note', style: 'margin-bottom:8px' }, C.store.local ? 'Add the ones your players want to use.' : 'Players can pick one of these when they join.'));
    C.pregens.forEach(pg => sc.append(pregenCard(pg, C.store.local ? () => { const nv = invFromPregen(pg); nv.owner = ME.uid; nv.updated = Date.now(); fire(C.store.set('investigators/' + nid(), nv)); } : null, 'Add')));
  }
  else if (!invs.length && C.info.code) sc.append(h('button', { class: 'btn primary block', style: 'margin-top:12px', onclick: openCodeSheet }, icon('share', 18), 'Share the case code'));
  return sc;
}

/* ================= privacy and about ================= */
const PRIVACY_CONTACT = ''; /* put the email address people should use for privacy questions, e.g. 'casefile@example.com' */
function openLegal(which) {
  const P = t => h('p', { style: 'margin:0 0 10px;line-height:1.45' }, t), H = t => h('h3', { style: 'margin:16px 0 6px;font-size:17px' }, t);
  if (which === 'privacy') return openSheet('Privacy notice', () => h('div', null,
    P(`This copy of ${APP_NAME} is run privately by the person who set it up and shared it with you, using their own Firebase project. They are the data controller for what it stores.` + (PRIVACY_CONTACT ? ` Contact: ${PRIVACY_CONTACT}.` : ' Ask them if you have any privacy question.')),
    H('On this phone only'), P('If you don’t sign in, everything stays on your phone. Nothing is sent anywhere.'),
    H('With an account'), P('We keep your email address, the display name you choose, and an account ID. If you sign in with Google, Google confirms your email address to us.'),
    P('Inside a case we keep what you add: your investigator sheet, your rolls, and for Keepers the case name, handouts and pictures. Your Keeper can see your sheet and your rolls; other investigators can see your sheet.'),
    H('Where it’s kept'), P('Accounts and cases are stored with Google Firebase (Firebase Authentication and Cloud Firestore), under Google’s data processing terms, in the Firestore location chosen for this project. Data is encrypted in transit and at rest.'),
    H('Why'), P('To run the app you asked to use: signing you in and syncing your cases. There is no advertising, tracking or analytics, and nothing is sold or shared for marketing.'),
    H('How long'), P('Until you delete it. Leaving a case deletes your investigator and rolls there. Deleting a case removes it for everyone. Deleting your account removes everything you added. Google’s backups clear it later on their own schedule.'),
    H('Your rights'), P('You can see and download your data (Account, Download all my data), correct it in the app, and delete it (Account, Delete my account). Under UK GDPR you can also object, ask about your data, or complain to the Information Commissioner’s Office (ico.org.uk).'),
    H('Children'), P('You need to be 13 or older to make an account.')), { noFocus: true });
  return openSheet('About', () => h('div', null,
    h('p', { class: 'type', style: 'font-size:22px;margin:0 0 4px' }, APP_NAME), P(`Version ${APP_VERSION}. A companion for Call of Cthulhu 7th edition: investigator sheets, d100 rolls with bonus and penalty dice, Sanity, handouts and a Keeper’s view.`),
    H('Chaosium'), FAN_NOTICE ? P(FAN_NOTICE) : null,
    P('This is an unofficial fan-made tool, not made, endorsed or approved by Chaosium Inc. Call of Cthulhu is a registered trademark of Chaosium Inc. You need the Call of Cthulhu rules to play; find them at chaosium.com.'),
    H('Made with'), P('Firebase JavaScript SDK (Apache 2.0). Alegreya Sans (SIL Open Font License 1.1) and Special Elite (Apache 2.0) fonts.')), { noFocus: true });
}

/* ================= Android back button and start-up ================= */
window.cfBack = () => {
  if (SHEETS.length) { SHEETS[SHEETS.length - 1].close(); return true; }
  if (C && S.page) { S.page = S.page.type === 'roll' ? (S.page.back || null) : null; schedule(); return true; }
  if (C) { exitCase(); return true; }
  return false;
};
async function boot() {
  if (cloudConfigured()) {
    S.mode = pref.get('mode', '') === 'device' ? 'device' : 'cloud';
    try { await cloudInit(); } catch (e) { console.warn(e); S.mode = 'device'; toast('Couldn’t start sync, so this phone works on its own for now.', 4200); }
  } else S.mode = 'device';
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !/appassets\.androidplatform\.net$/.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => { });
  render();
}

/* ================= scenario packs ================= */
/* A pack is a JSON file (kind "pack") holding Keeper notes, handouts and ready-made investigators.
   Packs in web/packs/ (listed in packs/index.json) come with the app; others can be imported as files. See docs/PACKS.md. */
async function bundledPacks() {
  if (S.packs) return S.packs;
  try { const r = await fetch('packs/index.json', { cache: 'no-cache' }); S.packs = r.ok ? ((await r.json()).packs || []) : []; } catch (e) { S.packs = []; }
  return S.packs;
}
function checkPack(j) {
  if (!j || j.kind !== 'pack' || !j.id || !j.title) throw new Error('That file isn’t a scenario pack for ' + APP_NAME + '.');
  return j;
}
async function fetchPack(file) {
  const r = await fetch('packs/' + encodeURIComponent(file));
  if (!r.ok) throw new Error('Couldn’t open that pack.');
  return checkPack(await r.json());
}
function pickPackFile() {
  return new Promise(res => {
    const inp = h('input', { type: 'file', accept: 'application/json,.json', style: 'display:none' });
    inp.onchange = async () => {
      const f = inp.files[0]; inp.remove(); if (!f) return res(null);
      try { res(checkPack(JSON.parse(await f.text()))); } catch (e) { toast(e.message || 'That file isn’t a scenario pack.', 3600); res(null); }
    };
    document.body.append(inp); inp.click();
  });
}
const packId = s => String(s || 'pack').toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 40);
/* writes a pack into a case: Keeper notes, handouts (all hidden), ready-made investigators */
async function applyPack(store, pack, rename) {
  const id = packId(pack.id), t = Date.now(), base = { id, title: pack.title, version: pack.version || 1 };
  await store.set('', rename ? { name: pack.title, pack: base } : { pack: base }, true);
  await store.set('keeper/notes', { pack: base, title: pack.title, subtitle: pack.subtitle || '', meta: pack.meta || {}, warnings: pack.warnings || [],
    credits: pack.credits || '', licence: pack.licence || '', sections: pack.sections || [], sanity: pack.sanity || [] }, true);
  for (const [i, hd] of (pack.handouts || []).entries()) {
    await store.set('handouts/' + id + '-' + (i + 1), { title: hd.title || 'Handout ' + (i + 1), where: hd.where || '', text: hd.text || '', img: safeImg(hd.img), shared: false, at: t + i, pack: id, n: i + 1 });
  }
  for (const [i, pg] of (pack.investigators || []).entries()) {
    await store.set('pregens/' + id + '-' + (i + 1), Object.assign(clone(pg), { order: i + 1, pack: id }));
  }
}
function openPackPicker(onPick) {
  openSheet('Scenario packs', rec => {
    const list = h('div', { class: 'col' }, h('p', { class: 'empty' }, 'Loading…'));
    bundledPacks().then(ps => {
      list.textContent = '';
      if (!ps.length) list.append(h('p', { class: 'empty' }, 'No packs come with this copy of the app. Import a pack file instead.'));
      ps.forEach(x => {
        const b = h('button', { class: 'card', style: 'width:100%;text-align:left;color:var(--text);display:flex;flex-direction:column;gap:4px' },
          h('b', { class: 'type', style: 'font-size:21px;font-weight:400;color:var(--acc)' }, x.title), x.subtitle ? h('span', { class: 'small muted' }, x.subtitle) : null,
          h('span', { class: 'small' }, [x.players, x.length].filter(Boolean).join(' · ')));
        b.onclick = busyBtn(b, async () => { const pack = await fetchPack(x.file); rec.close(); await onPick(pack); });
        list.append(b);
      });
    });
    const imp = h('button', { class: 'btn quiet block' }, 'Import a pack file');
    imp.onclick = async () => { const pack = await pickPackFile(); if (pack) { rec.close(); await fire(onPick(pack)); } };
    return h('div', { class: 'col' }, h('p', { class: 'note' }, 'A pack sets up a ready-to-run case: Keeper notes, handouts that stay hidden until you share them, and ready-made investigators.'), list, imp);
  }, { noFocus: true });
}
async function startFromPack(pack) {
  if (!C && S.mode === 'cloud' && CLOUD.user) { await createCloudCase(pack.title, pack); if (C) { S.tab = 'notes'; schedule(); } return; }
  const id = await createDeviceCase(pack.title);
  await applyPack(LocalStore(id), pack, true);
  S.devCases = null; await openDeviceCase(id); S.tab = 'notes'; schedule();
}
function openNewCase() {
  openSheet('Open a new case', rec => {
    const blank = h('button', { class: 'btn primary block' }, 'Blank case');
    blank.onclick = busyBtn(blank, async () => {
      rec.close();
      const n = await askText('Name your case', '', { placeholder: 'e.g. The Hollow at Lantern Hill', ok: 'Open the case', max: 60 }); if (n == null) return;
      if (S.mode === 'cloud' && CLOUD.user) await createCloudCase(n || 'New case');
      else { const id = await createDeviceCase(n || 'New case'); S.devCases = null; await openDeviceCase(id); }
    });
    return h('div', { class: 'col' }, blank,
      h('button', { class: 'btn block', onclick: () => { rec.close(); openPackPicker(pack => startFromPack(pack)); } }, 'From a scenario pack'),
      h('p', { class: 'note' }, S.mode === 'cloud' && CLOUD.user ? 'You’ll be the Keeper. Investigators join with your case code.' : 'The case lives on this phone.'));
  }, { noFocus: true });
}

/* ---------- ready-made investigators ---------- */
function invFromPregen(pg) {
  const inv = newInvestigator({ name: pg.name, occupation: pg.occupation, age: pg.age, residence: pg.residence, ch: pg.ch || {}, luck: pg.luck });
  for (const k in (pg.skills || {})) inv.skills[k] = { v: clamp(num(pg.skills[k], 0), 0, 999), t: false };
  if (Array.isArray(pg.weapons) && pg.weapons.length) inv.weapons = clone(pg.weapons);
  ['gear', 'cash'].forEach(k => { if (pg[k]) inv[k] = String(pg[k]); });
  if (pg.story) inv.story = clone(pg.story);
  if (pg.notes) inv.notes = String(pg.notes);
  inv.pregen = pg.id;
  return inv;
}
function pregenCard(pg, onPick, label) {
  const taken = invList().some(i => i.pregen === pg.id);
  const status = taken ? (C.store.local ? 'Added' : 'Taken') : (onPick ? null : 'Not picked yet');
  return h('div', { class: 'card', style: 'margin-top:8px' },
    h('div', { class: 'row', style: 'justify-content:space-between;align-items:flex-start' },
      h('div', { style: 'min-width:0' }, h('b', { style: 'font-size:18px;display:block' }, pg.name), h('span', { class: 'small muted' }, [pg.occupation, pg.age].filter(Boolean).join(', '))),
      onPick && !taken ? h('button', { class: 'btn sm', onclick: onPick }, label) : h('span', { class: 'pill ' + (taken ? 'good' : 'muted'), style: 'flex-shrink:0' }, status)),
    pg.blurb ? h('p', { class: 'small', style: 'margin-top:6px' }, pg.blurb) : null);
}

/* ---------- the Keeper's notes ---------- */
function notesText(text) {
  const box = h('div', { class: 'notes-body' });
  String(text || '').split(/\n\s*\n/).forEach(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    let list = null;
    lines.forEach(l => {
      if (l.startsWith('### ')) { list = null; box.append(h('h3', null, l.slice(4))); }
      else if (l.startsWith('- ')) { if (!list) { list = h('ul'); box.append(list); } list.append(h('li', null, l.slice(2))); }
      else { list = null; box.append(h('p', null, l)); }
    });
  });
  return box;
}
function keeperNotes() {
  const sc = h('div', { class: 'scroll' }), n = C.notes || {};
  if (n.title) {
    const m = n.meta || {};
    sc.append(h('h1', { class: 'title', style: 'margin-top:6px' }, n.title), n.subtitle ? h('p', { class: 'muted', style: 'margin-top:4px' }, n.subtitle) : null,
      h('div', { class: 'card', style: 'margin-top:12px' }, [['Players', m.players], ['Length', m.length], ['Setting', m.era]].filter(x => x[1]).map(([k, v]) => h('div', { class: 'small', style: 'margin:2px 0' }, h('span', { class: 'muted' }, k + ': '), v))),
      (n.warnings || []).length ? h('div', { class: 'dash', style: 'margin-top:10px' }, h('b', { class: 'small' }, 'Content to check with your group'), h('p', { class: 'small muted', style: 'margin-top:4px' }, n.warnings.join(' · '))) : null);
    const secs = n.sections || [];
    sc.append(h('h2', { class: 'sec' }, 'Contents'), h('div', { class: 'col', style: 'gap:0' }, secs.map((s, i) => h('button', { class: 'linkish', style: 'text-align:left;min-height:40px', onclick: () => { const el = document.getElementById('sec-' + i); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }, s.title))));
    secs.forEach((s, i) => {
      sc.append(h('h2', { class: 'sec', id: 'sec-' + i, style: 'scroll-margin-top:8px' }, s.title), notesText(s.text));
      const hs = (s.share || []).map(k => C.handouts.find(x => x.id === (n.pack && n.pack.id) + '-' + k)).filter(Boolean);
      if (hs.length) sc.append(h('div', { class: 'card', style: 'margin:4px 0 8px' }, h('b', { class: 'small' }, 'Handouts for this part'),
        hs.map(hd => handoutRow(hd, () => readHandout(hd), h('button', { class: 'btn sm ' + (hd.shared ? 'good' : ''), style: 'min-width:92px;flex-shrink:0', 'aria-pressed': String(!!hd.shared), 'aria-label': hd.shared ? `${hd.title}, shared. Tap to take it back.` : `Share ${hd.title}`,
          onclick: () => fire(C.store.set('handouts/' + hd.id, { shared: !hd.shared }, true)) }, hd.shared ? icon('check', 14, 3) : null, hd.shared ? 'Shared' : 'Share')))));
      const ss = (s.sanity || []).map(k => (n.sanity || [])[k - 1]).filter(Boolean);
      if (ss.length) sc.append(h('div', { class: 'row wrap', style: 'gap:8px;margin:4px 0 8px' }, ss.map(x => h('button', { class: 'chip ok', style: 'font-weight:500;text-align:left', onclick: () => { S.form['san-source'] = x.source; S.form['san-succ'] = x.succ; S.form['san-fail'] = x.fail; S.san = null; S.tab = 'sanity'; schedule(); } }, icon('eye', 16, 2), `${x.source} ${x.succ}/${x.fail}`))));
    });
    if (n.credits || n.licence) sc.append(h('p', { class: 'tiny muted', style: 'margin-top:18px' }, n.credits || '', n.licence ? ` Licence: ${n.licence}.` : ''));
  } else {
    sc.append(h('h1', { class: 'title', style: 'margin-top:6px' }, 'Notes'), h('p', { class: 'note', style: 'margin-top:6px' }, 'Only you see this page. Keep your plans here, or add a scenario pack with notes, handouts and ready-made investigators.'),
      h('button', { class: 'btn block', style: 'margin-top:14px', onclick: () => openPackPicker(async pack => { await applyPack(C.store, pack, false); toast(pack.title + ' added.', 3000); }) }, 'Add a scenario pack'));
  }
  const own = n.own || '';
  sc.append(h('div', { class: 'row', style: 'justify-content:space-between;margin-top:22px' }, h('h2', { class: 'sec', style: 'margin:0' }, 'Your notes'),
    h('button', { class: 'linkish', onclick: async () => { const v = await askText('Your notes', own, { multiline: true, label: false, max: 20000 }); if (v != null) fire(C.store.set('keeper/notes', { own: v }, true)); } }, own ? 'Edit' : 'Add')),
    own ? h('p', { class: 'prose', style: 'margin-top:6px' }, own) : h('p', { class: 'small muted', style: 'margin-top:6px' }, 'Nothing yet.'));
  return sc;
}

boot();
