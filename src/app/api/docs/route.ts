import { NextResponse } from 'next/server'

const API_DOCUMENTATION = {
    title: 'Farm Management API',
    version: '1.0.0',
    description: 'REST API for farm management system with animal tracking, events, and financial management',
    baseUrl: '/api',
    endpoints: {
        authentication: {
            'POST /auth/login': {
                description: 'Authenticate user and create session',
                body: {
                    email: 'string (required)',
                    password: 'string (required)'
                },
                response: {
                    success: 'boolean',
                    data: {
                        user: 'User object',
                        farm: 'Farm object (if user has farms)'
                    }
                }
            },
            'POST /auth/register': {
                description: 'Register new user',
                body: {
                    email: 'string (required)',
                    name: 'string (required)',
                    password: 'string (required, min 8 chars)'
                }
            },
            'POST /auth/logout': {
                description: 'Logout user and destroy session'
            },
            'GET /auth/session': {
                description: 'Get current user session'
            }
        },
        farms: {
            'GET /farms': {
                description: 'List user farms'
            },
            'POST /farms': {
                description: 'Create new farm',
                body: {
                    name: 'string (required)',
                    currency: 'string (optional, default: TND)',
                    timezone: 'string (optional, default: Africa/Tunis)'
                }
            },
            'GET /farms/:farmId': {
                description: 'Get farm details'
            },
            'PUT /farms/:farmId': {
                description: 'Update farm (OWNER only)',
                body: {
                    name: 'string (optional)',
                    currency: 'string (optional)',
                    timezone: 'string (optional)'
                }
            },
            'DELETE /farms/:farmId': {
                description: 'Soft delete farm (OWNER only)'
            }
        },
        animals: {
            'GET /farms/:farmId/animals': {
                description: 'List farm animals with optional filters',
                queryParams: {
                    species: 'string (optional)',
                    type: 'INDIVIDUAL|LOT (optional)',
                    status: 'ACTIVE|SOLD|DEAD (optional)',
                    sex: 'MALE|FEMALE (optional)'
                }
            },
            'POST /farms/:farmId/animals': {
                description: 'Create new animal',
                body: {
                    type: 'INDIVIDUAL|LOT (required)',
                    species: 'string (required)',
                    sex: 'MALE|FEMALE (optional)',
                    birthDate: 'ISO date string (optional)',
                    estimatedAge: 'number (optional)',
                    status: 'ACTIVE|SOLD|DEAD (optional, default: ACTIVE)',
                    photoUrl: 'string URL (optional)',
                    lotCount: 'number (optional, for LOT type)'
                }
            },
            'GET /farms/:farmId/animals/:animalId': {
                description: 'Get animal details'
            },
            'PUT /farms/:farmId/animals/:animalId': {
                description: 'Update animal'
            },
            'DELETE /farms/:farmId/animals/:animalId': {
                description: 'Soft delete animal'
            }
        },
        events: {
            'GET /farms/:farmId/events': {
                description: 'List farm events with optional filters',
                queryParams: {
                    targetId: 'string (optional)',
                    eventType: 'BIRTH|VACCINATION|TREATMENT|WEIGHT|SALE|DEATH|NOTE (optional)',
                    startDate: 'ISO date string (optional)',
                    endDate: 'ISO date string (optional)',
                    hasNextDueDate: 'boolean (optional)',
                    nextDueBefore: 'ISO date string (optional)',
                    nextDueAfter: 'ISO date string (optional)',
                    limit: 'number (optional)',
                    offset: 'number (optional)'
                }
            },
            'POST /farms/:farmId/events': {
                description: 'Create new event',
                body: {
                    targetId: 'string UUID (required)',
                    targetType: 'ANIMAL|LOT (required)',
                    eventType: 'BIRTH|VACCINATION|TREATMENT|WEIGHT|SALE|DEATH|NOTE (required)',
                    eventDate: 'ISO date string (required)',
                    payload: 'object (optional)',
                    note: 'string (optional)',
                    cost: 'number (optional)',
                    nextDueDate: 'ISO date string (optional)',
                    attachmentUrl: 'string URL (optional)'
                }
            },
            'GET /farms/:farmId/events/:eventId': {
                description: 'Get event details'
            },
            'PUT /farms/:farmId/events/:eventId': {
                description: 'Update event'
            },
            'DELETE /farms/:farmId/events/:eventId': {
                description: 'Soft delete event'
            },
            'GET /farms/:farmId/events/stats': {
                description: 'Get event statistics',
                queryParams: {
                    startDate: 'ISO date string (optional)',
                    endDate: 'ISO date string (optional)'
                }
            },
            'GET /farms/:farmId/events/upcoming': {
                description: 'Get upcoming events with due dates',
                queryParams: {
                    days: 'number (optional, default: 30)',
                    after: 'ISO date string (optional)'
                }
            }
        },
        cashbox: {
            'GET /farms/:farmId/cashbox': {
                description: 'Get cashbox balance and recent movements',
                queryParams: {
                    limit: 'number (optional, default: 10)'
                }
            },
            'POST /farms/:farmId/cashbox/deposit': {
                description: 'Create deposit',
                body: {
                    amount: 'number (required, positive)',
                    description: 'string (required)'
                }
            },
            'POST /farms/:farmId/cashbox/expense': {
                description: 'Create expense (cash or credit)',
                body: {
                    type: 'CASH|CREDIT (required)',
                    amount: 'number (required, positive)',
                    description: 'string (required)',
                    category: 'FEED|VET|LABOR|TRANSPORT|EQUIPMENT|UTILITIES|OTHER (required)',
                    paidBy: 'string UUID (required for CREDIT type)'
                }
            },
            'POST /farms/:farmId/cashbox/reimbursement': {
                description: 'Process reimbursement for credit expense',
                body: {
                    creditExpenseId: 'string UUID (required)',
                    amount: 'number (required, positive)',
                    description: 'string (optional)'
                }
            },
            'GET /farms/:farmId/cashbox/credit-expenses': {
                description: 'List credit expenses',
                queryParams: {
                    status: 'OUTSTANDING|PARTIALLY_REIMBURSED|FULLY_REIMBURSED (optional)'
                }
            }
        },
        dashboard: {
            'GET /farms/:farmId/dashboard': {
                description: 'Get dashboard statistics'
            },
            'GET /farms/:farmId/dashboard/reminders': {
                description: 'Get reminders for upcoming events',
                queryParams: {
                    days: 'number (optional, default: 30)'
                }
            }
        },
        members: {
            'GET /farms/:farmId/members': {
                description: 'List farm members'
            },
            'POST /farms/:farmId/members': {
                description: 'Invite new member (OWNER only)',
                body: {
                    email: 'string (required)',
                    role: 'OWNER|ASSOCIATE|WORKER (required)'
                }
            },
            'PUT /farms/:farmId/members/:userId': {
                description: 'Update member role (OWNER only)',
                body: {
                    role: 'OWNER|ASSOCIATE|WORKER (required)'
                }
            },
            'DELETE /farms/:farmId/members/:userId': {
                description: 'Remove member (OWNER only, or self-removal)'
            }
        },
        export: {
            'GET /farms/:farmId/export': {
                description: 'Export farm data',
                queryParams: {
                    type: 'animals|events|financial (required)',
                    format: 'csv (optional, default: csv)'
                },
                response: 'CSV file download'
            }
        }
    },
    authentication: {
        description: 'All endpoints except /auth/* require authentication via session cookies',
        permissions: {
            OWNER: 'Full access to all farm data and settings',
            ASSOCIATE: 'Read, create, and edit operations on domain data',
            WORKER: 'Create events and expenses, read data, no settings access'
        }
    },
    errorHandling: {
        format: {
            success: 'boolean (false for errors)',
            error: 'string (error message)',
            details: 'array (validation errors, optional)'
        },
        statusCodes: {
            200: 'Success',
            201: 'Created',
            400: 'Bad Request / Validation Error',
            401: 'Unauthorized',
            403: 'Forbidden / Access Denied',
            404: 'Not Found',
            409: 'Conflict / Resource Already Exists',
            500: 'Internal Server Error'
        }
    }
}

export async function GET() {
    return NextResponse.json(API_DOCUMENTATION, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
}