/* Documents PDF de BPN : facture et compte rendu mensuel. Fonctions pures : données en entrée, octets PDF en sortie. */
(function (root) {
  const PDFDoc = root.PDFDoc || (typeof require !== 'undefined' ? require('./pdf.js').PDFDoc : null);
  const C = { vert: '#14303A', laiton: '#B8964A', ivoire: '#F6F1E9', ocean: '#1878A0', texte: '#14303A', gris: '#5B6A70', ligne: '#E4DBCC', fond: '#FAF6EF', ok: '#2E7A4B', crit: '#B1393A' };
  const eur = v => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v || 0);
  const d8 = iso => { if (!iso) return '—'; const [y, m, d] = iso.split('-').map(Number); return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(y, m - 1, d)); };
  const dShort = iso => { const [y, m, d] = iso.split('-').map(Number); return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d)); };
  const mois = ym => new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1));

  function header(doc, kicker, title) {
    const W = doc.width;
    doc.rect(0, 0, W, 104, { fill: C.vert });
    doc.logo(46, 26, 54, C.laiton);
    doc.rect(84, 30, 1.2, 46, { fill: C.laiton });
    doc.text(96, 58, 'BPN', { size: 28, bold: true, color: C.ivoire, spacing: 2 });
    doc.text(97, 74, 'VOTRE BIEN, NOTRE ENGAGEMENT', { size: 7, color: C.ivoire, spacing: 1.4 });
    doc.text(W - 46, 50, kicker, { size: 9, bold: true, color: C.laiton, align: 'right', spacing: 1.5 });
    doc.text(W - 46, 72, title, { size: 16, bold: true, color: C.ivoire, align: 'right' });
  }
  function footer(doc, txt) {
    const W = doc.width, H = doc.height;
    doc.line(46, H - 58, W - 46, H - 58, { color: C.ligne });
    doc.paragraph(46, H - 42, txt, W - 92, { size: 7.5, color: C.gris, lineHeight: 10 });
  }

  function invoicePDF(p) {
    const { f, client, logement, statut } = p;
    const avoir = f.type === 'avoir';
    const doc = new PDFDoc((avoir ? 'Avoir ' : 'Facture ') + f.numero);
    const W = doc.width, L = 46, R = W - 46;
    header(doc, avoir ? 'AVOIR' : 'FACTURE', f.numero);
    let y = 140;
    doc.text(L, y, 'BPN SAS', { size: 10, bold: true });
    doc.text(L, y + 14, 'Conciergerie de locations saisonnières', { size: 9, color: C.gris });
    doc.text(L, y + 27, 'Côte sud du Morbihan', { size: 9, color: C.gris });
    doc.rect(R - 220, y - 14, 220, 76, { fill: C.fond, stroke: C.ligne, lw: 0.6 });
    doc.text(R - 206, y + 2, 'Facturé à', { size: 8, bold: true, color: C.gris });
    doc.text(R - 206, y + 18, client || '—', { size: 11, bold: true });
    doc.paragraph(R - 206, y + 33, (logement ? logement.nom + ' · ' + (logement.adresse ? logement.adresse + ', ' : '') + logement.commune : ''), 192, { size: 8.5, color: C.gris, lineHeight: 11 });
    y = 236;
    const meta = [['Date d’émission', d8(f.date)], avoir ? ['Annule la facture', f.ref || '—'] : ['Échéance', d8(f.echeance)], ['Période', mois(f.mois)]];
    meta.forEach((m, i) => { const x = L + i * 168; doc.text(x, y, m[0], { size: 8, bold: true, color: C.gris }); doc.text(x, y + 15, m[1], { size: 10.5 }); });
    y = 284;
    const cQ = R - 190, cPU = R - 100;
    doc.rect(L, y, R - L, 24, { fill: C.vert });
    doc.text(L + 10, y + 16, 'Désignation', { size: 8.5, bold: true, color: C.ivoire });
    doc.text(cQ, y + 16, 'Qté', { size: 8.5, bold: true, color: C.ivoire, align: 'right' });
    doc.text(cPU, y + 16, 'PU HT', { size: 8.5, bold: true, color: C.ivoire, align: 'right' });
    doc.text(R - 10, y + 16, 'Total HT', { size: 8.5, bold: true, color: C.ivoire, align: 'right' });
    y += 24;
    f.lignes.forEach((li, i) => {
      const lines = doc.wrap(li.libelle, cQ - L - 50, 9.5);
      const h = Math.max(26, 12 + lines.length * 13);
      if (i % 2) doc.rect(L, y, R - L, h, { fill: C.fond });
      lines.forEach((t, k) => doc.text(L + 10, y + 17 + k * 13, t, { size: 9.5 }));
      doc.text(cQ, y + 17, String(li.qte), { size: 9.5, align: 'right' });
      doc.text(cPU, y + 17, eur(li.pu), { size: 9.5, align: 'right' });
      doc.text(R - 10, y + 17, eur(li.qte * li.pu), { size: 9.5, align: 'right' });
      y += h;
    });
    doc.line(L, y, R, y, { color: C.ligne });
    y += 22;
    const tx = R - 220;
    [['Total HT', eur(f.totalHT)], ['TVA ' + f.tva + ' %', eur(f.totalTVA)]].forEach(([a, b]) => { doc.text(tx, y, a, { size: 10, color: C.gris }); doc.text(R - 10, y, b, { size: 10, align: 'right' }); y += 18; });
    doc.rect(tx - 10, y - 8, R - tx + 10, 30, { fill: C.vert });
    doc.text(tx, y + 12, 'Total TTC', { size: 11, bold: true, color: C.ivoire });
    doc.text(R - 10, y + 12, eur(f.totalTTC), { size: 13, bold: true, color: C.laiton, align: 'right' });
    y += 46;
    if (statut) {
      const col = statut.tone === 'ok' ? C.ok : statut.tone === 'crit' ? C.crit : C.ocean;
      doc.rect(L, y - 30, 150, 30, { stroke: col, lw: 1.4 });
      doc.text(L + 75, y - 11, statut.label.toUpperCase(), { size: 10, bold: true, color: col, align: 'center', spacing: 1 });
    }
    y += 10;
    if (!avoir) doc.paragraph(L, y, 'Règlement par prélèvement SEPA ou virement à réception. Merci de rappeler le numéro de facture.', R - L, { size: 9, color: C.gris });
    footer(doc, 'Document généré par BPN Gestion (prototype). À compléter avant tout usage réel : forme et capital de la société, adresse du siège, SIREN et RCS, numéro de TVA intracommunautaire, conditions et pénalités de retard. À partir du 1er septembre 2027, les factures seront émises via une plateforme agréée.');
    return doc.output();
  }

  function rapportPDF(p) {
    const { logement, proprietaire, ym, stats, mot } = p;
    const doc = new PDFDoc('Compte rendu ' + logement.nom + ' ' + ym);
    const W = doc.width, L = 46, R = W - 46;
    header(doc, 'COMPTE RENDU MENSUEL', mois(ym).replace(/^./, c => c.toUpperCase()));
    let y = 140;
    doc.text(L, y, logement.nom, { size: 17, bold: true });
    doc.text(L, y + 17, [logement.type, logement.commune, 'Propriétaire : ' + (proprietaire || '—')].filter(Boolean).join(' · '), { size: 9.5, color: C.gris });
    y = 186;
    const tiles = [['Rotations faites', String(stats.faites)], ['Incluses au forfait', String(stats.quota)], ['Rotations en plus', String(stats.enPlus)], ['Incidents', String(stats.incidents.length)]];
    const tw = (R - L - 30) / 4;
    tiles.forEach((t, i) => {
      const x = L + i * (tw + 10);
      doc.rect(x, y, tw, 58, { fill: C.fond, stroke: C.ligne, lw: 0.6 });
      doc.text(x + 12, y + 20, t[0], { size: 8, bold: true, color: C.gris });
      doc.text(x + 12, y + 46, t[1], { size: 22, bold: true, color: i === 2 && stats.enPlus ? C.laiton : C.vert });
    });
    y = 272;
    doc.text(L, y, 'Le mot du mois', { size: 11, bold: true, color: C.ocean });
    y = doc.paragraph(L, y + 18, mot || 'Aucun commentaire ce mois-ci.', R - L, { size: 10, lineHeight: 15 });
    y += 14;
    doc.text(L, y, 'Interventions', { size: 11, bold: true, color: C.ocean });
    y += 10;
    const rows = stats.missions.length ? stats.missions : [{ date: '', libelle: 'Aucune intervention ce mois-ci', qui: '', statut: '' }];
    rows.slice(0, 16).forEach((m, i) => {
      if (i % 2 === 0) doc.rect(L, y, R - L, 20, { fill: C.fond });
      doc.text(L + 8, y + 14, m.date ? dShort(m.date) : '', { size: 9 });
      doc.text(L + 100, y + 14, m.libelle, { size: 9 });
      doc.text(L + 300, y + 14, m.qui || '', { size: 9, color: C.gris });
      doc.text(R - 8, y + 14, m.statut || '', { size: 9, align: 'right', color: m.statut === 'Faite' ? C.ok : C.gris });
      y += 20;
    });
    if (stats.missions.length > 16) { doc.text(L + 8, y + 12, '… et ' + (stats.missions.length - 16) + ' autres', { size: 8.5, color: C.gris }); y += 16; }
    y += 18;
    if (stats.incidents.length) {
      doc.text(L, y, 'Incidents', { size: 11, bold: true, color: C.ocean });
      y += 16;
      stats.incidents.forEach(i => { y = doc.paragraph(L + 8, y, '• ' + dShort(i.date) + ' : ' + i.texte + (i.statut === 'clos' ? ' (résolu)' : ' (en cours)'), R - L - 16, { size: 9.5, lineHeight: 13 }) + 4; });
      y += 10;
    }
    doc.text(L, y, 'Facturation', { size: 11, bold: true, color: C.ocean });
    y += 18;
    stats.montants.forEach(([a, b]) => { doc.text(L + 8, y, a, { size: 9.5 }); doc.text(R - 8, y, b, { size: 9.5, align: 'right' }); y += 15; });
    footer(doc, 'BPN SAS · Conciergerie de locations saisonnières, côte sud du Morbihan. Les rotations au-delà du forfait sont facturées avec l’abonnement du mois suivant. Revenus locatifs détaillés : disponibles une fois le logiciel de gestion locative connecté.');
    return doc.output();
  }

  const api = { invoicePDF, rapportPDF };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof window !== 'undefined' ? window : globalThis);
