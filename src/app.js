'use strict';
/* BPN Gestion v2 — CRM + ERP de la conciergerie BPN.
   Sections : outils · état et stockage · capacités (IA, Gmail, photos, téléchargements) · sélecteurs · vues · fiches · actions. */

/* ---------- Outils ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pad = n => String(n).padStart(2, '0');
function TODAY() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function nowISO() { const d = new Date(); return TODAY() + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function parseISO(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d || 1); }
function addDays(iso, n) { const t = parseISO(iso); t.setDate(t.getDate() + n); return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()); }
function addMonths(ym, n) { let [y, m] = ym.split('-').map(Number); m += n; while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; } return y + '-' + pad(m); }
function daysBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
const DF = o => new Intl.DateTimeFormat('fr-FR', o);
const fmtDate = iso => iso ? DF({ weekday: 'short', day: 'numeric', month: 'short' }).format(parseISO(iso)) : '—';
const fmtDateFull = iso => iso ? DF({ day: 'numeric', month: 'long', year: 'numeric' }).format(parseISO(iso)) : '—';
const fmtLong = iso => DF({ weekday: 'long', day: 'numeric', month: 'long' }).format(parseISO(iso));
const fmtMonth = ym => DF({ month: 'long', year: 'numeric' }).format(parseISO(ym + '-01'));
const fmtMonthShort = ym => DF({ month: 'short' }).format(parseISO(ym + '-01'));
const eur = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);
const eur0 = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
const num1 = n => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(n || 0);
const r2 = n => Math.round(n * 100) / 100;
const clone = o => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));
const plural = (n, s, p) => n + ' ' + (n > 1 ? (p || s + 's') : s);
function setPath(o, path, v) { const ks = path.split('.'); let t = o; ks.slice(0, -1).forEach(k => { if (t[k] == null || typeof t[k] !== 'object') t[k] = {}; t = t[k]; }); t[ks[ks.length - 1]] = v; }
function getPrefRaw(k) { try { return localStorage.getItem('bpn-proto-' + k); } catch (e) { return null; } }
function setPref(k, v) { try { localStorage.setItem('bpn-proto-' + k, v); } catch (e) { /* stockage indisponible */ } }
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const I = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.8c1.9.7 3 2.5 3.5 5.2"/>',
  house: '<path d="M4 20V10l8-6 8 6v10z"/><circle cx="12" cy="13" r="2"/><path d="M12 15v3"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  team: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M8.5 10l1.5 1.5 3-3M8.5 16h7"/>',
  gear: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
  box: '<path d="M3 7.5l9-4 9 4v9l-9 4-9-4z"/><path d="M3 7.5l9 4 9-4M12 11.5v9"/>',
  car: '<path d="M4 15l1.6-5h12.8L20 15v4H4z"/><path d="M7 10l1.4-4h7.2L17 10"/><circle cx="8" cy="17" r="1"/><circle cx="16" cy="17" r="1"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  down: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  up: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
  send: '<path d="M4 12l16-8-6 16-2-6z"/><path d="M12 14l8-10"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>'
};
const ico = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const LOGO_SVG = '<svg viewBox="0 0 24 40" aria-hidden="true"><path d="M3 11.5L12 3l9 8.5V21H3z" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linejoin="miter"/><rect x="10.6" y="21" width="2.8" height="17.5" fill="currentColor"/><rect x="13.4" y="29.2" width="5.2" height="2.6" fill="currentColor"/><rect x="13.4" y="34.4" width="5.2" height="2.6" fill="currentColor"/><rect x="16" y="29.2" width="2.6" height="7.8" fill="currentColor"/></svg>';

/* ---------- Référentiels ---------- */
const TYPES = { studio: 'Studio', t2: 'T2', t3: 'T3', maison: 'Maison' };
const SIZE = t => (t === 'studio' || t === 't2') ? 'petit' : 'grand';
const STATUTS_M = { a_faire: 'À faire', en_cours: 'En cours', terminee: 'Terminée' };
const HIST_TYPES = { appel: 'Appel', email: 'E-mail', rdv: 'Rendez-vous', note: 'Note' };
const ORIGINES = ['Site web', 'Bouche-à-oreille', 'Prescripteur', 'Salon / événement', 'Démarchage', 'Autre'];
const RAISONS = ['Prix', 'Concurrent', 'Pas prêt', 'Logement non adapté', 'Pas de réponse', 'Autre'];
const NIVEAUX = { mineur: 'Mineur', important: 'Important', urgent: 'Urgent' };
const CATEGORIES = ['Fournitures', 'Communication', 'Déplacement', 'Logiciel', 'Autre'];
const PROFILES = { paul: { nom: 'Paul', role: 'Président · commercial' }, bedirhan: { nom: 'Bedirhan', role: 'Administration et finance' }, jade: { nom: 'Jade', role: 'Opérations' } };
const ASSOCIES = Object.keys(PROFILES);
const NAV = [['accueil', 'Accueil', 'home'], ['crm', 'CRM', 'users'], ['logements', 'Logements', 'house'], ['planning', 'Planning', 'cal'], ['factures', 'Factures', 'receipt'],
  ['rapports', 'Comptes rendus', 'doc'], ['stocks', 'Stocks', 'box'], ['frais', 'Frais et km', 'car'], ['concierges', 'Concierges', 'team'], ['assistant', 'Assistant IA', 'spark'], ['reglages', 'Réglages', 'gear']];
const VIEWS = NAV.map(n => n[0]).concat(['missions', 'proprio']);
/* Barème kilométrique 2026 (identique à 2025) : [≤ 5 000 km, (a × d) + b de 5 001 à 20 000 km, au-delà] */
const BAREME = { 3: [0.529, 0.316, 1065, 0.370], 4: [0.606, 0.340, 1330, 0.407], 5: [0.636, 0.357, 1395, 0.427], 6: [0.665, 0.374, 1457, 0.447], 7: [0.697, 0.394, 1515, 0.470] };
function indemnite(km, cv) { const b = BAREME[Math.min(7, Math.max(3, cv || 4))]; if (km <= 5000) return km * b[0]; if (km <= 20000) return km * b[1] + b[2]; return km * b[3]; }

/* ---------- État et stockage ---------- */
const COLS = ['contacts', 'logements', 'missions', 'concierges', 'factures', 'incidents', 'stocks', 'frais', 'concurrents', 'astreinte', 'rapports'];
const S = { settings: defaultSettings() };
COLS.forEach(c => { S[c] = {}; });
let MODE = 'loading';
let DB = null, ASSETS = null, DL = null, SAMPLE = null, MCP = null, USER = null, ME = null;
let dbNote = '';
let loadTimer = null;
let readOnly = false;
const PHOTO_CACHE = {};
const UI = {
  view: 'accueil', crmTab: 'pipeline', crmFilter: 'tous', q: '',
  weekStart: mondayOf(TODAY()), factMonth: TODAY().slice(0, 7), rapMonth: addMonths(TODAY().slice(0, 7), -1), fraisMonth: TODAY().slice(0, 7), fraisWho: 'tous',
  profile: getPrefRaw('profile') || 'paul', sheet: null
};
const CHAT = { turns: [], busy: false, ctl: null, err: '' };
function mondayOf(iso) { const d = parseISO(iso); return addDays(iso, -((d.getDay() + 6) % 7)); }

function mergeSettings(raw) {
  const d = defaultSettings();
  const s = Object.assign({}, d, clone(raw || {}));
  s.tarifSup = Object.assign({}, d.tarifSup, s.tarifSup || {});
  s.vehicules = Object.assign({}, d.vehicules, s.vehicules || {});
  ['formules', 'etapes', 'services', 'communes'].forEach(k => { if (!Array.isArray(s[k]) || !s[k].length) s[k] = d[k]; });
  if (typeof s.commission !== 'number') s.commission = d.commission;
  return s;
}
function loadData(data) {
  S.settings = mergeSettings(data.settings);
  COLS.forEach(c => { S[c] = {}; (data[c] || []).forEach(o => { S[c][o.id] = o; }); });
}
function dump() { const o = { settings: S.settings }; COLS.forEach(c => { o[c] = Object.values(S[c]); }); return o; }
function saveLocal() { try { localStorage.setItem('bpn-proto-data-v2', JSON.stringify(dump())); } catch (e) { /* stockage indisponible */ } }
function startLocal() {
  MODE = 'local';
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('bpn-proto-data-v2') || 'null'); } catch (e) { saved = null; }
  loadData(saved || bpnDemo(TODAY()));
  render();
}

const pending = {};
function persist(col, id) {
  if (MODE === 'local') { saveLocal(); return; }
  if (MODE !== 'db' || readOnly) return;
  const key = col + '/' + id;
  if (pending[key]) { pending[key].dirty = true; return; }
  pending[key] = { dirty: false };
  (async () => {
    do {
      pending[key].dirty = false;
      const obj = col === 'settings' ? S.settings : S[col][id];
      const ref = col === 'settings' ? DB.doc('config/settings') : DB.collection(col).doc(id);
      try {
        if (obj === undefined) await ref.delete();
        else await ref.set(JSON.parse(JSON.stringify(obj)));
      } catch (e) { onWriteError(e); break; }
    } while (pending[key].dirty);
    delete pending[key];
  })();
}
function onWriteError(e) {
  const code = e && e.code;
  if (code === 'invalid_argument') { readOnly = true; toast('Modification non enregistrée : vous êtes en lecture seule.'); render(); }
  else if (code === 'quota_exceeded') toast('Base pleine : supprimez des éléments pour continuer.');
  else toast('Modification non enregistrée, réessayez dans un instant.');
}
function put(col, obj) { S[col] = Object.assign({}, S[col], { [obj.id]: obj }); persist(col, obj.id); scheduleRender(); }
function edit(col, id, fn) { const cur = S[col][id]; if (!cur) return; const o = clone(cur); fn(o); put(col, o); }
function upsert(col, id, base, fn) { const o = S[col][id] ? clone(S[col][id]) : Object.assign({ id }, base); fn(o); put(col, o); }
function del(col, id) { const n = Object.assign({}, S[col]); delete n[id]; S[col] = n; persist(col, id); scheduleRender(); }
function editSettings(fn) { const s = clone(S.settings); fn(s); S.settings = s; persist('settings', 'main'); scheduleRender(); }

async function boot() {
  const h = location.hash.slice(1);
  if (VIEWS.includes(h)) UI.view = h;
  render();
  const C = (window.claude && typeof window.claude.use === 'function') ? window.claude : null;
  if (!C) { startLocal(); return; }
  const use = n => Promise.resolve().then(() => C.use(n)).catch(() => null);
  use('assets').then(a => { ASSETS = a; scheduleRender(); });
  use('downloads').then(d => { DL = d; scheduleRender(); });
  use('sample').then(s => { SAMPLE = s; scheduleRender(); });
  use('mcp').then(m => { MCP = m; scheduleRender(); });
  use('user').then(async u => {
    USER = u; if (!u) return;
    try { ME = await u.me(); } catch (e) { ME = null; }
    const first = norm((ME && ME.name) || '').split(/\s+/)[0];
    if (!getPrefRaw('profile') && PROFILES[first]) { UI.profile = first; setPref('profile', first); }
    scheduleRender();
  });
  const db = await use('db');
  if (!db) { startLocal(); return; }
  DB = db; MODE = 'db';
  loadTimer = setTimeout(() => { dbNote = 'Les données ne répondent pas pour l’instant : elles s’afficheront dès que la connexion revient.'; render(); }, 10000);
  const confirmed = new Set();
  const mark = (k, meta) => { if (meta && meta.fromCache) return; confirmed.add(k); if (confirmed.size === COLS.length + 1) { clearTimeout(loadTimer); dbNote = ''; } };
  const onErr = e => { clearTimeout(loadTimer); dbNote = (e && e.code === 'revoked') ? 'L’accès aux données a été retiré.' : 'Une partie des données n’a pas pu être chargée.'; render(); };
  COLS.forEach(col => {
    DB.collection(col).onSnapshot(snap => {
      const o = {};
      snap.docs.forEach(d => { o[d.id] = Object.assign({}, d.data(), { id: d.id }); });
      S[col] = o; mark(col, snap.metadata); scheduleRender();
    }, onErr);
  });
  DB.doc('config/settings').onSnapshot(snap => {
    S.settings = snap.exists ? mergeSettings(snap.data()) : defaultSettings();
    mark('settings', snap.metadata); scheduleRender();
  }, onErr);
}

/* ---------- Capacités : téléchargements, IA, Gmail, photos ---------- */
const canDownload = () => !!DL || MODE === 'local';
async function saveFile(filename, data, mime) {
  if (DL) {
    try { await DL.save({ filename, data }); }
    catch (e) { if (e && e.code === 'declined') return; toast(e && e.code === 'rate_limited' ? 'Un téléchargement est déjà en cours.' : 'Téléchargement impossible ici.'); }
    return;
  }
  try {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (e) { toast('Téléchargement impossible ici.'); }
}
function csv(rows) { return '﻿' + rows.map(r => r.map(v => { const s = typeof v === 'number' ? String(r2(v)).replace('.', ',') : String(v ?? ''); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n'); }
function b64(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
function sampleErr(e) {
  const c = e && e.code;
  if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(c)) { SAMPLE = null; scheduleRender(); return 'L’assistant IA n’est pas disponible sur cette page.'; }
  if (c === 'cancelled') return '';
  if (c === 'rate_limited') return 'Trop de demandes pour le moment, réessayez dans un instant.';
  if (c === 'refused') return 'L’IA a refusé cette demande, reformulez-la.';
  if (c === 'session_expired') return 'Reconnectez-vous à Claude pour utiliser l’IA.';
  if (c === 'invalid_json') return 'La réponse de l’IA était illisible, réessayez.';
  return 'L’IA n’a pas pu répondre, réessayez.';
}
function mcpErr(e) {
  switch (e && e.code) {
    case 'server_not_connected': return 'Gmail n’est pas connecté : ajoutez-le dans claude.ai, Réglages › Connecteurs.';
    case 'needs_reauth': return 'Reconnectez Gmail dans claude.ai, Réglages › Connecteurs.';
    case 'not_in_manifest': return 'Gmail n’est pas autorisé pour cette page.';
    case 'approval_required': return 'La création du brouillon attend votre autorisation : réessayez et acceptez la demande.';
    case 'blocked_by_policy': return 'Votre organisation bloque cette action.';
    case 'selection_required': return 'Choisissez le compte Gmail à utiliser dans claude.ai.';
    case 'tool_error': return 'Gmail a refusé le brouillon. Vérifiez l’adresse du destinataire.';
    case 'not_granted': case 'capability_disabled': case 'capability_removed': return 'Gmail n’est pas disponible sur cette page.';
    default: return 'Le brouillon n’a pas pu être confirmé : regardez dans vos brouillons Gmail avant de réessayer.';
  }
}
async function shrink(file) {
  try {
    const bmp = await createImageBitmap(file); const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', 0.82));
  } catch (e) { return file; }
}

/* ---------- Sélecteurs ---------- */
const list = col => Object.values(S[col]);
const fullName = c => c ? ((c.prenom || '') + ' ' + (c.nom || '')).trim() || 'Sans nom' : '—';
const formuleOf = l => S.settings.formules.find(f => f.id === l?.contrat?.formuleId) || S.settings.formules[0];
const actifs = () => list('logements').filter(l => l.contrat?.statut === 'actif');
const tarifSup = l => S.settings.tarifSup[SIZE(l.type)] || 0;
const tarifConc = (c, l) => (c && c.tarif && c.tarif[SIZE(l.type)]) || 0;
const rotations = (lid, ym, onlyDone) => list('missions').filter(m => m.logementId === lid && m.type === 'rotation' && m.date.startsWith(ym) && (!onlyDone || m.statut === 'terminee'));
const etapeNom = id => (S.settings.etapes.find(e => e.id === id) || { nom: id || '—' }).nom;
const isOpenProspect = c => !['signe', 'perdu'].includes(c.etape);
const isConcierge = () => UI.profile.startsWith('c:');
const isOwner = () => UI.profile.startsWith('o:');
const isAssocie = () => !isConcierge() && !isOwner();
const myConcierge = () => S.concierges[UI.profile.slice(2)];
const myOwner = () => S.contacts[UI.profile.slice(2)];
function profileName() { if (isConcierge()) return myConcierge()?.prenom || 'Concierge'; if (isOwner()) return myOwner()?.prenom || 'Propriétaire'; return (PROFILES[UI.profile] || PROFILES.paul).nom; }
function profileRole() { if (isConcierge()) return 'Concierge'; if (isOwner()) return 'Espace propriétaire'; return (PROFILES[UI.profile] || PROFILES.paul).role; }
function relancesDues() { const t = TODAY(); return list('contacts').filter(c => isOpenProspect(c) && c.relance && c.relance <= t).sort((a, b) => a.relance.localeCompare(b.relance)); }
function openIncidentFor(mid) { return list('incidents').find(i => i.missionId === mid && i.statut === 'ouvert'); }
function factStatut(f) { if (f.type === 'avoir') return 'avoir'; if (f.statut === 'payee') return 'payee'; if (f.statut === 'annulee') return 'annulee'; return f.echeance < TODAY() ? 'retard' : 'attente'; }
const FACT_LABEL = { payee: ['Payée', 'ok'], attente: ['En attente', 'info'], retard: ['En retard', 'crit'], annulee: ['Annulée', ''], avoir: ['Avoir', ''] };
function dateState(date, warnDays) {
  if (!date) return { cls: 'warn', txt: 'à renseigner', days: null };
  const d = daysBetween(TODAY(), date);
  if (d < 0) return { cls: 'crit', txt: 'expiré le ' + fmtDateFull(date), days: d };
  if (d <= warnDays) return { cls: 'warn', txt: 'expire dans ' + d + ' j', days: d };
  return { cls: 'ok', txt: 'valable jusqu’au ' + fmtDateFull(date), days: d };
}
function alertes() {
  const out = [];
  list('concierges').filter(c => c.actif !== false).forEach(c => {
    [['urssaf', 'Attestation URSSAF'], ['rcpro', 'Assurance RC pro']].forEach(([k, lab]) => {
      const st = dateState(c.docs?.[k], 30);
      if (st.cls !== 'ok') out.push({ cls: st.cls === 'crit' ? 'crit' : 'warn', titre: lab + ' ' + (st.cls === 'crit' ? 'expirée' : st.days == null ? 'à fournir' : 'à renouveler'), meta: fullName(c) + ' · ' + st.txt, act: 'openConcierge', id: c.id });
    });
  });
  actifs().forEach(l => {
    if (!l.conformite?.enregistrement) out.push({ cls: 'warn', titre: 'Numéro d’enregistrement manquant', meta: l.nom + ' · ' + l.commune, act: 'openLogement', id: l.id });
    [['classement', 'Classement meublé de tourisme'], ['dpe', 'DPE'], ['assurance', 'Assurance du logement']].forEach(([k, lab]) => {
      const st = dateState(l.conformite?.[k], 60);
      if (st.cls !== 'ok' && st.days != null) out.push({ cls: st.cls, titre: lab + (st.cls === 'crit' ? ' expiré' : ' à renouveler'), meta: l.nom + ' · ' + st.txt, act: 'openLogement', id: l.id });
    });
  });
  return out;
}
function suggestConcierge(l) { return list('concierges').find(c => c.actif !== false && (c.zone || []).includes(l?.commune)); }
function stocksBas() { return list('stocks').filter(s => s.quantite <= s.seuil).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')); }
function astreinteOf(ws) { const doc = S.astreinte[ws]; if (doc && PROFILES[doc.associe]) return doc.associe; const i = Math.floor(daysBetween('2026-01-05', ws) / 7); return ASSOCIES[((i % 3) + 3) % 3]; }
function rapportsAEnvoyer(ym) { return actifs().filter(l => (l.contrat.debut || '') <= ym + '-31' && !(S.rapports[l.id + '_' + ym] || {}).envoyeLe); }
function toBill(ym) { const end = ym + '-31'; return actifs().filter(l => (l.contrat.debut || '') <= end && !list('factures').some(f => f.logementId === l.id && f.mois === ym && f.type !== 'avoir' && f.statut !== 'annulee')); }
function invoiceLines(l, ym) {
  const f = formuleOf(l); const prev = addMonths(ym, -1);
  const lines = [{ libelle: 'Abonnement ' + f.nom + ' – ' + fmtMonth(ym), qte: 1, pu: f.prix }];
  const done = rotations(l.id, prev, true).length; const extra = Math.max(0, done - f.quota);
  if (extra) lines.push({ libelle: 'Rotations supplémentaires ' + fmtMonth(prev) + ' (' + done + ' faites, ' + f.quota + ' incluses)', qte: extra, pu: tarifSup(l) });
  list('missions').filter(m => m.logementId === l.id && m.type === 'service' && m.statut === 'terminee' && m.date.startsWith(prev)).sort((a, b) => a.date.localeCompare(b.date))
    .forEach(m => lines.push({ libelle: (m.libelle || 'Service à la carte') + ' – ' + fmtDate(m.date), qte: 1, pu: m.prix || 0 }));
  return lines;
}
function nextNumero(year, offset = 0) {
  const re = new RegExp('^BPN-' + year + '-(\\d+)$'); let max = 0;
  list('factures').forEach(f => { const m = re.exec(f.numero || ''); if (m) max = Math.max(max, +m[1]); });
  return 'BPN-' + year + '-' + String(max + 1 + offset).padStart(4, '0');
}
function rapportStats(lid, ym) {
  const l = S.logements[lid]; const f = formuleOf(l);
  const ms = list('missions').filter(m => m.logementId === lid && m.date.startsWith(ym)).sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  const rot = ms.filter(m => m.type === 'rotation');
  const faites = rot.filter(m => m.statut === 'terminee').length;
  const enPlus = Math.max(0, faites - f.quota);
  const services = ms.filter(m => m.type === 'service' && m.statut === 'terminee');
  const incidents = list('incidents').filter(i => i.logementId === lid && i.date.startsWith(ym)).sort((a, b) => a.date.localeCompare(b.date));
  const montants = [['Abonnement ' + f.nom + ' – ' + fmtMonth(ym), eur(f.prix)]];
  if (enPlus) montants.push(['Rotations en plus (' + enPlus + ' × ' + eur0(tarifSup(l)) + '), facturées en ' + fmtMonth(addMonths(ym, 1)), eur(enPlus * tarifSup(l))]);
  services.forEach(s => montants.push([(s.libelle || 'Service') + ' – ' + fmtDate(s.date), eur(s.prix)]));
  const missions = ms.map(m => ({ date: m.date, libelle: m.type === 'service' ? (m.libelle || 'Service') : 'Rotation complète', qui: S.concierges[m.conciergeId]?.prenom || '', statut: m.statut === 'terminee' ? 'Faite' : m.statut === 'en_cours' ? 'En cours' : 'Prévue' }));
  return { faites, aVenir: rot.length - faites, quota: f.quota, enPlus, services, incidents, montants, missions };
}
function facturePDF(f) { const st = factStatut(f); return invoicePDF({ f, client: fullName(S.contacts[f.proprietaireId]), logement: S.logements[f.logementId], statut: f.type === 'avoir' ? null : { label: FACT_LABEL[st][0] + (st === 'payee' && f.payeeLe ? ' le ' + fmtDateFull(f.payeeLe) : ''), tone: FACT_LABEL[st][1] } }); }
function rapportPDFOf(lid, ym) { const l = S.logements[lid]; return rapportPDF({ logement: { nom: l.nom, type: TYPES[l.type], commune: l.commune }, proprietaire: fullName(S.contacts[l.proprietaireId]), ym, stats: rapportStats(lid, ym), mot: (S.rapports[lid + '_' + ym] || {}).mot || '' }); }
function slug(s) { return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

/* ---------- Rendu ---------- */
let rq = false;
function scheduleRender() { if (rq) return; rq = true; requestAnimationFrame(() => { rq = false; render(); }); }
function render() {
  if (isConcierge() && !['missions', 'reglages'].includes(UI.view)) UI.view = 'missions';
  if (isOwner() && !['proprio', 'reglages'].includes(UI.view)) UI.view = 'proprio';
  if (isAssocie() && ['missions', 'proprio'].includes(UI.view)) UI.view = 'accueil';
  if (UI.view === 'assistant' && CHAT.busy && $('#chat-live')) return; /* ne pas casser la réponse en cours */
  const keep = {};
  document.querySelectorAll('[data-keep-scroll]').forEach(el => { keep[el.id] = el.scrollLeft; });
  $('#topbar-title').textContent = viewTitle();
  $('#avatar').innerHTML = `<span class="dot">${esc(profileName().slice(0, 1))}</span><span>${esc(profileName())}</span>`;
  $('#nav').innerHTML = navHTML();
  $('#nav').classList.toggle('few', !isAssocie());
  $('#main').innerHTML = MODE === 'loading' ? `<div class="empty">Chargement des données…</div>` : (VIEW_FN[UI.view] || vAccueil)();
  Object.keys(keep).forEach(id => { const el = document.getElementById(id); if (el) el.scrollLeft = keep[id]; });
}
function viewTitle() { if (UI.view === 'missions') return 'Mes missions'; if (UI.view === 'proprio') return 'Espace propriétaire'; const n = NAV.find(x => x[0] === UI.view); return n ? n[1] : ''; }
function navHTML() {
  if (isConcierge()) return `<a class="tab" href="#missions" aria-current="${UI.view === 'missions' ? 'page' : 'false'}">${ico('team')}<span>Mes missions</span></a><button class="tab" type="button" data-act="openMenu">${ico('more')}<span>Profil</span></button>`;
  if (isOwner()) return `<a class="tab" href="#proprio" aria-current="${UI.view === 'proprio' ? 'page' : 'false'}">${ico('house')}<span>Mon espace</span></a><button class="tab" type="button" data-act="openMenu">${ico('more')}<span>Profil</span></button>`;
  return NAV.map(([v, lab, ic], i) => `<a class="tab${i >= 5 ? ' secondary' : ''}" href="#${v}" aria-current="${UI.view === v ? 'page' : 'false'}">${ico(ic)}<span>${lab}</span></a>`).join('') + `<button class="tab more" type="button" data-act="openMenu">${ico('more')}<span>Plus</span></button>`;
}
function modeBanner() {
  if (MODE === 'local') return `<div class="banner">Mode démo : données d'exemple, vos modifications restent sur cet appareil.</div>`;
  if (dbNote) return `<div class="banner warn">${esc(dbNote)}</div>`;
  if (readOnly) return `<div class="banner warn">Lecture seule : vous pouvez consulter mais pas modifier.</div>`;
  return '';
}
function pill(txt, cls = '') { return `<span class="pill ${cls}">${esc(txt)}</span>`; }
function relancePill(c) {
  if (!isOpenProspect(c) || !c.relance) return '';
  const d = daysBetween(TODAY(), c.relance);
  if (d < 0) return pill('Relance en retard de ' + (-d) + ' j', 'crit');
  if (d === 0) return pill('Relance aujourd’hui', 'warn');
  return pill('Relance ' + fmtDate(c.relance));
}
function stagePill(c) { if (c.etape === 'signe') return pill(etapeNom('signe'), 'ok'); if (c.etape === 'perdu') return pill(etapeNom('perdu') + (c.perduRaison ? ' · ' + c.perduRaison : '')); return pill(etapeNom(c.etape), 'brand'); }
function statutPill(m) { if (openIncidentFor(m.id)) return pill('Problème signalé', 'crit'); const cls = { a_faire: '', en_cours: 'info', terminee: 'ok' }[m.statut] || ''; return pill(STATUTS_M[m.statut] || m.statut, cls); }
function factPill(f) { const [t, c] = FACT_LABEL[factStatut(f)]; return pill(t, c); }
function emptyBox(txt, btn) { return `<div class="empty"><p>${txt}</p>${btn || ''}</div>`; }
function opts(arr, val) { return arr.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(val ?? '') ? ' selected' : ''}>${esc(l)}</option>`).join(''); }
function fid(col, id, path) { return ('f-' + col + '-' + id + '-' + path).replace(/[^\w-]/g, '_'); }
function fld(label, inner, cls = '') { return `<label class="fld ${cls}"><span>${label}</span>${inner}</label>`; }
function inp(col, id, path, val, type = 'text', extra = '') { return `<input id="${fid(col, id, path)}" type="${type}" value="${esc(val ?? '')}" data-chg="f" data-col="${col}" data-id="${id}" data-path="${path}" data-kind="${type === 'number' ? 'num' : 'text'}" ${extra}>`; }
function area(col, id, path, val, extra = '') { return `<textarea id="${fid(col, id, path)}" data-chg="f" data-col="${col}" data-id="${id}" data-path="${path}" data-kind="text" ${extra}>${esc(val ?? '')}</textarea>`; }
function sel(col, id, path, val, options, extra = '') { return `<select id="${fid(col, id, path)}" data-chg="f" data-col="${col}" data-id="${id}" data-path="${path}" data-kind="text" ${extra}>${opts(options, val)}</select>`; }
function chk(col, id, path, val, label) { return `<label class="chk"><input id="${fid(col, id, path)}" type="checkbox" ${val ? 'checked' : ''} data-chg="f" data-col="${col}" data-id="${id}" data-path="${path}" data-kind="bool"><span>${label}</span></label>`; }
function sset(path, val, type = 'number', label = '', extra = '') { return `<input id="s-${path.replace(/\./g, '-')}" type="${type}" value="${esc(val ?? '')}" data-chg="f" data-col="settings" data-path="${path}" data-kind="${type === 'number' ? 'num' : 'text'}" aria-label="${esc(label)}" ${extra}>`; }
function confirmBtn(key, label, question, act, attrs) {
  if (UI.sheet && UI.sheet.armed === key) return `<div class="confirm"><span>${question}</span><button class="btn danger sm" type="button" data-act="${act}" ${attrs}>Confirmer</button><button class="btn ghost sm" type="button" data-act="disarm">Annuler</button></div>`;
  return `<button class="btn ghost danger-text" type="button" data-act="arm" data-key="${key}">${label}</button>`;
}
const communeOpts = () => S.settings.communes.map(c => [c, c]);
const typeOpts = () => Object.entries(TYPES);
const concOpts = (val, empty = '— À attribuer —') => [['', empty]].concat(list('concierges').filter(c => c.actif !== false).map(c => [c.id, fullName(c)]));
const associeOpts = () => ASSOCIES.map(k => [k, PROFILES[k].nom]);
function head(title, sub, actions) { return `<div class="view-head"><div><h1 class="h1">${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${actions ? `<div class="row">${actions}</div>` : ''}</div>`; }
function monthNav(ym, act) { return `<div class="weeknav"><button class="icon-btn" data-act="${act}" data-d="-1" aria-label="Mois précédent">${ico('left')}</button><span class="label" style="text-transform:capitalize">${esc(fmtMonth(ym))}</span><button class="icon-btn" data-act="${act}" data-d="1" aria-label="Mois suivant">${ico('right')}</button></div>`; }
const aiBtn = (act, label, attrs = '') => SAMPLE ? `<button class="btn ai-btn" data-act="${act}" ${attrs}>${ico('spark')}${label}</button>` : '';

/* ---------- Vue : Accueil ---------- */
function tile(label, value, foot, view, cls = '') { return `<a class="tile ${cls}" href="#${view}"><span class="tile-label">${label}</span><span class="tile-value">${value}</span><span class="tile-foot">${foot}</span></a>`; }
function vAccueil() {
  const t = TODAY(), m = t.slice(0, 7);
  const act = actifs();
  if (MODE === 'db' && !dbNote && !list('contacts').length && !act.length) {
    return modeBanner() + head('Bonjour ' + esc(profileName())) + emptyBox('Aucune donnée pour l’instant. Commencez par ajouter un premier prospect.', `<button class="btn primary" data-act="newContact">${ico('plus')}Ajouter un prospect</button>`);
  }
  const mrr = act.reduce((s, l) => s + formuleOf(l).prix, 0);
  const rotM = list('missions').filter(x => x.type === 'rotation' && x.date.startsWith(m));
  const doneM = rotM.filter(x => x.statut === 'terminee').length;
  const extraM = act.reduce((s, l) => s + Math.max(0, rotations(l.id, m, true).length - formuleOf(l).quota), 0);
  const retard = list('factures').filter(f => factStatut(f) === 'retard');
  const prospects = list('contacts').filter(isOpenProspect).length;
  const todo = [];
  relancesDues().forEach(c => { const d = daysBetween(c.relance, t); todo.push({ cls: d > 0 ? 'crit' : 'warn', titre: 'Relancer ' + fullName(c), meta: etapeNom(c.etape) + ' · ' + (d > 0 ? 'prévu il y a ' + d + ' j' : 'prévu aujourd’hui'), act: 'openContact', id: c.id }); });
  list('missions').filter(x => !x.conciergeId && x.statut !== 'terminee' && x.date >= t && x.date <= addDays(t, 7)).sort((a, b) => a.date.localeCompare(b.date)).forEach(x => {
    const l = S.logements[x.logementId]; todo.push({ cls: x.date <= addDays(t, 1) ? 'crit' : 'warn', titre: 'Attribuer un concierge', meta: (l?.nom || '?') + ' · ' + fmtDate(x.date) + ' ' + (x.heure || ''), act: 'openMission', id: x.id });
  });
  list('incidents').filter(i => i.statut === 'ouvert').forEach(i => { const l = S.logements[i.logementId]; todo.push({ cls: i.niveau === 'mineur' ? 'warn' : 'crit', titre: 'Incident : ' + i.texte, meta: (l?.nom || '?') + ' · ' + NIVEAUX[i.niveau], act: 'openLogement', id: i.logementId }); });
  retard.forEach(f => todo.push({ cls: 'crit', titre: 'Facture ' + f.numero + ' en retard', meta: fullName(S.contacts[f.proprietaireId]) + ' · ' + eur(f.totalTTC), act: 'openFacture', id: f.id }));
  const prevM = addMonths(m, -1); const ar = rapportsAEnvoyer(prevM);
  if (ar.length) todo.push({ cls: 'warn', titre: plural(ar.length, 'compte rendu', 'comptes rendus') + ' de ' + fmtMonth(prevM) + ' à envoyer', meta: ar.map(l => l.nom).join(', '), act: 'goRapports', id: prevM });
  const sb = stocksBas(); if (sb.length) todo.push({ cls: sb.some(s => s.quantite <= 0) ? 'crit' : 'warn', titre: 'Stock bas : ' + sb.map(s => s.nom).join(', '), meta: 'Voir la liste de courses', act: 'goStocks', id: '' });
  alertes().forEach(a => todo.push(a));
  todo.sort((a, b) => (a.cls === 'crit' ? 0 : 1) - (b.cls === 'crit' ? 0 : 1));
  const et = S.settings.etapes.filter(e => e.id !== 'perdu');
  const counts = et.map(e => list('contacts').filter(c => c.etape === e.id).length);
  const max = Math.max(1, ...counts);
  const perdus = list('contacts').filter(c => c.etape === 'perdu').length;
  const perm = astreinteOf(mondayOf(t));
  return `${modeBanner()}
  <div class="view-head"><div><h1 class="h1">Bonjour ${esc(profileName())}</h1><p class="sub">${esc(fmtLong(t))} · ${esc(profileRole())}</p><span class="perma"><span class="dotlive"></span><span>De permanence cette semaine : <b>${esc(PROFILES[perm].nom)}</b> (8 h – 22 h)</span></span></div></div>
  <section class="tiles" aria-label="Chiffres clés">
    ${tile('Logements gérés', act.length, plural(prospects, 'prospect') + ' en cours', 'logements')}
    ${tile('Abonnements / mois', eur0(mrr), 'HT, contrats actifs', 'factures')}
    ${tile('Rotations ce mois', doneM + '<small> / ' + rotM.length + '</small>', extraM ? extraM + ' au-delà des forfaits' : 'Aucune au-delà des forfaits', 'planning')}
    ${tile('Factures en retard', retard.length, retard.length ? eur(retard.reduce((s, f) => s + f.totalTTC, 0)) + ' TTC' : 'Tout est à jour', 'factures', retard.length ? 'crit' : '')}
  </section>
  ${SAMPLE ? `<a class="ai-card" href="#assistant">${ico('spark')}<span><b>Demandez à l’assistant</b><span>« Qui dois-je relancer cette semaine ? », « Combien vais-je facturer ce mois-ci ? »</span></span></a>` : ''}
  <section class="block"><h2 class="h2">À traiter</h2>
    <div class="todo">${todo.length ? todo.map(x => `<button class="todo-item ${x.cls}" data-act="${x.act}" data-id="${esc(x.id)}"><span class="stripe"></span><span><b>${esc(x.titre)}</b><span class="meta">${esc(x.meta)}</span></span>${ico('right')}</button>`).join('') : emptyBox('Rien à traiter pour l’instant.')}</div>
  </section>
  <section class="block"><h2 class="h2">Rotations du mois par logement</h2>${chartRotations(m)}</section>
  <section class="block"><h2 class="h2">Chiffre d’affaires facturé</h2>${chartCA(m)}</section>
  <section class="block"><h2 class="h2">Pipeline commercial</h2>
    <div class="funnel">${et.map((e, i) => `<a class="f-row${e.id === 'signe' ? ' won' : ''}" href="#crm"><span>${esc(e.nom)}</span><span class="f-bar"><span style="width:${counts[i] / max * 100}%"></span></span><span class="n">${counts[i]}</span></a>`).join('')}
    <p class="hint">${plural(perdus, 'contact')} classé${perdus > 1 ? 's' : ''} perdu${perdus > 1 ? 's' : ''}.</p></div>
  </section>`;
}
function chartRotations(m) {
  const ls = actifs().sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  if (!ls.length) return emptyBox('Aucun logement sous contrat.');
  const rows = ls.map(l => { const f = formuleOf(l); const done = rotations(l.id, m, true).length; const all = rotations(l.id, m).length; return { l, q: f.quota, done, plan: all - done }; });
  const scale = Math.max(...rows.map(r => Math.max(r.q, r.done + r.plan)), 1) * 1.1;
  return `<div class="chart"><div class="legend"><span><i></i>Faites</span><span><i style="background:repeating-linear-gradient(45deg,var(--ocean) 0 3px,transparent 3px 6px)"></i>Prévues</span><span><i class="est"></i>Au-delà du forfait</span><span><i class="quota"></i>Forfait</span></div>
  ${rows.map(r => `<button class="hbar" data-act="openLogement" data-id="${r.l.id}"><span>${esc(r.l.nom)}</span><span class="track"><span class="fill${r.done > r.q ? ' over' : ''}" style="width:${r.done / scale * 100}%"></span><span class="ghost" style="left:${r.done / scale * 100}%;width:${r.plan / scale * 100}%"></span><span class="quota" style="left:${r.q / scale * 100}%"></span></span><span class="v">${r.done}/${r.q}</span></button>`).join('')}</div>`;
}
function chartCA(m) {
  const months = [...Array(6)].map((_, i) => addMonths(m, i - 5));
  const vals = months.map(ym => list('factures').filter(f => f.mois === ym && f.statut !== 'annulee').reduce((s, f) => s + f.totalTTC, 0));
  const est = toBill(m).reduce((s, l) => { const ht = invoiceLines(l, m).reduce((a, x) => a + x.qte * x.pu, 0); return s + ht * (1 + S.settings.tva / 100); }, 0);
  const first = vals.findIndex(v => v > 0);
  if (first < 0 && !est) return emptyBox('Aucune facture pour l’instant.');
  const ms = months.slice(Math.max(0, Math.min(first < 0 ? 5 : first, 3)));
  const vs = ms.map(ym => vals[months.indexOf(ym)]);
  const top = Math.max(...vs.map((v, i) => v + (ms[i] === m ? est : 0)), 1);
  return `<div class="chart"><div class="legend"><span><i></i>Facturé TTC</span>${est ? `<span><i class="est"></i>Reste à facturer ce mois (estimation)</span>` : ''}</div>
  <div class="vbars">${ms.map((ym, i) => { const v = vs[i]; const e = ym === m ? est : 0; return `<div class="vbar"><span class="val">${v || e ? eur0(v + e) : '—'}</span>${e ? `<span class="colv est" style="height:${e / top * 120}px"></span>` : ''}<span class="colv" style="height:${v / top * 120}px;${e ? 'border-radius:0' : ''}"></span><span class="lbl">${esc(fmtMonthShort(ym))}</span></div>`; }).join('')}</div></div>`;
}

/* ---------- Vue : CRM ---------- */
function vCRM() {
  const n = relancesDues().length;
  const tabs = [['pipeline', 'Pipeline'], ['liste', 'Liste'], ['relances', 'Relances' + (n ? ' (' + n + ')' : '')], ['prescripteurs', 'Prescripteurs'], ['concurrents', 'Concurrents']];
  let body = '';
  if (UI.crmTab === 'pipeline') body = board();
  else if (UI.crmTab === 'liste') body = `<input class="search" type="search" id="crm-search" placeholder="Rechercher un nom, une commune…" value="${esc(UI.q)}" data-input="crmSearch" aria-label="Rechercher un contact">
    <div class="chips">${[['tous', 'Tous'], ['prospects', 'Prospects'], ['clients', 'Clients'], ['perdus', 'Perdus']].map(([v, l]) => `<button class="chip" data-act="crmFilter" data-v="${v}" aria-pressed="${UI.crmFilter === v}">${l}</button>`).join('')}</div>
    <div class="list" id="crm-list">${crmListHTML()}</div>`;
  else if (UI.crmTab === 'relances') body = relancesHTML();
  else if (UI.crmTab === 'prescripteurs') body = prescripteursHTML();
  else body = concurrentsHTML();
  const btn = UI.crmTab === 'concurrents' ? `<button class="btn primary" data-act="newConcurrent">${ico('plus')}Concurrent</button>` : `<button class="btn primary" data-act="newContact">${ico('plus')}Prospect</button>`;
  return `${modeBanner()}${head('CRM', '', btn)}<div class="seg" role="group" aria-label="Affichage">${tabs.map(([v, l]) => `<button data-act="crmTab" data-v="${v}" aria-pressed="${UI.crmTab === v}">${l}</button>`).join('')}</div>${body}`;
}
function board() {
  return `<div class="board" id="board" data-keep-scroll>${S.settings.etapes.map(e => {
    const cs = list('contacts').filter(c => c.etape === e.id).sort((a, b) => (a.relance || '9').localeCompare(b.relance || '9'));
    return `<section class="col" data-drop="${e.id}" aria-label="${esc(e.nom)}"><header><span>${esc(e.nom)}</span><span class="count">${cs.length}</span></header><div class="col-body">${cs.map(dealCard).join('') || '<p class="empty-col">Aucun contact</p>'}</div></section>`;
  }).join('')}</div><p class="hint">Glissez une carte d’une colonne à l’autre sur ordinateur, ou ouvrez la fiche pour changer d’étape.</p>`;
}
function dealCard(c) {
  const lg = list('logements').filter(l => l.proprietaireId === c.id);
  const meta = [c.commune, lg.length ? lg.map(l => l.nom).join(', ') : c.bien].filter(Boolean).join(' · ');
  return `<button class="deal" data-act="openContact" data-id="${c.id}" draggable="true" data-drag="${c.id}"><span class="deal-name">${esc(fullName(c))}</span><span class="deal-meta">${esc(meta)}</span>${relancePill(c)}</button>`;
}
function crmListHTML() {
  const q = norm(UI.q.trim());
  const cs = list('contacts').filter(c => {
    if (UI.crmFilter === 'prospects' && !isOpenProspect(c)) return false;
    if (UI.crmFilter === 'clients' && c.etape !== 'signe') return false;
    if (UI.crmFilter === 'perdus' && c.etape !== 'perdu') return false;
    return !q || norm(fullName(c) + ' ' + (c.commune || '') + ' ' + (c.bien || '')).includes(q);
  }).sort((a, b) => fullName(a).localeCompare(fullName(b), 'fr'));
  if (!cs.length) return emptyBox('Aucun contact ne correspond.');
  return cs.map(c => `<button class="item" data-act="openContact" data-id="${c.id}"><span class="item-main"><b>${esc(fullName(c))}</b><span>${esc([c.commune, c.origine].filter(Boolean).join(' · '))}</span></span><span class="item-side">${stagePill(c)}${relancePill(c)}</span></button>`).join('');
}
function relancesHTML() {
  const cs = list('contacts').filter(c => isOpenProspect(c) && c.relance).sort((a, b) => a.relance.localeCompare(b.relance));
  if (!cs.length) return emptyBox('Aucune relance prévue.');
  return `<div class="list">${cs.map(c => `<button class="item" data-act="openContact" data-id="${c.id}"><span class="item-main"><b>${esc(fullName(c))}</b><span>${esc(etapeNom(c.etape))} · ${esc(c.commune || '')}</span></span><span class="item-side">${relancePill(c)}<span class="small muted">${esc(c.tel || '')}</span></span></button>`).join('')}</div>`;
}
function prescripteursHTML() {
  const groups = {};
  list('contacts').filter(c => (c.prescripteur || '').trim()).forEach(c => { const k = c.prescripteur.trim(); (groups[k] = groups[k] || []).push(c); });
  const names = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'fr'));
  const com = S.settings.commission;
  if (!names.length) return emptyBox('Aucun prescripteur. Renseignez le champ « Prescripteur » sur la fiche d’un contact.');
  return `<p class="hint" style="margin-bottom:10px">Commission de ${eur0(com)} par contrat signé (modifiable dans Réglages).</p><div class="stack">${names.map(n => {
    const cs = groups[n]; const signed = cs.filter(c => c.etape === 'signe'); const due = signed.filter(c => !c.commissionVersee).length;
    return `<div class="box"><div class="row"><b style="flex:1">${esc(n)}</b>${due ? pill(eur0(due * com) + ' à verser', 'warn') : signed.length ? pill('À jour', 'ok') : ''}</div>
    <p class="small muted" style="margin:4px 0 8px">${plural(cs.length, 'contact transmis', 'contacts transmis')} · ${plural(signed.length, 'contrat signé', 'contrats signés')}</p>
    ${cs.map(c => `<div class="row" style="padding:4px 0;border-top:1px solid var(--line)"><button class="btn ghost sm" data-act="openContact" data-id="${c.id}" style="flex:1;justify-content:flex-start">${esc(fullName(c))}</button>${stagePill(c)}${c.etape === 'signe' ? `<label class="chk" style="padding:0"><input type="checkbox" id="com-${c.id}" ${c.commissionVersee ? 'checked' : ''} data-chg="f" data-col="contacts" data-id="${c.id}" data-path="commissionVersee" data-kind="bool"><span class="small">Versée</span></label>` : ''}</div>`).join('')}</div>`;
  }).join('')}</div>`;
}
function concurrentsHTML() {
  const cs = list('concurrents').sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  if (!cs.length) return emptyBox('Aucun concurrent suivi.');
  return `<p class="hint" style="margin-bottom:10px">Veille trimestrielle : tenez à jour l’offre et les prix après chaque appel client mystère.</p><div class="list">${cs.map(c => `<button class="item" data-act="openConcurrent" data-id="${c.id}"><span class="item-main"><b>${esc(c.nom)}</b><span>${esc(c.zone || '')} · ${esc(c.modele || 'Modèle à vérifier')}${c.prix ? ' · ' + esc(c.prix) : ''}</span></span><span class="item-side">${c.maj ? pill('Vu le ' + fmtDate(c.maj)) : pill('À compléter', 'warn')}</span></button>`).join('')}</div>`;
}

/* ---------- Vue : Logements ---------- */
function vLogements() {
  const ls = list('logements').sort((a, b) => (a.contrat?.statut === 'actif' ? 0 : 1) - (b.contrat?.statut === 'actif' ? 0 : 1) || a.nom.localeCompare(b.nom, 'fr'));
  const m = TODAY().slice(0, 7); const al = alertes();
  return `${modeBanner()}${head('Logements', plural(actifs().length, 'contrat actif', 'contrats actifs'), `<button class="btn primary" data-act="newLogement">${ico('plus')}Logement</button>`)}
  ${ls.length ? `<div class="cards">${ls.map(l => {
    const f = formuleOf(l); const done = rotations(l.id, m, true).length; const all = rotations(l.id, m).length;
    const owner = S.contacts[l.proprietaireId];
    const myAl = al.filter(a => a.id === l.id).length + list('incidents').filter(i => i.logementId === l.id && i.statut === 'ouvert').length;
    return `<button class="lcard" data-act="openLogement" data-id="${l.id}">
      <div class="row"><h3>${esc(l.nom)}</h3><span class="spacer"></span>${l.contrat?.statut === 'actif' ? pill(f.nom, 'brand') : pill('Résilié')}</div>
      <span class="meta">${esc(TYPES[l.type] || '')} · ${esc(l.commune)} · ${esc(fullName(owner))}</span>
      <div class="meter${done > f.quota ? ' over' : ''}" aria-hidden="true"><span style="width:${Math.min(100, done / Math.max(1, f.quota) * 100)}%"></span></div>
      <span class="meter-label"><span>${done} rotation${done > 1 ? 's' : ''} faite${done > 1 ? 's' : ''} sur ${f.quota} incluses</span><span>${all - done} prévue${all - done > 1 ? 's' : ''}</span></span>
      ${myAl ? `<span>${pill(plural(myAl, 'point') + ' à vérifier', 'warn')}</span>` : ''}
    </button>`;
  }).join('')}</div>` : emptyBox('Aucun logement. Un logement est créé quand un contrat est signé.')}`;
}

/* ---------- Vue : Planning ---------- */
function vPlanning() {
  const ws = UI.weekStart; const days = [...Array(7)].map((_, i) => addDays(ws, i));
  const ms = list('missions').filter(m => m.date >= days[0] && m.date <= days[6]).sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  const un = ms.filter(m => !m.conciergeId && m.statut !== 'terminee').length;
  const lab = DF({ day: 'numeric', month: 'short' });
  return `${modeBanner()}${head('Planning', '', `<button class="btn" data-act="openIcal">${ico('up')}Importer un calendrier</button><button class="btn primary" data-act="newMission">${ico('plus')}Mission</button>`)}
  <div class="weeknav"><button class="icon-btn" data-act="week" data-d="-7" aria-label="Semaine précédente">${ico('left')}</button><span class="label">Semaine du ${lab.format(parseISO(days[0]))} au ${lab.format(parseISO(days[6]))}</span><button class="icon-btn" data-act="week" data-d="7" aria-label="Semaine suivante">${ico('right')}</button><button class="btn sm" data-act="week" data-d="0">Aujourd’hui</button></div>
  <div class="box row" style="margin-bottom:12px"><span style="flex:1"><b>Astreinte de la semaine</b><br><span class="small muted">Répond au numéro unique de 8 h à 22 h</span></span><select id="astreinte-${ws}" data-chg="astreinte" data-week="${ws}" aria-label="Associé d’astreinte" style="min-height:40px;border:1px solid var(--line);border-radius:8px;background:var(--surface);padding:0 8px">${opts(associeOpts(), astreinteOf(ws))}</select></div>
  ${un ? `<div class="banner warn">${plural(un, 'mission')} sans concierge cette semaine.</div>` : ''}
  ${days.map(d => { const dm = ms.filter(m => m.date === d); return `<section class="day${d === TODAY() ? ' is-today' : ''}"><h3>${esc(DF({ weekday: 'long', day: 'numeric', month: 'long' }).format(parseISO(d)))}</h3>${dm.length ? dm.map(missionRow).join('') : '<p class="small muted">Rien de prévu</p>'}</section>`; }).join('')}`;
}
function missionRow(m) {
  const l = S.logements[m.logementId];
  return `<div class="mrow"><button class="mrow-main" data-act="openMission" data-id="${m.id}"><span class="mtime">${esc(m.heure || '')}</span><span class="mtitle">${esc(l?.nom || 'Logement supprimé')}</span><span class="mmeta">${esc(m.type === 'service' ? (m.libelle || 'Service') : 'Rotation')} · ${esc(l?.commune || '')}</span></button>
  <div class="mrow-side">${statutPill(m)}<select id="assign-${m.id}" aria-label="Concierge pour ${esc(l?.nom || '')}" data-chg="assign" data-id="${m.id}" class="${m.conciergeId ? '' : 'unassigned'}">${opts(concOpts(m.conciergeId), m.conciergeId)}</select></div></div>`;
}

/* ---------- Vue : Factures ---------- */
function vFactures() {
  const ym = UI.factMonth; const prev = addMonths(ym, -1);
  const fs = list('factures').filter(f => f.mois === ym).sort((a, b) => a.numero.localeCompare(b.numero));
  const tb = toBill(ym);
  const factTTC = fs.filter(f => f.statut !== 'annulee').reduce((s, f) => s + f.totalTTC, 0);
  const paid = fs.filter(f => f.type !== 'avoir' && f.statut === 'payee').reduce((s, f) => s + f.totalTTC, 0);
  const late = list('factures').filter(f => factStatut(f) === 'retard');
  const lateOther = late.filter(f => f.mois !== ym);
  return `${modeBanner()}${head('Factures', '', fs.length && canDownload() ? `<button class="btn" data-act="exportFactures">${ico('down')}Export CSV</button>` : '')}
  ${monthNav(ym, 'month')}
  <div class="stats"><div class="stat"><span>Facturé TTC</span><b>${eur0(factTTC)}</b></div><div class="stat"><span>Encaissé</span><b>${eur0(paid)}</b></div><div class="stat"><span>En retard</span><b style="color:${late.length ? 'var(--crit)' : 'inherit'}">${eur0(late.reduce((s, f) => s + f.totalTTC, 0))}</b></div></div>
  ${tb.length ? `<div class="gen"><p><b>${plural(tb.length, 'logement')} à facturer pour ${esc(fmtMonth(ym))}</b><br><span class="small muted">Abonnement du mois, plus les rotations au-delà du forfait et les services de ${esc(fmtMonth(prev))}.</span></p><button class="btn primary" data-act="genFactures">Générer les factures</button></div>` : ''}
  ${fs.length ? `<div class="list">${fs.map(factRow).join('')}</div>` : (tb.length ? '' : emptyBox('Aucune facture pour ce mois.'))}
  ${lateOther.length ? `<h2 class="h3">En retard sur d’autres mois</h2><div class="list">${lateOther.map(factRow).join('')}</div>` : ''}`;
}
function factRow(f) {
  const l = S.logements[f.logementId];
  return `<button class="item" data-act="openFacture" data-id="${f.id}"><span class="item-main"><b>${esc(f.numero)} · ${esc(fullName(S.contacts[f.proprietaireId]))}</b><span>${esc(l?.nom || '')} · échéance ${esc(fmtDate(f.echeance))}</span></span><span class="item-side"><span class="money">${eur(f.totalTTC)}</span>${factPill(f)}</span></button>`;
}

/* ---------- Vue : Comptes rendus ---------- */
function vRapports() {
  const ym = UI.rapMonth;
  const ls = actifs().filter(l => (l.contrat.debut || '') <= ym + '-31').sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const sent = ls.filter(l => (S.rapports[l.id + '_' + ym] || {}).envoyeLe).length;
  return `${modeBanner()}${head('Comptes rendus', 'Un compte rendu par logement et par mois, à envoyer au propriétaire.')}
  ${monthNav(ym, 'rapMonth')}
  <p class="small muted" style="margin:0 0 10px">${sent} envoyé${sent > 1 ? 's' : ''} sur ${ls.length}.</p>
  ${ls.length ? `<div class="list">${ls.map(l => {
    const r = S.rapports[l.id + '_' + ym] || {}; const st = rapportStats(l.id, ym);
    return `<button class="item" data-act="openRapport" data-id="${l.id}" data-ym="${ym}"><span class="item-main"><b>${esc(l.nom)}</b><span>${esc(fullName(S.contacts[l.proprietaireId]))} · ${plural(st.faites, 'rotation')} · ${plural(st.incidents.length, 'incident')}</span></span><span class="item-side">${r.envoyeLe ? pill('Envoyé le ' + fmtDate(r.envoyeLe), 'ok') : r.mot ? pill('Prêt', 'info') : pill('À préparer', 'warn')}</span></button>`;
  }).join('')}</div>` : emptyBox('Aucun logement sous contrat ce mois-là.')}`;
}

/* ---------- Vue : Stocks ---------- */
function vStocks() {
  const ss = list('stocks').sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const bas = stocksBas();
  const courses = bas.map(s => ({ s, qte: Math.max(1, Math.ceil(s.seuil * 2 - s.quantite)) }));
  return `${modeBanner()}${head('Stocks', 'Consommables et kits d’accueil. Une rotation terminée décompte automatiquement le stock.', `<button class="btn primary" data-act="newStock">${ico('plus')}Article</button>`)}
  ${courses.length ? `<div class="gen"><p><b>Liste de courses</b><br><span class="small">${courses.map(c => esc(c.s.nom) + ' : ' + num1(c.qte) + ' ' + esc(c.s.unite)).join(' · ')}</span></p><button class="btn" data-act="copyCourses">Copier la liste</button></div>` : ''}
  ${ss.length ? `<div class="stack">${ss.map(s => {
    const st = s.quantite <= 0 ? ['Rupture', 'crit'] : s.quantite <= s.seuil ? ['Stock bas', 'warn'] : ['OK', 'ok'];
    return `<div class="stock-row"><button class="item-main" data-act="openStock" data-id="${s.id}" style="border:0;background:transparent;text-align:left;padding:0"><b>${esc(s.nom)}</b><span>${num1(s.quantite)} ${esc(s.unite)} · seuil ${num1(s.seuil)}${s.parRotation ? ' · ' + num1(s.parRotation) + ' par rotation' : ''}</span></button>
    <div class="row">${pill(st[0], st[1])}<div class="qty"><button class="icon-btn" data-act="stockAdj" data-id="${s.id}" data-d="-1" aria-label="Retirer un ${esc(s.nom)}">${ico('minus')}</button><button class="icon-btn" data-act="stockAdj" data-id="${s.id}" data-d="1" aria-label="Ajouter un ${esc(s.nom)}">${ico('plus')}</button></div></div></div>`;
  }).join('')}</div>` : emptyBox('Aucun article suivi.')}`;
}

/* ---------- Vue : Frais et km ---------- */
function vFrais() {
  const ym = UI.fraisMonth; const yr = ym.slice(0, 4);
  const who = UI.fraisWho;
  const fs = list('frais').filter(f => f.date.startsWith(ym) && (who === 'tous' || f.associe === who)).sort((a, b) => b.date.localeCompare(a.date));
  const per = ASSOCIES.map(a => {
    const mine = list('frais').filter(f => f.associe === a);
    const kmM = mine.filter(f => f.type === 'km' && f.date.startsWith(ym)).reduce((s, f) => s + (f.km || 0), 0);
    const depM = mine.filter(f => f.type === 'depense' && f.date.startsWith(ym)).reduce((s, f) => s + (f.montant || 0), 0);
    const kmY = mine.filter(f => f.type === 'km' && f.date.startsWith(yr)).reduce((s, f) => s + (f.km || 0), 0);
    const cv = S.settings.vehicules[a] || 4;
    return { a, kmM, depM, kmY, cv, ikM: kmM * BAREME[Math.min(7, Math.max(3, cv))][0], ikY: indemnite(kmY, cv) };
  });
  return `${modeBanner()}${head('Frais et kilomètres', 'Barème kilométrique 2026 (identique à 2025), puissance du véhicule dans Réglages.', `${fs.length && canDownload() ? `<button class="btn" data-act="exportFrais">${ico('down')}Export CSV</button>` : ''}<button class="btn" data-act="newDepense">${ico('plus')}Dépense</button><button class="btn primary" data-act="newTrajet">${ico('plus')}Trajet</button>`)}
  ${monthNav(ym, 'fraisMonth')}
  <div class="sum-grid">${per.map(p => `<div class="sum-card"><b>${esc(PROFILES[p.a].nom)}</b><span>${num1(p.kmM)} km ce mois · ${eur(p.ikM)} d’indemnités${p.depM ? ' · ' + eur(p.depM) + ' de dépenses' : ''}</span><span>${yr} : ${num1(p.kmY)} km, ${eur(p.ikY)} selon le barème (${p.cv} CV)</span></div>`).join('')}</div>
  <div class="chips">${[['tous', 'Tous']].concat(associeOpts()).map(([v, l]) => `<button class="chip" data-act="fraisWho" data-v="${v}" aria-pressed="${who === v}">${esc(l)}</button>`).join('')}</div>
  ${fs.length ? `<div class="list">${fs.map(f => `<button class="item" data-act="openFrais" data-id="${f.id}"><span class="item-main"><b>${f.type === 'km' ? esc(f.depart + ' → ' + f.arrivee) : esc(f.libelle)}</b><span>${esc(fmtDate(f.date))} · ${esc(PROFILES[f.associe]?.nom || '')} · ${esc(f.type === 'km' ? f.motif : f.categorie)}</span></span><span class="item-side"><span class="money">${f.type === 'km' ? num1(f.km) + ' km' : eur(f.montant)}</span>${f.type === 'km' ? `<span class="small muted">${eur(f.km * BAREME[Math.min(7, Math.max(3, S.settings.vehicules[f.associe] || 4))][0])}</span>` : ''}</span></button>`).join('')}</div>` : emptyBox('Aucun frais ce mois-ci.')}
  <p class="hint" style="margin-top:12px">Le montant du mois applique le taux jusqu’à 5 000 km. Le total de l’année applique la bonne tranche du barème.</p>`;
}

/* ---------- Vue : Concierges ---------- */
function vConcierges() {
  const m = TODAY().slice(0, 7);
  const cs = list('concierges').sort((a, b) => fullName(a).localeCompare(fullName(b), 'fr'));
  return `${modeBanner()}${head('Concierges', '', `<button class="btn primary" data-act="newConcierge">${ico('plus')}Concierge</button>`)}
  ${cs.length ? `<div class="list">${cs.map(c => {
    const n = list('missions').filter(x => x.conciergeId === c.id && x.type === 'rotation' && x.statut === 'terminee' && x.date.startsWith(m)).length;
    const u = dateState(c.docs?.urssaf, 30), r = dateState(c.docs?.rcpro, 30);
    return `<button class="item" data-act="openConcierge" data-id="${c.id}"><span class="item-main"><b>${esc(fullName(c))}</b><span>${esc((c.zone || []).join(', '))} · ${plural(n, 'rotation')} ce mois</span></span><span class="item-side">${pill('URSSAF : ' + (u.cls === 'ok' ? 'à jour' : u.cls === 'crit' ? 'expirée' : 'à renouveler'), u.cls)}${r.cls !== 'ok' ? pill('RC pro : ' + (r.cls === 'crit' ? 'expirée' : 'à renouveler'), r.cls) : ''}</span></button>`;
  }).join('')}</div>` : emptyBox('Aucun concierge enregistré.')}`;
}

/* ---------- Vue : Assistant IA ---------- */
const SUGGESTIONS = ['Qui dois-je relancer cette semaine ?', 'Quels logements dépassent leur forfait ce mois-ci ?', 'Résume la semaine à venir pour les concierges.', 'Combien vais-je facturer ce mois-ci, et à qui ?'];
function vAssistant() {
  if (!SAMPLE) return modeBanner() + head('Assistant IA') + emptyBox(MODE === 'local' ? 'L’assistant fonctionne quand l’appli est ouverte dans Claude.' : 'L’assistant IA n’est pas disponible pour le moment sur cette page.');
  return `${modeBanner()}${head('Assistant IA', 'Il lit les données de l’appli (contacts, logements, planning, factures, stocks) et répond en quelques lignes. Il ne modifie rien.')}
  <div class="chat" id="chat">${CHAT.turns.map(t => `<div class="bubble ${t.role === 'user' ? 'me' : 'ai'}">${esc(t.content)}</div>`).join('')}
  ${CHAT.busy ? `<div class="bubble ai wait" id="chat-live">Réflexion en cours…</div>` : ''}</div>
  ${CHAT.err ? `<div class="banner warn">${esc(CHAT.err)}</div>` : ''}
  ${!CHAT.turns.length && !CHAT.busy ? `<div class="chips">${SUGGESTIONS.map((s, i) => `<button class="chip" data-act="askSuggestion" data-i="${i}">${esc(s)}</button>`).join('')}</div>` : ''}
  <form class="chat-form" data-submit="ask"><label class="sr" for="chat-input">Votre question</label><textarea id="chat-input" name="q" rows="1" placeholder="Posez une question sur votre activité…" ${CHAT.busy ? 'disabled' : ''}></textarea>
  ${CHAT.busy ? `<button class="btn" type="button" data-act="chatStop">${ico('stop')}Arrêter</button>` : `<button class="btn primary" type="submit" aria-label="Envoyer">${ico('send')}</button>`}</form>
  ${CHAT.turns.length && !CHAT.busy ? `<div class="row"><button class="btn ghost sm" data-act="chatReset">Nouvelle conversation</button></div>` : ''}`;
}
function dataContext() {
  const t = TODAY(), m = t.slice(0, 7); const L = [];
  L.push('Date du jour : ' + t + '. Utilisateur : ' + profileName() + ' (' + profileRole() + ').');
  L.push('Formules : ' + S.settings.formules.map(f => f.nom + ' ' + f.prix + ' € HT/mois, ' + f.quota + ' rotations incluses').join(' ; ') + '. Rotation en plus : ' + S.settings.tarifSup.petit + ' € HT (studio, T2), ' + S.settings.tarifSup.grand + ' € HT (T3, maison), facturée le mois suivant.');
  L.push('\nLOGEMENTS SOUS CONTRAT');
  actifs().forEach(l => { const f = formuleOf(l); const d = rotations(l.id, m, true).length; const a = rotations(l.id, m).length; const inc = list('incidents').filter(i => i.logementId === l.id && i.statut === 'ouvert').map(i => i.texte); L.push(`- ${l.nom} (${TYPES[l.type]}, ${l.commune}), propriétaire ${fullName(S.contacts[l.proprietaireId])}, formule ${f.nom}, rotations ce mois : ${d} faites sur ${f.quota} incluses, ${a - d} prévues${inc.length ? ', incidents ouverts : ' + inc.join(' / ') : ''}.`); });
  L.push('\nPROSPECTS EN COURS');
  list('contacts').filter(isOpenProspect).forEach(c => L.push(`- ${fullName(c)}, étape ${etapeNom(c.etape)}, relance ${c.relance || 'non fixée'}, ${c.commune || ''}, origine ${c.origine || '?'}${c.bien ? ', bien : ' + c.bien : ''}, dernier échange : ${((c.historique || []).slice(-1)[0] || {}).texte || 'aucun'}.`));
  L.push('\nMISSIONS DES 14 PROCHAINS JOURS');
  list('missions').filter(x => x.date >= t && x.date <= addDays(t, 14)).sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure)).forEach(x => L.push(`- ${x.date} ${x.heure} ${S.logements[x.logementId]?.nom || '?'}, ${x.type === 'service' ? x.libelle : 'rotation'}, concierge : ${fullName(S.concierges[x.conciergeId]) === '—' ? 'aucun' : fullName(S.concierges[x.conciergeId])}, statut ${STATUTS_M[x.statut]}.`));
  L.push('\nFACTURES (6 derniers mois)');
  list('factures').filter(f => f.mois >= addMonths(m, -6)).sort((a, b) => a.numero.localeCompare(b.numero)).forEach(f => L.push(`- ${f.numero} ${fullName(S.contacts[f.proprietaireId])}, ${f.mois}, ${r2(f.totalTTC)} € TTC, ${FACT_LABEL[factStatut(f)][0]}.`));
  const tb = toBill(m); if (tb.length) { L.push('\nRESTE À FACTURER CE MOIS (estimation)'); tb.forEach(l => { const ht = invoiceLines(l, m).reduce((s, x) => s + x.qte * x.pu, 0); L.push(`- ${l.nom} : ${r2(ht)} € HT (${invoiceLines(l, m).map(x => x.libelle + ' ' + x.qte + ' × ' + x.pu + ' €').join(' ; ')}).`); }); }
  L.push('\nCONCIERGES'); list('concierges').forEach(c => L.push(`- ${fullName(c)}, zone ${(c.zone || []).join(', ')}, URSSAF valable jusqu’au ${c.docs?.urssaf || '?'}, RC pro jusqu’au ${c.docs?.rcpro || '?'}.`));
  const sb = stocksBas(); if (sb.length) L.push('\nSTOCKS BAS : ' + sb.map(s => s.nom + ' ' + s.quantite + ' ' + s.unite + ' (seuil ' + s.seuil + ')').join(' ; '));
  L.push('\nALERTES : ' + (alertes().map(a => a.titre + ' (' + a.meta + ')').join(' ; ') || 'aucune'));
  L.push('\nASTREINTE DE LA SEMAINE : ' + PROFILES[astreinteOf(mondayOf(t))].nom + '.');
  return L.join('\n');
}

/* ---------- Vue : Mes missions (concierge) ---------- */
function vMissions() {
  const c = myConcierge();
  if (!c) return emptyBox('Choisissez votre profil de concierge dans le menu Profil.');
  const t = TODAY();
  const mine = list('missions').filter(m => m.conciergeId === c.id);
  const byTime = (a, b) => (a.date + a.heure).localeCompare(b.date + b.heure);
  const todays = mine.filter(m => m.date === t).sort(byTime);
  const next = mine.filter(m => m.date > t && m.date <= addDays(t, 14)).sort(byTime);
  const late = mine.filter(m => m.date < t && m.statut !== 'terminee').sort(byTime);
  const done = mine.filter(m => m.date < t && m.statut === 'terminee').sort((a, b) => byTime(b, a)).slice(0, 4);
  const u = dateState(c.docs?.urssaf, 30);
  const card = m => { const l = S.logements[m.logementId]; return `<button class="big-card" data-act="openMission" data-id="${m.id}"><span class="row"><span class="when">${esc(m.heure || '')} · ${esc(l?.nom || '')}</span><span class="spacer"></span>${statutPill(m)}</span><span class="muted">${esc(fmtDate(m.date))} · ${esc(m.type === 'service' ? (m.libelle || 'Service') : 'Rotation complète')} · ${esc(l?.adresse || '')}, ${esc(l?.commune || '')}</span></button>`; };
  return `${modeBanner()}${head('Bonjour ' + esc(c.prenom), esc(fmtLong(t)))}
  ${u.cls !== 'ok' ? `<div class="banner ${u.cls === 'crit' ? 'crit' : 'warn'}">Votre attestation URSSAF ${u.cls === 'crit' ? 'a expiré' : 'expire bientôt'} : envoyez la nouvelle à Bedirhan.</div>` : ''}
  <h2 class="h3">Aujourd’hui</h2><div class="stack">${todays.length ? todays.map(card).join('') : '<p class="muted">Aucune mission aujourd’hui.</p>'}</div>
  ${late.length ? `<h2 class="h3">En attente de validation</h2><div class="stack">${late.map(card).join('')}</div>` : ''}
  <h2 class="h3">Les 14 prochains jours</h2><div class="stack">${next.length ? next.map(card).join('') : '<p class="muted">Rien de prévu.</p>'}</div>
  ${done.length ? `<h2 class="h3">Dernières missions faites</h2><div class="stack">${done.map(card).join('')}</div>` : ''}`;
}

/* ---------- Vue : Espace propriétaire ---------- */
function vProprio() {
  const o = myOwner(); if (!o) return emptyBox('Choisissez un propriétaire dans le menu Profil.');
  const t = TODAY(), m = t.slice(0, 7);
  const lgs = list('logements').filter(l => l.proprietaireId === o.id);
  const fs = list('factures').filter(f => f.proprietaireId === o.id).sort((a, b) => b.numero.localeCompare(a.numero));
  const months = [m, addMonths(m, -1), addMonths(m, -2)];
  return `${modeBanner()}${head('Bonjour ' + esc(o.prenom), 'Votre espace BPN · aperçu de ce que voit le propriétaire')}
  ${lgs.map(l => {
    const f = formuleOf(l); const done = rotations(l.id, m, true).length;
    const next = list('missions').filter(x => x.logementId === l.id && x.type === 'rotation' && x.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
    const inc = list('incidents').filter(i => i.logementId === l.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    return `<div class="lcard" style="margin-bottom:12px"><div class="row"><h3>${esc(l.nom)}</h3><span class="spacer"></span>${pill('Formule ' + f.nom, 'brand')}</div>
    <span class="meta">${esc(l.adresse || '')}, ${esc(l.commune)}</span>
    <div class="meter${done > f.quota ? ' over' : ''}" aria-hidden="true"><span style="width:${Math.min(100, done / Math.max(1, f.quota) * 100)}%"></span></div>
    <span class="meter-label"><span>${done} rotation${done > 1 ? 's' : ''} ce mois sur ${f.quota} incluses</span></span>
    <span class="small"><b>Prochains départs :</b> ${next.length ? next.map(x => esc(fmtDate(x.date))).join(', ') : 'aucun prévu'}</span>
    ${inc.length ? `<span class="small"><b>Interventions :</b> ${inc.map(i => esc(fmtDate(i.date) + ' ' + i.texte + (i.statut === 'clos' ? ' (résolu)' : ' (en cours)'))).join(' · ')}</span>` : ''}
    <div class="row" style="margin-top:4px">${months.map(ym => `<button class="btn sm" data-act="openRapport" data-id="${l.id}" data-ym="${ym}">${ico('doc')}<span style="text-transform:capitalize">${esc(fmtMonth(ym))}</span></button>`).join('')}</div></div>`;
  }).join('') || emptyBox('Aucun logement.')}
  <h2 class="h3">Mes factures</h2>${fs.length ? `<div class="list">${fs.map(factRow).join('')}</div>` : '<p class="muted">Aucune facture.</p>'}`;
}

/* ---------- Vue : Réglages ---------- */
function allProfiles() {
  return Object.entries(PROFILES).map(([k, p]) => [k, p.nom + ' · ' + p.role])
    .concat(list('concierges').map(c => ['c:' + c.id, fullName(c) + ' · Concierge']))
    .concat(list('contacts').filter(c => c.etape === 'signe').map(c => ['o:' + c.id, fullName(c) + ' · Propriétaire (aperçu)']));
}
function profilePicker() {
  return `<div class="box"><label class="fld"><span>Profil actif sur cet appareil</span><select id="profile-select" data-chg="profile">${opts(allProfiles(), UI.profile)}</select></label>${ME && ME.name ? `<p class="hint" style="margin-top:6px">Connecté en tant que ${esc(ME.name)}.</p>` : ''}<p class="hint" style="margin-top:6px">Un concierge ne voit que ses missions. Un propriétaire voit ses logements, ses comptes rendus et ses factures.</p></div>`;
}
function vReglages() {
  const s = S.settings;
  if (!isAssocie()) return `${head('Profil')}${profilePicker()}`;
  const cap = (ok, lab, hint) => `<div><span>${lab}</span>${ok ? pill('Actif', 'ok') : pill(hint || 'Indisponible', '')}</div>`;
  return `${modeBanner()}${head('Réglages')}
  <h2 class="h3">Qui utilise l’appli</h2>${profilePicker()}
  <h2 class="h3">Fonctions connectées</h2>
  <div class="box cap-list">${cap(MODE === 'db', 'Données enregistrées et partagées', MODE === 'local' ? 'Mode démo' : '')}${cap(!!SAMPLE, 'Assistant IA et rédaction')}${cap(!!MCP, 'Brouillons Gmail')}${cap(!!ASSETS, 'Photos des concierges enregistrées')}${cap(canDownload(), 'PDF et exports')}</div>
  <h2 class="h3">Formules</h2>
  <div class="box"><table class="settings-table"><thead><tr><th class="small muted" style="text-align:left">Nom</th><th class="small muted" style="text-align:left">Prix HT / mois</th><th class="small muted" style="text-align:left">Rotations incluses</th></tr></thead><tbody>
  ${s.formules.map((f, i) => `<tr><td>${sset('formules.' + i + '.nom', f.nom, 'text', 'Nom de la formule')}</td><td>${sset('formules.' + i + '.prix', f.prix, 'number', 'Prix de ' + f.nom, 'min="0"')}</td><td>${sset('formules.' + i + '.quota', f.quota, 'number', 'Rotations incluses ' + f.nom, 'min="0"')}</td></tr>`).join('')}
  </tbody></table></div>
  <h2 class="h3">Rotations au-delà du forfait (HT)</h2>
  <div class="form-grid">${fld('Studio ou T2', sset('tarifSup.petit', s.tarifSup.petit, 'number', '', 'min="0"'))}${fld('T3 ou maison', sset('tarifSup.grand', s.tarifSup.grand, 'number', '', 'min="0"'))}</div>
  <h2 class="h3">Facturation et commissions</h2>
  <div class="form-grid">${fld('TVA (%)', sset('tva', s.tva, 'number', '', 'min="0" step="0.1"'))}${fld('Délai de paiement (jours)', sset('delaiPaiement', s.delaiPaiement, 'number', '', 'min="0"'))}${fld('Commission prescripteur (€ par contrat)', sset('commission', s.commission, 'number', '', 'min="0"'), 'full')}</div>
  <h2 class="h3">Véhicules des associés (puissance fiscale)</h2>
  <div class="form-grid">${ASSOCIES.map(a => fld(PROFILES[a].nom + ' (CV)', sset('vehicules.' + a, s.vehicules[a], 'number', '', 'min="3" max="7"'))).join('')}</div>
  <h2 class="h3">Étapes du pipeline</h2>
  <ul class="edit-list">${s.etapes.map((e, i) => `<li><input class="search" style="margin:0" aria-label="Nom de l’étape" id="s-e${i}" value="${esc(e.nom)}" data-chg="f" data-col="settings" data-path="etapes.${i}.nom" data-kind="text">${['contact', 'signe', 'perdu'].includes(e.id) ? '' : `<button class="icon-btn" data-act="delEtape" data-id="${e.id}" aria-label="Supprimer l’étape ${esc(e.nom)}">${ico('x')}</button>`}</li>`).join('')}</ul>
  <div class="row" style="margin-top:8px"><button class="btn sm" data-act="addEtape">${ico('plus')}Ajouter une étape</button></div>
  <h2 class="h3">Services à la carte (HT)</h2>
  <ul class="edit-list">${s.services.map((x, i) => `<li><input class="search" style="margin:0" aria-label="Nom du service" id="s-sv${i}-nom" value="${esc(x.nom)}" data-chg="f" data-col="settings" data-path="services.${i}.nom" data-kind="text"><input class="search" style="margin:0;max-width:7em" aria-label="Prix du service" id="s-sv${i}-prix" type="number" min="0" value="${x.prix}" data-chg="f" data-col="settings" data-path="services.${i}.prix" data-kind="num"><button class="icon-btn" data-act="delService" data-i="${i}" aria-label="Supprimer ${esc(x.nom)}">${ico('x')}</button></li>`).join('')}</ul>
  <div class="row" style="margin-top:8px"><button class="btn sm" data-act="addService">${ico('plus')}Ajouter un service</button></div>
  <h2 class="h3">Données</h2>
  <div class="box stack"><p class="small" style="margin:0">${MODE === 'db' ? 'Les données sont enregistrées et partagées avec les personnes qui ont accès à cette page.' : 'Mode démo : les données restent dans ce navigateur.'} Prototype : n’y mettez pas encore de vraies données clients.</p>
  <div class="row">${canDownload() ? `<button class="btn sm" data-act="saveBackup">${ico('down')}Sauvegarde (JSON)</button>` : ''}<button class="btn sm" data-act="copyData">Copier les données</button>${MODE === 'local' ? confirmBtnPage('reset', 'Remettre les données d’exemple', 'Effacer vos modifications ?', 'resetDemo') : ''}</div></div>
  <p class="hint" style="margin-top:18px">BPN Gestion v2 · prototype, base de travail pour le CRM et l’ERP.</p>`;
}
let pageArmed = '';
function confirmBtnPage(key, label, q, act) { return pageArmed === key ? `<span class="confirm"><span>${q}</span><button class="btn danger sm" data-act="${act}">Confirmer</button><button class="btn ghost sm" data-act="disarmPage">Annuler</button></span>` : `<button class="btn sm ghost danger-text" data-act="armPage" data-key="${key}">${label}</button>`; }

const VIEW_FN = { accueil: vAccueil, crm: vCRM, logements: vLogements, planning: vPlanning, factures: vFactures, rapports: vRapports, stocks: vStocks, frais: vFrais, concierges: vConcierges, assistant: vAssistant, reglages: vReglages, missions: vMissions, proprio: vProprio };

/* ---------- Fiches (panneau) ---------- */
function openSheet(kind, params = {}) { UI.sheet = Object.assign({ kind }, params); renderSheet(true); }
function closeSheet() { if (UI.sheet && UI.sheet.ctl) UI.sheet.ctl.abort(); UI.sheet = null; renderSheet(); }
function renderSheet(fresh) {
  const root = $('#sheet-root');
  if (!UI.sheet) { root.innerHTML = ''; root.classList.remove('open'); document.body.classList.remove('noscroll'); return; }
  const body = root.querySelector('.sheet-body'); const top = (!fresh && body) ? body.scrollTop : 0;
  const def = SHEETS[UI.sheet.kind];
  root.innerHTML = `<div class="scrim" data-act="closeSheet"></div><section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(def.kicker)}"><div class="sheet-head"><span class="kicker">${esc(def.kicker)}</span><button class="icon-btn" data-act="closeSheet" aria-label="Fermer">${ico('x')}</button></div><div class="sheet-body">${def.html(UI.sheet)}</div></section>`;
  root.classList.add('open'); document.body.classList.add('noscroll');
  const nb = root.querySelector('.sheet-body'); if (nb) nb.scrollTop = top;
  if (fresh) { const f = root.querySelector('[autofocus]'); if (f) f.focus(); }
}
const SHEETS = {};
SHEETS.contact = {
  kicker: 'Fiche contact', html: ({ id, lost }) => {
    const c = S.contacts[id]; if (!c) return '<p>Ce contact n’existe plus.</p>';
    const open = isOpenProspect(c);
    const lgs = list('logements').filter(l => l.proprietaireId === id);
    const hist = (c.historique || []).map((h, i) => Object.assign({ i }, h)).sort((a, b) => b.date.localeCompare(a.date) || b.i - a.i);
    return `<div class="sheet-title"><h2>${esc(fullName(c))}</h2><p>${stagePill(c)}${relancePill(c)}</p></div>
    <div class="actions">${open ? `<button class="btn" data-act="nextStage" data-id="${id}">Étape suivante</button><button class="btn primary" data-act="openSign" data-id="${id}">Contrat signé</button>` : ''}<button class="btn" data-act="compose" data-mode="relance" data-id="${id}">${ico('mail')}E-mail</button>${open ? `<button class="btn ghost" data-act="toggleLost" data-id="${id}">Perdu</button>` : ''}</div>
    ${lost ? `<form class="box form-grid" data-submit="lost" data-id="${id}" style="margin:10px 0"><label class="fld full"><span>Raison</span><select name="raison" id="lost-raison">${opts(RAISONS.map(r => [r, r]))}</select></label><button class="btn danger full" type="submit">Classer perdu</button></form>` : ''}
    <h3 class="h3">Suivi</h3>
    <div class="form-grid">${fld('Étape', `<select id="etape-${id}" data-chg="etape" data-id="${id}">${opts(S.settings.etapes.map(e => [e.id, e.nom]), c.etape)}</select>`)}${fld('Prochaine relance', inp('contacts', id, 'relance', c.relance, 'date', 'data-rerender="1"'))}</div>
    <h3 class="h3">Historique des échanges</h3>
    <form class="box form-grid" data-submit="addHist" data-id="${id}">
      <label class="fld"><span>Type</span><select name="type" id="hist-type-${id}">${opts(Object.entries(HIST_TYPES), 'appel')}</select></label>
      <label class="fld"><span>Date</span><input type="date" name="date" id="hist-date-${id}" value="${TODAY()}"></label>
      <label class="fld full"><span>Ce qui s’est dit</span><textarea name="texte" id="hist-texte-${id}" rows="2" required placeholder="Ex. Appel : souhaite un devis pour l’été"></textarea></label>
      <button class="btn primary full" type="submit">Ajouter à l’historique</button></form>
    <ol class="timeline">${hist.map(h => `<li><span class="tl-type">${esc(HIST_TYPES[h.type] || h.type)}</span><span class="tl-date">${esc(fmtDate(h.date))}${h.auteur ? ' · ' + esc(h.auteur) : ''}</span><p>${esc(h.texte)}</p></li>`).join('') || '<li class="muted">Aucun échange enregistré.</li>'}</ol>
    ${lgs.length ? `<h3 class="h3">Logements</h3><div class="list">${lgs.map(l => `<button class="item" data-act="openLogement" data-id="${l.id}"><span class="item-main"><b>${esc(l.nom)}</b><span>${esc(TYPES[l.type])} · ${esc(l.commune)}</span></span>${pill(formuleOf(l).nom, 'brand')}</button>`).join('')}</div>` : ''}
    <h3 class="h3">Coordonnées</h3>
    <div class="form-grid">
      ${fld('Prénom', inp('contacts', id, 'prenom', c.prenom))}${fld('Nom', inp('contacts', id, 'nom', c.nom))}
      ${fld('Téléphone', inp('contacts', id, 'tel', c.tel, 'tel'))}${fld('E-mail', inp('contacts', id, 'email', c.email, 'email'))}
      ${fld('Commune', sel('contacts', id, 'commune', c.commune, communeOpts().concat(c.commune && !S.settings.communes.includes(c.commune) ? [[c.commune, c.commune]] : []).concat([['', 'Autre']])))}
      ${fld('Origine du contact', sel('contacts', id, 'origine', c.origine, [['', '—']].concat(ORIGINES.map(o => [o, o]))))}
      ${fld('Prescripteur', inp('contacts', id, 'prescripteur', c.prescripteur, 'text', 'placeholder="Agence, notaire…"'))}
      ${fld('Bien envisagé', inp('contacts', id, 'bien', c.bien, 'text', 'placeholder="Ex. T2 vue mer"'))}
      <div class="full">${chk('contacts', id, 'consentementEmail', c.consentementEmail, 'Accepte de recevoir nos e-mails')}${chk('contacts', id, 'bloctel', c.bloctel, 'Inscrit sur Bloctel : pas de démarchage téléphonique')}</div>
      ${fld('Notes', area('contacts', id, 'notes', c.notes, 'rows="3"'), 'full')}
    </div>
    <div class="danger-zone">${confirmBtn('del', 'Supprimer ce contact', 'Supprimer définitivement ?', 'delete', `data-col="contacts" data-id="${id}"`)}</div>`;
  }
};
SHEETS.newContact = {
  kicker: 'Nouveau prospect', html: () => `<form class="form-grid" data-submit="newContact">
    <label class="fld"><span>Prénom</span><input name="prenom" id="nc-prenom" required autofocus></label>
    <label class="fld"><span>Nom</span><input name="nom" id="nc-nom" required></label>
    <label class="fld"><span>Téléphone</span><input name="tel" id="nc-tel" type="tel"></label>
    <label class="fld"><span>E-mail</span><input name="email" id="nc-email" type="email"></label>
    <label class="fld"><span>Commune</span><select name="commune" id="nc-commune">${opts(communeOpts().concat([['', 'Autre']]))}</select></label>
    <label class="fld"><span>Origine</span><select name="origine" id="nc-origine">${opts(ORIGINES.map(o => [o, o]))}</select></label>
    <label class="fld"><span>Prescripteur</span><input name="prescripteur" id="nc-presc" placeholder="Si recommandé par un pro"></label>
    <label class="fld"><span>Bien envisagé</span><input name="bien" id="nc-bien" placeholder="Ex. Maison 6 couchages"></label>
    <label class="fld"><span>Première relance</span><input name="relance" id="nc-relance" type="date" value="${addDays(TODAY(), 2)}"></label>
    <div class="full"><label class="chk"><input type="checkbox" name="consentementEmail" id="nc-consent"><span>Accepte de recevoir nos e-mails</span></label></div>
    <button class="btn primary full" type="submit">Créer le prospect</button></form>`
};
SHEETS.sign = {
  kicker: 'Nouveau contrat', html: ({ id }) => {
    const c = id ? S.contacts[id] : null;
    const owners = list('contacts').filter(x => x.etape !== 'perdu').sort((a, b) => fullName(a).localeCompare(fullName(b), 'fr')).map(x => [x.id, fullName(x)]);
    return `<div class="sheet-title"><h2>${c ? 'Contrat avec ' + esc(fullName(c)) : 'Nouveau logement sous contrat'}</h2><p>Le logement est créé avec sa checklist par défaut.</p></div>
    <form class="form-grid" data-submit="sign" data-id="${id || ''}" style="margin-top:14px">
      ${c ? '' : `<label class="fld full"><span>Propriétaire</span><select name="proprietaireId" id="sg-owner" required>${opts(owners)}</select></label>`}
      <label class="fld full"><span>Nom du logement</span><input name="nom" id="sg-nom" required placeholder="Ex. Ty Mor" autofocus></label>
      <label class="fld full"><span>Adresse</span><input name="adresse" id="sg-adresse"></label>
      <label class="fld"><span>Commune</span><select name="commune" id="sg-commune">${opts(communeOpts(), c?.commune)}</select></label>
      <label class="fld"><span>Type</span><select name="type" id="sg-type">${opts(typeOpts(), 't2')}</select></label>
      <label class="fld"><span>Couchages</span><input name="capacite" id="sg-cap" type="number" min="1" value="4"></label>
      <label class="fld"><span>Formule</span><select name="formuleId" id="sg-formule">${opts(S.settings.formules.map(f => [f.id, f.nom + ' · ' + eur0(f.prix) + ' HT/mois']), 'confort')}</select></label>
      <label class="fld"><span>Début du contrat</span><input name="debut" id="sg-debut" type="date" value="${TODAY()}"></label>
      <button class="btn primary full" type="submit">Signer et créer le logement</button></form>`;
  }
};
SHEETS.logement = {
  kicker: 'Logement', html: ({ id }) => {
    const l = S.logements[id]; if (!l) return '<p>Ce logement n’existe plus.</p>';
    const o = S.contacts[l.proprietaireId]; const f = formuleOf(l); const m = TODAY().slice(0, 7);
    const doneMs = rotations(id, m, true); const done = doneMs.length; const all = rotations(id, m).length;
    const extra = Math.max(0, done - f.quota);
    const cost = doneMs.reduce((s, x) => s + tarifConc(S.concierges[x.conciergeId], l), 0);
    const rev = f.prix + extra * tarifSup(l);
    const incs = list('incidents').filter(i => i.logementId === id).sort((a, b) => b.date.localeCompare(a.date));
    const ms = list('missions').filter(x => x.logementId === id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    const actif = l.contrat?.statut === 'actif';
    const confRow = (k, lab, warn) => { const st = dateState(l.conformite?.[k], warn); return `<div class="fld">${fld(lab, inp('logements', id, 'conformite.' + k, l.conformite?.[k], 'date', 'data-rerender="1"'))}<span>${pill(st.txt, st.cls)}</span></div>`; };
    return `<div class="sheet-title"><h2>${esc(l.nom)}</h2><p>${esc(TYPES[l.type] || '')} · ${l.capacite || '?'} couchages · ${esc(l.commune)}</p></div>
    <div class="actions"><button class="btn" data-act="openContact" data-id="${l.proprietaireId}">${esc(fullName(o))}</button><button class="btn" data-act="newMission" data-logement="${id}">${ico('plus')}Mission</button><button class="btn" data-act="openRapport" data-id="${id}" data-ym="${addMonths(m, -1)}">${ico('doc')}Compte rendu</button></div>
    <h3 class="h3">Ce mois-ci</h3>
    <div class="box"><div class="meter${done > f.quota ? ' over' : ''}" aria-hidden="true"><span style="width:${Math.min(100, done / Math.max(1, f.quota) * 100)}%"></span></div>
    <p class="meter-label" style="margin:6px 0 10px"><span>${done} rotation${done > 1 ? 's' : ''} faite${done > 1 ? 's' : ''} sur ${f.quota} incluses</span><span>${all - done} prévue${all - done > 1 ? 's' : ''}</span></p>
    <dl class="kv"><dt>Abonnement ${esc(f.nom)}</dt><dd>${eur(f.prix)}</dd><dt>Rotations en plus (${extra} × ${eur0(tarifSup(l))})</dt><dd>${eur(extra * tarifSup(l))}</dd><dt>Coût des concierges</dt><dd>− ${eur(cost)}</dd><dt class="total">Marge estimée (HT)</dt><dd class="total">${eur(rev - cost)}</dd></dl>
    <p class="hint" style="margin-top:8px">Les rotations en plus sont facturées avec l’abonnement du mois suivant.</p></div>
    <h3 class="h3">Contrat</h3>
    <div class="form-grid">
      ${fld('Formule', `<select id="formule-${id}" data-chg="formule" data-id="${id}" ${actif ? '' : 'disabled'}>${opts(S.settings.formules.map(x => [x.id, x.nom + ' · ' + eur0(x.prix)]), l.contrat?.formuleId)}</select>`)}
      ${fld('Début', inp('logements', id, 'contrat.debut', l.contrat?.debut, 'date'))}
      ${fld('Type', sel('logements', id, 'type', l.type, typeOpts(), 'data-rerender="1"'))}
      ${fld('Couchages', inp('logements', id, 'capacite', l.capacite, 'number'))}
      ${fld('Adresse', inp('logements', id, 'adresse', l.adresse), 'full')}
    </div>
    ${(l.contrat?.avenants || []).length ? `<p class="hint" style="margin-top:8px">Avenants : ${l.contrat.avenants.map(a => esc(fmtDate(a.date) + ' : ' + a.de + ' → ' + a.vers)).join(' · ')}</p>` : ''}
    <div style="margin-top:10px">${actif ? confirmBtn('resil', 'Résilier le contrat', 'Résilier à la date d’aujourd’hui ?', 'resilier', `data-id="${id}"`) : `<p>${pill('Contrat résilié le ' + fmtDateFull(l.contrat?.fin), '')}</p>`}</div>
    <h3 class="h3">Accès et consignes</h3>
    <div class="form-grid">${fld('Code d’accès', inp('logements', id, 'acces.code', l.acces?.code))}${fld('Wi-Fi', inp('logements', id, 'acces.wifi', l.acces?.wifi))}${fld('Consignes pour les concierges', area('logements', id, 'consignes', l.consignes, 'rows="3"'), 'full')}</div>
    <h3 class="h3">Checklist de rotation</h3>
    <ul class="edit-list">${(l.checklist || []).map((t, i) => `<li><span>${esc(t)}</span><button class="icon-btn" data-act="delCheck" data-id="${id}" data-i="${i}" aria-label="Retirer ${esc(t)}">${ico('x')}</button></li>`).join('')}</ul>
    <form class="row" data-submit="addCheck" data-id="${id}" style="margin-top:8px"><input class="search" style="margin:0;flex:1" name="t" id="addcheck-${id}" placeholder="Ajouter un point" required aria-label="Nouveau point de checklist"><button class="btn" type="submit">Ajouter</button></form>
    <h3 class="h3">Conformité</h3>
    <div class="form-grid">${fld('Numéro d’enregistrement', inp('logements', id, 'conformite.enregistrement', l.conformite?.enregistrement, 'text', 'data-rerender="1" placeholder="À demander en mairie"'), 'full')}
      ${confRow('classement', 'Classement meublé de tourisme', 60)}${confRow('dpe', 'DPE valable jusqu’au', 60)}${confRow('assurance', 'Assurance jusqu’au', 60)}</div>
    <h3 class="h3">Incidents</h3>
    ${incs.length ? `<div class="list">${incs.map(i => `<div class="item"><span class="item-main"><b>${esc(i.texte)}</b><span>${esc(fmtDate(i.date))} · ${esc(NIVEAUX[i.niveau] || '')} · ${esc(i.auteur || '')}</span></span><span class="item-side"><button class="btn sm" data-act="compose" data-mode="incident" data-id="${i.id}">${ico('mail')}Propriétaire</button>${i.statut === 'ouvert' ? `<button class="btn sm" data-act="closeIncident" data-id="${i.id}">Clore</button>` : pill('Clos', 'ok')}</span></div>`).join('')}</div>` : '<p class="muted small">Aucun incident.</p>'}
    <h3 class="h3">Dernières missions</h3>
    ${ms.length ? `<div class="list">${ms.map(x => `<button class="item" data-act="openMission" data-id="${x.id}"><span class="item-main"><b>${esc(fmtDate(x.date))} · ${esc(x.type === 'service' ? x.libelle : 'Rotation')}</b><span>${esc(S.concierges[x.conciergeId] ? fullName(S.concierges[x.conciergeId]) : 'Sans concierge')}</span></span>${statutPill(x)}</button>`).join('')}</div>` : '<p class="muted small">Aucune mission.</p>'}
    <div class="danger-zone">${confirmBtn('del', 'Supprimer ce logement', 'Supprimer le logement ?', 'delete', `data-col="logements" data-id="${id}"`)}</div>`;
  }
};
SHEETS.mission = {
  kicker: 'Mission', html: ({ id, problem }) => {
    const m = S.missions[id]; if (!m) return '<p>Cette mission n’existe plus.</p>';
    const l = S.logements[m.logementId] || { nom: 'Logement supprimé', checklist: [] };
    const conc = isConcierge();
    const items = l.checklist || []; const faits = m.faits || [];
    const left = items.filter(t => !faits.includes(t)).length;
    const ph = m.photos || {}; const ids = m.photoIds || {};
    const inc = openIncidentFor(id);
    const isRot = m.type === 'rotation';
    const canFinish = !isRot || (left === 0 && ph.avant > 0 && ph.apres > 0);
    const missing = [left ? plural(left, 'point') + ' de checklist' : '', isRot && !ph.avant ? 'les photos avant' : '', isRot && !ph.apres ? 'les photos après' : ''].filter(Boolean);
    const thumbs = w => (ids[w] || []).map(pid => `<a href="/_blob/${esc(pid)}" target="_blank" rel="noopener"><img src="/_blob/${esc(pid)}" alt="Photo ${w === 'avant' ? 'avant' : 'après'}"></a>`).join('') + (PHOTO_CACHE[id + w] || []).map(u => `<img src="${u}" alt="">`).join('');
    return `<div class="sheet-title"><h2>${esc(l.nom)}</h2><p>${esc(fmtDate(m.date))} · ${esc(m.heure || '')} · ${esc(isRot ? 'Rotation' : (m.libelle || 'Service'))} ${statutPill(m)}</p></div>
    ${conc ? '' : `<h3 class="h3">Organisation</h3><div class="form-grid">
      ${fld('Logement', sel('missions', id, 'logementId', m.logementId, list('logements').map(x => [x.id, x.nom]), 'data-rerender="1"'), 'full')}
      ${fld('Date', inp('missions', id, 'date', m.date, 'date', 'data-rerender="1"'))}${fld('Heure', inp('missions', id, 'heure', m.heure, 'time'))}
      ${fld('Concierge', sel('missions', id, 'conciergeId', m.conciergeId, concOpts(m.conciergeId), 'data-rerender="1"'))}
      ${fld('Statut', sel('missions', id, 'statut', m.statut, Object.entries(STATUTS_M), 'data-rerender="1"'))}
      ${isRot ? '' : fld('Service', inp('missions', id, 'libelle', m.libelle)) + fld('Prix HT', inp('missions', id, 'prix', m.prix, 'number'))}
    </div>`}
    <h3 class="h3">Sur place</h3>
    <dl class="kv"><dt>Adresse</dt><dd>${esc(l.adresse || '—')}, ${esc(l.commune || '')}</dd><dt>Code d’accès</dt><dd><b>${esc(l.acces?.code || '—')}</b></dd><dt>Wi-Fi</dt><dd>${esc(l.acces?.wifi || '—')}</dd></dl>
    ${l.consignes ? `<p class="box" style="margin-top:10px">${esc(l.consignes)}</p>` : ''}
    ${isRot ? `<h3 class="h3">Checklist (${items.length - left}/${items.length})</h3>
    <div class="checklist">${items.map((t, i) => `<label class="chk"><input type="checkbox" id="ck-${id}-${i}" ${faits.includes(t) ? 'checked' : ''} data-chg="check" data-id="${id}" data-i="${i}" ${m.statut === 'terminee' && conc ? 'disabled' : ''}><span>${esc(t)}</span></label>`).join('')}</div>
    <h3 class="h3">Photos</h3>
    <div class="photos">${['avant', 'apres'].map(w => `<div class="photo-in"><b>${w === 'avant' ? 'Avant' : 'Après'}</b><span class="small muted">${ph[w] ? plural(ph[w], 'photo') + ' envoyée' + (ph[w] > 1 ? 's' : '') : 'Aucune photo'}</span><label class="btn sm">${ico('up')}Ajouter<input class="sr" type="file" accept="image/*" multiple id="ph-${id}-${w}" data-chg="photo" data-id="${id}" data-w="${w}" aria-label="Photos ${w === 'avant' ? 'avant' : 'après'}"></label><div class="thumbs">${thumbs(w)}</div></div>`).join('')}</div>
    ${ASSETS ? '' : `<p class="hint" style="margin-top:6px">${MODE === 'db' ? 'Les photos sont enregistrées pour les éditeurs de la page ; ici, seul leur envoi est noté.' : 'Mode démo : l’envoi est noté, les photos ne sont pas conservées.'}</p>`}` : ''}
    <h3 class="h3">Problème</h3>
    ${inc ? `<div class="banner crit">${esc(inc.texte)} · ${esc(NIVEAUX[inc.niveau])}</div>` : ''}
    ${problem ? `<form class="box form-grid" data-submit="problem" data-id="${id}"><label class="fld"><span>Gravité</span><select name="niveau" id="pb-niveau">${opts(Object.entries(NIVEAUX), 'important')}</select></label><label class="fld full"><span>Ce qui ne va pas</span><textarea name="texte" id="pb-texte" rows="3" required placeholder="Ex. Fuite sous l’évier de la cuisine"></textarea></label><button class="btn danger full" type="submit">Prévenir l’équipe</button></form>` : `<button class="btn" data-act="toggleProblem">Signaler un problème</button>`}
    <div class="stack" style="margin-top:22px">
      ${m.statut === 'a_faire' ? `<button class="btn wide" data-act="startMission" data-id="${id}">Commencer la mission</button>` : ''}
      ${m.statut !== 'terminee' ? `<button class="btn primary wide" data-act="finishMission" data-id="${id}" ${canFinish ? '' : 'disabled'}>Terminer la mission</button>${canFinish ? '' : `<p class="hint">Il reste ${esc(missing.join(', '))}.</p>`}` : `<p>${pill('Terminée' + (m.doneAt ? ' le ' + fmtDate(m.doneAt.slice(0, 10)) + ' à ' + m.doneAt.slice(11, 16) : ''), 'ok')}</p>`}
    </div>
    ${conc ? '' : `<div class="danger-zone">${confirmBtn('del', 'Supprimer cette mission', 'Supprimer la mission ?', 'delete', `data-col="missions" data-id="${id}"`)}</div>`}`;
  }
};
SHEETS.newMission = {
  kicker: 'Nouvelle mission', html: ({ logement, date }) => `<form class="form-grid" data-submit="newMission">
    <label class="fld full"><span>Logement</span><select name="logementId" id="nm-logement" required>${opts(actifs().map(l => [l.id, l.nom + ' · ' + l.commune]), logement)}</select></label>
    <label class="fld"><span>Date</span><input type="date" name="date" id="nm-date" value="${date || TODAY()}" required></label>
    <label class="fld"><span>Heure</span><input type="time" name="heure" id="nm-heure" value="11:00"></label>
    <label class="fld"><span>Type</span><select name="type" id="nm-type">${opts([['rotation', 'Rotation (départ + ménage + arrivée)']].concat(S.settings.services.map(s => ['service:' + s.id, s.nom + ' · ' + eur0(s.prix)])))}</select></label>
    <label class="fld"><span>Concierge</span><select name="conciergeId" id="nm-conc">${opts([['auto', 'Selon la zone du logement']].concat(concOpts('', 'À attribuer plus tard')), 'auto')}</select></label>
    <button class="btn primary full" type="submit">Créer la mission</button></form>`
};
SHEETS.ical = {
  kicker: 'Importer un calendrier', html: ({ result }) => `<p class="hint">Exportez le calendrier du logement depuis Airbnb ou Booking (lien .ics). Ce prototype ne peut pas lire un lien : ouvrez-le, puis importez le fichier ou collez son contenu. Une rotation est créée à chaque date de départ.</p>
    <form class="form-grid" data-submit="ical" style="margin-top:12px">
      <label class="fld full"><span>Logement</span><select name="logementId" id="ic-logement" required>${opts(actifs().map(l => [l.id, l.nom + ' · ' + l.commune]))}</select></label>
      <label class="fld full"><span>Fichier .ics</span><input type="file" name="file" id="ic-file" accept=".ics,text/calendar"></label>
      <label class="fld full"><span>Ou contenu du calendrier</span><textarea name="txt" id="ic-txt" rows="5" placeholder="BEGIN:VCALENDAR…"></textarea></label>
      <div class="full row"><button class="btn sm" type="button" data-act="icalSample">Essayer avec un exemple</button></div>
      ${result ? `<div class="full banner">${esc(result)}</div>` : ''}
      <button class="btn primary full" type="submit">Créer les rotations</button></form>`
};
SHEETS.facture = {
  kicker: 'Facture', html: ({ id }) => {
    const f = S.factures[id]; if (!f) return '<p>Cette facture n’existe plus.</p>';
    const c = S.contacts[f.proprietaireId]; const l = S.logements[f.logementId]; const st = factStatut(f);
    const manage = isAssocie() && f.type === 'facture' && st !== 'annulee';
    return `<div class="inv-head"><div><div class="inv-logo">${LOGO_SVG}<span class="wordmark"><b>BPN</b><small>Votre bien, notre engagement</small></span></div><span class="small muted">BPN SAS · facture de démonstration</span></div>
      <div class="r"><h2 style="font-family:var(--font-display);font-size:20px">${f.type === 'avoir' ? 'Avoir' : 'Facture'} ${esc(f.numero)}</h2><span class="small">Émise le ${esc(fmtDateFull(f.date))}<br>${f.type === 'avoir' ? 'Annule la facture ' + esc(f.ref || '') : 'Échéance le ' + esc(fmtDateFull(f.echeance))}</span><br>${factPill(f)}</div></div>
    <div class="box"><b>${esc(fullName(c))}</b><br><span class="small muted">${esc(l?.nom || '')} · ${esc(l?.adresse || '')}, ${esc(l?.commune || '')}</span></div>
    <div class="table-wrap" style="margin-top:12px"><table class="inv"><thead><tr><th>Désignation</th><th class="n">Qté</th><th class="n">PU HT</th><th class="n">Total HT</th></tr></thead><tbody>
      ${f.lignes.map(x => `<tr><td>${esc(x.libelle)}</td><td class="n">${x.qte}</td><td class="n">${eur(x.pu)}</td><td class="n">${eur(x.qte * x.pu)}</td></tr>`).join('')}
    </tbody></table></div>
    <dl class="kv" style="margin-top:12px"><dt>Total HT</dt><dd>${eur(f.totalHT)}</dd><dt>TVA ${f.tva} %</dt><dd>${eur(f.totalTVA)}</dd><dt class="total">Total TTC</dt><dd class="total">${eur(f.totalTTC)}</dd></dl>
    ${f.payeeLe && st === 'payee' ? `<p class="hint" style="margin-top:8px">Payée le ${esc(fmtDateFull(f.payeeLe))}.</p>` : ''}
    <div class="stack" style="margin-top:18px">
      ${canDownload() ? `<button class="btn wide" data-act="pdfFacture" data-id="${id}">${ico('down')}Télécharger le PDF</button>` : ''}
      ${isAssocie() && f.type === 'facture' ? `<button class="btn wide" data-act="compose" data-mode="facture" data-id="${id}">${ico('mail')}Envoyer au propriétaire</button>` : ''}
      ${manage ? (st === 'payee' ? `<button class="btn wide" data-act="unpay" data-id="${id}">Annuler le paiement</button>` : `<button class="btn primary wide" data-act="pay" data-id="${id}">Marquer payée</button>`) : ''}
      ${isAssocie() ? `<button class="btn wide" data-act="copyFacture" data-id="${id}">Copier le texte</button>` : ''}
      ${manage ? confirmBtn('avoir', 'Annuler par un avoir', 'Créer un avoir du même montant ?', 'avoir', `data-id="${id}"`) : ''}
    </div>
    ${isAssocie() ? `<p class="hint" style="margin-top:14px">Numérotation continue, sans trou : une facture ne se supprime pas, elle s’annule par un avoir. À partir du 1er septembre 2027, l’envoi passera par une plateforme agréée.</p>` : ''}`;
  }
};
SHEETS.rapport = {
  kicker: 'Compte rendu', html: ({ id, ym, busy }) => {
    const l = S.logements[id]; if (!l) return '<p>Ce logement n’existe plus.</p>';
    const r = S.rapports[id + '_' + ym] || {}; const st = rapportStats(id, ym); const edit = isAssocie();
    return `<div class="sheet-title"><h2>${esc(l.nom)}</h2><p style="text-transform:capitalize">${esc(fmtMonth(ym))}</p><p>${esc(fullName(S.contacts[l.proprietaireId]))} ${r.envoyeLe ? pill('Envoyé le ' + fmtDate(r.envoyeLe), 'ok') : ''}</p></div>
    <div class="stats" style="margin-top:14px;grid-template-columns:repeat(4,minmax(0,1fr))"><div class="stat"><span>Faites</span><b>${st.faites}</b></div><div class="stat"><span>Incluses</span><b>${st.quota}</b></div><div class="stat"><span>En plus</span><b style="color:${st.enPlus ? 'var(--accent)' : 'inherit'}">${st.enPlus}</b></div><div class="stat"><span>Incidents</span><b>${st.incidents.length}</b></div></div>
    <h3 class="h3">Le mot du mois</h3>
    ${edit ? `<textarea id="rap-mot-${id}" class="search" style="min-height:120px;padding:10px" data-chg="rapMot" data-id="${id}" data-ym="${ym}" placeholder="Quelques phrases pour le propriétaire : comment s’est passé le mois, ce qui a été fait.">${esc(r.mot || '')}</textarea>
      <div class="row" style="margin-top:8px">${aiBtn('aiMot', busy ? 'Rédaction…' : 'Rédiger avec l’IA', `data-id="${id}" data-ym="${ym}" ${busy ? 'disabled' : ''}`)}${busy ? `<button class="btn ghost sm" data-act="aiStop">Arrêter</button>` : ''}</div>` : `<p class="box">${esc(r.mot || 'Pas encore de commentaire pour ce mois.')}</p>`}
    <h3 class="h3">Interventions</h3>
    ${st.missions.length ? `<dl class="kv">${st.missions.map(x => `<dt>${esc(fmtDate(x.date))} · ${esc(x.libelle)}${x.qui ? ' · ' + esc(x.qui) : ''}</dt><dd>${esc(x.statut)}</dd>`).join('')}</dl>` : '<p class="muted small">Aucune intervention.</p>'}
    ${st.incidents.length ? `<h3 class="h3">Incidents</h3><ul class="small">${st.incidents.map(i => `<li>${esc(fmtDate(i.date))} : ${esc(i.texte)} ${i.statut === 'clos' ? '(résolu)' : '(en cours)'}</li>`).join('')}</ul>` : ''}
    <h3 class="h3">Facturation</h3>
    <dl class="kv">${st.montants.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>
    <div class="stack" style="margin-top:18px">
      ${canDownload() ? `<button class="btn wide" data-act="pdfRapport" data-id="${id}" data-ym="${ym}">${ico('down')}Télécharger le PDF</button>` : ''}
      ${edit ? `<button class="btn primary wide" data-act="compose" data-mode="rapport" data-id="${id}" data-ym="${ym}">${ico('mail')}Préparer l’e-mail avec le PDF</button>
      <button class="btn wide" data-act="toggleSent" data-id="${id}" data-ym="${ym}">${r.envoyeLe ? 'Marquer comme non envoyé' : 'Marquer comme envoyé'}</button>` : ''}
    </div>`;
  }
};
SHEETS.compose = {
  kicker: 'E-mail', html: s => {
    const ctx = composeCtx(s);
    if (!ctx) return '<p>Élément introuvable.</p>';
    return `<div class="sheet-title"><h2>À ${esc(ctx.toName)}</h2><p>${ctx.to ? esc(ctx.to) : pill('Adresse e-mail manquante', 'warn')}${ctx.attach ? ' · ' + pill('PDF joint', 'info') : ''}</p></div>
    <div class="row" style="margin:12px 0">${aiBtn('aiCompose', s.busy ? 'Rédaction…' : 'Rédiger avec l’IA', s.busy ? 'disabled' : '')}${s.busy ? `<button class="btn ghost sm" data-act="aiStop">Arrêter</button>` : ''}</div>
    <div class="form-grid"><label class="fld full"><span>Objet</span><input id="cmp-subject" data-input="cmpSubject" value="${esc(s.subject)}"></label>
    <label class="fld full"><span>Message</span><textarea id="cmp-body" rows="12" data-input="cmpBody" style="min-height:240px">${esc(s.body)}</textarea></label></div>
    ${s.draftUrl ? `<div class="banner" style="margin-top:12px">Brouillon créé dans Gmail. <a href="${esc(s.draftUrl)}" target="_blank" rel="noopener">Ouvrir le brouillon</a></div>` : s.draftOk ? `<div class="banner" style="margin-top:12px">Brouillon créé dans vos brouillons Gmail.</div>` : ''}
    ${s.err ? `<div class="banner warn" style="margin-top:12px">${esc(s.err)}</div>` : ''}
    <div class="stack" style="margin-top:14px">
      ${MCP ? `<button class="btn primary wide" data-act="gmailDraft" ${ctx.to && !s.sending ? '' : 'disabled'}>${ico('mail')}${s.sending ? 'Création du brouillon…' : 'Créer le brouillon dans Gmail'}</button>` : `<p class="hint">${MODE === 'local' ? 'Les brouillons Gmail fonctionnent quand l’appli est ouverte dans Claude.' : 'Gmail n’est pas disponible sur cette page.'}</p>`}
      <button class="btn wide" data-act="copyCompose">Copier le texte</button>
      ${ctx.attach && canDownload() ? `<button class="btn wide" data-act="composePdf">${ico('down')}Télécharger le PDF joint</button>` : ''}
    </div>
    <p class="hint" style="margin-top:12px">Le brouillon n’est pas envoyé : vous le relisez et l’envoyez depuis Gmail.${s.mode === 'rapport' ? ' Une fois parti, marquez le compte rendu comme envoyé.' : ''}</p>`;
  }
};
SHEETS.newConcierge = {
  kicker: 'Nouveau concierge', html: () => `<form class="form-grid" data-submit="newConcierge">
    <label class="fld"><span>Prénom</span><input name="prenom" id="ncc-prenom" required autofocus></label>
    <label class="fld"><span>Nom</span><input name="nom" id="ncc-nom" required></label>
    <label class="fld"><span>Téléphone</span><input name="tel" id="ncc-tel" type="tel"></label>
    <label class="fld"><span>SIRET</span><input name="siret" id="ncc-siret"></label>
    <label class="fld"><span>Tarif studio ou T2 (€)</span><input name="petit" id="ncc-petit" type="number" min="0" value="35"></label>
    <label class="fld"><span>Tarif T3 ou maison (€)</span><input name="grand" id="ncc-grand" type="number" min="0" value="50"></label>
    <label class="fld"><span>URSSAF valable jusqu’au</span><input name="urssaf" id="ncc-urssaf" type="date"></label>
    <label class="fld"><span>RC pro valable jusqu’au</span><input name="rcpro" id="ncc-rcpro" type="date"></label>
    <fieldset class="full" style="border:0;padding:0;margin:0"><legend class="small muted" style="font-weight:600">Zone</legend>${S.settings.communes.map((z, i) => `<label class="chk"><input type="checkbox" name="zone" value="${esc(z)}" id="ncc-z${i}"><span>${esc(z)}</span></label>`).join('')}</fieldset>
    <button class="btn primary full" type="submit">Ajouter le concierge</button></form>`
};
SHEETS.concierge = {
  kicker: 'Concierge', html: ({ id, ym }) => {
    const c = S.concierges[id]; if (!c) return '<p>Ce concierge n’existe plus.</p>';
    const month = ym || TODAY().slice(0, 7);
    const ms = list('missions').filter(x => x.conciergeId === id && x.type === 'rotation' && x.statut === 'terminee' && x.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date));
    const total = ms.reduce((s, x) => s + tarifConc(c, S.logements[x.logementId] || { type: 't2' }), 0);
    const paid = !!(c.paiements || {})[month];
    const docRow = (k, lab) => { const st = dateState(c.docs?.[k], 30); return `<div class="fld">${fld(lab, inp('concierges', id, 'docs.' + k, c.docs?.[k], 'date', 'data-rerender="1"'))}<span>${pill(st.txt, st.cls)}</span></div>`; };
    return `<div class="sheet-title"><h2>${esc(fullName(c))}</h2><p>${esc((c.zone || []).join(', ') || 'Zone à définir')}</p></div>
    <h3 class="h3">Relevé des rotations</h3>
    ${monthNav(month, 'releve')}
    <div class="box">${ms.length ? `<dl class="kv">${ms.map(x => { const l = S.logements[x.logementId]; return `<dt>${esc(fmtDate(x.date))} · ${esc(l?.nom || '?')}</dt><dd>${eur(tarifConc(c, l || { type: 't2' }))}</dd>`; }).join('')}<dt class="total">${plural(ms.length, 'rotation')}</dt><dd class="total">${eur(total)}</dd></dl>` : '<p class="muted small" style="margin:0">Aucune rotation terminée ce mois-ci.</p>'}
    ${ms.length ? `<label class="chk" style="margin-top:8px"><input type="checkbox" id="paid-${id}-${month}" ${paid ? 'checked' : ''} data-chg="concPaid" data-id="${id}" data-ym="${month}"><span>Facture du concierge reçue et payée</span></label>` : ''}</div>
    <h3 class="h3">Documents obligatoires</h3>
    <div class="form-grid">${docRow('urssaf', 'Attestation URSSAF valable jusqu’au')}${docRow('rcpro', 'RC pro valable jusqu’au')}</div>
    <p class="hint" style="margin-top:6px">L’attestation de vigilance URSSAF se renouvelle tous les 6 mois.</p>
    <h3 class="h3">Infos</h3>
    <div class="form-grid">${fld('Prénom', inp('concierges', id, 'prenom', c.prenom))}${fld('Nom', inp('concierges', id, 'nom', c.nom))}${fld('Téléphone', inp('concierges', id, 'tel', c.tel, 'tel'))}${fld('E-mail', inp('concierges', id, 'email', c.email, 'email'))}${fld('SIRET', inp('concierges', id, 'siret', c.siret), 'full')}
    ${fld('Tarif studio ou T2 (€)', inp('concierges', id, 'tarif.petit', c.tarif?.petit, 'number', 'data-rerender="1"'))}${fld('Tarif T3 ou maison (€)', inp('concierges', id, 'tarif.grand', c.tarif?.grand, 'number', 'data-rerender="1"'))}</div>
    <h3 class="h3">Zone d’intervention</h3>
    <div>${S.settings.communes.map((z, i) => `<label class="chk"><input type="checkbox" id="zone-${id}-${i}" ${(c.zone || []).includes(z) ? 'checked' : ''} data-chg="zone" data-id="${id}" data-z="${esc(z)}"><span>${esc(z)}</span></label>`).join('')}</div>
    <div class="danger-zone">${confirmBtn('del', 'Supprimer ce concierge', 'Supprimer définitivement ?', 'delete', `data-col="concierges" data-id="${id}"`)}</div>`;
  }
};
SHEETS.stock = {
  kicker: 'Article de stock', html: ({ id }) => {
    const s = S.stocks[id]; if (!s) return '<p>Cet article n’existe plus.</p>';
    return `<div class="sheet-title"><h2>${esc(s.nom)}</h2><p>${num1(s.quantite)} ${esc(s.unite)} en stock</p></div>
    <form class="box row" data-submit="restock" data-id="${id}" style="margin:14px 0"><label class="fld" style="flex:1"><span>Ajouter au stock</span><input name="q" id="rs-${id}" type="number" min="0" step="any" required placeholder="Quantité achetée"></label><button class="btn primary" type="submit" style="align-self:flex-end">Ajouter</button></form>
    <div class="form-grid">${fld('Nom', inp('stocks', id, 'nom', s.nom))}${fld('Unité', inp('stocks', id, 'unite', s.unite))}${fld('Quantité', inp('stocks', id, 'quantite', s.quantite, 'number', 'step="any" data-rerender="1"'))}${fld('Seuil d’alerte', inp('stocks', id, 'seuil', s.seuil, 'number', 'step="any"'))}${fld('Consommé par rotation', inp('stocks', id, 'parRotation', s.parRotation, 'number', 'step="any"'), 'full')}</div>
    <h3 class="h3">Derniers mouvements</h3>
    ${(s.mouvements || []).length ? `<dl class="kv">${s.mouvements.slice().reverse().map(mv => `<dt>${esc(fmtDate(mv.date))} · ${esc(mv.motif)}</dt><dd>${mv.delta > 0 ? '+' : ''}${num1(mv.delta)}</dd>`).join('')}</dl>` : '<p class="muted small">Aucun mouvement enregistré.</p>'}
    <div class="danger-zone">${confirmBtn('del', 'Supprimer cet article', 'Supprimer l’article ?', 'delete', `data-col="stocks" data-id="${id}"`)}</div>`;
  }
};
SHEETS.newStock = {
  kicker: 'Nouvel article', html: () => `<form class="form-grid" data-submit="newStock">
    <label class="fld full"><span>Nom</span><input name="nom" id="ns-nom" required autofocus placeholder="Ex. Capsules de thé"></label>
    <label class="fld"><span>Unité</span><input name="unite" id="ns-unite" value="unités"></label>
    <label class="fld"><span>Quantité en stock</span><input name="quantite" id="ns-q" type="number" min="0" step="any" value="0"></label>
    <label class="fld"><span>Seuil d’alerte</span><input name="seuil" id="ns-s" type="number" min="0" step="any" value="5"></label>
    <label class="fld"><span>Consommé par rotation</span><input name="parRotation" id="ns-p" type="number" min="0" step="any" value="1"></label>
    <button class="btn primary full" type="submit">Ajouter l’article</button></form>`
};
SHEETS.newTrajet = {
  kicker: 'Nouveau trajet', html: () => `<form class="form-grid" data-submit="newFrais" data-type="km">
    <label class="fld"><span>Date</span><input name="date" id="nt-date" type="date" value="${TODAY()}" required></label>
    <label class="fld"><span>Associé</span><select name="associe" id="nt-assoc">${opts(associeOpts(), isAssocie() ? UI.profile : 'paul')}</select></label>
    <label class="fld"><span>Départ</span><input name="depart" id="nt-dep" value="Vannes" required></label>
    <label class="fld"><span>Arrivée</span><input name="arrivee" id="nt-arr" list="communes-list" required><datalist id="communes-list">${S.settings.communes.map(c => `<option value="${esc(c)}">`).join('')}</datalist></label>
    <label class="fld"><span>Distance (km, aller)</span><input name="km" id="nt-km" type="number" min="0" step="any" required></label>
    <div class="fld" style="align-self:end"><label class="chk"><input type="checkbox" name="ar" id="nt-ar" checked><span>Aller-retour (double la distance)</span></label></div>
    <label class="fld full"><span>Motif</span><input name="motif" id="nt-motif" required placeholder="Ex. Rendez-vous avec un propriétaire"></label>
    <button class="btn primary full" type="submit">Enregistrer le trajet</button></form>`
};
SHEETS.newDepense = {
  kicker: 'Nouvelle dépense', html: () => `<form class="form-grid" data-submit="newFrais" data-type="depense">
    <label class="fld"><span>Date</span><input name="date" id="nd-date" type="date" value="${TODAY()}" required></label>
    <label class="fld"><span>Associé</span><select name="associe" id="nd-assoc">${opts(associeOpts(), isAssocie() ? UI.profile : 'paul')}</select></label>
    <label class="fld full"><span>Libellé</span><input name="libelle" id="nd-lib" required placeholder="Ex. Produits ménagers"></label>
    <label class="fld"><span>Catégorie</span><select name="categorie" id="nd-cat">${opts(CATEGORIES.map(c => [c, c]))}</select></label>
    <label class="fld"><span>Montant TTC (€)</span><input name="montant" id="nd-mt" type="number" min="0" step="0.01" required></label>
    <button class="btn primary full" type="submit">Enregistrer la dépense</button></form>`
};
SHEETS.frais = {
  kicker: 'Frais', html: ({ id }) => {
    const f = S.frais[id]; if (!f) return '<p>Ce frais n’existe plus.</p>';
    const km = f.type === 'km';
    return `<div class="sheet-title"><h2>${km ? esc(f.depart + ' → ' + f.arrivee) : esc(f.libelle)}</h2><p>${esc(fmtDateFull(f.date))} · ${esc(PROFILES[f.associe]?.nom || '')}</p></div>
    <div class="form-grid" style="margin-top:14px">${fld('Date', inp('frais', id, 'date', f.date, 'date'))}${fld('Associé', sel('frais', id, 'associe', f.associe, associeOpts()))}
    ${km ? fld('Départ', inp('frais', id, 'depart', f.depart)) + fld('Arrivée', inp('frais', id, 'arrivee', f.arrivee)) + fld('Distance totale (km)', inp('frais', id, 'km', f.km, 'number', 'step="any"')) + fld('Motif', inp('frais', id, 'motif', f.motif)) : fld('Libellé', inp('frais', id, 'libelle', f.libelle), 'full') + fld('Catégorie', sel('frais', id, 'categorie', f.categorie, CATEGORIES.map(c => [c, c]))) + fld('Montant TTC', inp('frais', id, 'montant', f.montant, 'number', 'step="0.01"'))}</div>
    <div class="danger-zone">${confirmBtn('del', 'Supprimer', 'Supprimer ce frais ?', 'delete', `data-col="frais" data-id="${id}"`)}</div>`;
  }
};
SHEETS.concurrent = {
  kicker: 'Concurrent', html: ({ id }) => {
    const c = S.concurrents[id]; if (!c) return '<p>Ce concurrent n’existe plus.</p>';
    return `<div class="sheet-title"><h2>${esc(c.nom)}</h2><p>${esc(c.zone || '')}</p></div>
    <div class="form-grid" style="margin-top:14px">${fld('Nom', inp('concurrents', id, 'nom', c.nom))}${fld('Zone', inp('concurrents', id, 'zone', c.zone))}
    ${fld('Modèle', sel('concurrents', id, 'modele', c.modele, [['À vérifier', 'À vérifier'], ['Commission', 'Commission sur les loyers'], ['Abonnement', 'Abonnement fixe'], ['Mixte', 'Mixte']]))}${fld('Prix observés', inp('concurrents', id, 'prix', c.prix, 'text', 'placeholder="Ex. 20 % des loyers + ménage"'))}
    ${fld('Dernière vérification', inp('concurrents', id, 'maj', c.maj, 'date'))}${fld('Source', inp('concurrents', id, 'source', c.source, 'url'))}
    ${fld('Notes', area('concurrents', id, 'notes', c.notes, 'rows="4"'), 'full')}</div>
    ${c.source ? `<p class="small" style="margin-top:10px"><a href="${esc(c.source)}" target="_blank" rel="noopener">Ouvrir la source</a></p>` : ''}
    <div class="danger-zone">${confirmBtn('del', 'Supprimer', 'Supprimer ce concurrent ?', 'delete', `data-col="concurrents" data-id="${id}"`)}</div>`;
  }
};
SHEETS.menu = {
  kicker: 'Menu', html: () => `${profilePicker()}
    ${isAssocie() ? `<div class="list" style="margin-top:14px">${NAV.slice(5).map(([v, lab, ic]) => `<a class="item" href="#${v}" data-act="closeSheet">${ico(ic)}<span class="item-main"><b>${lab}</b></span>${ico('right')}</a>`).join('')}</div>` : ''}`
};

/* ---------- Rédaction d'e-mails (modèles + IA) ---------- */
function composeCtx(s) {
  const sign = '\n\nBien cordialement,\n' + (isAssocie() ? profileName() : 'L’équipe') + '\nBPN – Votre bien, notre engagement';
  if (s.mode === 'relance') {
    const c = S.contacts[s.id]; if (!c) return null;
    return { to: c.email, toName: fullName(c), contactId: c.id, subject: 'BPN – suite à notre échange', body: `Bonjour ${c.prenom || ''},\n\nJe reviens vers vous au sujet de ${c.bien ? c.bien.charAt(0).toLowerCase() + c.bien.slice(1) : 'votre logement'}${c.commune ? ' à ' + c.commune : ''}. Seriez-vous disponible cette semaine pour en parler quelques minutes ?` + sign,
      prompt: () => `Rédige un e-mail de relance court (120 mots maximum), chaleureux et professionnel, en vouvoyant. Expéditeur : ${profileName()}, de BPN, conciergerie de locations saisonnières sur la côte sud du Morbihan, qui gère les logements de A à Z contre un abonnement mensuel fixe (pas de commission sur les loyers). Destinataire : ${fullName(c)}, ${c.commune || ''}. Étape commerciale : ${etapeNom(c.etape)}. Bien : ${c.bien || 'non précisé'}. Origine : ${c.origine || '?'}${c.prescripteur ? ', recommandé par ' + c.prescripteur : ''}. Notes : ${c.notes || 'aucune'}. Historique : ${(c.historique || []).slice(-4).map(h => h.date + ' ' + (HIST_TYPES[h.type] || h.type) + ' : ' + h.texte).join(' | ') || 'aucun'}. Objectif : faire avancer d'une étape (premier contact → proposer un appel ou un rendez-vous ; rendez-vous → caler la visite ; audit → finaliser l'audit ; proposition → recueillir son avis sur la proposition). Ne cite aucun prix ni chiffre absent de ces données. Termine par « Bien cordialement, ${profileName()} » puis « BPN – Votre bien, notre engagement ». Réponds uniquement en JSON : {"objet": "...", "message": "..."} (message en texte brut avec retours à la ligne).` };
  }
  if (s.mode === 'rapport') {
    const l = S.logements[s.id]; if (!l) return null; const o = S.contacts[l.proprietaireId]; const st = rapportStats(l.id, s.ym); const mot = (S.rapports[l.id + '_' + s.ym] || {}).mot || '';
    return { to: o?.email, toName: fullName(o), attach: { name: 'compte-rendu-' + slug(l.nom) + '-' + s.ym + '.pdf', make: () => rapportPDFOf(l.id, s.ym) }, subject: 'Compte rendu ' + fmtMonth(s.ym) + ' – ' + l.nom,
      body: `Bonjour ${o?.prenom || ''},\n\nVoici le compte rendu de ${fmtMonth(s.ym)} pour ${l.nom}.\n\n${mot ? mot + '\n\n' : ''}En bref : ${plural(st.faites, 'rotation faite', 'rotations faites')} pour ${st.quota} incluses dans votre formule${st.enPlus ? ', dont ' + st.enPlus + ' en plus, facturée' + (st.enPlus > 1 ? 's' : '') + ' avec l’abonnement du mois prochain' : ''}${st.incidents.length ? ', et ' + plural(st.incidents.length, 'intervention') + ' sur un incident' : ''}.\n\nLe détail est dans le PDF joint.` + sign,
      prompt: () => `Rédige l'e-mail d'envoi du compte rendu mensuel à un propriétaire (100 mots maximum, vouvoiement, ton chaleureux). Logement : ${l.nom} (${l.commune}). Mois : ${fmtMonth(s.ym)}. Propriétaire : ${fullName(o)}. Rotations faites : ${st.faites}, incluses : ${st.quota}, en plus : ${st.enPlus} (facturées le mois suivant). Incidents : ${st.incidents.map(i => i.texte + (i.statut === 'clos' ? ' (résolu)' : ' (en cours)')).join(' ; ') || 'aucun'}. Mot du mois déjà rédigé : ${mot || 'aucun'}. Indique que le PDF est joint. Ne cite aucun chiffre absent de ces données. Signe « Bien cordialement, ${profileName()} » puis « BPN – Votre bien, notre engagement ». Réponds uniquement en JSON : {"objet": "...", "message": "..."}.` };
  }
  if (s.mode === 'facture') {
    const f = S.factures[s.id]; if (!f) return null; const o = S.contacts[f.proprietaireId]; const l = S.logements[f.logementId];
    return { to: o?.email, toName: fullName(o), attach: { name: 'facture-' + f.numero + '.pdf', make: () => facturePDF(f) }, subject: 'Facture ' + f.numero + ' – BPN',
      body: `Bonjour ${o?.prenom || ''},\n\nVeuillez trouver ci-joint la facture ${f.numero} pour ${l?.nom || 'votre logement'} (${fmtMonth(f.mois)}), d’un montant de ${eur(f.totalTTC)} TTC, à régler avant le ${fmtDateFull(f.echeance)}.\n\nN’hésitez pas à me contacter pour toute question.` + sign,
      prompt: () => `Rédige un e-mail court (80 mots maximum, vouvoiement) pour envoyer une facture à un propriétaire. Facture ${f.numero}, ${l?.nom || ''}, période ${fmtMonth(f.mois)}, ${eur(f.totalTTC)} TTC, échéance ${fmtDateFull(f.echeance)}, statut ${FACT_LABEL[factStatut(f)][0]}. Détail : ${f.lignes.map(x => x.libelle + ' ' + x.qte + ' × ' + x.pu + ' €').join(' ; ')}. Si la facture est en retard, rappelle-le avec tact. Indique que la facture est jointe en PDF. Signe « Bien cordialement, ${profileName()} » puis « BPN – Votre bien, notre engagement ». Réponds uniquement en JSON : {"objet": "...", "message": "..."}.` };
  }
  if (s.mode === 'incident') {
    const i = S.incidents[s.id]; if (!i) return null; const l = S.logements[i.logementId]; const o = S.contacts[l?.proprietaireId];
    return { to: o?.email, toName: fullName(o), subject: (l?.nom || 'Votre logement') + ' : intervention du ' + fmtDateFull(i.date),
      body: `Bonjour ${o?.prenom || ''},\n\nNous vous informons que nous avons constaté le problème suivant à ${l?.nom || 'votre logement'} le ${fmtDateFull(i.date)} : ${i.texte.charAt(0).toLowerCase() + i.texte.slice(1)}\n\n${i.statut === 'clos' ? 'Le problème est résolu.' : 'Nous nous en occupons et vous tenons informé(e) dès que c’est réglé.'}` + sign,
      prompt: () => `Rédige un e-mail court (100 mots maximum, vouvoiement, rassurant et factuel) pour informer un propriétaire d'un incident dans son logement en location saisonnière. Logement : ${l?.nom || ''} (${l?.commune || ''}). Date : ${fmtDateFull(i.date)}. Incident : ${i.texte}. Gravité : ${NIVEAUX[i.niveau]}. Statut : ${i.statut === 'clos' ? 'résolu' : 'en cours de traitement'}. N'invente ni coût ni délai. Signe « Bien cordialement, ${profileName()} » puis « BPN – Votre bien, notre engagement ». Réponds uniquement en JSON : {"objet": "...", "message": "..."}.` };
  }
  return null;
}

/* ---------- Actions ---------- */
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.tm); toast.tm = setTimeout(() => t.classList.remove('show'), 2800); }
function addHistory(cid, type, texte) { edit('contacts', cid, c => { c.historique = c.historique || []; c.historique.push({ date: TODAY(), type, texte, auteur: profileName() }); }); }
function guard() { if (readOnly) { toast('Lecture seule : modification impossible.'); return false; } return true; }
function moveStage(id, etape) {
  const c = S.contacts[id]; if (!c || c.etape === etape || !guard()) return;
  if (etape === 'signe' && !list('logements').some(l => l.proprietaireId === id)) { openSheet('sign', { id }); return; }
  if (etape === 'perdu') { openSheet('contact', { id, lost: true }); return; }
  const from = etapeNom(c.etape);
  edit('contacts', id, o => { o.etape = etape; if (etape === 'signe') o.type = 'client'; o.historique = o.historique || []; o.historique.push({ date: TODAY(), type: 'note', texte: 'Étape : ' + from + ' → ' + etapeNom(etape), auteur: profileName() }); });
  toast(fullName(c) + ' : ' + etapeNom(etape));
}
function consumeStock(lnom) {
  list('stocks').filter(s => (s.parRotation || 0) > 0).forEach(s => edit('stocks', s.id, o => {
    o.quantite = Math.max(0, r2((o.quantite || 0) - o.parRotation));
    o.mouvements = (o.mouvements || []).concat([{ date: TODAY(), delta: -o.parRotation, motif: 'Rotation ' + lnom }]).slice(-15);
  }));
}
async function askAI(question) {
  if (!SAMPLE || CHAT.busy || !question.trim()) return;
  CHAT.err = ''; CHAT.turns.push({ role: 'user', content: question.trim() }); CHAT.busy = true; CHAT.ctl = new AbortController();
  render();
  const rules = 'Tu es l’assistant de gestion de BPN, conciergerie de locations saisonnières sur la côte sud du Morbihan. Réponds en français, de façon concise (5 phrases maximum ou une courte liste à tirets), uniquement à partir des données ci-dessous. Si une information manque, dis-le simplement. Pas de titres ni de gras. Données de l’appli :\n\n' + dataContext();
  try {
    const { text } = await SAMPLE([{ role: 'user', content: rules }].concat(CHAT.turns.slice(-8)), { cache: false, signal: CHAT.ctl.signal, onText: ({ text }) => { const el = $('#chat-live'); if (el) { el.textContent = text; el.classList.remove('wait'); } } });
    CHAT.turns.push({ role: 'assistant', content: text });
  } catch (e) {
    const msg = sampleErr(e);
    if (e && e.text) CHAT.turns.push({ role: 'assistant', content: e.text + ' […]' });
    CHAT.err = msg;
  }
  CHAT.busy = false; CHAT.ctl = null; render();
  const inpEl = $('#chat-input'); if (inpEl) inpEl.focus();
}
const ACT = {
  closeSheet: () => closeSheet(),
  openMenu: () => openSheet('menu'),
  openContact: el => openSheet('contact', { id: el.dataset.id }),
  openLogement: el => openSheet('logement', { id: el.dataset.id }),
  openMission: el => openSheet('mission', { id: el.dataset.id }),
  openFacture: el => openSheet('facture', { id: el.dataset.id }),
  openConcierge: el => openSheet('concierge', { id: el.dataset.id }),
  openRapport: el => openSheet('rapport', { id: el.dataset.id, ym: el.dataset.ym }),
  openStock: el => openSheet('stock', { id: el.dataset.id }),
  openFrais: el => openSheet('frais', { id: el.dataset.id }),
  openConcurrent: el => openSheet('concurrent', { id: el.dataset.id }),
  goRapports: el => { UI.rapMonth = el.dataset.id || UI.rapMonth; location.hash = 'rapports'; },
  goStocks: () => { location.hash = 'stocks'; },
  newContact: () => guard() && openSheet('newContact'),
  newLogement: () => guard() && openSheet('sign', { id: '' }),
  newMission: el => guard() && openSheet('newMission', { logement: el.dataset.logement || '', date: el.dataset.date || '' }),
  newConcierge: () => guard() && openSheet('newConcierge'),
  newStock: () => guard() && openSheet('newStock'),
  newTrajet: () => guard() && openSheet('newTrajet'),
  newDepense: () => guard() && openSheet('newDepense'),
  newConcurrent: () => { if (!guard()) return; const c = { id: uid('cc-'), nom: 'Nouveau concurrent', zone: '', modele: 'À vérifier', prix: '', notes: '', maj: '', source: '' }; put('concurrents', c); openSheet('concurrent', { id: c.id }); },
  openIcal: () => guard() && openSheet('ical'),
  openSign: el => guard() && openSheet('sign', { id: el.dataset.id }),
  crmTab: el => { UI.crmTab = el.dataset.v; render(); },
  crmFilter: el => { UI.crmFilter = el.dataset.v; render(); },
  fraisWho: el => { UI.fraisWho = el.dataset.v; render(); },
  week: el => { const d = +el.dataset.d; UI.weekStart = d === 0 ? mondayOf(TODAY()) : addDays(UI.weekStart, d); render(); },
  month: el => { UI.factMonth = addMonths(UI.factMonth, +el.dataset.d); render(); },
  rapMonth: el => { UI.rapMonth = addMonths(UI.rapMonth, +el.dataset.d); render(); },
  fraisMonth: el => { UI.fraisMonth = addMonths(UI.fraisMonth, +el.dataset.d); render(); },
  releve: el => { UI.sheet.ym = addMonths(UI.sheet.ym || TODAY().slice(0, 7), +el.dataset.d); renderSheet(); },
  arm: el => { UI.sheet.armed = el.dataset.key; renderSheet(); },
  disarm: () => { UI.sheet.armed = ''; renderSheet(); },
  armPage: el => { pageArmed = el.dataset.key; render(); },
  disarmPage: () => { pageArmed = ''; render(); },
  delete: el => { if (!guard()) return; const { col, id } = el.dataset; del(col, id); closeSheet(); toast('Supprimé'); },
  nextStage: el => { const c = S.contacts[el.dataset.id]; const et = S.settings.etapes.filter(e => e.id !== 'perdu'); const i = et.findIndex(e => e.id === c.etape); if (i >= 0 && i < et.length - 1) { moveStage(c.id, et[i + 1].id); if (UI.sheet && UI.sheet.kind === 'contact') renderSheet(); } },
  toggleLost: () => { UI.sheet.lost = !UI.sheet.lost; renderSheet(); },
  toggleProblem: () => { UI.sheet.problem = !UI.sheet.problem; renderSheet(); },
  resilier: el => { if (!guard()) return; const id = el.dataset.id; edit('logements', id, l => { l.contrat.statut = 'resilie'; l.contrat.fin = TODAY(); }); const l = S.logements[id]; addHistory(l.proprietaireId, 'note', 'Contrat résilié : ' + l.nom); UI.sheet.armed = ''; renderSheet(); toast('Contrat résilié'); },
  delCheck: el => { if (!guard()) return; edit('logements', el.dataset.id, l => { l.checklist.splice(+el.dataset.i, 1); }); renderSheet(); },
  closeIncident: el => { if (!guard()) return; edit('incidents', el.dataset.id, i => { i.statut = 'clos'; i.closedAt = nowISO(); }); renderSheet(); toast('Incident clos'); },
  startMission: el => { if (!guard()) return; edit('missions', el.dataset.id, m => { m.statut = 'en_cours'; }); renderSheet(); },
  finishMission: el => { if (!guard()) return; const m = S.missions[el.dataset.id]; edit('missions', m.id, o => { o.statut = 'terminee'; o.doneAt = nowISO(); }); if (m.type === 'rotation') consumeStock(S.logements[m.logementId]?.nom || ''); renderSheet(); toast('Mission terminée'); },
  icalSample: () => {
    const fmt = d => d.replace(/-/g, ''); const t = TODAY();
    const ev = (a, b, s) => `BEGIN:VEVENT\nDTSTART;VALUE=DATE:${fmt(addDays(t, a))}\nDTEND;VALUE=DATE:${fmt(addDays(t, b))}\nSUMMARY:${s}\nEND:VEVENT`;
    $('#ic-txt').value = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Airbnb Inc//Hosting Calendar//EN', ev(3, 5, 'Reserved'), ev(10, 14, 'Reserved'), ev(15, 17, 'Airbnb (Not available)'), ev(18, 22, 'Reserved'), 'END:VCALENDAR'].join('\n');
  },
  genFactures: () => {
    if (!guard()) return;
    const ym = UI.factMonth; const ls = toBill(ym); const t = TODAY();
    const date = t.slice(0, 7) === ym ? t : ym + '-01'; const year = date.slice(0, 4);
    ls.forEach((l, i) => {
      const lignes = invoiceLines(l, ym); const ht = r2(lignes.reduce((s, x) => s + x.qte * x.pu, 0)); const tva = r2(ht * S.settings.tva / 100);
      put('factures', { id: uid('f-'), numero: nextNumero(year, i), type: 'facture', mois: ym, date, echeance: addDays(date, S.settings.delaiPaiement), proprietaireId: l.proprietaireId, logementId: l.id, lignes, tva: S.settings.tva, totalHT: ht, totalTVA: tva, totalTTC: r2(ht + tva), statut: 'en_attente', payeeLe: '' });
    });
    toast(plural(ls.length, 'facture générée', 'factures générées'));
  },
  pay: el => { if (!guard()) return; edit('factures', el.dataset.id, f => { f.statut = 'payee'; f.payeeLe = TODAY(); }); renderSheet(); toast('Facture marquée payée'); },
  unpay: el => { if (!guard()) return; edit('factures', el.dataset.id, f => { f.statut = 'en_attente'; f.payeeLe = ''; }); renderSheet(); },
  avoir: el => {
    if (!guard()) return; const f = S.factures[el.dataset.id]; const t = TODAY();
    const a = { id: uid('f-'), numero: nextNumero(t.slice(0, 4)), type: 'avoir', ref: f.numero, mois: f.mois, date: t, echeance: t, proprietaireId: f.proprietaireId, logementId: f.logementId, lignes: f.lignes.map(x => Object.assign({}, x, { pu: -x.pu })), tva: f.tva, totalHT: -f.totalHT, totalTVA: -f.totalTVA, totalTTC: -f.totalTTC, statut: 'payee', payeeLe: '' };
    put('factures', a); edit('factures', f.id, o => { o.statut = 'annulee'; o.avoir = a.numero; });
    UI.sheet = { kind: 'facture', id: a.id }; renderSheet(true); toast('Avoir ' + a.numero + ' créé');
  },
  copyFacture: async el => {
    const f = S.factures[el.dataset.id]; const c = S.contacts[f.proprietaireId]; const l = S.logements[f.logementId];
    const txt = [(f.type === 'avoir' ? 'AVOIR ' : 'FACTURE ') + f.numero, 'BPN SAS', 'Émise le ' + fmtDateFull(f.date) + (f.type === 'avoir' ? '' : ' · échéance le ' + fmtDateFull(f.echeance)), '', 'Client : ' + fullName(c), 'Logement : ' + (l?.nom || '') + ', ' + (l?.commune || ''), '']
      .concat(f.lignes.map(x => '- ' + x.libelle + ' : ' + x.qte + ' × ' + eur(x.pu) + ' = ' + eur(x.qte * x.pu)))
      .concat(['', 'Total HT : ' + eur(f.totalHT), 'TVA ' + f.tva + ' % : ' + eur(f.totalTVA), 'Total TTC : ' + eur(f.totalTTC)]).join('\n');
    try { await navigator.clipboard.writeText(txt); toast('Texte copié'); } catch (e) { toast('Copie impossible ici'); }
  },
  pdfFacture: el => { const f = S.factures[el.dataset.id]; saveFile((f.type === 'avoir' ? 'avoir-' : 'facture-') + f.numero + '.pdf', facturePDF(f), 'application/pdf'); },
  pdfRapport: el => { const l = S.logements[el.dataset.id]; saveFile('compte-rendu-' + slug(l.nom) + '-' + el.dataset.ym + '.pdf', rapportPDFOf(l.id, el.dataset.ym), 'application/pdf'); },
  exportFactures: () => {
    const fs = list('factures').filter(f => f.mois === UI.factMonth).sort((a, b) => a.numero.localeCompare(b.numero));
    const rows = [['Numéro', 'Type', 'Date', 'Échéance', 'Client', 'Logement', 'Mois', 'Total HT', 'TVA', 'Total TTC', 'Statut', 'Payée le']].concat(fs.map(f => [f.numero, f.type, f.date, f.echeance, fullName(S.contacts[f.proprietaireId]), S.logements[f.logementId]?.nom || '', f.mois, f.totalHT, f.totalTVA, f.totalTTC, FACT_LABEL[factStatut(f)][0], f.payeeLe || '']));
    saveFile('factures-bpn-' + UI.factMonth + '.csv', csv(rows), 'text/csv');
  },
  exportFrais: () => {
    const fs = list('frais').filter(f => f.date.startsWith(UI.fraisMonth)).sort((a, b) => a.date.localeCompare(b.date));
    const rows = [['Date', 'Associé', 'Type', 'Départ', 'Arrivée', 'Km', 'Indemnité (€)', 'Motif / libellé', 'Catégorie', 'Montant TTC (€)']].concat(fs.map(f => { const cv = S.settings.vehicules[f.associe] || 4; return [f.date, PROFILES[f.associe]?.nom || f.associe, f.type === 'km' ? 'Trajet' : 'Dépense', f.depart, f.arrivee, f.km || '', f.type === 'km' ? f.km * BAREME[Math.min(7, Math.max(3, cv))][0] : '', f.type === 'km' ? f.motif : f.libelle, f.categorie, f.type === 'km' ? '' : f.montant]; }));
    saveFile('frais-bpn-' + UI.fraisMonth + '.csv', csv(rows), 'text/csv');
  },
  saveBackup: () => saveFile('bpn-sauvegarde-' + TODAY() + '.json', JSON.stringify(dump(), null, 2), 'application/json'),
  copyData: async () => { try { await navigator.clipboard.writeText(JSON.stringify(dump(), null, 2)); toast('Données copiées'); } catch (e) { toast('Copie impossible ici'); } },
  resetDemo: () => { try { localStorage.removeItem('bpn-proto-data-v2'); } catch (e) { /* rien */ } pageArmed = ''; loadData(bpnDemo(TODAY())); saveLocal(); render(); toast('Données d’exemple remises'); },
  addEtape: () => { if (!guard()) return; editSettings(s => { const i = s.etapes.findIndex(e => e.id === 'signe'); s.etapes.splice(i < 0 ? s.etapes.length : i, 0, { id: uid('e-'), nom: 'Nouvelle étape' }); }); },
  delEtape: el => { if (!guard()) return; const id = el.dataset.id; if (list('contacts').some(c => c.etape === id)) { toast('Déplacez d’abord les contacts de cette étape'); return; } editSettings(s => { s.etapes = s.etapes.filter(e => e.id !== id); }); },
  addService: () => { if (!guard()) return; editSettings(s => { s.services.push({ id: uid('s-'), nom: 'Nouveau service', prix: 20 }); }); },
  delService: el => { if (!guard()) return; editSettings(s => { s.services.splice(+el.dataset.i, 1); }); },
  stockAdj: el => { if (!guard()) return; const d = +el.dataset.d; edit('stocks', el.dataset.id, s => { s.quantite = Math.max(0, r2((s.quantite || 0) + d)); s.mouvements = (s.mouvements || []).concat([{ date: TODAY(), delta: d, motif: 'Ajustement manuel' }]).slice(-15); }); },
  copyCourses: async () => { const txt = 'Courses BPN – ' + fmtDateFull(TODAY()) + '\n' + stocksBas().map(s => '- ' + s.nom + ' : ' + num1(Math.max(1, Math.ceil(s.seuil * 2 - s.quantite))) + ' ' + s.unite).join('\n'); try { await navigator.clipboard.writeText(txt); toast('Liste copiée'); } catch (e) { toast('Copie impossible ici'); } },
  toggleSent: el => { if (!guard()) return; const { id, ym } = el.dataset; upsert('rapports', id + '_' + ym, { logementId: id, mois: ym, mot: '' }, r => { r.envoyeLe = r.envoyeLe ? '' : TODAY(); }); renderSheet(); },
  askSuggestion: el => askAI(SUGGESTIONS[+el.dataset.i]),
  chatStop: () => { if (CHAT.ctl) CHAT.ctl.abort(); },
  chatReset: () => { CHAT.turns = []; CHAT.err = ''; render(); },
  aiStop: () => { if (UI.sheet && UI.sheet.ctl) UI.sheet.ctl.abort(); },
  aiMot: async el => {
    if (!SAMPLE || !guard()) return; const { id, ym } = el.dataset; const l = S.logements[id]; const st = rapportStats(id, ym); const o = S.contacts[l.proprietaireId];
    const sh = UI.sheet; sh.busy = true; sh.ctl = new AbortController(); renderSheet();
    const prompt = `Rédige « le mot du mois » d'un compte rendu de conciergerie : 3 ou 4 phrases, ton chaleureux et professionnel, vouvoiement, adressé à ${fullName(o)}, propriétaire de ${l.nom} (${TYPES[l.type]}, ${l.commune}). Mois : ${fmtMonth(ym)}. Rotations faites : ${st.faites} pour ${st.quota} incluses${st.enPlus ? ', ' + st.enPlus + ' en plus facturées le mois suivant' : ''}. Rotations encore prévues : ${st.aVenir}. Services : ${st.services.map(s => s.libelle).join(', ') || 'aucun'}. Incidents : ${st.incidents.map(i => i.texte + (i.statut === 'clos' ? ' (résolu)' : ' (en cours)')).join(' ; ') || 'aucun'}. Consignes du logement : ${l.consignes || 'aucune'}. N'invente aucun chiffre (pas de revenus, pas de notes voyageurs). Réponds uniquement avec le texte, sans titre ni formule de politesse.`;
    try { const { text } = await SAMPLE(prompt, { signal: sh.ctl.signal, cache: false }); upsert('rapports', id + '_' + ym, { logementId: id, mois: ym, envoyeLe: '' }, r => { r.mot = text.trim(); }); }
    catch (e) { const m = sampleErr(e); if (m) toast(m); }
    if (UI.sheet === sh) { sh.busy = false; sh.ctl = null; renderSheet(); }
  },
  compose: el => { const s = { kind: 'compose', mode: el.dataset.mode, id: el.dataset.id, ym: el.dataset.ym || '' }; const ctx = composeCtx(s); if (!ctx) return; s.subject = ctx.subject; s.body = ctx.body; UI.sheet = s; renderSheet(true); },
  aiCompose: async () => {
    const sh = UI.sheet; if (!SAMPLE || !sh) return; const ctx = composeCtx(sh); sh.busy = true; sh.err = ''; sh.ctl = new AbortController(); renderSheet();
    try { const r = await SAMPLE.json(ctx.prompt(), { signal: sh.ctl.signal, cache: false }); if (r && (r.message || r.objet)) { sh.subject = String(r.objet || sh.subject); sh.body = String(r.message || sh.body); } else sh.err = 'La réponse de l’IA était incomplète, réessayez.'; }
    catch (e) { sh.err = sampleErr(e); }
    sh.busy = false; sh.ctl = null; if (UI.sheet === sh) renderSheet();
  },
  copyCompose: async () => { const s = UI.sheet; try { await navigator.clipboard.writeText('Objet : ' + s.subject + '\n\n' + s.body); toast('Texte copié'); } catch (e) { toast('Copie impossible ici'); } },
  composePdf: () => { const ctx = composeCtx(UI.sheet); if (ctx && ctx.attach) saveFile(ctx.attach.name, ctx.attach.make(), 'application/pdf'); },
  gmailDraft: async () => {
    const sh = UI.sheet; if (!MCP || !sh || sh.sending) return; const ctx = composeCtx(sh); if (!ctx.to) return;
    sh.sending = true; sh.err = ''; renderSheet();
    const input = { to: [ctx.to], subject: sh.subject, body: sh.body, includeSignature: false };
    if (ctx.attach) input.attachments = [{ content: b64(ctx.attach.make()), filename: ctx.attach.name, mimeType: 'application/pdf' }];
    try {
      const res = await MCP.callTool('Gmail', 'create_draft', input); const p = (res && res.payload) || {};
      sh.draftUrl = (p && (p.viewUrl || (p.draft && p.draft.viewUrl))) || ''; sh.draftOk = true; toast('Brouillon créé dans Gmail');
      if (sh.mode === 'relance' && ctx.contactId) addHistory(ctx.contactId, 'email', 'E-mail préparé dans Gmail : ' + sh.subject);
    } catch (e) { sh.err = mcpErr(e); }
    sh.sending = false; if (UI.sheet === sh) renderSheet();
  }
};
const CHG = {
  f: el => {
    if (!guard()) { render(); renderSheet(); return; }
    const { col, id, path, kind } = el.dataset;
    const v = kind === 'bool' ? el.checked : kind === 'num' ? (el.value === '' ? null : Number(el.value)) : el.value;
    if (col === 'settings') { editSettings(s => setPath(s, path, v)); return; }
    edit(col, id, o => setPath(o, path, v));
    if (el.dataset.rerender) renderSheet();
  },
  etape: el => { moveStage(el.dataset.id, el.value); if (UI.sheet && UI.sheet.kind === 'contact') renderSheet(); },
  formule: el => {
    if (!guard()) return; const id = el.dataset.id; const l = S.logements[id]; const de = formuleOf(l).nom; const vers = (S.settings.formules.find(f => f.id === el.value) || {}).nom;
    edit('logements', id, o => { o.contrat.formuleId = el.value; o.contrat.avenants = o.contrat.avenants || []; o.contrat.avenants.push({ date: TODAY(), de, vers }); });
    addHistory(l.proprietaireId, 'note', 'Avenant : ' + l.nom + ', formule ' + de + ' → ' + vers); renderSheet(); toast('Formule changée');
  },
  assign: el => { if (!guard()) return; edit('missions', el.dataset.id, m => { m.conciergeId = el.value; }); toast(el.value ? 'Concierge attribué' : 'Mission à attribuer'); },
  astreinte: el => { if (!guard()) return; upsert('astreinte', el.dataset.week, {}, a => { a.associe = el.value; }); toast('Astreinte : ' + PROFILES[el.value].nom); },
  rapMot: el => { if (!guard()) return; const { id, ym } = el.dataset; upsert('rapports', id + '_' + ym, { logementId: id, mois: ym, envoyeLe: '' }, r => { r.mot = el.value; }); },
  check: el => {
    if (!guard()) return; const m = S.missions[el.dataset.id]; const l = S.logements[m.logementId]; const t = l.checklist[+el.dataset.i];
    edit('missions', m.id, o => { o.faits = (o.faits || []).filter(x => x !== t); if (el.checked) o.faits.push(t); if (o.statut === 'a_faire') o.statut = 'en_cours'; });
    renderSheet();
  },
  photo: async el => {
    if (!guard()) return; const { id, w } = el.dataset; const files = [...(el.files || [])]; if (!files.length) return;
    if (ASSETS) {
      toast('Envoi de ' + plural(files.length, 'photo') + '…'); const ids = [];
      for (const f of files) { try { const r = await ASSETS.upload(await shrink(f)); ids.push(r.id); } catch (e) { toast('Une photo n’a pas pu être envoyée.'); } }
      if (ids.length) { edit('missions', id, o => { o.photoIds = o.photoIds || {}; o.photoIds[w] = (o.photoIds[w] || []).concat(ids); o.photos = o.photos || {}; o.photos[w] = (o.photos[w] || 0) + ids.length; }); toast('Photos enregistrées'); }
    } else {
      PHOTO_CACHE[id + w] = (PHOTO_CACHE[id + w] || []).concat(files.map(f => URL.createObjectURL(f)));
      edit('missions', id, o => { o.photos = o.photos || {}; o.photos[w] = (o.photos[w] || 0) + files.length; });
    }
    if (UI.sheet && UI.sheet.id === id) renderSheet();
  },
  zone: el => { if (!guard()) return; const z = el.dataset.z; edit('concierges', el.dataset.id, c => { c.zone = (c.zone || []).filter(x => x !== z); if (el.checked) c.zone.push(z); }); },
  concPaid: el => { if (!guard()) return; edit('concierges', el.dataset.id, c => { c.paiements = c.paiements || {}; c.paiements[el.dataset.ym] = el.checked; }); },
  profile: el => { UI.profile = el.value; setPref('profile', el.value); if (UI.sheet && UI.sheet.kind === 'menu') closeSheet(); location.hash = isConcierge() ? 'missions' : isOwner() ? 'proprio' : 'accueil'; render(); }
};
const SUBMIT = {
  newContact: (f, fd) => {
    if (!guard()) return;
    const c = { id: uid('pr-'), type: 'prospect', prenom: fd.get('prenom').trim(), nom: fd.get('nom').trim(), tel: fd.get('tel'), email: fd.get('email'), commune: fd.get('commune'), origine: fd.get('origine'), prescripteur: (fd.get('prescripteur') || '').trim(), bien: fd.get('bien'), etape: S.settings.etapes[0].id, relance: fd.get('relance'), consentementEmail: !!fd.get('consentementEmail'), bloctel: false, notes: '', perduRaison: '', historique: [{ date: TODAY(), type: 'note', texte: 'Fiche créée', auteur: profileName() }], createdAt: TODAY() };
    put('contacts', c); openSheet('contact', { id: c.id }); toast('Prospect créé');
  },
  addHist: (f, fd) => { if (!guard()) return; const id = f.dataset.id; edit('contacts', id, c => { c.historique = c.historique || []; c.historique.push({ date: fd.get('date') || TODAY(), type: fd.get('type'), texte: fd.get('texte').trim(), auteur: profileName() }); }); renderSheet(); toast('Échange ajouté'); },
  lost: (f, fd) => { if (!guard()) return; const id = f.dataset.id; const r = fd.get('raison'); edit('contacts', id, c => { c.etape = 'perdu'; c.perduRaison = r; c.relance = ''; c.historique = c.historique || []; c.historique.push({ date: TODAY(), type: 'note', texte: 'Classé perdu : ' + r, auteur: profileName() }); }); UI.sheet.lost = false; renderSheet(); toast('Contact classé perdu'); },
  sign: (f, fd) => {
    if (!guard()) return;
    const pid = f.dataset.id || fd.get('proprietaireId');
    const fo = S.settings.formules.find(x => x.id === fd.get('formuleId')) || S.settings.formules[0];
    const l = { id: uid('l-'), nom: fd.get('nom').trim(), adresse: fd.get('adresse'), commune: fd.get('commune'), type: fd.get('type'), capacite: Number(fd.get('capacite')) || 0, proprietaireId: pid, contrat: { formuleId: fo.id, debut: fd.get('debut') || TODAY(), statut: 'actif', avenants: [] }, acces: { code: '', wifi: '' }, consignes: '', checklist: DEFAULT_CHECKLIST.slice(), conformite: { enregistrement: '', dpe: '', classement: '', assurance: '' }, createdAt: TODAY() };
    put('logements', l);
    edit('contacts', pid, c => { c.type = 'client'; c.etape = 'signe'; c.relance = ''; c.historique = c.historique || []; c.historique.push({ date: TODAY(), type: 'note', texte: 'Contrat signé : ' + l.nom + ', formule ' + fo.nom + ' (' + eur0(fo.prix) + ' HT/mois)', auteur: profileName() }); });
    openSheet('logement', { id: l.id }); toast('Contrat signé, logement créé');
  },
  addCheck: (f, fd) => { if (!guard()) return; const t = fd.get('t').trim(); if (!t) return; edit('logements', f.dataset.id, l => { l.checklist = l.checklist || []; l.checklist.push(t); }); renderSheet(); },
  newMission: (f, fd) => {
    if (!guard()) return;
    const l = S.logements[fd.get('logementId')]; if (!l) return;
    const ty = fd.get('type'); const svc = ty.startsWith('service:') ? S.settings.services.find(s => 'service:' + s.id === ty) : null;
    let cid = fd.get('conciergeId'); if (cid === 'auto') cid = suggestConcierge(l)?.id || '';
    const m = { id: uid('m-'), logementId: l.id, date: fd.get('date'), heure: fd.get('heure') || '11:00', type: svc ? 'service' : 'rotation', libelle: svc ? svc.nom : '', prix: svc ? svc.prix : 0, conciergeId: cid, statut: 'a_faire', faits: [], photos: { avant: 0, apres: 0 }, source: 'manuel', doneAt: '' };
    put('missions', m); UI.weekStart = mondayOf(m.date); closeSheet(); toast('Mission créée' + (cid ? ' pour ' + fullName(S.concierges[cid]) : ', à attribuer'));
  },
  ical: async (f, fd) => {
    if (!guard()) return;
    const l = S.logements[fd.get('logementId')]; if (!l) return;
    let txt = fd.get('txt') || ''; const file = fd.get('file'); if (file && file.size) { try { txt = await file.text(); } catch (e) { /* lecture impossible */ } }
    const evs = txt.replace(/\r\n[ \t]/g, '').split('BEGIN:VEVENT').slice(1);
    let created = 0, dup = 0, blocked = 0, past = 0; const t = TODAY(); const cid = suggestConcierge(l)?.id || '';
    evs.forEach(ev => {
      const sum = (/SUMMARY[^:]*:(.*)/.exec(ev) || [])[1] || ''; const end = (/DTEND[^:]*:(\d{8})/.exec(ev) || [])[1]; if (!end) return;
      if (/not available|blocked|closed|indisponible/i.test(sum)) { blocked++; return; }
      const d = end.slice(0, 4) + '-' + end.slice(4, 6) + '-' + end.slice(6, 8);
      if (d < t) { past++; return; }
      if (list('missions').some(m => m.logementId === l.id && m.type === 'rotation' && m.date === d)) { dup++; return; }
      put('missions', { id: uid('m-'), logementId: l.id, date: d, heure: '11:00', type: 'rotation', libelle: '', prix: 0, conciergeId: cid, statut: 'a_faire', faits: [], photos: { avant: 0, apres: 0 }, source: 'ical', doneAt: '' }); created++;
    });
    UI.sheet.result = evs.length ? `${plural(created, 'rotation créée', 'rotations créées')} pour ${l.nom}${dup ? ', ' + dup + ' déjà prévue' + (dup > 1 ? 's' : '') : ''}${blocked ? ', ' + plural(blocked, 'date bloquée ignorée', 'dates bloquées ignorées') : ''}${past ? ', ' + plural(past, 'date passée ignorée', 'dates passées ignorées') : ''}.` : 'Aucune réservation trouvée dans ce calendrier.';
    renderSheet();
  },
  problem: (f, fd) => { if (!guard()) return; const m = S.missions[f.dataset.id]; put('incidents', { id: uid('i-'), logementId: m.logementId, missionId: m.id, date: TODAY(), niveau: fd.get('niveau'), texte: fd.get('texte').trim(), statut: 'ouvert', auteur: isConcierge() ? fullName(myConcierge()) : profileName() }); UI.sheet.problem = false; renderSheet(); toast('Problème signalé à l’équipe'); },
  newConcierge: (f, fd) => {
    if (!guard()) return;
    const c = { id: uid('c-'), prenom: fd.get('prenom').trim(), nom: fd.get('nom').trim(), tel: fd.get('tel'), email: '', zone: fd.getAll('zone'), siret: fd.get('siret'), tarif: { petit: Number(fd.get('petit')) || 0, grand: Number(fd.get('grand')) || 0 }, docs: { urssaf: fd.get('urssaf'), rcpro: fd.get('rcpro') }, paiements: {}, actif: true };
    put('concierges', c); openSheet('concierge', { id: c.id }); toast('Concierge ajouté');
  },
  newStock: (f, fd) => { if (!guard()) return; const s = { id: uid('st-'), nom: fd.get('nom').trim(), unite: fd.get('unite') || 'unités', quantite: Number(fd.get('quantite')) || 0, seuil: Number(fd.get('seuil')) || 0, parRotation: Number(fd.get('parRotation')) || 0, mouvements: [] }; put('stocks', s); closeSheet(); toast('Article ajouté'); },
  restock: (f, fd) => { if (!guard()) return; const q = Number(fd.get('q')) || 0; if (!q) return; edit('stocks', f.dataset.id, s => { s.quantite = r2((s.quantite || 0) + q); s.mouvements = (s.mouvements || []).concat([{ date: TODAY(), delta: q, motif: 'Réapprovisionnement' }]).slice(-15); }); renderSheet(); toast('Stock mis à jour'); },
  newFrais: (f, fd) => {
    if (!guard()) return; const km = f.dataset.type === 'km';
    const o = { id: uid('fr-'), date: fd.get('date'), associe: fd.get('associe'), type: km ? 'km' : 'depense', depart: km ? fd.get('depart').trim() : '', arrivee: km ? fd.get('arrivee').trim() : '', km: km ? (Number(fd.get('km')) || 0) * (fd.get('ar') ? 2 : 1) : 0, motif: km ? fd.get('motif').trim() + (fd.get('ar') ? ' (aller-retour)' : '') : '', libelle: km ? '' : fd.get('libelle').trim(), montant: km ? 0 : Number(fd.get('montant')) || 0, categorie: km ? '' : fd.get('categorie') };
    put('frais', o); UI.fraisMonth = o.date.slice(0, 7); closeSheet(); toast(km ? 'Trajet enregistré : ' + num1(o.km) + ' km' : 'Dépense enregistrée');
  },
  ask: (f, fd) => { const q = fd.get('q') || ''; askAI(q); }
};

/* ---------- Événements ---------- */
document.addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (!a) return; const fn = ACT[a.dataset.act]; if (!fn) return; if (a.tagName !== 'A') e.preventDefault(); fn(a, e); });
document.addEventListener('change', e => { const a = e.target.closest('[data-chg]'); if (!a) return; const fn = CHG[a.dataset.chg]; if (fn) fn(a, e); });
document.addEventListener('submit', e => { const f = e.target.closest('form[data-submit]'); if (!f) return; e.preventDefault(); const fn = SUBMIT[f.dataset.submit]; if (fn) fn(f, new FormData(f)); });
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.input;
  if (k === 'crmSearch') { UI.q = e.target.value; const box = $('#crm-list'); if (box) box.innerHTML = crmListHTML(); }
  else if (k === 'cmpSubject' && UI.sheet) UI.sheet.subject = e.target.value;
  else if (k === 'cmpBody' && UI.sheet) UI.sheet.body = e.target.value;
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && UI.sheet) closeSheet();
  if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'chat-input') { e.preventDefault(); const q = e.target.value; e.target.value = ''; askAI(q); }
});
document.addEventListener('dragstart', e => { const d = e.target.closest && e.target.closest('[data-drag]'); if (!d) return; e.dataTransfer.setData('text/plain', d.dataset.drag); e.dataTransfer.effectAllowed = 'move'; });
document.addEventListener('dragover', e => { const c = e.target.closest && e.target.closest('[data-drop]'); if (c) { e.preventDefault(); c.classList.add('drop-hover'); } });
document.addEventListener('dragleave', e => { const c = e.target.closest && e.target.closest('[data-drop]'); if (c && !c.contains(e.relatedTarget)) c.classList.remove('drop-hover'); });
document.addEventListener('drop', e => { const c = e.target.closest && e.target.closest('[data-drop]'); if (!c) return; e.preventDefault(); c.classList.remove('drop-hover'); moveStage(e.dataTransfer.getData('text/plain'), c.dataset.drop); });
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (VIEWS.includes(h)) { UI.view = h; pageArmed = ''; render(); window.scrollTo(0, 0); } });

boot();
