# Base de données - Guide Rapide

## Configuration automatique

✅ **Les migrations sont appliquées automatiquement lors du build** via le script `postbuild`.

Lors de `npm run build`, les migrations sont automatiquement appliquées à la base de données configurée.

## Variables d'environnement

### Développement local
```env
TURSO_DATABASE_URL="file:./sqlite.db"
```

### Production (Turso)
```env
TURSO_DATABASE_URL="libsql://votre-database.turso.io"
TURSO_AUTH_TOKEN="eyJhbGc..."
NODE_ENV="production"
```

## Commandes principales

```bash
# Générer une migration après modification du schéma
npm run db:generate

# Appliquer les migrations manuellement
npm run db:migrate:run

# Push le schéma directement (sans fichier de migration)
npm run db:push

# Ouvrir Drizzle Studio
npm run db:studio

# Build (applique les migrations automatiquement)
npm run build
```

## Workflow de développement

1. **Modifier le schéma** dans `src/lib/db/schema.ts`
2. **Générer la migration** : `npm run db:generate`
3. **Appliquer localement** : `npm run db:migrate:run`
4. **Tester** : `npm run dev`
5. **Commit et push** : Les migrations seront appliquées automatiquement en production

## Déploiement

### Premier déploiement

1. Créez une base Turso :
```bash
turso db create farm-tracker
turso db show farm-tracker --url
turso db tokens create farm-tracker
```

2. Configurez les variables d'environnement sur Vercel/Netlify

3. Déployez - Les migrations s'appliquent automatiquement

### Déploiements ultérieurs

Tout est automatique ! Chaque déploiement applique les nouvelles migrations.

## Documentation complète

- **[TURSO_SETUP.md](./TURSO_SETUP.md)** - Configuration Turso détaillée
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guide de déploiement complet

## Désactiver les migrations automatiques

Si vous préférez gérer les migrations manuellement, commentez dans `package.json` :

```json
{
  "scripts": {
    // "postbuild": "npm run db:migrate:run"
  }
}
```
