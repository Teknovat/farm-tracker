# Mission - Farm Tracker

## Vision

Farm Tracker est un outil de **gestion collaborative complète** qui permet à un ou plusieurs associés de gérer efficacement tous les aspects de leur exploitation agricole dans un environnement multilingue et multi-utilisateur.

## État Actuel : Fondations Solides (60% implémenté)

Farm Tracker dispose aujourd'hui d'une **base fonctionnelle robuste** avec l'infrastructure technique et métier essentielle déjà opérationnelle.

### ✅ **Déjà Opérationnel**

#### 🐄 **Gestion des Animaux Core**
- **Généalogie basique** : Relations parents/descendants avec validation (`fatherId`/`motherId`)
- **Types & identification** : Animaux individuels/lots avec numéros d'identification
- **Statuts complets** : Actif, vendu, mort avec transitions validées
- **Upload photos** : Stockage d'images en Base64 compatible Vercel
- **Historique** : Timeline complète des événements par animal

#### 📊 **Événements & Suivi Médical**  
- **7 types d'événements** : Naissance, vaccination, traitement, pesée, vente, mort, note
- **Rappels programmés** : `nextDueDate` pour planifier événements futurs
- **Coûts intégrés** : Traçage des dépenses par événement
- **API reminders** : Alertes automatiques événements urgents (<7j) et à venir

#### 💰 **Système Financier Complet**
- **Caisse collaborative** : Dépôts, dépenses cash/crédit, remboursements
- **Gestion des dettes** : Crédit avec statuts (en attente, partiellement/totalement remboursé)
- **Catégories** : Alimentation, vétérinaire, main d'œuvre, transport, équipement
- **Dashboard financier** : Solde caisse, dettes, dépenses mensuelles par catégorie
- **Transparence** : Qui a payé quoi (`paidBy`) visible par tous les associés

#### 👥 **Collaboration Multi-Utilisateur**
- **3 rôles** : OWNER (contrôle total), ASSOCIATE (gestion), WORKER (saisie)
- **Invitations par email** : Système de tokens sécurisés avec expiration
- **Permissions granulaires** : Contrôle READ/CREATE/UPDATE/DELETE par ferme
- **Session management** : Authentification robuste avec refresh automatique

#### 🌍 **Multilingue Complet**
- **3 langues** : Français (défaut), anglais, arabe avec support RTL
- **Traduction complète** : Interface, erreurs, emails, exports
- **Détection automatique** : Locale via URL `/[locale]/`

#### 📈 **Export & Statistiques**
- **Export CSV** : Animaux, événements, données financières
- **Statistiques dashboard** : Totaux animaux, naissances/décès mensuel, soldes
- **APIs complètes** : 20+ endpoints REST documentés et typés

---

## Objectifs de Développement : Compléter l'Expérience Utilisateur

### 🎯 **Priorité 1 - Interfaces Manquantes (4-6 semaines)**

#### Interface Généalogie Visuelle
- **Arbre généalogique graphique** : Composant React interactif (3 générations)
- **Navigation visuelle** : Cliquer pour naviguer dans l'arbre
- ⚙️ *Backend existe, besoin composant frontend*

#### Calcul Automatique d'Âge  
- **Âge en temps réel** : Dérivation automatique depuis `birthDate`
- **Alertes âge** : Notifications pour animaux seniors
- ⚙️ *Champ stockage existe, besoin logique calcul*

#### Calendrier Partagé Visuel
- **Vue calendrier** : Événements passés et planifiés par jour/semaine/mois
- **Interface de planification** : Création événements directement dans calendrier
- ⚙️ *Données événements existent, besoin composant calendrier*

#### Courbes de Croissance
- **Graphiques poids** : Évolution du poids par animal avec tendances
- **Alertes croissance** : Détection anomalies de développement
- ⚙️ *Événements WEIGHT existent, besoin visualisation*

### 🎯 **Priorité 2 - Nouvelles Fonctionnalités (6-8 semaines)**

#### Gestion Enclos/Pâturages
- **Localisation géographique** : Assignation animaux à enclos/pâturages
- **Densité et rotation** : Optimisation utilisation espaces
- ⚙️ *Nouvelle infrastructure requise (tables + APIs)*

#### Statuts Reproductifs
- **États reproductifs** : Gestante, en lactation, saillie programmée  
- **Cycles de reproduction** : Planification et suivi automatisé
- ⚙️ *Extension schema + nouveaux événements*

#### Budgets & Prévisions
- **Budgets annuels** : Planification par catégorie avec suivi écarts
- **Prévisions financières** : Projections basées sur historique
- ⚙️ *Nouvelle infrastructure budgétaire*

#### Système de Tâches  
- **Assignation collaborative** : Tâches avec responsables et délais
- **Suivi de progression** : États À faire/En cours/Terminé
- ⚙️ *Nouvelles tables + workflow*

### 🎯 **Priorité 3 - Professionnalisation (8-10 semaines)**

#### Gestion Stocks & Inventaire
#### Communication Interne (Messagerie)
#### Compliance Réglementaire
#### Ventes & Gestion Clients

---

## Utilisateurs Cibles

### Utilisateurs Primaires
- **Propriétaires de fermes** (OWNER) : Contrôle total de l'exploitation
- **Associés** (ASSOCIATE) : Partenaires avec droits de gestion étendus
- **Employés** (WORKER) : Personnel avec accès limité aux opérations courantes

### Types d'Exploitations
- Élevages bovins, ovins, caprins
- Fermes mixtes (élevage + cultures)  
- Exploitations familiales ou sociétaires
- Fermes de 10 à 1000+ têtes

---

## Différenciation

### **Avantages Actuels** ✅
- **Infrastructure technique solide** : SQLite + Drizzle + TypeScript strict
- **Collaboration native** : Multi-utilisateur dès la conception
- **Multilingue avancé** : Arabe RTL + européennes
- **Données complètes** : Généalogie + événements + finances intégrées
- **Export professionnel** : CSV prêts pour comptabilité

### **Avantages Futurs** 🎯
- **Visualisation intuitive** : Arbres généalogiques, calendriers, graphiques
- **Automatisation intelligente** : Rappels, calculs, prévisions
- **Gestion territoriale** : Enclos, pâturages, géolocalisation
- **Workflow collaboratif** : Tâches assignées, approbations, messagerie

---

## Mesures de Succès

### **Phase Actuelle (Fondations)**
- ✅ **Infrastructure** : 60% fonctionnalités core implémentées
- ✅ **Stabilité** : APIs robustes + validation + tests
- ✅ **Adoption précoce** : 3 fermes pilotes utilisent actuellement

### **Phase Cible (6 mois)**
- **Adoption** : 15+ fermes utilisatrices actives  
- **Engagement** : 80%+ saisie quotidienne via interfaces visuelles
- **Satisfaction** : NPS > 60 grâce aux outils de visualisation
- **ROI** : 30% réduction temps de gestion administrative