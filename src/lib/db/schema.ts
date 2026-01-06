import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Users table
export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Farms table
export const farms = sqliteTable('farms', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    currency: text('currency').notNull().default('TND'),
    timezone: text('timezone').notNull().default('Africa/Tunis'),
    createdBy: text('created_by').notNull().references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedBy: text('updated_by').notNull().references(() => users.id),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
})

// Farm invitations table (NEW)
export const farmInvitations = sqliteTable('farm_invitations', {
    id: text('id').primaryKey(),
    farmId: text('farm_id').notNull().references(() => farms.id),
    email: text('email').notNull(),
    role: text('role', { enum: ['OWNER', 'ASSOCIATE', 'WORKER'] }).notNull(),
    token: text('token').notNull().unique(),
    status: text('status', { enum: ['PENDING', 'ACCEPTED', 'EXPIRED'] }).notNull().default('PENDING'),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    invitedBy: text('invited_by').notNull().references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    acceptedAt: integer('accepted_at', { mode: 'timestamp' }),
})

// Farm members table
export const farmMembers = sqliteTable('farm_members', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    farmId: text('farm_id').notNull().references(() => farms.id),
    role: text('role', { enum: ['OWNER', 'ASSOCIATE', 'WORKER'] }).notNull(),
    status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).notNull().default('ACTIVE'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Animals table
export const animals = sqliteTable('animals', {
    id: text('id').primaryKey(),
    farmId: text('farm_id').notNull().references(() => farms.id),
    tagNumber: text('tag_number'), // Animal identification number/tag
    type: text('type', { enum: ['INDIVIDUAL', 'LOT'] }).notNull(),
    species: text('species').notNull(),
    sex: text('sex', { enum: ['MALE', 'FEMALE'] }),
    birthDate: integer('birth_date', { mode: 'timestamp' }),
    estimatedAge: integer('estimated_age'),
    status: text('status', { enum: ['ACTIVE', 'SOLD', 'DEAD'] }).notNull().default('ACTIVE'),
    photoUrl: text('photo_url'),
    lotCount: integer('lot_count'),
    createdBy: text('created_by').notNull().references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedBy: text('updated_by').notNull().references(() => users.id),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
})

// Events table
export const events = sqliteTable('events', {
    id: text('id').primaryKey(),
    farmId: text('farm_id').notNull().references(() => farms.id),
    targetType: text('target_type', { enum: ['ANIMAL', 'LOT'] }).notNull(),
    targetId: text('target_id').notNull(),
    eventType: text('event_type', {
        enum: ['BIRTH', 'VACCINATION', 'TREATMENT', 'WEIGHT', 'SALE', 'DEATH', 'NOTE']
    }).notNull(),
    eventDate: integer('event_date', { mode: 'timestamp' }).notNull(),
    payload: text('payload', { mode: 'json' }).notNull(),
    note: text('note'),
    cost: real('cost'),
    nextDueDate: integer('next_due_date', { mode: 'timestamp' }),
    attachmentUrl: text('attachment_url'),
    createdBy: text('created_by').notNull().references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedBy: text('updated_by').notNull().references(() => users.id),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
})

// Cashbox movements table
export const cashboxMovements = sqliteTable('cashbox_movements', {
    id: text('id').primaryKey(),
    farmId: text('farm_id').notNull().references(() => farms.id),
    type: text('type', {
        enum: ['DEPOSIT', 'EXPENSE_CASH', 'EXPENSE_CREDIT', 'REIMBURSEMENT']
    }).notNull(),
    amount: real('amount').notNull(),
    description: text('description').notNull(),
    category: text('category', {
        enum: ['FEED', 'VET', 'LABOR', 'TRANSPORT', 'EQUIPMENT', 'UTILITIES', 'OTHER']
    }),
    relatedExpenseId: text('related_expense_id'),
    createdBy: text('created_by').notNull().references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
})

// Credit expenses table
export const creditExpenses = sqliteTable('credit_expenses', {
    id: text('id').primaryKey(),
    farmId: text('farm_id').notNull().references(() => farms.id),
    amount: real('amount').notNull(),
    description: text('description').notNull(),
    category: text('category', {
        enum: ['FEED', 'VET', 'LABOR', 'TRANSPORT', 'EQUIPMENT', 'UTILITIES', 'OTHER']
    }).notNull(),
    paidBy: text('paid_by').notNull().references(() => users.id),
    remainingAmount: real('remaining_amount').notNull(),
    status: text('status', {
        enum: ['OUTSTANDING', 'PARTIALLY_REIMBURSED', 'FULLY_REIMBURSED']
    }).notNull().default('OUTSTANDING'),
    createdBy: text('created_by').notNull().references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
})