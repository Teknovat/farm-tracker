# Système de Messages d'Erreur Multilingues

Ce document explique comment utiliser le système de messages d'erreur multilingues dans l'application Farm Tracker.

## Vue d'ensemble

Le système prend en charge trois langues:
- **Français (fr)** - langue par défaut
- **Anglais (en)**
- **Arabe (ar)** - avec support RTL

Tous les messages d'erreur, qu'ils proviennent de la validation Zod, de la logique métier ou du système, sont automatiquement traduits selon la locale de l'utilisateur.

## Architecture

### Fichiers clés

1. **`src/lib/utils/i18n-errors.ts`** - Utilitaires pour la gestion des erreurs multilingues
   - `getLocaleFromRequest()` - Extrait la locale de la requête
   - `getErrorMessage()` - Traduit un code d'erreur
   - `ERROR_CODE_MAP` - Mapping des codes d'erreur vers les clés de traduction

2. **`src/lib/middleware/validation-schemas.ts`** - Schémas Zod avec messages traduits
   - Factory functions pour créer des schémas avec traduction
   - Exemples: `createAnimalCreateSchema()`, `createEventCreateSchema()`

3. **`src/lib/middleware/error-handler.ts`** - Gestionnaire d'erreurs centralisé
   - Classes d'erreur avec support i18n: `ApiError`, `ValidationError`, `BusinessLogicError`
   - `handleApiError()` - Traduit et formate les erreurs
   - `withErrorHandler()` - Wrapper pour les routes API

4. **`messages/{locale}.json`** - Fichiers de traduction
   - Section `errors` - Messages d'erreur business
   - Section `validation` - Messages de validation Zod

## Utilisation dans les routes API

### Exemple complet

```typescript
import { NextRequest, NextResponse } from 'next/server'
import {
    validateRequestBodyWithLocale,
    getValidationSchemas
} from '@/lib/middleware/validation'
import {
    withErrorHandler,
    ValidationError,
    BusinessLogicError,
    AuthorizationError
} from '@/lib/middleware/error-handler'
import { getLocaleFromRequest } from '@/lib/utils/i18n-errors'

export const POST = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) => {
    // 1. Extraire la locale de la requête
    const locale = getLocaleFromRequest(request)

    // 2. Obtenir les schémas de validation
    const schemas = getValidationSchemas()

    // 3. Valider avec messages traduits
    const body = await request.json()
    const validation = await validateRequestBodyWithLocale(
        schemas.createAnimalCreateSchema,
        body,
        locale
    )

    if (!validation.success) {
        // Les messages d'erreur sont déjà traduits
        throw new ValidationError('Invalid data', validation.errors!, 'VALIDATION_ERROR')
    }

    // 4. Erreurs business avec codes
    if (someBusinessRule) {
        // Le code sera automatiquement traduit par withErrorHandler
        throw new BusinessLogicError(
            'Business rule violation',
            'ALREADY_SOLD'  // Ce code sera traduit
        )
    }

    // 5. Réponse de succès
    return NextResponse.json({
        success: true,
        data: result
    })
}, { operation: 'CREATE_RESOURCE' })
```

### Codes d'erreur disponibles

Tous les codes d'erreur sont définis dans `ERROR_CODE_MAP` (`i18n-errors.ts`):

#### Erreurs d'authentification
- `UNAUTHORIZED` - Non authentifié
- `FORBIDDEN` - Accès refusé

#### Erreurs d'animaux
- `INVALID_STATUS_TRANSITION` - Transition de statut invalide
- `HAS_ACTIVE_EVENTS` - A des événements actifs
- `ALREADY_DEAD` - Déjà marqué comme mort
- `ALREADY_SOLD` - Déjà marqué comme vendu

#### Erreurs de caisse
- `INSUFFICIENT_BALANCE` - Solde insuffisant
- `EXCEEDS_REMAINING_DEBT` - Dépasse la dette restante
- `ALREADY_REIMBURSED` - Déjà remboursé

*Voir `ERROR_CODE_MAP` pour la liste complète*

## Ajouter de nouveaux messages

### 1. Ajouter dans les fichiers de traduction

**`messages/fr.json`:**
```json
{
  "errors": {
    "myNewError": "Mon nouveau message d'erreur en français"
  }
}
```

**`messages/en.json`:**
```json
{
  "errors": {
    "myNewError": "My new error message in English"
  }
}
```

**`messages/ar.json`:**
```json
{
  "errors": {
    "myNewError": "رسالة الخطأ الجديدة بالعربية"
  }
}
```

### 2. Ajouter le code dans ERROR_CODE_MAP

```typescript
// src/lib/utils/i18n-errors.ts
export const ERROR_CODE_MAP: Record<string, string> = {
    // ... existing codes
    'MY_NEW_ERROR': 'myNewError'
}
```

### 3. Utiliser dans le code

```typescript
throw new BusinessLogicError(
    'Fallback message',
    'MY_NEW_ERROR'
)
```

## Créer un nouveau schéma de validation

### 1. Définir le schéma dans `validation-schemas.ts`

```typescript
export async function createMyNewSchema(locale: Locale = 'fr') {
    const t = await getTranslations({ locale, namespace: 'validation' })
    const errorMap = await getZodErrorMap(locale)

    return z.object({
        name: z.string({
            required_error: t('myField.required'),
            errorMap
        }).min(1, t('myField.empty')),

        age: z.number({
            invalid_type_error: t('myField.invalidType'),
            errorMap
        }).positive(t('myField.positive'))
    })
}
```

### 2. Ajouter les traductions

Dans `messages/{locale}.json`, section `validation`:

```json
{
  "validation": {
    "myField": {
      "required": "Ce champ est requis",
      "empty": "Ne peut pas être vide",
      "invalidType": "Doit être un nombre",
      "positive": "Doit être positif"
    }
  }
}
```

### 3. Utiliser dans une route

```typescript
const schemas = getValidationSchemas()
const validation = await validateRequestBodyWithLocale(
    schemas.createMyNewSchema,
    body,
    locale
)
```

## Messages de validation Zod standards

Les messages Zod standards sont déjà traduits:

- `required` - Champ requis
- `invalidType` - Type invalide
- `stringMin` - Minimum de caractères
- `stringMax` - Maximum de caractères
- `numberMin` / `numberMax` - Min/max pour nombres
- `invalidEmail` - Email invalide
- `invalidUrl` - URL invalide
- `invalidUuid` - UUID invalide
- `invalidEnum` - Valeur d'énumération invalide

## Gestion automatique de la locale

Le système extrait automatiquement la locale de plusieurs sources (par ordre de priorité):

1. **URL path** - `/fr/dashboard`, `/en/animals`, `/ar/events`
2. **Accept-Language header** - Header HTTP standard
3. **Défaut** - Français (fr)

```typescript
// Fonction utilisée automatiquement par withErrorHandler
const locale = getLocaleFromRequest(request)
// => 'fr' | 'en' | 'ar'
```

## Bonnes pratiques

### ✅ À faire

1. **Toujours utiliser des codes d'erreur**
   ```typescript
   throw new BusinessLogicError('Message', 'ERROR_CODE')
   ```

2. **Utiliser validateRequestBodyWithLocale pour les nouvelles routes**
   ```typescript
   const validation = await validateRequestBodyWithLocale(
       schemas.createSchema,
       body,
       locale
   )
   ```

3. **Ajouter tous les messages dans les 3 langues**

### ❌ À éviter

1. **Messages en dur sans code**
   ```typescript
   // ❌ Mauvais
   throw new Error('This will not be translated')

   // ✅ Bon
   throw new BusinessLogicError('Fallback', 'ERROR_CODE')
   ```

2. **Oublier une langue**
   - Toujours traduire dans fr, en, et ar

3. **Utiliser validateRequestBody au lieu de validateRequestBodyWithLocale**
   - L'ancien retourne des messages en anglais

## Migration progressive

Les anciennes routes peuvent continuer à utiliser `validateRequestBody` et les schémas statiques. Les messages seront en anglais mais le système continuera de fonctionner.

Pour migrer une route:

1. Ajouter `getLocaleFromRequest` et `getValidationSchemas`
2. Remplacer `validateRequestBody` par `validateRequestBodyWithLocale`
3. Passer le schema factory au lieu du schema statique

Exemple:
```typescript
// Avant
const validation = validateRequestBody(animalCreateSchema, body)

// Après
const locale = getLocaleFromRequest(request)
const schemas = getValidationSchemas()
const validation = await validateRequestBodyWithLocale(
    schemas.createAnimalCreateSchema,
    body,
    locale
)
```

## Tests

Pour tester les messages d'erreur dans différentes langues:

```bash
# Tester en français
curl -H "Accept-Language: fr" http://localhost:3000/fr/api/...

# Tester en anglais
curl -H "Accept-Language: en" http://localhost:3000/en/api/...

# Tester en arabe
curl -H "Accept-Language: ar" http://localhost:3000/ar/api/...
```

## Support

Pour toute question sur le système de messages multilingues, consultez:
- `src/lib/utils/i18n-errors.ts` - Code source
- `messages/*.json` - Fichiers de traduction
- `src/lib/middleware/validation-schemas.ts` - Schémas de validation
