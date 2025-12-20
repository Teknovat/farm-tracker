# Configuration Turso pour Farm Tracker

Ce projet utilise Turso (SQLite serverless) en production et un fichier SQLite local en développement.

## Développement Local

En développement, l'application utilise un fichier SQLite local via le SDK libsql.

**Configuration `.env.local`:**

```env
TURSO_DATABASE_URL="file:./sqlite.db"
```

Le préfixe `file:` est obligatoire pour que libsql puisse lire le fichier local.

## Production avec Turso

### 1. Créer une base de données Turso

```bash
# Installer Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Se connecter
turso auth login

# Créer une base de données
turso db create farm-tracker

# Obtenir l'URL de connexion
turso db show farm-tracker --url

# Créer un token d'authentification
turso db tokens create farm-tracker
```

### 2. Configuration Production

Ajoutez ces variables d'environnement dans votre plateforme de déploiement (Vercel, Netlify, etc.):

```env
NODE_ENV="production"
TURSO_DATABASE_URL="libsql://farm-tracker-[votre-org].turso.io"
TURSO_AUTH_TOKEN="eyJhbGc..."
```

### 3. Synchronisation automatique lors du déploiement

Le projet est configuré pour **synchroniser automatiquement** le schéma de la base de données lors de chaque déploiement via le script `postbuild`.

**Comment ça fonctionne :**

Lors de `npm run build`, le script `postbuild` est automatiquement exécuté et applique les migrations à la base de données configurée (via `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN`).

```bash
# Le build exécute automatiquement :
npm run build
  ↓
npm run postbuild  # Exécuté automatiquement
  ↓
npm run db:migrate:run  # Applique les migrations
```

**Désactiver la synchronisation automatique :**

Si vous préférez appliquer les migrations manuellement, commentez la ligne `postbuild` dans `package.json` :

```json
{
  "scripts": {
    // "postbuild": "npm run db:migrate:run"
  }
}
```

### 4. Migration manuelle (optionnel)

#### Option A: Utiliser le script de migration

```bash
# Appliquer les migrations avec le script TypeScript
npm run db:migrate:run
```

#### Option B: Utiliser Turso CLI

```bash
# Appliquer les fichiers SQL directement
turso db shell farm-tracker < drizzle/0000_initial.sql
```

#### Option C: Push direct du schéma (sans fichiers de migration)

```bash
# Synchroniser le schéma directement (utile pour le premier déploiement)
npm run db:push
```

**⚠️ Attention:** `db:push` applique les changements directement sans créer de fichiers de migration. À utiliser avec précaution en production.

## Architecture

### Comment ça fonctionne

Le fichier `src/lib/db/index.ts` utilise le SDK `@libsql/client` qui supporte:

- **Fichiers locaux** en développement (`file:./sqlite.db`)
- **Turso remote** en production (`libsql://...`)

```typescript
const isProduction = process.env.NODE_ENV === "production" || process.env.USE_TURSO === "true";
const databaseUrl = process.env.TURSO_DATABASE_URL || "file:./sqlite.db";

const client = createClient({
  url: databaseUrl,
  authToken: isProduction ? process.env.TURSO_AUTH_TOKEN : undefined,
});
```

### Différences avec better-sqlite3

Le projet utilise maintenant exclusivement `@libsql/client` au lieu de `better-sqlite3`. Les principales différences:

1. **Format de l'URL**: Doit utiliser `file:./sqlite.db` au lieu de `./sqlite.db`
2. **API des résultats**: Utilise `rowsAffected` au lieu de `changes`
3. **Compatibilité**: Fonctionne de manière identique en local et avec Turso

## Déploiement sur différentes plateformes

### Vercel

Les variables d'environnement sont automatiquement utilisées lors du build. Ajoutez dans les settings de votre projet:

```
TURSO_DATABASE_URL=libsql://farm-tracker-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...
NODE_ENV=production
```

Le script `postbuild` s'exécutera automatiquement après chaque déploiement.

### Netlify

Ajoutez les variables dans **Site settings > Environment variables**:

```
TURSO_DATABASE_URL=libsql://farm-tracker-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...
NODE_ENV=production
```

### Docker

Exemple de Dockerfile avec migrations automatiques:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Les migrations seront appliquées lors du build
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Variables d'environnement Docker:
```bash
docker run -e TURSO_DATABASE_URL="libsql://..." -e TURSO_AUTH_TOKEN="..." -p 3000:3000 farm-tracker
```

## Commandes utiles

```bash
# Générer une nouvelle migration
npm run db:generate

# Appliquer les migrations manuellement
npm run db:migrate:run

# Push le schéma directement (sans migration)
npm run db:push

# Ouvrir l'interface Drizzle Studio
npm run db:studio

# Shell interactif Turso
turso db shell farm-tracker
```

## Backup et restauration

### Créer un backup

```bash
# Backup avec Turso CLI
turso db shell farm-tracker .dump > backup.sql

# Ou télécharger directement la base
turso db download farm-tracker
```

### Restaurer un backup

```bash
# Restaurer depuis un dump SQL
turso db shell farm-tracker < backup.sql
```

## Multi-régions (optionnel)

Turso supporte la réplication multi-régions pour de meilleures performances:

```bash
# Ajouter des réplicas
turso db replicate farm-tracker --location ams  # Amsterdam
turso db replicate farm-tracker --location sin  # Singapour

# Lister les locations
turso db locations
```

## Coûts et limites

- **Plan gratuit**: 9 GB de stockage, 3 locations
- **Scaler Pro**: À partir de $29/mois

Plus d'infos: https://turso.tech/pricing

## Troubleshooting

### Erreur "URL_INVALID"

Si vous voyez cette erreur, vérifiez que votre `TURSO_DATABASE_URL` utilise le bon format:

- Local: `file:./sqlite.db` (avec le préfixe `file:`)
- Turso: `libsql://votre-database.turso.io`

### Erreur "TURSO_AUTH_TOKEN required"

En production, assurez-vous que la variable `TURSO_AUTH_TOKEN` est définie.

### Migrations ne s'appliquent pas

Vérifiez que vous pointez vers la bonne base de données avec:

```bash
turso db show farm-tracker
```
