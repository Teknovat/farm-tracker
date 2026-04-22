# Tech Stack - Farm Tracker

## Architecture Globale

Farm Tracker suit une architecture **Full-Stack TypeScript** avec une approche monolithique modulaire privilégiant la simplicité de déploiement et la vélocité de développement.

### Approche API-First (Déjà Implémentée)
L'application suit une **stratégie API-First** avec **20+ endpoints** déjà opérationnels :
- **APIs REST complètes** : Animals, Events, Cashbox, Members, Invitations, Export
- **Validation Zod** : Schemas typés pour toutes les entrées/sorties
- **Documentation automatique** : Swagger via `/api/docs` (déployé)
- **Extensibilité** : Prêt pour mobile natif et intégrations tierces

### Architecture Modulaire (Existante + Extensions)
Organisation actuelle par **domaines métier** indépendants :

#### ✅ **Modules Opérationnels**
- **Animals Module** : Généalogie basique, types, statuts, photos (COMPLET)
- **Events Module** : 7 types événements + rappels + coûts + timeline (COMPLET) 
- **Finance Module** : Cashbox + crédit/remboursement + catégories (COMPLET)
- **Auth Module** : Sessions JWT + rôles RBAC + invitations (COMPLET)
- **Export Module** : CSV animaux/événements/finances (COMPLET)

#### 🚧 **Modules en Extension** (roadmap Phase 2)
- **Paddocks Module** : Géolocalisation et enclos (NOUVEAU)
- **Budgets Module** : Planification financière (NOUVEAU) 
- **Tasks Module** : Assignation collaborative (NOUVEAU)
- **Approvals Module** : Workflow validation collective (NOUVEAU)

#### 🎯 **Modules Futurs** (roadmap Phase 3-5)
- **Messaging Module** : Communication interne
- **Inventory Module** : Stocks et fournitures
- **Analytics Module** : KPIs et prédictions IA
- **Integrations Module** : APIs externes (météo, prix marchés)

## Frontend

### Framework Principal
- **Next.js 15** avec App Router
  - Server-Side Rendering (SSR) pour l'SEO et les performances
  - API Routes intégrées pour éviter la complexité backend séparé
  - TypeScript strict pour la sécurité de type

### UI/UX
- **Tailwind CSS** pour le styling utilitaire
- **next-intl** pour l'internationalisation (fr/en/ar avec support RTL)
- **Responsive Design** mobile-first

## Backend

### Base de Données
- **SQLite** avec **better-sqlite3**
  - Simplicité de déploiement (fichier unique)
  - Performance excellente pour charges moyennes
  - Backup/restore trivial

### ORM & Migrations  
- **Drizzle ORM**
  - Type-safety complète avec TypeScript
  - Migrations SQL explicites et versionées
  - Studio GUI intégré pour l'administration

### Pattern d'Accès aux Données
- **Repository Pattern** avec BaseRepository abstrait
- **Soft Delete** systématique avec `deletedAt`
- Validation Zod côté API et business logic séparée

## Sécurité & Authentication

### Gestion des Sessions
- **JWT tokens** avec `jose` library
- Cookies **httpOnly** (expiration 7 jours)
- Refresh automatique en middleware

### Autorisation
- **RBAC** (Role-Based Access Control)
- 3 rôles : OWNER / ASSOCIATE / WORKER
- Permissions granulaires par ferme

## Validation & Erreurs

### Validation des Données
- **Zod** pour tous les schemas de validation
- Validation côté client ET serveur
- Messages d'erreur localisés

### Gestion d'Erreurs
- Classes d'erreur typées (ValidationError, AuthorizationError, etc.)
- Wrapper `withErrorHandler` pour cohérence API
- Logging structuré pour debugging

## Développement & Tests

### Outillage
- **TypeScript** en mode strict
- **ESLint** pour la qualité de code
- **Vitest** pour les tests unitaires
- **Path mapping** (`@/*` → `./src/*`)

### Base de Données de Test
- Pool de forks avec `singleFork: true`
- Isolation des tests par fichier
- Configuration jsdom pour les tests frontend

## Hébergement & Déploiement

### Plateforme Cible
- **Vercel** pour le déploiement simplifié
- **Turso** (SQLite cloud) pour la production
- Variables d'environnement pour la configuration

### Upload & Assets
- **Base64 encoding** pour les images (compatibilité Vercel)
- Stockage direct en base de données
- Configuration de taille limite par type de fichier

## Principes Architecturaux

### 1. **Convention over Configuration**
Structures de dossiers et nommage prévisibles

### 2. **Type Safety First**  
TypeScript strict sur toute la codebase

### 3. **Repository Abstraction**
Isolation de la logique métier des détails ORM

### 4. **Error Boundary Pattern**
Gestion centralisée et cohérente des erreurs

### 5. **Separation of Concerns**
- Routes API → Business validation → Repository → Database
- UI Components → Hooks → API calls
- Schemas → Validation → Types

### 6. **API-First Design**
APIs REST documentées et typées pour toutes les fonctionnalités

### 7. **Modular Architecture**  
Développement par domaines métier indépendants et extensibles

## Dependencies Clés

```json
{
  "framework": "next@15",
  "database": "better-sqlite3 + drizzle-orm", 
  "validation": "zod",
  "auth": "jose",
  "i18n": "next-intl",
  "styling": "tailwindcss",
  "testing": "vitest",
  "typescript": "strict mode"
}
```