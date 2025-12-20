# Farm Management MVP - Design Document

## Overview

The Farm Management MVP is a Next.js monorepo application designed for mobile-first farm management. The system provides comprehensive animal lifecycle tracking, financial management through a cashbox system, and role-based access control. The architecture prioritizes simplicity, mobile usability, and deployment flexibility while maintaining data integrity and audit trails.

## Architecture

### System Architecture

The application follows a monolithic Next.js architecture with clear separation of concerns:

- **Frontend**: Next.js App Router with Tailwind CSS for mobile-first responsive design
- **Backend**: Next.js API routes and Server Actions for business logic
- **Database**: Relational database (PostgreSQL recommended for production, SQLite for development)
- **Authentication**: Server-side session management with role-based access control
- **File Storage**: Cloud storage integration for animal photos and event attachments

### Deployment Strategy

- **Primary**: Vercel deployment with serverless functions
- **Alternative**: Compatible with Railway, Fly.io, and self-hosted environments
- **Database**: Vercel Postgres for production, with migration support for other providers

## Components and Interfaces

### Core Components

#### Authentication & Authorization

- `AuthProvider`: Manages user sessions and role-based permissions
- `PermissionGuard`: Server-side middleware for route protection
- `RoleChecker`: Utility for validating user permissions

#### Animal Management

- `AnimalService`: Business logic for animal CRUD operations
- `EventService`: Manages animal lifecycle events and timeline
- `AnimalRepository`: Data access layer for animal records
- `EventRepository`: Data access layer for event records

#### Financial Management

- `CashboxService`: Manages cashbox balance calculations and movements
- `ExpenseService`: Handles expense creation and categorization
- `ReimbursementService`: Processes credit expense settlements
- `FinancialRepository`: Data access layer for financial records

#### Dashboard & Reporting

- `DashboardService`: Aggregates data for dashboard displays
- `ReportingService`: Generates summaries and exports
- `ReminderService`: Calculates upcoming vaccinations and treatments

#### Internationalization

- `I18nProvider`: Manages language selection and translation context
- `TranslationService`: Handles text translation and locale management
- `LocaleDetector`: Detects user's preferred language from browser/settings
- `DateFormatter`: Formats dates according to locale preferences

### API Interface Design

#### REST-like Endpoints Structure

```
/api/auth/
  POST /login
  POST /logout
  GET /session

/api/farms/
  GET / (list user farms)
  POST / (create farm)
  GET /:farmId
  PUT /:farmId

/api/farms/:farmId/animals/
  GET / (list with filters)
  POST / (create animal/lot)
  GET /:animalId
  PUT /:animalId
  DELETE /:animalId (soft delete)

/api/farms/:farmId/events/
  GET / (list with filters)
  POST / (create event)
  GET /:eventId
  PUT /:eventId

/api/farms/:farmId/cashbox/
  GET / (current balance and recent movements)
  POST /deposit
  POST /expense
  POST /reimbursement

/api/farms/:farmId/dashboard/
  GET / (dashboard data)
  GET /reminders
```

## Data Models

### Core Entities

#### Farm

```typescript
interface Farm {
  id: string;
  name: string;
  currency: string; // default: 'TND'
  timezone: string; // default: 'Africa/Tunis'
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### User & Membership

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FarmMember {
  id: string;
  userId: string;
  farmId: string;
  role: "OWNER" | "ASSOCIATE" | "WORKER";
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}
```

#### Animal

```typescript
interface Animal {
  id: string;
  farmId: string;
  type: "INDIVIDUAL" | "LOT";
  species: string;
  sex?: "MALE" | "FEMALE"; // for individual animals
  birthDate?: Date;
  estimatedAge?: number;
  status: "ACTIVE" | "SOLD" | "DEAD";
  photoUrl?: string;
  lotCount?: number; // for LOT type
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### Event

```typescript
interface Event {
  id: string;
  farmId: string;
  targetType: "ANIMAL" | "LOT";
  targetId: string;
  eventType: "BIRTH" | "VACCINATION" | "TREATMENT" | "WEIGHT" | "SALE" | "DEATH" | "NOTE";
  eventDate: Date;
  payload: Record<string, any>; // typed based on eventType
  note?: string;
  cost?: number;
  nextDueDate?: Date;
  attachmentUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### Financial Records

```typescript
interface CashboxMovement {
  id: string;
  farmId: string;
  type: "DEPOSIT" | "EXPENSE_CASH" | "EXPENSE_CREDIT" | "REIMBURSEMENT";
  amount: number;
  description: string;
  category?: "FEED" | "VET" | "LABOR" | "TRANSPORT" | "EQUIPMENT" | "UTILITIES" | "OTHER";
  relatedExpenseId?: string; // for reimbursements
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface CreditExpense {
  id: string;
  farmId: string;
  amount: number;
  description: string;
  category: string;
  paidBy: string; // user who advanced the money
  remainingAmount: number; // for partial reimbursements
  status: "OUTSTANDING" | "PARTIALLY_REIMBURSED" | "FULLY_REIMBURSED";
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

## Internationalization

### Language Support

The system supports three languages with French as the default for the Tunisian market:

- **French (fr)**: Primary language for Tunisia
- **English (en)**: International support
- **Arabic (ar)**: Regional language support with RTL layout

### Translation Architecture

```typescript
interface Translation {
  key: string;
  locale: "fr" | "en" | "ar";
  value: string;
  namespace?: string; // e.g., 'common', 'animals', 'cashbox'
}

interface UserPreferences {
  userId: string;
  locale: "fr" | "en" | "ar";
  dateFormat: string;
  numberFormat: string;
  timezone: string;
}
```

### Implementation Strategy

- **Client-side**: Next.js internationalization with dynamic imports
- **Translation Files**: JSON files organized by namespace and locale
- **Fallback**: French → English → Key display for missing translations
- **RTL Support**: CSS logical properties and direction detection for Arabic
- **Date/Number Formatting**: Locale-aware formatting using Intl API

### Translation Namespaces

- `common`: Shared UI elements (buttons, navigation, errors)
- `animals`: Animal management terminology
- `events`: Event types and descriptions
- `cashbox`: Financial terminology
- `dashboard`: Dashboard and reporting terms
- `auth`: Authentication and user management

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

- Event chronological ordering (2.3, 2.4) → Combined into single comprehensive property
- Authorization validation (7.4, 7.5) → Combined into single comprehensive property
- Input validation patterns → Grouped by entity type for efficiency

### Core Correctness Properties

**Property 1: Farm creation initializes cashbox**
_For any_ farm creation operation, the system should create exactly one cashbox with zero balance
**Validates: Requirements 1.1**

**Property 2: Role assignment validation**
_For any_ member invitation, the assigned role should be one of OWNER, ASSOCIATE, or WORKER
**Validates: Requirements 1.2**

**Property 3: Audit trail completeness**
_For any_ create or update operation, the system should populate createdBy, createdAt, updatedBy, and updatedAt fields
**Validates: Requirements 1.3**

**Property 4: Soft deletion preservation**
_For any_ delete operation, the data should remain in storage with a deletedAt timestamp
**Validates: Requirements 1.4**

**Property 5: Permission enforcement**
_For any_ operation requiring specific permissions, users without those permissions should be denied access
**Validates: Requirements 1.5, 7.1, 7.2, 7.3, 7.4, 7.5**

**Property 6: Animal type validation**
_For any_ animal creation, the type should be either INDIVIDUAL or LOT
**Validates: Requirements 2.1**

**Property 7: Animal required fields validation**
_For any_ animal creation attempt with missing species, type, or status, the system should reject the operation
**Validates: Requirements 2.2**

**Property 8: Event chronological ordering**
_For any_ animal with multiple events, retrieving the event timeline should return events in chronological order by eventDate
**Validates: Requirements 2.3, 2.4**

**Property 9: Photo storage round-trip**
_For any_ animal photo upload, storing and then retrieving the photo should return the same image data
**Validates: Requirements 2.5**

**Property 10: Event type validation**
_For any_ event creation, the eventType should be one of BIRTH, VACCINATION, TREATMENT, WEIGHT, SALE, DEATH, or NOTE
**Validates: Requirements 3.1**

**Property 11: Event required fields validation**
_For any_ event creation attempt with missing eventType, eventDate, or target, the system should reject the operation
**Validates: Requirements 3.2**

**Property 12: Optional event data preservation**
_For any_ event created with cost, nextDueDate, or attachment data, retrieving the event should return the same optional data
**Validates: Requirements 3.3, 3.4, 3.5**

**Property 13: Deposit balance increase**
_For any_ cashbox deposit operation, the calculated balance should increase by exactly the deposit amount
**Validates: Requirements 4.1**

**Property 14: Cash expense balance decrease**
_For any_ cash expense operation, the calculated balance should decrease by exactly the expense amount
**Validates: Requirements 4.2**

**Property 15: Credit expense debt creation**
_For any_ credit expense operation, the cashbox balance should remain unchanged and a debt record should be created
**Validates: Requirements 4.3**

**Property 16: Reimbursement dual effect**
_For any_ reimbursement operation, the cashbox balance should decrease and the corresponding credit expense debt should be reduced
**Validates: Requirements 4.4**

**Property 17: Partial reimbursement calculation**
_For any_ partial reimbursement, the remaining debt amount should equal the original amount minus all reimbursement amounts
**Validates: Requirements 4.5**

**Property 18: Dashboard calculation accuracy**
_For any_ dashboard request, the displayed totals should match the calculated values from the underlying data
**Validates: Requirements 5.1, 5.2**

**Property 19: Reminder date filtering**
_For any_ reminder request, only events with nextDueDate within the specified timeframe should be returned
**Validates: Requirements 5.3**

**Property 20: Expense category validation**
_For any_ expense creation, the category should be one of FEED, VET, LABOR, TRANSPORT, EQUIPMENT, UTILITIES, or OTHER
**Validates: Requirements 5.4**

**Property 21: Financial summary segregation**
_For any_ financial summary, cash and credit expenses should be displayed in separate totals
**Validates: Requirements 5.5**

**Property 22: Form submission feedback**
_For any_ form submission, the system should return a success or error response indicating the operation result
**Validates: Requirements 6.5**

**Property 23: CSV export format validation**
_For any_ data export request, the output should be valid CSV format with proper headers and data rows
**Validates: Requirements 8.1**

**Property 24: Export data completeness**
_For any_ export operation, all relevant records from the source data should be included in the export
**Validates: Requirements 8.2, 8.3, 8.5**

**Property 25: Export permission control**
_For any_ export request, users should only be able to export data they have permission to access
**Validates: Requirements 8.4**

**Property 26: Language preference persistence**
_For any_ user who selects a language preference, the system should persist and apply that preference across all subsequent sessions
**Validates: Requirements 9.2**

**Property 27: Translation completeness**
_For any_ user interface element, the system should display translated text in the selected language or fall back to French if translation is missing
**Validates: Requirements 9.3, 9.4**

**Property 28: Locale consistency**
_For any_ form or page, all text elements including labels, buttons, messages, and validation errors should be in the same selected language
**Validates: Requirements 9.5**

## Error Handling

### Error Categories

1. **Validation Errors**: Invalid input data, missing required fields
2. **Authorization Errors**: Insufficient permissions, unauthenticated requests
3. **Business Logic Errors**: Invalid state transitions, constraint violations
4. **System Errors**: Database failures, external service unavailability
5. **Localization Errors**: Missing translations, invalid locale settings

### Error Response Strategy

- Consistent error response format across all API endpoints
- Appropriate HTTP status codes (400, 401, 403, 404, 500)
- User-friendly error messages for frontend display in user's selected language
- Detailed error logging for debugging and monitoring
- Graceful degradation for non-critical features
- Translation fallback mechanism for error messages

### Specific Error Scenarios

- **Animal Management**: Prevent deletion of animals with active events
- **Financial Operations**: Reject reimbursements exceeding outstanding debt
- **Role Management**: Prevent removal of the last farm owner
- **Data Integrity**: Validate foreign key relationships before operations

## Testing Strategy

### Dual Testing Approach

The system will employ both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Unit Testing Requirements

Unit tests will cover:

- Specific examples that demonstrate correct behavior
- Integration points between components
- Error handling scenarios
- Edge cases and boundary conditions

### Property-Based Testing Requirements

- **Testing Library**: fast-check for JavaScript/TypeScript property-based testing
- **Test Configuration**: Minimum 100 iterations per property test to ensure thorough random input coverage
- **Property Tagging**: Each property-based test must include a comment with the format: `**Feature: farm-management-mvp, Property {number}: {property_text}**`
- **Implementation Mapping**: Each correctness property must be implemented by exactly one property-based test
- **Test Organization**: Property tests should be co-located with the modules they test

### Testing Coverage Requirements

- All correctness properties must have corresponding property-based tests
- Critical business logic must have unit test coverage
- API endpoints must have integration test coverage
- Database operations must have transaction rollback tests
- Authentication and authorization must have security tests
