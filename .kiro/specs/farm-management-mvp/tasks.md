# Implementation Plan

- [x] 1. Set up project structure and core infrastructure

  - Initialize Next.js project with TypeScript and Tailwind CSS
  - Configure database schema and migrations (PostgreSQL/SQLite)
  - Set up authentication system with session management
  - Create base repository pattern and database connection utilities
  - Configure file upload handling for photos and attachments
  - _Requirements: 1.1, 1.3, 2.5, 3.5_

- [ ]\* 1.1 Write property test for farm creation initializes cashbox

  - **Property 1: Farm creation initializes cashbox**
  - **Validates: Requirements 1.1**

- [x] 2. Implement user management and authentication

  - Create User and FarmMember data models with TypeScript interfaces
  - Implement user registration and login API endpoints
  - Build role-based permission system (OWNER, ASSOCIATE, WORKER)
  - Create middleware for server-side authentication and authorization
  - _Requirements: 1.2, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]\* 2.1 Write property test for role assignment validation

  - **Property 2: Role assignment validation**
  - **Validates: Requirements 1.2**

- [ ]\* 2.2 Write property test for permission enforcement

  - **Property 5: Permission enforcement**
  - **Validates: Requirements 1.5, 7.1, 7.2, 7.3, 7.4, 7.5**

- [x] 3. Create farm management system

  - Implement Farm data model and repository
  - Build farm creation API with automatic cashbox initialization
  - Create farm member invitation and role assignment functionality
  - Implement soft deletion system with deletedAt timestamps
  - Add audit trail system for all create/update operations
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]\* 3.1 Write property test for audit trail completeness

  - **Property 3: Audit trail completeness**
  - **Validates: Requirements 1.3**

- [ ]\* 3.2 Write property test for soft deletion preservation

  - **Property 4: Soft deletion preservation**
  - **Validates: Requirements 1.4**

- [x] 4. Implement animal management system

  - Create Animal data model supporting INDIVIDUAL and LOT types
  - Build animal creation API with validation for required fields
  - Implement animal listing with filtering capabilities
  - Create animal detail view with photo upload functionality
  - Add animal status management (ACTIVE, SOLD, DEAD)
  - _Requirements: 2.1, 2.2, 2.5_

- [ ]\* 4.1 Write property test for animal type validation

  - **Property 6: Animal type validation**
  - **Validates: Requirements 2.1**

- [ ]\* 4.2 Write property test for animal required fields validation

  - **Property 7: Animal required fields validation**
  - **Validates: Requirements 2.2**

- [ ]\* 4.3 Write property test for photo storage round-trip

  - **Property 9: Photo storage round-trip**
  - **Validates: Requirements 2.5**

- [x] 5. Build event tracking system

  - Create Event data model with support for all event types
  - Implement event creation API with validation for required fields
  - Build event timeline functionality with chronological ordering
  - Add support for optional event data (cost, nextDueDate, attachments)
  - Create event listing and filtering capabilities
  - _Requirements: 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]\* 5.1 Write property test for event type validation

  - **Property 10: Event type validation**
  - **Validates: Requirements 3.1**

- [ ]\* 5.2 Write property test for event required fields validation

  - **Property 11: Event required fields validation**
  - **Validates: Requirements 3.2**

- [ ]\* 5.3 Write property test for event chronological ordering

  - **Property 8: Event chronological ordering**
  - **Validates: Requirements 2.3, 2.4**

- [ ]\* 5.4 Write property test for optional event data preservation

  - **Property 12: Optional event data preservation**
  - **Validates: Requirements 3.3, 3.4, 3.5**

- [x] 6. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement cashbox and financial management

  - Create CashboxMovement and CreditExpense data models
  - Build deposit functionality that increases cashbox balance
  - Implement cash expense recording that decreases balance
  - Create credit expense system that tracks internal debt
  - Build reimbursement system with partial payment support
  - Add expense categorization with predefined categories
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.4_

- [ ]\* 7.1 Write property test for deposit balance increase

  - **Property 13: Deposit balance increase**
  - **Validates: Requirements 4.1**

- [ ]\* 7.2 Write property test for cash expense balance decrease

  - **Property 14: Cash expense balance decrease**
  - **Validates: Requirements 4.2**

- [ ]\* 7.3 Write property test for credit expense debt creation

  - **Property 15: Credit expense debt creation**
  - **Validates: Requirements 4.3**

- [ ]\* 7.4 Write property test for reimbursement dual effect

  - **Property 16: Reimbursement dual effect**
  - **Validates: Requirements 4.4**

- [ ]\* 7.5 Write property test for partial reimbursement calculation

  - **Property 17: Partial reimbursement calculation**
  - **Validates: Requirements 4.5**

- [ ]\* 7.6 Write property test for expense category validation

  - **Property 20: Expense category validation**
  - **Validates: Requirements 5.4**

- [x] 8. Create dashboard and reporting system

  - Build dashboard service for calculating animal and financial summaries
  - Implement home dashboard with key metrics display
  - Create financial summary views separating cash and credit expenses
  - Build reminder system for upcoming vaccinations and treatments
  - Add dashboard API endpoints with proper data aggregation
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ]\* 8.1 Write property test for dashboard calculation accuracy

  - **Property 18: Dashboard calculation accuracy**
  - **Validates: Requirements 5.1, 5.2**

- [ ]\* 8.2 Write property test for reminder date filtering

  - **Property 19: Reminder date filtering**
  - **Validates: Requirements 5.3**

- [x]\* 8.3 Write property test for financial summary segregation

  - **Property 21: Financial summary segregation**
  - **Validates: Requirements 5.5**

- [ ] 9. Build data export functionality

  - Create export service supporting CSV format
  - Implement animal data export with complete record inclusion
  - Build financial data export with all movement records
  - Add permission-based export access control
  - Ensure export data integrity and completeness
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]\* 9.1 Write property test for CSV export format validation

  - **Property 23: CSV export format validation**
  - **Validates: Requirements 8.1**

- [ ]\* 9.2 Write property test for export data completeness

  - **Property 24: Export data completeness**
  - **Validates: Requirements 8.2, 8.3, 8.5**

- [ ]\* 9.3 Write property test for export permission control

  - **Property 25: Export permission control**
  - **Validates: Requirements 8.4**

- [x] 10. Develop mobile-first frontend interfaces

  - Create responsive layouts using Tailwind CSS with mobile-first approach
  - Build farm dashboard page with key metrics and navigation
  - Implement animal listing and detail pages with photo display
  - Create event recording forms optimized for quick mobile entry
  - Build cashbox management interface with deposit and expense forms
  - Add member management interface for farm owners
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ]\* 10.1 Write property test for form submission feedback

  - **Property 22: Form submission feedback**
  - **Validates: Requirements 6.5**

- [x] 10.2 Implement authentication frontend interfaces

  - Create login page with email/password form and validation
  - Build registration page with user signup form
  - Implement client-side authentication state management
  - Add protected route components and redirects
  - Create logout functionality with session cleanup
  - Build error handling for authentication failures
  - Add loading states and user feedback for auth operations
  - Implement "remember me" and session persistence
  - Create responsive mobile-first auth forms
  - Add internationalization support for auth pages
  - _Requirements: 7.4, 7.5 (authentication and authorization)_

- [x] 11. Implement internationalization system

  - Set up Next.js internationalization with French as default language
  - Create translation files for French, English, and Arabic languages
  - Implement language selection and persistence functionality
  - Add RTL (Right-to-Left) support for Arabic language
  - Create locale-aware date and number formatting
  - Translate all user interface elements and error messages
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]\* 11.1 Write property test for language preference persistence

  - **Property 26: Language preference persistence**
  - **Validates: Requirements 9.2**

- [ ]\* 11.2 Write property test for translation completeness

  - **Property 27: Translation completeness**
  - **Validates: Requirements 9.3, 9.4**

- [ ]\* 11.3 Write property test for locale consistency

  - **Property 28: Locale consistency**
  - **Validates: Requirements 9.5**

- [x] 12. Implement API endpoints and server actions

  - Create all REST-like API endpoints for CRUD operations
  - Implement server actions for form submissions
  - Add proper error handling with consistent response formats
  - Build input validation middleware for all endpoints
  - Create API documentation and endpoint testing
  - _Requirements: All API-related requirements_

- [x] 13. Add error handling and validation

  - Implement comprehensive input validation for all forms
  - Create consistent error response formatting
  - Add business logic validation (e.g., prevent invalid state transitions)
  - Build error logging and monitoring system
  - Create user-friendly error messages for frontend display in multiple languages
  - _Requirements: All validation-related requirements_

- [ ] 14. Final integration and testing

  - Integrate all components and test end-to-end workflows
  - Verify mobile responsiveness across different screen sizes
  - Test role-based access control across all features
  - Validate data export functionality with real data
  - Perform security testing for authentication and authorization
  - Test internationalization across all supported languages
  - _Requirements: All requirements_

- [ ] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
