# Farm Tracker API Specification

> **Version**: 0.9 (Production Ready)  
> **Base URL**: `https://your-domain.com/api`  
> **Authentication**: Session-based (JWT cookies)  
> **Content-Type**: `application/json`  
> **Target**: Mobile Native Application (iOS/Android)

---

## 📱 **Mobile Application Requirements**

### Offline Support Considerations
- **Critical for mobile**: Most GET endpoints should be cached locally
- **Sync patterns**: POST/PUT/DELETE operations should queue when offline
- **Conflict resolution**: Last-write-wins for most entities
- **Local storage**: SQLite recommended for mobile data persistence

### Performance Optimizations
- **Pagination**: Use `limit`/`offset` parameters where available
- **Selective sync**: Filter by date ranges for events/cashbox movements
- **Image handling**: Photos are Base64 in responses (consider caching strategy)
- **Background sync**: Implement periodic sync for reminders and stats

---

## 🔐 **Authentication Flow**

### Initial Setup
1. **Register/Login** → Session cookie set automatically
2. **Select Farm** → Farm context stored in session
3. **API Calls** → Session validated on each request

### Session Management
```typescript
// Session cookie is httpOnly, handled automatically
// Check session status
GET /api/auth/session

// Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Returns user + default farm context
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "name": "..." },
    "farm": { "id": "farm-id", "name": "...", "role": "OWNER" }
  }
}
```

### Role-Based Access Control

| Endpoint Category | OWNER | ASSOCIATE | WORKER |
|-------------------|-------|-----------|--------|
| **Farm Settings** | ✅ Full | ❌ Read Only | ❌ Read Only |
| **Members/Invitations** | ✅ Full | ❌ Read Only | ❌ Read Only |
| **Animals** | ✅ Full | ✅ Full | ✅ Create/Read |
| **Events** | ✅ Full | ✅ Full | ✅ Create/Read |
| **Cashbox** | ✅ Full | ✅ Full | ✅ Create/Read |
| **Dashboard/Stats** | ✅ Read | ✅ Read | ✅ Read |
| **Export** | ✅ Full | ✅ Full | ❌ None |

---

## 📊 **Dashboard & Statistics**

### GET `/api/farms/{farmId}/dashboard`
**Purpose**: Main dashboard data for mobile home screen  
**Auth**: Required (READ)  
**Cache**: High priority - cache 5 minutes

```typescript
// Response
{
  "success": true,
  "data": {
    "totalAnimals": 150,
    "activeAnimals": 145,
    "soldAnimals": 4,
    "deadAnimals": 1,
    "totalEvents": 342,
    "recentEvents": Event[],
    "cashboxBalance": 1500.75,
    "totalDeposits": 5000.00,
    "totalExpenses": 3499.25,
    "upcomingEvents": 12
  }
}
```

**Mobile UX**: Perfect for dashboard widgets and home screen overview

---

### GET `/api/farms/{farmId}/dashboard/reminders`
**Purpose**: Critical alerts for mobile notifications  
**Auth**: Required (READ)  
**Cache**: 1 minute (real-time important)

```typescript
// Query params
?days=30  // Look ahead period

// Response
{
  "success": true,
  "data": {
    "urgent": [        // <= 7 days (RED alerts)
      {
        "id": "event-uuid",
        "targetId": "animal-uuid",
        "eventType": "VACCINATION",
        "targetSpecies": "Goat", 
        "targetTag": "TAG001",
        "nextDueDate": "2024-01-25T00:00:00Z",
        "daysUntilDue": 2
      }
    ],
    "upcoming": [      // > 7 days (YELLOW alerts)
      { /* ... */ }
    ],
    "total": 12
  }
}
```

**Mobile UX**: 
- Push notifications for urgent items
- Badge counts on app icon
- Home screen reminder widgets

---

## 🐄 **Animals Management**

### GET `/api/farms/{farmId}/animals`
**Purpose**: Animal list with filtering for mobile grids/lists  
**Auth**: Required (READ)  
**Cache**: Medium priority - cache 10 minutes

```typescript
// Query filters (all optional)
?species=Goat
&type=INDIVIDUAL  // or LOT
&status=ACTIVE    // ACTIVE/SOLD/DEAD
&sex=FEMALE       // MALE/FEMALE

// Response
{
  "success": true,
  "data": [
    {
      "id": "animal-uuid",
      "farmId": "farm-uuid", 
      "tagNumber": "TAG001",
      "type": "INDIVIDUAL",    // or "LOT"
      "species": "Goat",
      "sex": "FEMALE",         // null for LOT
      "birthDate": "2023-01-15T00:00:00Z",
      "estimatedAge": null,    // manual age if no birthDate
      "status": "ACTIVE",      // ACTIVE/SOLD/DEAD
      "photoUrl": "data:image/jpeg;base64,...", // or null
      "lotCount": null,        // number for LOT type
      "fatherId": "uuid",      // genealogy parent
      "motherId": "uuid",      // genealogy parent  
      "createdAt": "2024-01-01T00:00:00Z",
      "createdBy": "uuid"
    }
  ]
}
```

**Mobile UX**:
- Grid/list views with photos
- Search/filter by species, status
- Sorting options
- Pull-to-refresh

---

### POST `/api/farms/{farmId}/animals`
**Purpose**: Create animal (mobile form submission)  
**Auth**: Required (CREATE)

```typescript
// Request body
{
  "type": "INDIVIDUAL",      // Required: INDIVIDUAL or LOT
  "species": "Goat",         // Required: string
  "tagNumber": "TAG001",     // Optional: unique identifier
  "sex": "FEMALE",          // Optional: MALE/FEMALE (not for LOT)
  "birthDate": "2023-01-15T00:00:00Z", // Optional: ISO date
  "estimatedAge": 12,        // Optional: months if no birthDate
  "status": "ACTIVE",        // Optional: default ACTIVE
  "photoUrl": "data:image/jpeg;base64,...", // Optional: from upload
  "lotCount": 25,            // Required for LOT type
  "fatherId": "uuid",        // Optional: genealogy
  "motherId": "uuid"         // Optional: genealogy
}

// Response: 201 Created
{
  "success": true,
  "data": { /* Animal object */ },
  "message": "Animal created successfully"
}

// Errors
400: "Birth date cannot be in the future"
400: "LOT type requires lotCount" 
400: "Species cannot be empty"
403: "Insufficient permissions to create animals"
```

**Mobile UX**:
- Form with camera integration for photos
- Species picker/autocomplete
- Date picker for birthDate
- Genealogy selector (search existing animals)

---

### GET `/api/farms/{farmId}/animals/{animalId}`
**Purpose**: Animal details for detail screens  
**Auth**: Required (READ)

```typescript
// Response: Same as list item but single object
{
  "success": true,
  "data": { /* Single Animal object */ }
}
```

**Mobile UX**: Detail screen with full information and photo gallery

---

### POST `/api/farms/{farmId}/animals/upload` 
**Purpose**: Upload animal photos from mobile camera  
**Auth**: Required (CREATE)

```typescript
// FormData request
const formData = new FormData();
formData.append('photo', imageFile); // Max 2MB, image/* MIME types

// Response: 200 OK
{
  "success": true,
  "data": {
    "photoUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..." 
  },
  "message": "Photo uploaded successfully"
}

// Errors
400: "No photo file provided"
400: "Only image files are allowed"  
400: "Photo must be smaller than 2MB"
```

**Mobile UX**:
- Camera integration
- Image compression before upload
- Progress indicators
- Error handling for large files

---

## 📅 **Events & Timeline**

### GET `/api/farms/{farmId}/events`
**Purpose**: Events list with powerful filtering  
**Auth**: Required (READ)  
**Cache**: Low priority - cache 5 minutes

```typescript
// Query filters (all optional)
?targetId=animal-uuid           // Events for specific animal
&eventType=VACCINATION,TREATMENT // Comma-separated types
&startDate=2024-01-01T00:00:00Z // Date range start  
&endDate=2024-01-31T23:59:59Z   // Date range end
&hasNextDueDate=true            // Only events with future reminders
&nextDueBefore=2024-02-01T00:00:00Z // Upcoming reminders
&limit=50                       // Pagination
&offset=0                       // Pagination

// Response
{
  "success": true,
  "data": [
    {
      "id": "event-uuid",
      "farmId": "farm-uuid",
      "targetId": "animal-uuid",
      "targetType": "ANIMAL",     // or "LOT"  
      "eventType": "VACCINATION", // BIRTH/VACCINATION/TREATMENT/WEIGHT/SALE/DEATH/NOTE
      "eventDate": "2024-01-15T10:00:00Z",
      "note": "Rabies vaccination",
      "cost": 25.50,              // Optional: expense amount
      "nextDueDate": "2025-01-15T10:00:00Z", // Optional: next reminder
      "payload": {                // Optional: structured data
        "vaccine": "Rabies",
        "dosage": "1ml"
      },
      "attachmentUrl": null,      // Optional: file attachment
      "createdAt": "2024-01-15T00:00:00Z",
      "createdBy": "uuid"
    }
  ]
}
```

**Mobile UX**:
- Timeline view (chronological)
- Filter by animal, event type, date
- Reminder badges
- Infinite scroll pagination

---

### POST `/api/farms/{farmId}/events`
**Purpose**: Create events from mobile forms  
**Auth**: Required (CREATE)  
**Side Effects**: Creates cashbox expense if cost > 0

```typescript
// Request body
{
  "targetId": "animal-uuid",              // Required: animal/lot UUID
  "targetType": "ANIMAL",                 // Required: must match animal type
  "eventType": "VACCINATION",             // Required: see enum above
  "eventDate": "2024-01-15T10:00:00Z",   // Required: when it happened
  "note": "Annual rabies shot",           // Optional: description
  "cost": 25.50,                         // Optional: creates expense
  "nextDueDate": "2025-01-15T10:00:00Z", // Optional: reminder
  "payload": { "vaccine": "Rabies" },     // Optional: structured data
  "attachmentUrl": null,                  // Optional: file URL
  "category": "VET"                       // Optional: expense category
}

// Response: 201 Created
{
  "success": true, 
  "data": { /* Event object */ },
  "message": "Event created successfully"
}

// Errors
400: "Missing required fields"
400: "Target type mismatch" 
404: "Target animal/lot not found or does not belong to this farm"
```

**Mobile UX**:
- Quick event entry forms
- Animal picker with search
- Cost entry with calculator
- Reminder date picker  
- Photo attachments

---

### GET `/api/farms/{farmId}/events/timeline/{targetId}`
**Purpose**: Complete timeline for animal detail screens  
**Auth**: Required (READ)

```typescript
// Response
{
  "success": true,
  "data": {
    "target": {
      "id": "animal-uuid",
      "type": "INDIVIDUAL", 
      "species": "Goat",
      "status": "ACTIVE",
      "tagNumber": "TAG001"
    },
    "events": [
      { /* Chronologically sorted events */ }
    ]
  }
}
```

**Mobile UX**: Animal detail page with full medical/event history

---

### GET `/api/farms/{farmId}/events/upcoming`
**Purpose**: Reminder management screen  
**Auth**: Required (READ)

```typescript
// Query params
?days=30  // Look ahead period

// Response  
{
  "success": true,
  "data": {
    "urgent": [/* <= 7 days */],
    "upcoming": [/* > 7 days */],
    "total": 12
  }
}
```

**Mobile UX**: 
- Reminders screen
- Push notification data source
- Task management

---

## 💰 **Financial Management (Cashbox)**

### GET `/api/farms/{farmId}/cashbox`
**Purpose**: Financial overview for mobile dashboard  
**Auth**: Required (READ)  
**Cache**: Medium priority - cache 2 minutes

```typescript
// Query params
?limit=10  // Recent movements count

// Response
{
  "success": true,
  "data": {
    "balance": 1500.75,           // Current cash balance
    "totalDeposits": 5000.00,     // All-time deposits
    "totalCashExpenses": 3200.50, // All-time cash expenses
    "totalReimbursements": 298.75, // All-time reimbursements
    "outstandingDebt": 150.00,    // Outstanding credit expenses
    "recentMovements": [
      {
        "id": "movement-uuid",
        "type": "DEPOSIT",        // DEPOSIT/EXPENSE_CASH/EXPENSE_CREDIT/REIMBURSEMENT
        "amount": 500.00,
        "description": "Milk sales",
        "category": null,         // FEED/VET/LABOR/TRANSPORT/EQUIPMENT/UTILITIES/OTHER
        "createdAt": "2024-01-20T15:30:00Z",
        "createdByName": "John Doe",
        "paidBy": "user-uuid"     // Who provided money (for expenses)
      }
    ]
  }
}
```

**Mobile UX**:
- Financial dashboard widget  
- Recent transactions list
- Balance prominently displayed
- Outstanding debt warnings

---

### POST `/api/farms/{farmId}/cashbox/deposit`
**Purpose**: Record cash deposits from mobile  
**Auth**: Required (CREATE)

```typescript
// Request body
{
  "amount": 500.00,                // Required: positive number
  "description": "Milk sales",     // Required: what was sold
  "paidBy": "user-uuid"           // Optional: who provided money (default: current user)
}

// Response: 201 Created
{
  "success": true,
  "data": { /* Movement object */ },
  "message": "Deposit created successfully"
}
```

**Mobile UX**:
- Quick deposit entry
- Amount keyboard
- Description autocomplete
- Who paid selector

---

### POST `/api/farms/{farmId}/cashbox/expense`
**Purpose**: Record expenses (cash or credit)  
**Auth**: Required (CREATE)

```typescript
// Request body
{
  "type": "CASH",                    // Required: CASH or CREDIT  
  "amount": 25.50,                  // Required: positive number
  "description": "Feed purchase",    // Required: description
  "category": "FEED",               // Required: expense category
  "paidBy": "user-uuid"             // Required for CREDIT type
}

// Response for CASH: 201 Created (reduces cashbox immediately)
// Response for CREDIT: 201 Created (creates debt to paidBy person)
{
  "success": true,
  "data": { /* Movement or CreditExpense object */ },
  "message": "Cash expense recorded successfully"
}
```

**Mobile UX**:
- Expense type toggle (Cash/Credit)
- Category picker
- Member selector for credit expenses
- Receipt photo attachment

---

### GET `/api/farms/{farmId}/cashbox/credit-expenses`
**Purpose**: Outstanding debts management  
**Auth**: Required (READ)

```typescript
// Query params
?status=OUTSTANDING  // Optional: filter by status

// Response
{
  "success": true,
  "data": [
    {
      "id": "expense-uuid",
      "amount": 100.00,           // Original amount
      "description": "Veterinary consultation", 
      "category": "VET",
      "paidBy": "member-uuid",
      "paidByName": "John Doe",   // Who to reimburse
      "status": "OUTSTANDING",    // OUTSTANDING/PARTIALLY_REIMBURSED/FULLY_REIMBURSED
      "remainingAmount": 100.00,  // Amount left to reimburse
      "createdAt": "2024-01-15T10:00:00Z",
      "createdByName": "Jane Smith"
    }
  ]
}
```

**Mobile UX**:
- Debt management screen
- Quick reimbursement actions
- Filter by person/status
- Payment reminders

---

### POST `/api/farms/{farmId}/cashbox/reimbursement`
**Purpose**: Reimburse credit expenses  
**Auth**: Required (CREATE)

```typescript
// Request body
{
  "creditExpenseId": "expense-uuid",  // Required: which debt to pay
  "amount": 50.00,                   // Required: reimbursement amount
  "description": "Partial payment"    // Optional: note
}

// Response: 201 Created
{
  "success": true,
  "data": {
    "movement": { /* Reimbursement movement */ },
    "expense": {  /* Updated credit expense with new remainingAmount */ }
  },
  "message": "Reimbursement processed successfully"
}
```

**Mobile UX**:
- Debt detail screen with pay button
- Partial/full payment options
- Confirmation screens

---

## 👥 **Members & Farm Management**

### GET `/api/farms/{farmId}/members`
**Purpose**: Farm member list  
**Auth**: Required (READ)

```typescript
// Query params (optional)
?status=ACTIVE  // ACTIVE/INACTIVE
&role=OWNER     // OWNER/ASSOCIATE/WORKER

// Response
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "member-uuid",
        "userId": "user-uuid", 
        "role": "OWNER",        // OWNER/ASSOCIATE/WORKER
        "status": "ACTIVE",     // ACTIVE/INACTIVE
        "userName": "John Doe",
        "userEmail": "john@example.com",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

**Mobile UX**: 
- Team screen
- Contact information  
- Role badges
- Activity status

---

### GET `/api/farms/{farmId}/invitations`
**Purpose**: Pending invitations management  
**Auth**: Required (READ) + OWNER only

```typescript
// Response
{
  "success": true,
  "data": {
    "invitations": [
      {
        "id": "invitation-uuid",
        "email": "newuser@example.com", 
        "role": "ASSOCIATE",
        "status": "PENDING",
        "expiresAt": "2024-02-20T00:00:00Z",
        "inviterName": "John Doe",
        "createdAt": "2024-01-20T00:00:00Z"
      }
    ]
  }
}
```

**Mobile UX**:
- Pending invitations list
- Resend/cancel actions
- Expiration warnings

---

### POST `/api/farms/{farmId}/invitations`
**Purpose**: Invite new members  
**Auth**: Required (CREATE) + OWNER only

```typescript
// Request body
{
  "email": "newuser@example.com",  // Required: valid email
  "role": "ASSOCIATE"             // Required: OWNER/ASSOCIATE/WORKER
}

// Response: 201 Created
{
  "success": true,
  "data": {
    "invitation": { /* Invitation object */ },
    "invitationLink": "https://app.com/invitation/token..."
  },
  "message": "Invitation sent successfully"
}
```

**Mobile UX**:
- Invite member form
- Email validation
- Role selection
- Share invitation link

---

## 📤 **Data Export** 

### GET `/api/farms/{farmId}/export`
**Purpose**: Export data for external analysis  
**Auth**: Required (READ) - OWNER/ASSOCIATE only

```typescript
// Query params
?type=animals     // Required: animals/events/financial  
&format=csv       // Optional: only csv supported

// Response: CSV file download
Content-Type: text/csv
Content-Disposition: attachment; filename="animals-farm-uuid-2024-01-20.csv"

// CSV Structure varies by type:
// animals: ID,Type,Species,Sex,Birth Date,Estimated Age,Status,Lot Count,Created At,Created By,Updated At,Updated By
// events: ID,Target ID,Target Type,Event Type,Event Date,Note,Cost,Next Due Date,Created At,Created By,Updated At,Updated By  
// financial: ID,Type,Amount,Description,Category,Related Expense ID,Created At,Created By,Status,Remaining Amount,Paid By
```

**Mobile UX**:
- Export options screen
- Email/share exported files
- Progress indicators for large exports

---

## 🔑 **Authentication Endpoints**

### POST `/api/auth/register`
**Purpose**: Create new user account  
**Auth**: Not required

```typescript
// Request body
{
  "email": "user@example.com",    // Required: unique email
  "name": "John Doe",            // Required: full name
  "password": "password123"       // Required: min 8 characters
}

// Response: 200 OK (auto-login)
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "name": "..." }
    // No farm initially
  }
}
```

---

### POST `/api/auth/login`  
**Purpose**: Authenticate existing user  
**Auth**: Not required

```typescript
// Request body
{
  "email": "user@example.com",
  "password": "password123"
}

// Response: 200 OK
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "name": "..." },
    "farm": { "id": "farm-uuid", "name": "...", "role": "OWNER" } // First farm
  }
}
```

---

### GET `/api/auth/session`
**Purpose**: Check current session status  
**Auth**: Required

```typescript
// Response: 200 OK if authenticated
{
  "success": true,
  "data": {
    "user": { /* User object */ },
    "farm": { /* Current farm context */ }
  }
}

// Response: 401 Unauthorized if not authenticated
```

---

### POST `/api/auth/logout`
**Purpose**: End session  
**Auth**: Required

```typescript
// Response: 200 OK
{
  "success": true
}
```

---

## 🏗️ **Farm Management**

### GET `/api/farms`
**Purpose**: List user's farms  
**Auth**: Required

```typescript
// Response
{
  "success": true,
  "data": [
    {
      "id": "farm-uuid",
      "name": "My Farm",
      "currency": "TND",         // Default currency
      "timezone": "Africa/Tunis", // Farm timezone  
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST `/api/farms`
**Purpose**: Create new farm  
**Auth**: Required

```typescript
// Request body
{
  "name": "My New Farm",              // Required
  "currency": "TND",                  // Optional: default TND
  "timezone": "Africa/Tunis"          // Optional: default Africa/Tunis
}

// Response: 201 Created
{
  "success": true,
  "data": {
    "farm": { /* Farm object */ },
    "member": { /* User becomes OWNER */ }
  }
}
```

---

## 📋 **Error Handling**

### Standard Error Response Format
```typescript
{
  "success": false,
  "error": "Human readable error message",
  "code": "ERROR_CODE",              // Optional: for programmatic handling
  "details": [                       // Optional: validation errors
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes
- **200 OK**: Success
- **201 Created**: Resource created successfully  
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource already exists
- **500 Internal Server Error**: Server error

### Common Error Scenarios for Mobile Apps

```typescript
// Network/connectivity errors
{
  "success": false,
  "error": "Network error - please check your connection",
  "code": "NETWORK_ERROR"
}

// Session expired
{
  "success": false,
  "error": "Your session has expired. Please log in again.",
  "code": "SESSION_EXPIRED"
}

// Permission denied
{
  "success": false,
  "error": "You don't have permission to perform this action",
  "code": "INSUFFICIENT_PERMISSIONS"  
}

// Validation errors
{
  "success": false,
  "error": "Invalid input data",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

---

## 🔄 **Mobile Sync Strategies**

### Critical Data (Sync Immediately)
- **Reminders/Alerts**: Real-time important
- **Cashbox Balance**: Financial accuracy
- **New Events**: Time-sensitive

### Regular Data (Sync Every 5-10 minutes)  
- **Animal Lists**: Usually stable
- **Dashboard Stats**: Periodic updates fine
- **Recent Events**: Background refresh

### Large Data (Sync on Demand)
- **Full Event History**: User-initiated
- **Photo Uploads**: Manual/background upload
- **Export Data**: User request only

### Offline Queue Strategy
```typescript
// Queue operations when offline
interface QueuedOperation {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

// Process queue when online
// Handle conflicts with server-side timestamps
```

---

## 🚨 **Push Notifications**

### Notification Types
```typescript
// Urgent reminders (< 7 days)
{
  "type": "urgent_reminder",
  "title": "Vaccination Due Tomorrow", 
  "body": "TAG001 (Goat) - Rabies vaccination due",
  "data": {
    "eventId": "uuid",
    "animalId": "uuid", 
    "daysUntilDue": 1
  }
}

// Financial alerts
{
  "type": "low_balance",
  "title": "Low Cashbox Balance",
  "body": "Current balance: $50.25",
  "data": {
    "balance": 50.25,
    "farmId": "uuid"
  }
}

// New member joined
{
  "type": "member_joined", 
  "title": "New Team Member",
  "body": "John Doe has joined the farm",
  "data": {
    "memberId": "uuid",
    "farmId": "uuid"
  }
}
```

---

## 📱 **Mobile-Specific Considerations**

### Performance Tips
- **Image Optimization**: Compress photos before Base64 encoding
- **Pagination**: Use small page sizes (20-50 items)
- **Selective Loading**: Load details on-demand
- **Background Sync**: Minimize battery usage

### UX Recommendations  
- **Offline Indicators**: Show connection status
- **Sync Progress**: Visual feedback for data sync
- **Form Validation**: Client-side validation for UX
- **Error Recovery**: Retry mechanisms with exponential backoff

### Security Best Practices
- **HTTPS Only**: All API calls over TLS
- **Session Timeout**: Handle expired sessions gracefully  
- **Input Validation**: Validate on client + server
- **Sensitive Data**: Don't store passwords locally

---

## 🔗 **OpenAPI Schema Reference**

```yaml
openapi: 3.0.3
info:
  title: Farm Tracker API
  version: 0.9.0
  description: Complete API for Farm Management System

components:
  schemas:
    Animal:
      type: object
      required: [farmId, type, species]
      properties:
        id: 
          type: string
          format: uuid
        farmId:
          type: string  
          format: uuid
        tagNumber:
          type: string
          nullable: true
        type:
          type: string
          enum: [INDIVIDUAL, LOT]
        species:
          type: string
          minLength: 1
        sex:
          type: string
          enum: [MALE, FEMALE]
          nullable: true
        birthDate:
          type: string
          format: date-time
          nullable: true
        estimatedAge:
          type: integer
          nullable: true
        status:
          type: string
          enum: [ACTIVE, SOLD, DEAD]
          default: ACTIVE
        photoUrl:
          type: string
          nullable: true
        lotCount:
          type: integer
          nullable: true
        fatherId:
          type: string
          format: uuid
          nullable: true
        motherId:
          type: string
          format: uuid
          nullable: true
        createdAt:
          type: string
          format: date-time
        createdBy:
          type: string
          format: uuid

    Event:
      type: object
      required: [farmId, targetId, targetType, eventType, eventDate, payload]
      properties:
        id:
          type: string
          format: uuid
        farmId:
          type: string
          format: uuid
        targetId:
          type: string
          format: uuid
        targetType:
          type: string
          enum: [ANIMAL, LOT]
        eventType:
          type: string
          enum: [BIRTH, VACCINATION, TREATMENT, WEIGHT, SALE, DEATH, NOTE]
        eventDate:
          type: string
          format: date-time
        note:
          type: string
          nullable: true
        cost:
          type: number
          format: float
          nullable: true
        nextDueDate:
          type: string
          format: date-time
          nullable: true
        payload:
          type: object
          additionalProperties: true
        attachmentUrl:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time
        createdBy:
          type: string
          format: uuid

    CashboxMovement:
      type: object
      required: [farmId, type, amount, description]
      properties:
        id:
          type: string
          format: uuid
        farmId:
          type: string
          format: uuid
        type:
          type: string
          enum: [DEPOSIT, EXPENSE_CASH, EXPENSE_CREDIT, REIMBURSEMENT]
        amount:
          type: number
          format: float
          minimum: 0
        description:
          type: string
          minLength: 1
        category:
          type: string
          enum: [FEED, VET, LABOR, TRANSPORT, EQUIPMENT, UTILITIES, OTHER]
          nullable: true
        relatedExpenseId:
          type: string
          format: uuid
          nullable: true
        paidBy:
          type: string
          format: uuid
          nullable: true
        createdBy:
          type: string
          format: uuid
        createdAt:
          type: string
          format: date-time

  securitySchemes:
    SessionCookie:
      type: apiKey
      in: cookie
      name: session

security:
  - SessionCookie: []
```

---

## 📞 **Support & Communication**

### For Missing Features
When your mobile development team needs endpoints or features not documented here:

1. **Create GitHub Issue** in the Farm Tracker repository
2. **Use API Request Template**:
   ```
   **Feature**: Brief description
   **Mobile Use Case**: How it will be used in mobile app  
   **Priority**: High/Medium/Low
   **Proposed Endpoint**: `GET/POST /api/...`
   **Request/Response Format**: Example JSON
   **Business Rules**: Any specific logic needed
   ```

### For Bug Reports
1. **Endpoint**: Which API endpoint
2. **Request**: Exact request sent
3. **Expected Response**: What you expected
4. **Actual Response**: What you received
5. **Mobile Platform**: iOS/Android version

### For Performance Issues
1. **Response Time**: How long the request takes
2. **Data Size**: Amount of data requested
3. **Network Conditions**: 3G/4G/WiFi
4. **Frequency**: How often endpoint is called

---

*This API specification documents all currently implemented endpoints in Farm Tracker v0.9. The mobile team should implement against these exact endpoints and communicate any missing requirements through the established channels.*