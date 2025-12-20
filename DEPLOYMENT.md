# Guide de Déploiement - Farm Tracker

Ce guide explique comment déployer l'application Farm Tracker en production.

## Prérequis

1. **Compte Turso** : Créez un compte sur [turso.tech](https://turso.tech)
2. **Turso CLI** installé :
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

## Étapes de déploiement

### 1. Créer la base de données Turso

```bash
# Se connecter à Turso
turso auth login

# Créer la base de données
turso db create farm-tracker

# Récupérer l'URL de connexion
turso db show farm-tracker --url
# Output: libsql://farm-tracker-[votre-org].turso.io

# Créer un token d'authentification
turso db tokens create farm-tracker
# Output: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

### 2. Configurer les variables d'environnement

#### Pour Vercel

1. Allez dans **Settings > Environment Variables**
2. Ajoutez ces variables pour **Production, Preview et Development**:

```env
NODE_ENV=production
TURSO_DATABASE_URL=libsql://farm-tracker-[votre-org].turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
JWT_SECRET=votre-secret-jwt-securise-minimum-32-caracteres
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
```

#### Pour Netlify

1. Allez dans **Site settings > Environment variables**
2. Ajoutez les mêmes variables que pour Vercel

### 3. Premier déploiement

#### Option A: Déploiement avec migration automatique (recommandé)

Le script `postbuild` applique automatiquement les migrations lors du build.

```bash
# Sur votre machine locale
git push origin main

# Vercel/Netlify détecte le push et lance :
# 1. npm install
# 2. npm run build
#    └─> npm run postbuild (applique les migrations automatiquement)
# 3. Déploiement
```

#### Option B: Migration manuelle avant déploiement

Si vous préférez migrer manuellement :

1. **Commentez le script postbuild** dans `package.json` :
```json
{
  "scripts": {
    // "postbuild": "npm run db:migrate:run"
  }
}
```

2. **Appliquez les migrations manuellement** :
```bash
# Option 1: Via Turso CLI
turso db shell farm-tracker < drizzle/0000_initial.sql

# Option 2: Via drizzle-kit push (première fois seulement)
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:push
```

3. **Déployez** :
```bash
git push origin main
```

### 4. Déploiements ultérieurs

Chaque fois que vous modifiez le schéma :

1. **Générer la migration** :
```bash
npm run db:generate
```

2. **Tester en local** :
```bash
npm run db:migrate:run
npm run dev
```

3. **Commit et push** :
```bash
git add drizzle/
git commit -m "Add new migration"
git push origin main
```

4. **Le déploiement s'occupe du reste** - Le script `postbuild` appliquera automatiquement la nouvelle migration en production.

## Workflow de développement

### Modifications du schéma

```bash
# 1. Modifier le schéma dans src/lib/db/schema.ts
vim src/lib/db/schema.ts

# 2. Générer la migration
npm run db:generate

# 3. Appliquer en local
npm run db:migrate:run

# 4. Tester
npm run dev

# 5. Commit
git add drizzle/ src/lib/db/schema.ts
git commit -m "Add user profile table"
git push
```

### Vérifier les migrations appliquées

```bash
# En local
sqlite3 sqlite.db ".tables"

# Sur Turso
turso db shell farm-tracker
.tables
.schema users
```

## Stratégies de migration

### Migration avec fichiers SQL (recommandé)

✅ **Avantages** :
- Historique des changements
- Rollback possible
- Contrôle de version

```bash
npm run db:generate  # Crée un fichier de migration
npm run db:migrate:run  # Applique les migrations
```

### Push direct du schéma

⚠️ **À utiliser uniquement** :
- Pour le premier déploiement
- En développement
- Quand vous savez qu'il n'y a pas de données importantes

```bash
npm run db:push
```

## Rollback de migration

Si une migration cause des problèmes :

### Option 1: Rollback via Git

```bash
# Revenir au commit précédent
git revert HEAD
git push origin main

# Le déploiement appliquera l'ancien état
```

### Option 2: Restaurer depuis un backup

```bash
# 1. Créer un backup avant toute migration importante
turso db shell farm-tracker .dump > backup-avant-migration.sql

# 2. En cas de problème, restaurer
turso db shell farm-tracker < backup-avant-migration.sql
```

## Monitoring et debugging

### Vérifier les logs de déploiement

**Vercel** : Allez dans **Deployments > [votre déploiement] > Build Logs**

Recherchez :
```
🔄 Running database migrations...
📍 Environment: Production
🗄️  Database: libsql://...
✅ Migrations completed successfully!
```

**Netlify** : **Deploys > [votre déploiement] > Deploy log**

### En cas d'erreur de migration

1. **Vérifiez les variables d'environnement** :
   - `TURSO_DATABASE_URL` est correcte
   - `TURSO_AUTH_TOKEN` est valide

2. **Testez la connexion** :
```bash
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:migrate:run
```

3. **Vérifiez les permissions** :
```bash
turso db tokens validate farm-tracker <votre-token>
```

## Environnements multiples

### Développement, Staging, Production

Créez une base par environnement :

```bash
# Développement (local)
TURSO_DATABASE_URL="file:./sqlite.db"

# Staging
turso db create farm-tracker-staging
TURSO_DATABASE_URL="libsql://farm-tracker-staging.turso.io"

# Production
turso db create farm-tracker-prod
TURSO_DATABASE_URL="libsql://farm-tracker-prod.turso.io"
```

Configurez les variables selon la branche sur Vercel/Netlify.

## Sécurité

### Rotation des tokens

Recommandé tous les 90 jours :

```bash
# Créer un nouveau token
turso db tokens create farm-tracker

# Mettre à jour sur Vercel/Netlify
# L'ancien token reste valide jusqu'à ce que vous le révoquiez

# Révoquer l'ancien token
turso db tokens revoke farm-tracker <ancien-token>
```

### Secrets

❌ **Ne jamais** :
- Committer `.env.local`
- Partager `TURSO_AUTH_TOKEN` publiquement
- Utiliser le même token partout

✅ **Toujours** :
- Utiliser des tokens différents par environnement
- Stocker les secrets dans les variables d'environnement de la plateforme
- Utiliser un gestionnaire de secrets (Vercel, Netlify, 1Password, etc.)

## Coûts Turso

**Plan gratuit** :
- 9 GB de stockage
- 3 locations
- Suffisant pour la plupart des MVPs

**Plan Scaler** (29$/mois) :
- Stockage illimité
- Locations illimitées
- Support prioritaire

Plus d'infos : https://turso.tech/pricing

## Support

En cas de problème :

1. **Documentation Turso** : https://docs.turso.tech
2. **Discord Turso** : https://discord.gg/turso
3. **GitHub Issues** : Créer une issue sur le repo du projet
