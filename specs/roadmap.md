# Roadmap - Farm Tracker

## Méthodologie

**Sprints d'1 semaine** avec livraison continue basée sur l'**audit réel** du code existant. Chaque sprint complète des fonctionnalités où l'infrastructure backend existe mais les interfaces utilisateur manquent, ou développe de nouvelles capacités entièrement.

> **État actuel** : 60% des fondations sont implémentées (données + APIs). La roadmap se concentre sur les 40% restants : interfaces utilisateur et nouvelles fonctionnalités métier.

---

## Phase 1 : Finition Infrastructure Existante (3 semaines)

### Sprint 1 : Stabilisation & Production
**Objectif** : Préparer l'existant pour utilisateurs en production

- [ ] **Tests coverage** : Atteindre 85% sur repositories existants
- [ ] **Documentation API** : Swagger/OpenAPI pour les 20+ endpoints existants  
- [ ] **Configuration Turso** : Migration production + monitoring d'erreurs
- [ ] **Performance** : Optimiser queries + lazy loading + pagination
- [ ] **UI Polish** : Toast notifications + loading states + gestion d'erreurs côté client

### Sprint 2 : Interfaces pour Données Existantes
**Objectif** : Exploiter les données déjà stockées

- [ ] **Page Généalogie** : Composant arbre généalogique React (données `fatherId`/`motherId` existent)
- [ ] **Calcul âge automatique** : Dérivation depuis `birthDate` (champ existe, calcul manque)
- [ ] **Courbes de croissance** : Graphique Chart.js pour événements WEIGHT (données existent)
- [ ] **Améliorer Dashboard** : Utiliser les statistiques API existantes + nouveaux widgets
- [ ] **Export PDF** : Ajouter format PDF aux exports CSV existants

### Sprint 3 : Interface Calendrier & Rappels
**Objectif** : Visualiser les événements et rappels existants

- [ ] **Calendrier visuel** : Composant FullCalendar pour afficher événements (données `eventDate`/`nextDueDate` existent)
- [ ] **Gestion rappels** : Interface pour éditer/planifier avec API reminders existante  
- [ ] **Vue timeline améliorée** : Interface graphique pour timeline animaux (API existe)
- [ ] **Notifications en UI** : Affichage des reminders urgents en header (API existe)
- [ ] **Filtrage événements** : Par type, animal, date (backend supporte déjà)

---

## Phase 2 : Nouvelles Fonctionnalités Core (5 semaines)

### Sprint 4 : Statuts Reproductifs & Gestion Spatiale
**Objectif** : Extensions schema pour reproduction et localisation

- [ ] **Nouveau champ** : `reproductiveStatus` enum sur animals (GESTANTE, LACTATION, SAILLIE)
- [ ] **Nouveaux événements** : PREGNANCY, BREEDING, LACTATION_START, LACTATION_END  
- [ ] **Table paddocks** : Enclos/pâturages avec géolocalisation GPS
- [ ] **Liaison animal-paddock** : Champ `paddockId` + historique déplacements
- [ ] **API géolocalisation** : CRUD paddocks + assignation animaux

### Sprint 5 : Interface Paddocks & Déplacements
**Objectif** : Gestion visuelle des espaces

- [ ] **Page Paddocks** : CRUD enclos avec carte géographique
- [ ] **Assignation animaux** : Interface drag & drop pour déplacer animaux entre paddocks
- [ ] **Dashboard spatial** : Densité par paddock, animaux par zone
- [ ] **Historique mouvements** : Timeline des déplacements d'animaux
- [ ] **Alertes surcharge** : Notifications si densité > seuil configurable

### Sprint 6 : Budgets & Prévisions Financières
**Objectif** : Planification financière avancée

- [ ] **Table budgets** : Budgets annuels par catégorie avec montants/seuils
- [ ] **API budgets** : CRUD + comparaison budget vs réalisé (utilise cashbox existant)
- [ ] **Dashboard budget** : Graphiques écarts, prévisions basées historique
- [ ] **Alertes budgétaires** : Notifications si dépassement seuil
- [ ] **Rapports prévisionnels** : Projection fin d'année basée tendances

### Sprint 7 : Système de Tâches Collaboratives
**Objectif** : Assignation et suivi de tâches

- [ ] **Table tasks** : Tâches avec assignation, échéance, statut (À faire/En cours/Terminé)
- [ ] **API tasks** : CRUD + assignation + notifications  
- [ ] **Interface tâches** : Kanban board pour visualiser progression
- [ ] **Intégration événements** : Créer tâche automatiquement depuis rappel
- [ ] **Notifications tâches** : Alertes échéances + assignations

### Sprint 8 : Workflow Approbation Collective
**Objectif** : Transparence décisionnelle

- [ ] **Table approvals** : Demandes d'approbation avec votes multiples
- [ ] **Seuils configurables** : Montant nécessitant approbation par ferme  
- [ ] **Interface approbation** : Vote oui/non avec commentaires
- [ ] **Blocage dépenses** : Empêcher cashbox si non approuvé (dépense > seuil)
- [ ] **Historique décisions** : Journal des votes pour transparence

---

## Phase 3 : Communication & Stocks (4 semaines)

### Sprint 9 : Messagerie Interne
**Objectif** : Communication entre associés

- [ ] **Tables messaging** : Conversations, messages, participants
- [ ] **API messagerie** : CRUD + temps réel avec WebSockets/Polling
- [ ] **Interface chat** : Conversations par sujet (animal, événement, ferme)
- [ ] **Notifications messages** : Alertes nouveaux messages non lus
- [ ] **Partage contexte** : Lien messages à animaux/événements spécifiques

### Sprint 10 : Système Inventory/Stocks
**Objectif** : Gestion stocks et fournitures

- [ ] **Tables inventory** : Produits, stocks actuels, mouvements d'inventaire
- [ ] **Catégories inventory** : Aliments, médicaments, équipements avec dates expiration
- [ ] **API inventory** : CRUD + alertes stock bas + historique mouvements
- [ ] **Interface stocks** : Dashboards inventaire + saisie entrées/sorties
- [ ] **Liaison expenses** : Connecter achats cashbox avec entrées inventory

### Sprint 11 : Commentaires Collaboratifs
**Objectif** : Discussions contextuelles sur animaux/événements

- [ ] **Table comments** : Commentaires multi-utilisateurs avec threading
- [ ] **API comments** : CRUD + notifications nouveux commentaires
- [ ] **Interface commentaires** : Thread discussions sur pages animaux/événements
- [ ] **Mentions utilisateurs** : @mention avec notifications push
- [ ] **Historique collaboratif** : Log enrichi "qui a dit/fait quoi quand"

### Sprint 12 : Rapports Automatisés
**Objectif** : Génération rapports périodiques

- [ ] **Templates rapports** : Mensuel/annuel avec KPIs configurables
- [ ] **API rapports** : Génération PDF avec graphiques + données agrégées
- [ ] **Planification rapports** : Envoi automatique par email
- [ ] **Rapports de performance** : Analyse par animal, reproduction, financier
- [ ] **Export comptable** : Format standard pour experts-comptables

---

## Phase 4 : Mobile & Accessibilité (3 semaines)

### Sprint 13 : PWA & Mode Hors-ligne
**Objectif** : Application mobile installable

- [ ] **Service Worker** : Cache intelligent + sync background
- [ ] **Manifest PWA** : Installation via navigateur mobile
- [ ] **Interface mobile** : Optimisation touch + formulaires terrain
- [ ] **Sync offline** : Queue des actions + synchronisation automatique
- [ ] **Storage local** : IndexedDB pour données critiques offline

### Sprint 14 : Scanner & Capture Terrain
**Objectif** : Outils terrain pour éleveurs

- [ ] **Scanner QR/Barcode** : Identification rapide animaux via caméra
- [ ] **Génération QR codes** : Codes uniques par animal pour impression
- [ ] **Capture photo terrain** : Compression automatique + upload
- [ ] **Géolocalisation événements** : Coordonnées GPS optionnelles
- [ ] **Mode urgence** : Saisie rapide événements critiques (maladie/mort)

### Sprint 15 : Notifications & Performance
**Objectif** : Expérience mobile optimale

- [ ] **Push notifications** : Web Push API pour rappels/urgences
- [ ] **Optimisation performance** : Bundle splitting + lazy loading
- [ ] **Mode low-bandwidth** : Interface allégée pour réseau faible
- [ ] **Tests cross-device** : Compatibility iOS/Android/Desktop
- [ ] **Onboarding mobile** : Guide d'utilisation première connexion

---

## Phase 5 : Intégrations & Innovation (4 semaines)

### Sprint 16 : APIs Externes Essentielles
**Objectif** : Données automatisées contextuelle

- [ ] **API météo** : Intégration OpenWeather pour conditions locales
- [ ] **Prix marchés** : APIs prix bovins/ovins temps réel (sources nationales)
- [ ] **Calendrier agricole** : Événements saisonniers automatiques
- [ ] **Services vétérinaires** : Annuaire et prise RDV (partenariats locaux)
- [ ] **Alertes sanitaires** : Notifications épidémies régionales

### Sprint 17 : Compliance & Réglementation
**Objectif** : Conformité légale et traçabilité

- [ ] **Registres officiels** : Templates registres sanitaires/mouvements
- [ ] **Traçabilité alimentaire** : Suivi complet farm-to-fork
- [ ] **Carnet sanitaire électronique** : Format officiel avec signatures
- [ ] **Export réglementaire** : Formats conformes administrations
- [ ] **Audit trail enrichi** : Logs pour contrôles officiels

### Sprint 18 : Marketplace & Ventes
**Objectif** : Commercialisation professionnelle

- [ ] **Table customers** : CRM clients avec historique achats
- [ ] **Catalogue produits** : Viande/lait/fromage avec photos/prix
- [ ] **Système commandes** : Panier + facturation automatique
- [ ] **Gestion livraisons** : Planification tournées + tracking
- [ ] **Site vitrine** : Pages publiques pour vente directe

### Sprint 19 : Intelligence Artificielle
**Objectif** : Aide à la décision avancée

- [ ] **Analyse photos** : IA détection problèmes sanitaires (TensorFlow.js)
- [ ] **Prédictions reproduction** : ML sur historique pour cycles optimaux
- [ ] **Recommandations alimentaires** : Algorithmes basés performance
- [ ] **Détection anomalies** : Alertes automatiques écarts statistiques
- [ ] **Optimisation logistique** : Algorithmes de routage/regroupement

---

## Versioning Strategy

- **v0.9** : État actuel (infrastructure + interfaces basiques)
- **v1.0** : Fin Phase 1 (production-ready stable)
- **v1.1** : Fin Phase 2 (fonctionnalités métier complètes)
- **v1.2** : Fin Phase 3 (collaboration avancée)
- **v1.3** : Fin Phase 4 (mobile-first)
- **v2.0** : Fin Phase 5 (écosystème intelligent)

---

## Métriques de Succès par Phase

### Phase 1 : Exploitation de l'Existant
- **100% features backend** ont interface utilisateur complète
- **Dashboard visuel** remplace saisie manuelle pour 80% actions
- **Export PDF** utilisé par 100% fermes pour rapports externes
- **Performance** : <300ms toutes pages, 95% tests coverage

### Phase 2 : Nouvelles Capacités Métier  
- **Paddocks** : 100% animaux localisés géographiquement
- **Budgets** : Écarts budget vs réel <10% grâce prévisions
- **Tâches** : 90% événements planifiés via assignation collaborative
- **Approbations** : 100% grosses dépenses validées collectivement

### Phase 3 : Collaboration Avancée
- **Messages** : Communication quotidienne remplace SMS/WhatsApp
- **Stocks** : 0 rupture grâce alertes automatiques
- **Commentaires** : Discussions contextuelles sur 80%+ animaux
- **Rapports** : Génération automatique élimine Excel manuel

### Phase 4 : Mobile & Terrain
- **PWA** : 70%+ saisie via mobile (terrain/déplacement)  
- **Offline** : Application fonctionne 100% sans réseau
- **Scanner** : Identification animaux 3x plus rapide
- **Notifications** : Réactivité urgences <1h vs >24h

### Phase 5 : Écosystème & Innovation
- **APIs externes** : Données météo/prix automatisent 50% saisie
- **Compliance** : 100% conformité réglementaire automatique
- **Ventes** : 25%+ CA via vente directe intégrée
- **IA** : 20% réduction problèmes sanitaires grâce détection précoce