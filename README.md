# BPN Gestion — prototype CRM + ERP (v2)

Prototype cliquable du CRM et de l'ERP de BPN, conciergerie de locations saisonnières (Morbihan).
Il sert de **base de travail** pour la vraie application : les écrans, le parcours et les règles de gestion sont là, mais ce n'est pas du code de production.

## Ouvrir le prototype

- Double-cliquer sur `dist/index.html` : il s'ouvre dans n'importe quel navigateur, sans serveur ni installation.
- Hors de Claude, il tourne en **mode démo** : données d'exemple, modifications gardées dans le `localStorage` du navigateur.
- Réglages › « Remettre les données d'exemple » pour repartir de zéro.

## Modifier et reconstruire

Aucune dépendance, juste Node (18 ou plus) :

```
node build.js        # assemble src/ en un seul fichier dist/index.html
```

## Structure

```
src/
  index.template.html   coquille HTML (barre du haut, navigation, zones de rendu)
  style.css             styles + charte BPN (tokens en tête de fichier, thème clair et sombre)
  demo.js               réglages par défaut + générateur de données d'exemple
  pdf.js                mini générateur PDF sans dépendance (Helvetica, accents, €)
  docs.js               mise en page des PDF : facture et compte rendu mensuel
  app.js                toute l'application (état, rendu, actions, règles de gestion)
build.js                insère CSS + JS dans le gabarit -> dist/index.html
data/exemple.json       jeu de données d'exemple (même format que la base)
dist/index.html         version prête à ouvrir
```

`app.js` est découpé en sections commentées :

| Section | Rôle |
| --- | --- |
| Outils | dates, formats (€, dates FR), helpers |
| État et stockage | état en mémoire `S`, couche de persistance (`persist`, `boot`) |
| Sélecteurs | calculs : rotations du mois, statut des factures, alertes de conformité |
| Capacités | téléchargements, IA (`sample`), Gmail (`mcp`), photos (`assets`) |
| Vues | `vAccueil` (graphiques), `vCRM` (pipeline, relances, prescripteurs, concurrents), `vLogements`, `vPlanning` (astreinte), `vFactures`, `vRapports`, `vStocks`, `vFrais`, `vConcierges`, `vAssistant`, `vMissions` (concierge), `vProprio` (propriétaire), `vReglages` |
| Fiches | panneaux de détail et formulaires (`SHEETS.*`) |
| Actions | gestionnaires `ACT` (clics), `CHG` (changements de champ), `SUBMIT` (formulaires) |

Rendu en JavaScript sans framework (gabarits HTML + délégation d'événements via `data-act`, `data-chg`, `data-submit`). Le choix du framework pour la vraie version reste ouvert (React, Vue, ou une base comme Odoo / Dolibarr).

## Modèle de données

Onze collections + un document de réglages. Chaque élément a un `id`.

| Collection | Champs principaux |
| --- | --- |
| `contacts` | `type` (prospect/client), `prenom`, `nom`, `tel`, `email`, `commune`, `origine`, `prescripteur`, `bien`, `etape`, `relance` (date), `consentementEmail`, `bloctel`, `notes`, `perduRaison`, `historique[]` {date, type, texte, auteur} |
| `logements` | `nom`, `adresse`, `commune`, `type` (studio/t2/t3/maison), `capacite`, `proprietaireId`, `contrat` {formuleId, debut, statut, fin, avenants[]}, `acces` {code, wifi}, `consignes`, `checklist[]`, `conformite` {enregistrement, dpe, classement, assurance} |
| `missions` | `logementId`, `date`, `heure`, `type` (rotation/service), `libelle`, `prix`, `conciergeId`, `statut` (a_faire/en_cours/terminee), `faits[]` (points de checklist cochés), `photos` {avant, apres}, `source` (ical/manuel), `doneAt` |
| `concierges` | `prenom`, `nom`, `tel`, `email`, `siret`, `zone[]`, `tarif` {petit, grand}, `docs` {urssaf, rcpro}, `paiements` {"AAAA-MM": bool} |
| `factures` | `numero`, `type` (facture/avoir), `mois`, `date`, `echeance`, `proprietaireId`, `logementId`, `lignes[]` {libelle, qte, pu}, `tva`, `totalHT`, `totalTVA`, `totalTTC`, `statut` (en_attente/payee/annulee), `payeeLe`, `ref` (avoir) |
| `incidents` | `logementId`, `missionId`, `date`, `niveau` (mineur/important/urgent), `texte`, `statut` (ouvert/clos), `auteur` |
| `stocks` | `nom`, `unite`, `quantite`, `seuil`, `parRotation` (décompté à chaque rotation terminée), `mouvements[]` |
| `frais` | `date`, `associe`, `type` (km/depense), `depart`, `arrivee`, `km`, `motif`, `libelle`, `montant`, `categorie` |
| `concurrents` | `nom`, `zone`, `modele`, `prix`, `notes`, `maj`, `source` |
| `astreinte` | id = lundi de la semaine (AAAA-MM-JJ), `associe` |
| `rapports` | id = `<logementId>_<AAAA-MM>`, `logementId`, `mois`, `mot` (mot du mois), `envoyeLe` |
| `config/settings` | `formules[]` {id, nom, prix, quota}, `tarifSup` {petit, grand}, `tva`, `delaiPaiement`, `etapes[]`, `services[]`, `communes[]`, `vehicules` {associé: CV}, `commission` |

## Règles de gestion déjà codées

- **Facture mensuelle** (`invoiceLines`) : abonnement du mois M + rotations au-delà du quota faites en M-1 × tarif à la carte (studio/T2 ou T3/maison) + services à la carte de M-1.
- **Numérotation** (`nextNumero`) : `BPN-AAAA-0001`, continue. Une facture ne se supprime pas, elle s'annule par un avoir.
- **Statut de facture** : en retard si l'échéance est passée et la facture non payée.
- **Mission terminée** : seulement si toute la checklist est cochée et des photos avant/après sont envoyées.
- **Contrat signé** : crée le logement (checklist par défaut) et passe le contact en client.
- **Alertes** : attestation URSSAF ou RC pro des concierges à moins de 30 jours ; classement, DPE, assurance du logement à moins de 60 jours ; numéro d'enregistrement manquant.
- **Import iCal** : une rotation par date de départ (`DTEND`), dates bloquées et passées ignorées, pas de doublon.
- **Profil concierge** : ne voit que ses missions, sans prix ni données des propriétaires.
- **Profil propriétaire** : ses logements, ses comptes rendus et ses factures, en lecture seule.
- **Compte rendu mensuel** (`rapportStats`) : rotations faites / incluses / en plus, services, incidents, montants ; PDF avec « mot du mois ».
- **Stocks** : chaque rotation terminée décompte `parRotation` ; liste de courses = articles sous le seuil, quantité pour revenir à 2 × le seuil.
- **Indemnités kilométriques** (`indemnite`) : barème 2026 (identique à 2025), 3 à 7 CV, trois tranches (≤ 5 000 km, 5 001–20 000, au-delà).
- **Commissions prescripteurs** : montant fixe par contrat signé, case « versée » par contact.
- **Astreinte** : un associé par semaine, rotation par défaut Paul → Bedirhan → Jade.

## Capacités de la plateforme Claude (à remplacer hors Claude)

Dans Claude, la page utilise des services fournis par la plateforme via `window.claude.use(nom)`. Hors Claude, chacun manque et l'appli masque la fonction correspondante :

| Capacité | Usage dans l'appli | Équivalent pour la vraie version |
| --- | --- | --- |
| `db` | données partagées en temps réel | API + base de données |
| `sample` | assistant IA, rédaction d'e-mails, « mot du mois » | appel à une API de modèle de langage côté serveur |
| `mcp` (Gmail `create_draft`) | brouillons Gmail avec PDF joint | API Gmail (OAuth) ou envoi via un service d'e-mail |
| `assets` | photos des concierges | stockage de fichiers (S3, Supabase Storage…) |
| `downloads` | PDF et CSV | téléchargement navigateur classique (déjà en repli dans `saveFile`) |
| `user` | nom de la personne connectée | authentification |

## Stockage : ce qu'il faut remplacer

Dans Claude, la page utilise une base fournie par la plateforme (`window.claude.use('db')`). Ailleurs elle passe en `localStorage`.
Tout passe par deux fonctions de `app.js` :

- `boot()` : charge les collections et s'abonne aux mises à jour ;
- `persist(col, id)` : enregistre ou supprime un document.

Pour brancher un vrai back-end (API + base PostgreSQL, Supabase, Firebase…), il suffit de réécrire ces deux fonctions ; le reste de l'appli lit et écrit seulement l'état `S` via `put`, `edit` et `del`.

## Ce qui manque pour la production

- Authentification réelle, comptes nominatifs, double authentification, droits par profil côté serveur.
- Hébergement dans l'UE, sauvegardes, journal des modifications.
- Lecture automatique des liens iCal Airbnb / Booking (côté serveur) ou connexion à un logiciel de gestion locative.
- Prélèvement SEPA via un prestataire, PDF des contrats, envoi d'e-mails côté serveur.
- Facturation électronique via une plateforme agréée (obligatoire pour les PME au 1er septembre 2027).
- RGPD : durées de conservation automatiques, export et suppression des données d'une personne.

Le détail des besoins est dans le cahier des charges CRM & ERP envoyé par Paul.
