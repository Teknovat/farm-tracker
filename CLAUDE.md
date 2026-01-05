# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Farm Tracker is a multilingual (French, English, Arabic) farm management application built with Next.js 15, featuring livestock tracking, event management, and cashbox operations. It uses a role-based permission system with three roles: OWNER, ASSOCIATE, and WORKER.

## Development Commands

### Core Commands

- `npm run dev` - Start Next.js development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Commands

- `npm run db:generate` - Generate Drizzle migrations from schema
- `npm run db:migrate` - Apply pending migrations
- `npm run db:studio` - Open Drizzle Studio GUI (visual database explorer)

### Testing Commands

- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `vitest run <path>` - Run a specific test file (e.g., `vitest run src/lib/repositories/animal.test.ts`)
- `vitest run -t "<test name>"` - Run specific test by name

## Architecture

### Database Layer

**Technology**: SQLite with Drizzle ORM (`better-sqlite3`)

**Schema Location**: `src/lib/db/schema.ts` defines all tables (users, farms, farmMembers, animals, events, cashboxMovements, creditExpenses)

**Repository Pattern**: All database access goes through repositories in `src/lib/repositories/`:

- `BaseRepository<T>` - Abstract base class providing CRUD operations with soft delete support
- All repositories extend BaseRepository (FarmRepository, AnimalRepository, EventRepository, CashboxRepository, etc.)
- Repositories handle validation and business rules at the data layer

**Key Pattern**: Soft deletes are used throughout - records are marked with `deletedAt` timestamp instead of being physically deleted.

### API Routes Structure

**Location**: `src/app/api/` - All API routes follow Next.js 15 App Router conventions

**Standard Pattern for API Routes**:

1. Import repository, validation schemas, and error handlers
2. Extract route params using `await params` (Next.js 15 async params)
3. Verify authentication with `getCurrentUser()` from `@/lib/auth/server`
4. Check farm access permissions using `checkFarmAccess(userId, farmId, action)`
5. Validate request body/query params using Zod schemas from `@/lib/middleware/validation`
6. Perform business logic validation using functions from `@/lib/middleware/business-validation`
7. Execute repository operations
8. Wrap handlers with `withErrorHandler()` for consistent error responses

**Example Route Structure**:

```typescript
export const POST = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ farmId: string }> }
) => {
    const { farmId } = await params
    const user = await getCurrentUser()
    if (!user) throw new AuthorizationError('Authentication required', 'UNAUTHORIZED')

    const hasPermission = await checkFarmAccess(user.id, farmId, 'CREATE')
    if (!hasPermission) throw new AuthorizationError('Access denied', 'FORBIDDEN')

    const body = await request.json()
    const validation = validateRequestBody(schema, body)
    if (!validation.success) throw new ValidationError('Invalid data', validation.errors!)

    // Business logic and repository calls
    const result = await repository.create(...)

    return NextResponse.json<ApiResponse>({
        success: true,
        data: result
    }, { status: 201 })
}, { operation: 'CREATE_RESOURCE', farmId: 'farmId' })
```

### Authentication & Authorization

**Session Management**: JWT-based sessions using `jose` library

- Session stored in httpOnly cookies (7-day expiry)
- `src/lib/auth/session.ts` - createSession, verifySession, deleteSession, updateSession
- `src/lib/auth/server.ts` - getCurrentUser helper for API routes
- `src/middleware.ts` - Handles session refresh and i18n routing

**Permissions System**: `src/lib/auth/permissions.ts`

- Three roles: OWNER (full access), ASSOCIATE (read/create/update/export), WORKER (read/create only)
- `checkFarmAccess(userId, farmId, action)` validates user permission for farm operations
- Actions: 'READ', 'CREATE', 'UPDATE', 'DELETE'

### Error Handling

**Centralized Error System**: `src/lib/middleware/error-handler.ts`

**Error Classes**:

- `ValidationError` (400) - Zod validation failures with field-level details
- `BusinessLogicError` (422) - Business rule violations
- `AuthorizationError` (403) - Permission denied
- `NotFoundError` (404) - Resource not found
- `ApiError` (base class) - Generic API errors

**Error Wrapper**: Use `withErrorHandler(handler, context)` to wrap all API route handlers for consistent error responses with logging.

**Error Responses**: All errors return `ApiResponse` type with `success: false`, `error` message, `code`, and optional `details` array.

### Validation System

**Location**: `src/lib/middleware/validation.ts`

**Zod Schemas**: Pre-defined schemas for all resources (animalCreateSchema, eventCreateSchema, depositSchema, etc.) with detailed error messages in English.

**Validation Functions**:

- `validateRequestBody(schema, body)` - Validates request body
- `validateQueryParams(schema, searchParams)` - Validates URL query parameters with type coercion
- `createValidationResponse(errors)` - Creates standardized validation error response

**Business Validation**: `src/lib/middleware/business-validation.ts` - Domain-specific validation (e.g., status transitions, sale date before death date)

### Internationalization (i18n)

**Library**: next-intl

**Supported Locales**: French (default), English, Arabic

**Configuration**:

- `src/i18n/request.ts` - i18n routing configuration
- `src/middleware.ts` - Handles locale routing and session refresh
- `messages/` - Translation files (fr.json, en.json, ar.json)

**Client Usage**: Use hooks from `src/lib/i18n/hooks.ts` in components

**Route Pattern**: All page routes are under `[locale]` dynamic segment (e.g., `/fr/dashboard`, `/en/animals`)

### TypeScript Configuration

**Path Alias**: `@/*` maps to `./src/*` - Always use this for imports

**Strict Mode**: TypeScript strict mode is enabled

**Target**: ES2017

## Key Business Concepts

### Farm Membership

- Users can belong to multiple farms
- Each membership has a role (OWNER/ASSOCIATE/WORKER) and status (ACTIVE/INACTIVE)
- Farm context is stored in session after user selects a farm

### Animals

- Two types: INDIVIDUAL (single animal) or LOT (group of animals)
- INDIVIDUAL animals can have sex and birthDate
- LOT animals must have lotCount, cannot have sex specified
- Three statuses: ACTIVE, SOLD, DEAD (status transitions are validated)

### Events

- Track farm events: BIRTH, VACCINATION, TREATMENT, WEIGHT, SALE, DEATH, NOTE
- Events are linked to animals/lots via targetId and targetType
- Can include payload (JSON), cost, nextDueDate, and attachmentUrl
- SALE events must have a cost value

### Cashbox

- Four transaction types: DEPOSIT, EXPENSE_CASH, EXPENSE_CREDIT, REIMBURSEMENT
- Credit expenses create IOUs that can be partially/fully reimbursed
- Categories: FEED, VET, LABOR, TRANSPORT, EQUIPMENT, UTILITIES, OTHER
- Tracks who paid for credit expenses (paidBy field)

## Testing Practices

**Framework**: Vitest with jsdom environment

**Test Setup**: `src/test/setup.ts` - Global test configuration

**Important**: Tests use `pool: 'forks'` with `singleFork: true` to handle SQLite concurrency. Each test file should manage its own database state.

**Repository Tests**: Located alongside repositories (e.g., `animal.test.ts`, `farm.test.ts`)

## Common Patterns

### Creating New API Endpoints

1. Define Zod validation schema in `src/lib/middleware/validation.ts`
2. Add business validation function in `src/lib/middleware/business-validation.ts` if needed
3. Create route handler in `src/app/api/` following standard pattern above
4. Use `withErrorHandler` wrapper for consistent error handling
5. Always validate farmId access with `checkFarmAccess`
6. Return `ApiResponse` type for all responses

### Adding New Repository Methods

1. Extend `BaseRepository<T>` in `src/lib/repositories/`
2. Define TypeScript interfaces for domain types, filters, create/update data
3. Use Drizzle ORM query builders with proper type safety
4. Always include soft delete checks: `isNull(table.deletedAt)`
5. Add validation methods for business rules

### Database Schema Changes

1. Modify `src/lib/db/schema.ts`
2. Run `npm run db:generate` to create migration
3. Run `npm run db:migrate` to apply migration
4. Update repository interfaces and methods accordingly

## File Upload Pattern

**Upload Handler**: `src/lib/upload/handler.ts` - Handles file uploads with Base64 conversion
**Upload Config**: `src/lib/upload/config.ts` - File size limits, allowed types

Images are stored as Base64 data URLs directly in the database (Vercel-compatible).
