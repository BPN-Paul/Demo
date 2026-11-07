/* Mini générateur PDF sans dépendance (Helvetica, encodage WinAnsi : accents, €, guillemets).
   API en points, origine en haut à gauche (A4 : 595 × 842). */
(function (root) {
  const PW = 595.28, PH = 841.89;
  const HW = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
  const WIN = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F };
  const SPECIAL_W = { 0x20AC: 556, 0x2019: 222, 0x2018: 222, 0x201C: 333, 0x201D: 333, 0x2013: 556, 0x2014: 1000, 0x2026: 1000, 0xA0: 278, 0x202F: 278, 0x2022: 350, 0xAB: 556, 0xBB: 556, 0xB0: 400, 0x0153: 944, 0x0152: 1000, 0xE6: 889, 0xDF: 611 };
  const SPACES = new Set([0x202F, 0x2009, 0x2007, 0x2002, 0x2003]);

  function charW(ch, bold) {
    const c = ch.codePointAt(0);
    let w;
    if (c >= 32 && c <= 126) w = HW[c - 32];
    else if (SPECIAL_W[c]) w = SPECIAL_W[c];
    else { const base = ch.normalize('NFD')[0]; const bc = base.codePointAt(0); w = (bc >= 32 && bc <= 126) ? HW[bc - 32] : 556; }
    if (bold && !(c >= 48 && c <= 57)) w *= 1.08;
    return w;
  }
  function width(s, size, bold) { let w = 0; for (const ch of String(s)) w += charW(ch, bold); return w * size / 1000; }
  function encode(s) {
    let out = '';
    for (const ch of String(s)) {
      let c = ch.codePointAt(0);
      if (SPACES.has(c)) c = 0x20;
      if (c === 0x0A || c === 0x0D || c === 0x09) c = 0x20;
      let b;
      if ((c >= 32 && c < 127) || (c >= 0xA0 && c <= 0xFF)) b = c;
      else if (WIN[c]) b = WIN[c];
      else b = 0x3F;
      if (b === 0x28) out += '\\(';
      else if (b === 0x29) out += '\\)';
      else if (b === 0x5C) out += '\\\\';
      else if (b < 32 || b > 126) out += '\\' + b.toString(8).padStart(3, '0');
      else out += String.fromCharCode(b);
    }
    return out;
  }
  const n = v => (Math.round(v * 100) / 100).toString();
  function rgb(hex) { const h = hex.replace('#', ''); return [0, 2, 4].map(i => n(parseInt(h.slice(i, i + 2), 16) / 255)).join(' '); }

  class Doc {
    constructor(title) { this.title = title || 'Document'; this.pages = []; this.addPage(); }
    addPage() { this.ops = []; this.pages.push(this.ops); return this; }
    get width() { return PW; }
    get height() { return PH; }
    text(x, y, s, o = {}) {
      const size = o.size || 10, bold = !!o.bold, sp = o.spacing || 0;
      let xx = x;
      if (o.align === 'right' || o.align === 'center') {
        const w = width(s, size, bold) + sp * Math.max(0, [...String(s)].length - 1);
        xx = o.align === 'right' ? x - w : x - w / 2;
      }
      this.ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${n(sp)} Tc ${rgb(o.color || '#14303A')} rg ${n(xx)} ${n(PH - y)} Td (${encode(s)}) Tj ET`);
      return this;
    }
    rect(x, y, w, h, o = {}) {
      const parts = [];
      if (o.fill) parts.push(rgb(o.fill) + ' rg');
      if (o.stroke) parts.push(rgb(o.stroke) + ' RG ' + n(o.lw || 1) + ' w');
      parts.push(`${n(x)} ${n(PH - y - h)} ${n(w)} ${n(h)} re ${o.fill && o.stroke ? 'B' : o.fill ? 'f' : 'S'}`);
      this.ops.push(parts.join(' '));
      return this;
    }
    line(x1, y1, x2, y2, o = {}) { this.ops.push(`${rgb(o.color || '#E4DBCC')} RG ${n(o.lw || 0.8)} w ${n(x1)} ${n(PH - y1)} m ${n(x2)} ${n(PH - y2)} l S`); return this; }
    poly(pts, o = {}) {
      const d = pts.map((p, i) => `${n(p[0])} ${n(PH - p[1])} ${i ? 'l' : 'm'}`).join(' ');
      this.ops.push(`${rgb(o.color || '#B8964A')} RG ${n(o.lw || 1)} w 0 j ${d} ${o.close ? 'h ' : ''}S`);
      return this;
    }
    wrap(s, maxW, size, bold) {
      const lines = [];
      String(s || '').split(/\n/).forEach(par => {
        let cur = '';
        par.split(/\s+/).filter(Boolean).forEach(word => {
          const t = cur ? cur + ' ' + word : word;
          if (width(t, size, bold) <= maxW || !cur) cur = t; else { lines.push(cur); cur = word; }
        });
        lines.push(cur);
      });
      return lines;
    }
    paragraph(x, y, s, maxW, o = {}) {
      const size = o.size || 10, lh = o.lineHeight || size * 1.4;
      const lines = this.wrap(s, maxW, size, o.bold);
      lines.forEach((l, i) => this.text(x, y + i * lh, l, o));
      return y + lines.length * lh;
    }
    /* Logo BPN : clé dont la tête est une maison */
    logo(x, y, h, color) {
      const k = h / 40, P = (a, b) => [x + a * k, y + b * k];
      this.poly([P(3, 11.5), P(12, 3), P(21, 11.5), P(21, 21), P(3, 21)], { color, lw: 2.8 * k, close: true });
      this.rect(x + 10.6 * k, y + 21 * k, 2.8 * k, 17.5 * k, { fill: color });
      this.rect(x + 13.4 * k, y + 29.2 * k, 5.2 * k, 2.6 * k, { fill: color });
      this.rect(x + 13.4 * k, y + 34.4 * k, 5.2 * k, 2.6 * k, { fill: color });
      this.rect(x + 16 * k, y + 29.2 * k, 2.6 * k, 7.8 * k, { fill: color });
      return this;
    }
    output() {
      const objs = [null, null, null, null];
      const kids = [];
      this.pages.forEach(ops => {
        const content = ops.join('\n');
        objs.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
        const cn = objs.length;
        objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${cn} 0 R >>`);
        kids.push(objs.length);
      });
      objs.push(`<< /Title (${encode(this.title)}) /Producer (BPN Gestion) >>`);
      const info = objs.length;
      objs[0] = '<< /Type /Catalog /Pages 2 0 R >>';
      objs[1] = `<< /Type /Pages /Kids [${kids.map(k => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
      objs[2] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
      objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
      let out = '%PDF-1.4\n';
      const offs = [];
      objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
      const xref = out.length;
      out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
      out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
      const bytes = new Uint8Array(out.length);
      for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xFF;
      return bytes;
    }
  }
  const api = { PDFDoc: Doc, pdfTextWidth: width };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof window !== 'undefined' ? window : globalThis);
