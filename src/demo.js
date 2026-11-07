/* Données d'exemple BPN — utilisées en mode démo et pour remplir la base partagée. */
(function (root) {
  function pad(n) { return String(n).padStart(2, '0'); }
  function addDays(iso, n) { const [y, m, d] = iso.split('-').map(Number); const t = new Date(y, m - 1, d + n); return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()); }
  function addMonths(ym, n) { let [y, m] = ym.split('-').map(Number); m += n; while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; } return y + '-' + pad(m); }
  function monthLen(ym) { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); }
  function dayIn(ym, d) { return ym + '-' + pad(Math.min(Math.max(1, d), monthLen(ym))); }
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function moisLabel(ym) { return MOIS[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4); }

  const DEFAULT_CHECKLIST = [
    "Aérer et vérifier l'état général",
    'Changer draps et serviettes',
    'Nettoyer cuisine et électroménager',
    'Nettoyer salle de bain et WC',
    'Aspirer et laver les sols',
    'Vider les poubelles',
    'Réassort consommables (café, savon, papier)',
    "Vérifier le kit d'accueil",
    'Fermer volets et fenêtres',
    'Vérifier la serrure et la boîte à clés'
  ];

  function defaultSettings() {
    return {
      formules: [
        { id: 'essentiel', nom: 'Essentiel', prix: 249, quota: 4 },
        { id: 'confort', nom: 'Confort', prix: 349, quota: 4 },
        { id: 'prestige', nom: 'Prestige', prix: 489, quota: 4 }
      ],
      tarifSup: { petit: 55, grand: 85 },
      tva: 20,
      delaiPaiement: 15,
      etapes: [
        { id: 'contact', nom: 'Premier contact' },
        { id: 'rdv', nom: 'Rendez-vous' },
        { id: 'audit', nom: 'Audit du logement' },
        { id: 'proposition', nom: 'Proposition envoyée' },
        { id: 'signe', nom: 'Contrat signé' },
        { id: 'perdu', nom: 'Perdu' }
      ],
      services: [
        { id: 'courses', nom: "Courses d'arrivée", prix: 25 },
        { id: 'linge', nom: 'Linge supplémentaire', prix: 18 },
        { id: 'intervention', nom: 'Petite intervention', prix: 40 }
      ],
      communes: ['Arzon', 'Sarzeau', 'Carnac', 'La Trinité-sur-Mer', 'Quiberon', 'Belle-Île'],
      vehicules: { paul: 4, bedirhan: 5, jade: 4 },
      commission: 150
    };
  }

  function bpnDemo(today) {
    const M = today.slice(0, 7);
    const P = addMonths(M, -1);
    const settings = defaultSettings();

    const concierges = [
      { id: 'c-maelle', prenom: 'Maëlle', nom: 'Le Goff', tel: '06 01 02 03 04', email: 'maelle.legoff@exemple.fr', zone: ['Carnac', 'Quiberon'], siret: '912 345 678 00012', tarif: { petit: 35, grand: 50 }, docs: { urssaf: addDays(today, 12), rcpro: addDays(today, 210) }, paiements: { [P]: true }, actif: true },
      { id: 'c-yann', prenom: 'Yann', nom: 'Guého', tel: '06 05 06 07 08', email: 'yann.gueho@exemple.fr', zone: ['Arzon', 'Sarzeau'], siret: '923 456 789 00018', tarif: { petit: 35, grand: 50 }, docs: { urssaf: addDays(today, 95), rcpro: addDays(today, 160) }, paiements: { [P]: true }, actif: true },
      { id: 'c-sophie', prenom: 'Sophie', nom: 'Le Bihan', tel: '06 09 10 11 12', email: 'sophie.lebihan@exemple.fr', zone: ['La Trinité-sur-Mer', 'Belle-Île'], siret: '934 567 890 00025', tarif: { petit: 35, grand: 50 }, docs: { urssaf: addDays(today, -3), rcpro: addDays(today, 300) }, paiements: {}, actif: true }
    ];

    const h = (date, type, texte, auteur) => ({ date, type, texte, auteur: auteur || 'Paul' });
    const debut = addMonths(P, -4) + '-01';

    const owners = [
      { id: 'p-lefloch', prenom: 'Martine', nom: 'Le Floch', commune: 'Carnac', tel: '06 20 21 22 23', email: 'martine.lefloch@exemple.fr', origine: 'Bouche-à-oreille', formule: 'confort' },
      { id: 'p-daniel', prenom: 'Jean-Pierre', nom: 'Daniel', commune: 'Arzon', tel: '06 24 25 26 27', email: 'jp.daniel@exemple.fr', origine: 'Site web', formule: 'prestige' },
      { id: 'p-morvan', prenom: 'Isabelle', nom: 'Morvan', commune: 'Quiberon', tel: '06 28 29 30 31', email: 'isabelle.morvan@exemple.fr', origine: 'Prescripteur', prescripteur: 'Agence Océane (exemple)', formule: 'essentiel' },
      { id: 'p-riou', prenom: 'Hervé', nom: 'Riou', commune: 'La Trinité-sur-Mer', tel: '06 32 33 34 35', email: 'herve.riou@exemple.fr', origine: 'Salon / événement', formule: 'confort' },
      { id: 'p-guillemot', prenom: 'Claire', nom: 'Guillemot', commune: 'Sarzeau', tel: '06 36 37 38 39', email: 'claire.guillemot@exemple.fr', origine: 'Site web', formule: 'prestige' }
    ];

    const contacts = owners.map(o => {
      const f = settings.formules.find(x => x.id === o.formule);
      return {
        id: o.id, type: 'client', prenom: o.prenom, nom: o.nom, tel: o.tel, email: o.email, commune: o.commune,
        origine: o.origine, prescripteur: o.prescripteur || '', bien: '', etape: 'signe', relance: '',
        consentementEmail: true, bloctel: false, notes: '', perduRaison: '',
        historique: [
          h(addDays(debut, -20), 'appel', 'Premier appel, intéressé par une gestion complète.'),
          h(addDays(debut, -12), 'rdv', 'Visite du logement et audit sur place.'),
          h(addDays(debut, -2), 'note', 'Contrat signé, formule ' + f.nom + ' (' + f.prix + ' € HT/mois).')
        ],
        createdAt: addDays(debut, -20)
      };
    });

    const prospects = [
      { id: 'pr-leroux', prenom: 'Patrick', nom: 'Le Roux', commune: 'Belle-Île', etape: 'contact', relance: today, origine: 'Site web', bien: 'Maison 5 couchages à Le Palais', hist: [h(addDays(today, -3), 'email', 'Demande via le formulaire du site, souhaite être rappelé.')] },
      { id: 'pr-pichon', prenom: 'Anne', nom: 'Pichon', commune: 'La Trinité-sur-Mer', etape: 'contact', relance: addDays(today, 5), origine: 'Salon / événement', bien: 'Appartement T2 vue port', hist: [h(addDays(today, -8), 'note', 'Rencontrée au salon de l’habitat de Vannes.')] },
      { id: 'pr-tanguy', prenom: 'Nathalie', nom: 'Tanguy', commune: 'Carnac', etape: 'rdv', relance: addDays(today, 1), origine: 'Bouche-à-oreille', bien: 'T3 près de la plage', notes: 'Recommandée par Martine Le Floch.', hist: [h(addDays(today, -5), 'appel', 'Premier appel, rendez-vous fixé.')] },
      { id: 'pr-jegou', prenom: 'Loïc', nom: 'Jégou', commune: 'Carnac', etape: 'rdv', relance: addDays(today, 2), origine: 'Démarchage', bien: 'Studio centre-ville', hist: [h(addDays(today, -4), 'appel', 'Rappel suite au flyer, rendez-vous à caler.')] },
      { id: 'pr-kerbrat', prenom: 'Gaël', nom: 'Kerbrat', commune: 'Quiberon', etape: 'audit', relance: addDays(today, -2), origine: 'Prescripteur', prescripteur: 'Agence Océane (exemple)', bien: 'Maison 8 couchages', hist: [h(addDays(today, -9), 'rdv', 'Rendez-vous chez le propriétaire.'), h(addDays(today, -6), 'note', 'Audit à faire : vérifier le DPE et le numéro d’enregistrement.')] },
      { id: 'pr-allanic', prenom: 'Sylvie', nom: 'Allanic', commune: 'Arzon', etape: 'proposition', relance: addDays(today, 3), origine: 'Site web', bien: 'Villa avec piscine', hist: [h(addDays(today, -10), 'rdv', 'Visite de la villa.'), h(addDays(today, -2), 'email', 'Proposition Prestige envoyée.')] },
      { id: 'pr-ollivier', prenom: 'Thomas', nom: 'Ollivier', commune: 'Sarzeau', etape: 'perdu', relance: '', origine: 'Site web', bien: 'T2', perduRaison: 'Prix', hist: [h(addDays(today, -20), 'appel', 'Premier appel.'), h(addDays(today, -12), 'note', 'Classé perdu : trouve l’abonnement trop cher pour un T2.')] }
    ];
    prospects.forEach((p, i) => {
      contacts.push({
        id: p.id, type: 'prospect', prenom: p.prenom, nom: p.nom, tel: '06 4' + i + ' 00 00 0' + i, email: (p.prenom + '.' + p.nom).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z.]/g, '') + '@exemple.fr',
        commune: p.commune, origine: p.origine, prescripteur: p.prescripteur || '', bien: p.bien, etape: p.etape, relance: p.relance,
        consentementEmail: i % 2 === 0, bloctel: i === 3, notes: p.notes || '', perduRaison: p.perduRaison || '', historique: p.hist, createdAt: p.hist[0].date
      });
    });

    const L = (id, nom, adresse, commune, type, capacite, proprietaireId, formuleId, extra) => Object.assign({
      id, nom, adresse, commune, type, capacite, proprietaireId,
      contrat: { formuleId, debut, statut: 'actif', avenants: [] },
      acces: { code: '', wifi: '' }, consignes: '', checklist: DEFAULT_CHECKLIST.slice(),
      conformite: { enregistrement: '', dpe: addDays(today, 800), classement: addDays(today, 500), assurance: addDays(today, 200) },
      createdAt: debut
    }, extra);

    const logements = [
      L('l-tymor', 'Ty Mor', '12 rue du Tumulus', 'Carnac', 't2', 4, 'p-lefloch', 'confort', { acces: { code: '4821', wifi: 'TyMor-Invites / mor2026' }, consignes: 'Clé de secours dans la boîte à code du portail. Collecte des poubelles le mardi.', conformite: { enregistrement: '56034000123AB', dpe: addDays(today, 900), classement: addDays(today, 40), assurance: addDays(today, 200) } }),
      L('l-kerlann', 'Villa Kerlann', '3 chemin de Kerlann', 'Arzon', 'maison', 8, 'p-daniel', 'prestige', { acces: { code: '1957', wifi: 'Kerlann / golfe-du-morbihan' }, consignes: 'Piscine : vérifier la bâche à chaque départ. Linge de lit king size.', conformite: { enregistrement: '56005000456CD', dpe: addDays(today, 1200), classement: addDays(today, 700), assurance: addDays(today, 150) } }),
      L('l-haliguen', 'Studio Port-Haliguen', '8 quai de Houat', 'Quiberon', 'studio', 2, 'p-morvan', 'essentiel', { acces: { code: '0306', wifi: 'Haliguen / studio56' }, consignes: 'Stationnement sur le parking du port, pas devant l’immeuble.', conformite: { enregistrement: '', dpe: addDays(today, 600), classement: addDays(today, 300), assurance: addDays(today, 90) } }),
      L('l-hortensias', 'Les Hortensias', '21 rue des Hortensias', 'La Trinité-sur-Mer', 't3', 6, 'p-riou', 'confort', { acces: { code: '7714', wifi: 'Hortensias / trinite' }, consignes: 'Volets roulants électriques : interrupteur général dans l’entrée.', conformite: { enregistrement: '56258000789EF', dpe: addDays(today, 1000), classement: addDays(today, 420), assurance: addDays(today, 230) } }),
      L('l-penty', 'Penty du Golfe', '5 impasse du Ruault', 'Sarzeau', 'maison', 6, 'p-guillemot', 'prestige', { acces: { code: '2468', wifi: 'Penty / sarzeau-golfe' }, consignes: 'Poêle à granulés : ne pas l’éteindre en hiver, vérifier le niveau.', conformite: { enregistrement: '56240000321GH', dpe: addDays(today, 1300), classement: addDays(today, 800), assurance: addDays(today, 260) } })
    ];

    const conc = { 'l-tymor': 'c-maelle', 'l-kerlann': 'c-yann', 'l-haliguen': 'c-maelle', 'l-hortensias': 'c-sophie', 'l-penty': 'c-yann' };
    const pCount = { 'l-tymor': 5, 'l-kerlann': 6, 'l-haliguen': 3, 'l-hortensias': 4, 'l-penty': 7 };
    const mOffsets = { 'l-tymor': [-5, -2, 0, 9], 'l-kerlann': [-4, 6, 16], 'l-haliguen': [-6, 12], 'l-hortensias': [-3, 1, 13], 'l-penty': [-6, -1, 2, 8, 20] };
    const unassigned = { 'l-hortensias': [1], 'l-kerlann': [6] };

    const missions = [];
    const mk = (lid, date, statut, cid, extra) => {
      const l = logements.find(x => x.id === lid);
      const done = statut === 'terminee';
      return Object.assign({
        id: 'm-' + lid.slice(2) + '-' + date.replace(/-/g, ''), logementId: lid, date, heure: '11:00', type: 'rotation', libelle: '', prix: 0,
        conciergeId: cid, statut, faits: done ? l.checklist.slice() : [], photos: { avant: done ? 3 : 0, apres: done ? 4 : 0 }, source: 'ical', doneAt: done ? date + 'T14:30' : ''
      }, extra);
    };
    Object.keys(pCount).forEach(lid => {
      const n = pCount[lid];
      for (let i = 0; i < n; i++) {
        const d = dayIn(P, Math.round(2 + i * (monthLen(P) - 5) / Math.max(1, n - 1)));
        missions.push(mk(lid, d, 'terminee', conc[lid]));
      }
      mOffsets[lid].forEach(off => {
        const d = addDays(today, off);
        const st = d < today ? 'terminee' : 'a_faire';
        const cid = (unassigned[lid] || []).includes(off) ? '' : conc[lid];
        missions.push(mk(lid, d, st, cid));
      });
    });
    missions.push(mk('l-kerlann', dayIn(P, 10), 'terminee', 'c-yann', { id: 'm-kerlann-serv1', type: 'service', libelle: "Courses d'arrivée", prix: 25, heure: '16:00', source: 'manuel', faits: [], photos: { avant: 0, apres: 0 } }));
    missions.push(mk('l-tymor', dayIn(P, 18), 'terminee', 'c-maelle', { id: 'm-tymor-serv1', type: 'service', libelle: 'Linge supplémentaire', prix: 18, heure: '16:00', source: 'manuel', faits: [], photos: { avant: 0, apres: 0 } }));

    const incidents = [
      { id: 'i-penty-1', logementId: 'l-penty', missionId: 'm-penty-' + addDays(today, -1).replace(/-/g, ''), date: addDays(today, -1), niveau: 'important', texte: "Chasse d'eau qui fuit dans la salle de bain de l'étage.", statut: 'ouvert', auteur: 'Yann Guého' }
    ];

    const factures = [];
    const yr = P.slice(0, 4);
    logements.forEach((l, i) => {
      const f = settings.formules.find(x => x.id === l.contrat.formuleId);
      const ht = f.prix;
      const tva = Math.round(ht * settings.tva) / 100;
      const date = P + '-01';
      const paid = l.id !== 'l-haliguen';
      factures.push({
        id: 'f-' + yr + '-' + (i + 1), numero: 'BPN-' + yr + '-' + String(i + 1).padStart(4, '0'), type: 'facture', mois: P, date, echeance: addDays(date, settings.delaiPaiement),
        proprietaireId: l.proprietaireId, logementId: l.id, lignes: [{ libelle: 'Abonnement ' + f.nom + ' – ' + moisLabel(P), qte: 1, pu: f.prix }],
        tva: settings.tva, totalHT: ht, totalTVA: tva, totalTTC: Math.round((ht + tva) * 100) / 100,
        statut: paid ? 'payee' : 'en_attente', payeeLe: paid ? addDays(date, 4 + i) : ''
      });
    });

    const stocks = [
      { id: 'st-kits', nom: "Kits d'accueil", unite: 'kits', quantite: 18, seuil: 10, parRotation: 1 },
      { id: 'st-cafe', nom: 'Capsules de café', unite: 'capsules', quantite: 70, seuil: 80, parRotation: 6 },
      { id: 'st-savon', nom: 'Savon et gel douche', unite: 'flacons', quantite: 22, seuil: 12, parRotation: 1 },
      { id: 'st-papier', nom: 'Papier toilette', unite: 'rouleaux', quantite: 48, seuil: 30, parRotation: 4 },
      { id: 'st-sacs', nom: 'Sacs poubelle', unite: 'sacs', quantite: 60, seuil: 40, parRotation: 3 },
      { id: 'st-eponges', nom: 'Éponges', unite: 'éponges', quantite: 25, seuil: 15, parRotation: 1 },
      { id: 'st-menage', nom: 'Produits ménagers', unite: 'bidons', quantite: 6, seuil: 4, parRotation: 0 }
    ].map(s => Object.assign(s, { mouvements: [] }));

    const fr = (id, date, associe, depart, arrivee, km, motif) => ({ id, date, associe, type: 'km', depart, arrivee, km, motif, libelle: '', montant: 0, categorie: '' });
    const frais = [
      fr('fr-1', dayIn(P, 6), 'paul', 'Vannes', 'Arzon', 66, 'Visite Villa Kerlann (aller-retour)'),
      fr('fr-2', dayIn(P, 14), 'jade', 'Vannes', 'Carnac', 64, 'Contrôle qualité Ty Mor (aller-retour)'),
      fr('fr-3', dayIn(P, 21), 'bedirhan', 'Vannes', 'Quiberon', 92, 'Remise des clés Studio Port-Haliguen (aller-retour)'),
      { id: 'fr-4', date: dayIn(P, 22), associe: 'jade', type: 'depense', depart: '', arrivee: '', km: 0, motif: '', libelle: 'Produits ménagers et éponges', montant: 42.5, categorie: 'Fournitures' },
      fr('fr-5', addDays(today, -6), 'paul', 'Vannes', 'Quiberon', 92, 'Rendez-vous Gaël Kerbrat (aller-retour)'),
      fr('fr-6', addDays(today, -3), 'jade', 'Vannes', 'Sarzeau', 46, 'Intervention fuite Penty du Golfe (aller-retour)'),
      { id: 'fr-7', date: addDays(today, -2), associe: 'paul', type: 'depense', depart: '', arrivee: '', km: 0, motif: '', libelle: 'Impression des plaquettes', montant: 64, categorie: 'Communication' }
    ];

    const concurrents = [
      { id: 'cc-cocoonr', nom: 'Cocoonr', zone: 'Carnac', modele: 'À vérifier', prix: '', notes: 'Agence ouverte à Carnac fin 2024. Offre et tarifs à confirmer par un appel client mystère.', maj: '', source: 'https://media.cocoonr.fr/cms/press-releases/Communique_de_Presse_-_Cocoonr_Carnac_decembre_2024.pdf' },
      { id: 'cc-hoomy', nom: 'Hoomy', zone: 'Sarzeau, Morbihan', modele: 'À vérifier', prix: '', notes: 'Réseau national, présence dans le Morbihan. Tarifs à confirmer.', maj: '', source: 'https://www.hoomy.fr/regions/conciergerie-bretagne/conciergerie-morbihan' },
      { id: 'cc-yhh', nom: 'YourHostHelper', zone: 'Carnac', modele: 'À vérifier', prix: '', notes: 'Réseau national. Tarifs à confirmer.', maj: '', source: 'https://yourhosthelper.com/en/conciergerie/carnac/' },
      { id: 'cc-kledor', nom: 'Kledor Concept', zone: 'Carnac', modele: 'À vérifier', prix: '', notes: 'Acteur local. Offre à confirmer.', maj: '', source: 'https://morbihan.com/offres/kledor-concept-conciergerie-carnac-fr-5655328/' },
      { id: 'cc-cpq', nom: 'Conciergerie Personnalisée', zone: 'Saint-Pierre-Quiberon', modele: 'À vérifier', prix: '', notes: 'Acteur local presqu’île de Quiberon. Offre à confirmer.', maj: '', source: '' }
    ];

    const mots = {
      'l-tymor': "Bon mois d'octobre pour Ty Mor, porté par les vacances de la Toussaint : cinq séjours, tous rendus à l'heure. Une rotation a dépassé le forfait, elle sera facturée avec l'abonnement de novembre.",
      'l-kerlann': "Très beau mois pour la Villa Kerlann avec six séjours. La piscine a été bâchée à chaque départ. Deux rotations ont dépassé le forfait, elles seront facturées avec l'abonnement de novembre.",
      'l-penty': "Sept séjours en octobre pour le Penty du Golfe, un record pour l'arrière-saison. Le poêle a été vérifié à chaque passage. Trois rotations en plus seront facturées en novembre."
    };
    const rapports = Object.keys(mots).map(lid => ({ id: lid + '_' + P, logementId: lid, mois: P, mot: mots[lid], envoyeLe: addDays(today, -4) }));

    return { settings, contacts, logements, missions, concierges, factures, incidents, stocks, frais, concurrents, astreinte: [], rapports };
  }

  const api = { bpnDemo, defaultSettings, DEFAULT_CHECKLIST };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof window !== 'undefined' ? window : globalThis);
